-- ============================================================================
-- FIX: Cash allocation ceiling check
--
-- The old ceiling used SUM(assigned_cash) which includes money already spent
-- on positions. Invested money is backed by real broker positions, not broker
-- cash. Only available_cash + reserved_cash are actual claims on broker cash.
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
    v_total_available DECIMAL;
    v_total_reserved DECIMAL;
    v_total_cash_claims DECIMAL;
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
    -- Only available_cash + reserved_cash are actual claims on broker cash.
    -- Invested money is backed by real broker positions, not broker cash.
    IF p_delta > 0 THEN
        SELECT COALESCE(SUM(available_cash), 0), COALESCE(SUM(reserved_cash), 0)
        INTO v_total_available, v_total_reserved
        FROM virtual_accounts
        WHERE is_active = true;

        v_total_cash_claims := v_total_available + v_total_reserved;
        v_free_cash := p_lynx_cash - v_total_cash_claims;

        IF p_delta > v_free_cash + 0.01 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format(
                    'Exceeds LYNX cash. LYNX: %s, Cash claims: %s (available: %s, reserved: %s), Free: %s, Requested: %s',
                    p_lynx_cash, v_total_cash_claims, v_total_available, v_total_reserved, GREATEST(0, v_free_cash), p_delta
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
