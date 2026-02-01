-- ============================================================================
-- MIGRATION: Strict Admin-Only Cash Allocation System
--
-- Moves cash tracking from virtual_portfolios to virtual_accounts.
-- All cash mutations use RPC functions with row-level locks.
-- All accounts start at 0. Only admin allocates cash.
-- ============================================================================

-- ============================================================================
-- 1. ADD CASH COLUMNS TO virtual_accounts
-- ============================================================================

ALTER TABLE virtual_accounts
    ADD COLUMN IF NOT EXISTS assigned_cash DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS reserved_cash DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS available_cash DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE virtual_accounts
    ADD CONSTRAINT chk_assigned_non_negative CHECK (assigned_cash >= 0),
    ADD CONSTRAINT chk_reserved_non_negative CHECK (reserved_cash >= 0),
    ADD CONSTRAINT chk_available_non_negative CHECK (available_cash >= 0);

-- ============================================================================
-- 2. CREATE cash_allocation_log TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cash_allocation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id INTEGER NOT NULL,
    virtual_account_id UUID NOT NULL REFERENCES virtual_accounts(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2),
    old_assigned DECIMAL(15,2),
    new_assigned DECIMAL(15,2),
    old_reserved DECIMAL(15,2),
    new_reserved DECIMAL(15,2),
    old_available DECIMAL(15,2),
    new_available DECIMAL(15,2),
    description TEXT,
    order_intention_id UUID REFERENCES order_intentions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_alloc_log_account ON cash_allocation_log(virtual_account_id);
CREATE INDEX IF NOT EXISTS idx_cash_alloc_log_admin ON cash_allocation_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_cash_alloc_log_created ON cash_allocation_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_alloc_log_action ON cash_allocation_log(action);

ALTER TABLE cash_allocation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access cash_allocation_log"
    ON cash_allocation_log FOR ALL
    USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- ============================================================================
-- 3. RPC: admin_allocate_cash
--
-- Admin allocate (+delta) or deallocate (-delta).
-- Global constraint: SUM(assigned + reserved) + delta <= lynx_cash
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_allocate_cash(
    p_account_id UUID,
    p_admin_id INTEGER,
    p_delta DECIMAL,
    p_lynx_cash DECIMAL,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account virtual_accounts%ROWTYPE;
    v_total_assigned DECIMAL;
    v_total_reserved DECIMAL;
    v_free_cash DECIMAL;
    v_new_assigned DECIMAL;
    v_new_available DECIMAL;
BEGIN
    -- Lock the row
    SELECT * INTO v_account
    FROM virtual_accounts
    WHERE id = p_account_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account not found');
    END IF;

    IF NOT v_account.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account is deactivated');
    END IF;

    IF v_account.is_frozen THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account is frozen. Admin intervention required.');
    END IF;

    v_new_assigned := v_account.assigned_cash + p_delta;
    v_new_available := v_account.available_cash + p_delta;

    -- Validate non-negative
    IF v_new_assigned < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Cannot reduce assigned below 0. Current: %s, Delta: %s', v_account.assigned_cash, p_delta)
        );
    END IF;

    IF v_new_available < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient available cash. Available: %s, Requested: %s', v_account.available_cash, abs(p_delta))
        );
    END IF;

    -- Global ceiling check (only for positive allocations)
    IF p_delta > 0 THEN
        SELECT COALESCE(SUM(assigned_cash), 0), COALESCE(SUM(reserved_cash), 0)
        INTO v_total_assigned, v_total_reserved
        FROM virtual_accounts
        WHERE is_active = true;

        v_free_cash := p_lynx_cash - v_total_assigned - v_total_reserved;

        IF p_delta > v_free_cash + 0.01 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format(
                    'Exceeds LYNX cash. LYNX: %s, Assigned: %s, Reserved: %s, Free: %s, Requested: %s',
                    p_lynx_cash, v_total_assigned, v_total_reserved, GREATEST(0, v_free_cash), p_delta
                )
            );
        END IF;
    END IF;

    -- Apply
    UPDATE virtual_accounts
    SET assigned_cash = v_new_assigned,
        available_cash = v_new_available,
        updated_at = NOW()
    WHERE id = p_account_id;

    -- Audit log
    INSERT INTO cash_allocation_log (
        admin_id, virtual_account_id, action, amount,
        old_assigned, new_assigned,
        old_reserved, new_reserved,
        old_available, new_available,
        description
    ) VALUES (
        p_admin_id, p_account_id,
        CASE WHEN p_delta > 0 THEN 'allocate' ELSE 'deallocate' END,
        p_delta,
        v_account.assigned_cash, v_new_assigned,
        v_account.reserved_cash, v_account.reserved_cash,
        v_account.available_cash, v_new_available,
        COALESCE(p_description, format('%s %s EUR', CASE WHEN p_delta > 0 THEN 'Allocate' ELSE 'Deallocate' END, abs(p_delta)))
    );

    RETURN jsonb_build_object(
        'success', true,
        'assigned_cash', v_new_assigned,
        'reserved_cash', v_account.reserved_cash,
        'available_cash', v_new_available
    );
END;
$$;

-- ============================================================================
-- 4. RPC: reserve_order_cash
--
-- BUY order submit: available -= amount, reserved += amount
-- ============================================================================
CREATE OR REPLACE FUNCTION reserve_order_cash(
    p_account_id UUID,
    p_amount DECIMAL,
    p_order_intention_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account virtual_accounts%ROWTYPE;
    v_new_reserved DECIMAL;
    v_new_available DECIMAL;
BEGIN
    SELECT * INTO v_account
    FROM virtual_accounts
    WHERE id = p_account_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account not found');
    END IF;

    IF v_account.is_frozen THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account is frozen');
    END IF;

    IF NOT v_account.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account is deactivated');
    END IF;

    v_new_available := v_account.available_cash - p_amount;
    v_new_reserved := v_account.reserved_cash + p_amount;

    IF v_new_available < -0.01 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Insufficient available cash. Available: %s, Required: %s', v_account.available_cash, p_amount)
        );
    END IF;

    -- Clamp to zero for tiny floating point residuals
    v_new_available := GREATEST(0, v_new_available);

    UPDATE virtual_accounts
    SET reserved_cash = v_new_reserved,
        available_cash = v_new_available,
        updated_at = NOW()
    WHERE id = p_account_id;

    INSERT INTO cash_allocation_log (
        admin_id, virtual_account_id, action, amount,
        old_assigned, new_assigned,
        old_reserved, new_reserved,
        old_available, new_available,
        description, order_intention_id
    ) VALUES (
        0, p_account_id, 'reserve', p_amount,
        v_account.assigned_cash, v_account.assigned_cash,
        v_account.reserved_cash, v_new_reserved,
        v_account.available_cash, v_new_available,
        format('Reserve %s for order', p_amount),
        p_order_intention_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'assigned_cash', v_account.assigned_cash,
        'reserved_cash', v_new_reserved,
        'available_cash', v_new_available
    );
END;
$$;

-- ============================================================================
-- 5. RPC: settle_buy_fill
--
-- BUY fills: reserved -= reserved_amount, available += (reserved - actual) excess
-- If reserved would go negative → freeze account
-- ============================================================================
CREATE OR REPLACE FUNCTION settle_buy_fill(
    p_account_id UUID,
    p_reserved_amount DECIMAL,
    p_actual_cost DECIMAL,
    p_order_intention_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account virtual_accounts%ROWTYPE;
    v_excess DECIMAL;
    v_new_reserved DECIMAL;
    v_new_available DECIMAL;
BEGIN
    SELECT * INTO v_account
    FROM virtual_accounts
    WHERE id = p_account_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account not found');
    END IF;

    -- Check invariant: reserved should not go negative
    IF v_account.reserved_cash - p_reserved_amount < -0.01 THEN
        UPDATE virtual_accounts SET is_frozen = true, updated_at = NOW()
        WHERE id = p_account_id;

        INSERT INTO cash_allocation_log (
            admin_id, virtual_account_id, action, amount, description
        ) VALUES (
            0, p_account_id, 'freeze', 0,
            format('INVARIANT VIOLATION: reserved would go negative. reserved=%s, deducting=%s',
                   v_account.reserved_cash, p_reserved_amount)
        );

        RETURN jsonb_build_object('success', false, 'error', 'Invariant violation: account frozen');
    END IF;

    v_excess := GREATEST(0, p_reserved_amount - p_actual_cost);
    v_new_reserved := GREATEST(0, v_account.reserved_cash - p_reserved_amount);
    v_new_available := v_account.available_cash + v_excess;

    UPDATE virtual_accounts
    SET reserved_cash = v_new_reserved,
        available_cash = v_new_available,
        updated_at = NOW()
    WHERE id = p_account_id;

    INSERT INTO cash_allocation_log (
        admin_id, virtual_account_id, action, amount,
        old_assigned, new_assigned,
        old_reserved, new_reserved,
        old_available, new_available,
        description, order_intention_id
    ) VALUES (
        0, p_account_id, 'fill_buy', p_actual_cost,
        v_account.assigned_cash, v_account.assigned_cash,
        v_account.reserved_cash, v_new_reserved,
        v_account.available_cash, v_new_available,
        format('Buy fill: cost=%s, reserved=%s, excess=%s', p_actual_cost, p_reserved_amount, v_excess),
        p_order_intention_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'assigned_cash', v_account.assigned_cash,
        'reserved_cash', v_new_reserved,
        'available_cash', v_new_available,
        'excess_returned', v_excess
    );
END;
$$;

-- ============================================================================
-- 6. RPC: cancel_order_cash
--
-- Order cancel/reject: reserved -= amount, available += amount
-- ============================================================================
CREATE OR REPLACE FUNCTION cancel_order_cash(
    p_account_id UUID,
    p_reserved_amount DECIMAL,
    p_order_intention_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account virtual_accounts%ROWTYPE;
    v_new_reserved DECIMAL;
    v_new_available DECIMAL;
BEGIN
    SELECT * INTO v_account
    FROM virtual_accounts
    WHERE id = p_account_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account not found');
    END IF;

    v_new_reserved := GREATEST(0, v_account.reserved_cash - p_reserved_amount);
    v_new_available := v_account.available_cash + p_reserved_amount;

    UPDATE virtual_accounts
    SET reserved_cash = v_new_reserved,
        available_cash = v_new_available,
        updated_at = NOW()
    WHERE id = p_account_id;

    INSERT INTO cash_allocation_log (
        admin_id, virtual_account_id, action, amount,
        old_assigned, new_assigned,
        old_reserved, new_reserved,
        old_available, new_available,
        description, order_intention_id
    ) VALUES (
        0, p_account_id, 'cancel', p_reserved_amount,
        v_account.assigned_cash, v_account.assigned_cash,
        v_account.reserved_cash, v_new_reserved,
        v_account.available_cash, v_new_available,
        format('Order cancelled, released %s', p_reserved_amount),
        p_order_intention_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'assigned_cash', v_account.assigned_cash,
        'reserved_cash', v_new_reserved,
        'available_cash', v_new_available
    );
END;
$$;

-- ============================================================================
-- 7. RPC: credit_sell_proceeds
--
-- SELL fills: available += proceeds
-- ============================================================================
CREATE OR REPLACE FUNCTION credit_sell_proceeds(
    p_account_id UUID,
    p_proceeds DECIMAL,
    p_order_intention_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account virtual_accounts%ROWTYPE;
    v_new_available DECIMAL;
BEGIN
    SELECT * INTO v_account
    FROM virtual_accounts
    WHERE id = p_account_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Account not found');
    END IF;

    v_new_available := v_account.available_cash + p_proceeds;

    UPDATE virtual_accounts
    SET available_cash = v_new_available,
        updated_at = NOW()
    WHERE id = p_account_id;

    INSERT INTO cash_allocation_log (
        admin_id, virtual_account_id, action, amount,
        old_assigned, new_assigned,
        old_reserved, new_reserved,
        old_available, new_available,
        description, order_intention_id
    ) VALUES (
        0, p_account_id, 'sell_credit', p_proceeds,
        v_account.assigned_cash, v_account.assigned_cash,
        v_account.reserved_cash, v_account.reserved_cash,
        v_account.available_cash, v_new_available,
        format('Sell proceeds: %s', p_proceeds),
        p_order_intention_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'assigned_cash', v_account.assigned_cash,
        'reserved_cash', v_account.reserved_cash,
        'available_cash', v_new_available
    );
END;
$$;

-- ============================================================================
-- 8. RESET ALL EXISTING DATA
-- ============================================================================

UPDATE virtual_accounts
SET assigned_cash = 0, reserved_cash = 0, available_cash = 0, is_frozen = false;

UPDATE virtual_portfolios
SET cash_balance = 0, reserved_balance = 0, total_deposited = 0, total_withdrawn = 0;

-- ============================================================================
-- 9. GRANT EXECUTE ON RPC FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION admin_allocate_cash TO authenticated;
GRANT EXECUTE ON FUNCTION admin_allocate_cash TO service_role;
GRANT EXECUTE ON FUNCTION reserve_order_cash TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_order_cash TO service_role;
GRANT EXECUTE ON FUNCTION settle_buy_fill TO authenticated;
GRANT EXECUTE ON FUNCTION settle_buy_fill TO service_role;
GRANT EXECUTE ON FUNCTION cancel_order_cash TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_order_cash TO service_role;
GRANT EXECUTE ON FUNCTION credit_sell_proceeds TO authenticated;
GRANT EXECUTE ON FUNCTION credit_sell_proceeds TO service_role;
