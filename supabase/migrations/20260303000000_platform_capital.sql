-- ============================================================================
-- MIGRATION: Platform Capital Tracking
--
-- Adds a singleton table to track broker-level capital and the relationship
-- between real broker funds and virtual customer allocations.
--
-- broker_total_equity   = total account value at LYNX/IB (incl. securities)
-- broker_available_cash = liquid cash in the broker account
-- assigned_cash_total   = sum of all virtual account assigned_cash
-- unassigned_cash       = broker_available_cash - assigned_cash_total
-- ============================================================================

-- ============================================================================
-- 1. CREATE platform_capital TABLE (singleton)
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_capital (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    broker_total_equity DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    broker_available_cash DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    assigned_cash_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    unassigned_cash DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    ib_connected BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the singleton row
INSERT INTO platform_capital (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE platform_capital ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access platform_capital"
    ON platform_capital FOR ALL
    USING (current_setting('request.jwt.claim.role', true) = 'service_role');

-- ============================================================================
-- 2. RPC: sync_platform_capital
--
-- Called by the backend whenever IB data is fetched.
-- Recomputes assigned_cash_total from virtual_accounts.
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_platform_capital(
    p_broker_total_equity DECIMAL,
    p_broker_available_cash DECIMAL,
    p_ib_connected BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assigned_total DECIMAL;
    v_unassigned DECIMAL;
BEGIN
    -- Compute assigned total from virtual accounts
    SELECT COALESCE(SUM(assigned_cash), 0)
    INTO v_assigned_total
    FROM virtual_accounts
    WHERE is_active = true;

    -- Compute unassigned cash
    v_unassigned := p_broker_available_cash - v_assigned_total;

    -- Upsert the singleton row
    INSERT INTO platform_capital (
        id, broker_total_equity, broker_available_cash,
        assigned_cash_total, unassigned_cash,
        ib_connected, last_synced_at, updated_at
    ) VALUES (
        1, p_broker_total_equity, p_broker_available_cash,
        v_assigned_total, v_unassigned,
        p_ib_connected, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        broker_total_equity = EXCLUDED.broker_total_equity,
        broker_available_cash = EXCLUDED.broker_available_cash,
        assigned_cash_total = v_assigned_total,
        unassigned_cash = v_unassigned,
        ib_connected = EXCLUDED.ib_connected,
        last_synced_at = NOW(),
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'broker_total_equity', p_broker_total_equity,
        'broker_available_cash', p_broker_available_cash,
        'assigned_cash_total', v_assigned_total,
        'unassigned_cash', v_unassigned
    );
END;
$$;

-- ============================================================================
-- 3. UPDATE admin_allocate_cash to also refresh platform_capital
--
-- After each allocation change, update the assigned_cash_total and
-- unassigned_cash in platform_capital so it stays consistent.
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
    -- NOTE: assigned_cash already includes reserved_cash (reserved is a subset),
    -- so free_cash = lynx_cash - assigned. Do NOT subtract reserved again.
    IF p_delta > 0 THEN
        SELECT COALESCE(SUM(assigned_cash), 0)
        INTO v_total_assigned
        FROM virtual_accounts
        WHERE is_active = true;

        v_free_cash := p_lynx_cash - v_total_assigned;

        IF p_delta > v_free_cash + 0.01 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format(
                    'Exceeds LYNX cash. LYNX: %s, Assigned: %s, Free: %s, Requested: %s',
                    p_lynx_cash, v_total_assigned, GREATEST(0, v_free_cash), p_delta
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

    -- Refresh platform_capital assigned totals and broker cash if available
    UPDATE platform_capital
    SET broker_available_cash = CASE WHEN p_lynx_cash > 0 THEN p_lynx_cash ELSE broker_available_cash END,
        assigned_cash_total = (
            SELECT COALESCE(SUM(assigned_cash), 0)
            FROM virtual_accounts WHERE is_active = true
        ),
        unassigned_cash = (CASE WHEN p_lynx_cash > 0 THEN p_lynx_cash ELSE broker_available_cash END) - (
            SELECT COALESCE(SUM(assigned_cash), 0)
            FROM virtual_accounts WHERE is_active = true
        ),
        updated_at = NOW()
    WHERE id = 1;

    RETURN jsonb_build_object(
        'success', true,
        'assigned_cash', v_new_assigned,
        'reserved_cash', v_account.reserved_cash,
        'available_cash', v_new_available
    );
END;
$$;

-- ============================================================================
-- 4. GRANT EXECUTE
-- ============================================================================

GRANT EXECUTE ON FUNCTION sync_platform_capital TO authenticated;
GRANT EXECUTE ON FUNCTION sync_platform_capital TO service_role;
