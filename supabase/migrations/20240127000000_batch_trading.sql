-- Migration: Batch Trading System
-- Creates virtual portfolios, order intentions, batch execution, and fill allocation tables
-- with complete Row Level Security for user isolation

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE order_intention_status AS ENUM (
    'pending',           -- Awaiting batch execution
    'cancelled',         -- User cancelled before execution
    'aggregated',        -- Included in a batch
    'filled',            -- Successfully filled
    'partially_filled',  -- Partially filled
    'rejected',          -- Rejected (insufficient funds, etc.)
    'expired'            -- Order window passed
);

CREATE TYPE batch_status AS ENUM (
    'pending',       -- Scheduled but not started
    'running',       -- Currently executing
    'completed',     -- All orders processed
    'failed',        -- Fatal error during execution
    'partial'        -- Some orders failed
);

CREATE TYPE transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'buy',
    'sell',
    'dividend',
    'fee',
    'adjustment'
);

-- =============================================================================
-- TABLE 1: virtual_portfolios - User cash balances
-- =============================================================================

CREATE TABLE IF NOT EXISTS virtual_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    cash_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    reserved_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,  -- Reserved for pending orders
    total_deposited DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_withdrawn DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_portfolio UNIQUE (user_id),
    CONSTRAINT non_negative_cash CHECK (cash_balance >= 0),
    CONSTRAINT non_negative_reserved CHECK (reserved_balance >= 0)
);

CREATE INDEX idx_virtual_portfolios_user ON virtual_portfolios(user_id);

-- =============================================================================
-- TABLE 2: virtual_holdings - User share holdings
-- =============================================================================

CREATE TABLE IF NOT EXISTS virtual_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    conid INTEGER NOT NULL,
    isin VARCHAR(12),
    name VARCHAR(200),
    quantity DECIMAL(15, 6) NOT NULL DEFAULT 0,
    avg_cost_basis DECIMAL(15, 6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_symbol UNIQUE (user_id, symbol),
    CONSTRAINT positive_quantity CHECK (quantity >= 0)
);

CREATE INDEX idx_virtual_holdings_user ON virtual_holdings(user_id);
CREATE INDEX idx_virtual_holdings_symbol ON virtual_holdings(symbol);

-- =============================================================================
-- TABLE 3: batch_executions - Batch run records (admin only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS batch_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Status
    status batch_status NOT NULL DEFAULT 'pending',
    error_message TEXT,

    -- Statistics
    total_intentions INTEGER DEFAULT 0,
    total_aggregated_orders INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    total_value DECIMAL(15, 2) DEFAULT 0,

    -- Results
    successful_fills INTEGER DEFAULT 0,
    partial_fills INTEGER DEFAULT 0,
    failed_orders INTEGER DEFAULT 0,

    -- Audit
    executed_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batch_executions_status ON batch_executions(status);
CREATE INDEX idx_batch_executions_scheduled ON batch_executions(scheduled_at);

-- =============================================================================
-- TABLE 4: aggregated_orders - Aggregated orders for IB (admin only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS aggregated_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batch_executions(id) ON DELETE CASCADE,

    -- Aggregated order details
    symbol VARCHAR(20) NOT NULL,
    conid INTEGER NOT NULL,
    side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    total_quantity INTEGER NOT NULL,

    -- IB execution details
    ib_order_id VARCHAR(50),
    ib_status VARCHAR(50),

    -- Fill details
    filled_quantity INTEGER DEFAULT 0,
    avg_fill_price DECIMAL(15, 6),
    total_fill_value DECIMAL(15, 2),

    -- Timestamps
    submitted_at TIMESTAMPTZ,
    filled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aggregated_orders_batch ON aggregated_orders(batch_id);
CREATE INDEX idx_aggregated_orders_symbol ON aggregated_orders(symbol);

-- =============================================================================
-- TABLE 5: order_intentions - Pending user orders
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_intentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batch_executions(id),
    aggregated_order_id UUID REFERENCES aggregated_orders(id),

    -- Order details
    symbol VARCHAR(20) NOT NULL,
    conid INTEGER NOT NULL,
    isin VARCHAR(12),
    name VARCHAR(200),
    side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    order_type VARCHAR(10) NOT NULL DEFAULT 'MKT',
    limit_price DECIMAL(15, 6),

    -- Validation snapshot (at submission time)
    estimated_price DECIMAL(15, 6),
    estimated_value DECIMAL(15, 2),
    reserved_amount DECIMAL(15, 2),

    -- Status tracking
    status order_intention_status NOT NULL DEFAULT 'pending',
    status_message TEXT,

    -- Fill details (after execution)
    filled_quantity DECIMAL(15, 6) DEFAULT 0,
    fill_price DECIMAL(15, 6),
    fill_value DECIMAL(15, 2),

    -- Timestamps
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_intentions_user ON order_intentions(user_id);
CREATE INDEX idx_order_intentions_status ON order_intentions(status);
CREATE INDEX idx_order_intentions_batch ON order_intentions(batch_id);
CREATE INDEX idx_order_intentions_symbol ON order_intentions(symbol);

-- =============================================================================
-- TABLE 6: fill_allocations - Fill distribution to users
-- =============================================================================

CREATE TABLE IF NOT EXISTS fill_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregated_order_id UUID NOT NULL REFERENCES aggregated_orders(id) ON DELETE CASCADE,
    order_intention_id UUID NOT NULL REFERENCES order_intentions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Allocation details
    requested_quantity INTEGER NOT NULL,
    allocated_quantity DECIMAL(15, 6) NOT NULL,
    allocation_percentage DECIMAL(8, 6) NOT NULL,

    -- Cost
    fill_price DECIMAL(15, 6) NOT NULL,
    total_cost DECIMAL(15, 2) NOT NULL,

    -- Status
    applied_to_portfolio BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fill_allocations_user ON fill_allocations(user_id);
CREATE INDEX idx_fill_allocations_aggregated ON fill_allocations(aggregated_order_id);
CREATE INDEX idx_fill_allocations_intention ON fill_allocations(order_intention_id);

-- =============================================================================
-- TABLE 7: virtual_transactions - Complete transaction history
-- =============================================================================

CREATE TABLE IF NOT EXISTS virtual_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Transaction details
    type transaction_type NOT NULL,
    symbol VARCHAR(20),
    quantity DECIMAL(15, 6),
    price DECIMAL(15, 6),
    amount DECIMAL(15, 2) NOT NULL,

    -- Balance after transaction
    balance_after DECIMAL(15, 2) NOT NULL,

    -- References
    order_intention_id UUID REFERENCES order_intentions(id),
    fill_allocation_id UUID REFERENCES fill_allocations(id),

    -- Audit
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_virtual_transactions_user ON virtual_transactions(user_id);
CREATE INDEX idx_virtual_transactions_type ON virtual_transactions(type);
CREATE INDEX idx_virtual_transactions_created ON virtual_transactions(created_at);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

-- Reuse the update_updated_at_column function from broker_links migration
-- (if not exists, create it)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_virtual_portfolios_updated_at
    BEFORE UPDATE ON virtual_portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_holdings_updated_at
    BEFORE UPDATE ON virtual_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_executions_updated_at
    BEFORE UPDATE ON batch_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aggregated_orders_updated_at
    BEFORE UPDATE ON aggregated_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_intentions_updated_at
    BEFORE UPDATE ON order_intentions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY - USER TABLES
-- =============================================================================

-- Enable RLS on user-facing tables
ALTER TABLE virtual_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fill_allocations ENABLE ROW LEVEL SECURITY;

-- virtual_portfolios policies
CREATE POLICY "Users view own portfolio" ON virtual_portfolios
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'::integer);

CREATE POLICY "Service role full access portfolio" ON virtual_portfolios
    FOR ALL USING (current_setting('role') = 'service_role');

-- virtual_holdings policies
CREATE POLICY "Users view own holdings" ON virtual_holdings
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'::integer);

CREATE POLICY "Service role full access holdings" ON virtual_holdings
    FOR ALL USING (current_setting('role') = 'service_role');

-- order_intentions policies
CREATE POLICY "Users view own intentions" ON order_intentions
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'::integer);

CREATE POLICY "Users create own intentions" ON order_intentions
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'::integer);

CREATE POLICY "Users cancel own pending intentions" ON order_intentions
    FOR UPDATE USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'::integer
        AND status = 'pending'
    );

CREATE POLICY "Service role full access intentions" ON order_intentions
    FOR ALL USING (current_setting('role') = 'service_role');

-- virtual_transactions policies
CREATE POLICY "Users view own transactions" ON virtual_transactions
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'::integer);

CREATE POLICY "Service role full access transactions" ON virtual_transactions
    FOR ALL USING (current_setting('role') = 'service_role');

-- fill_allocations policies
CREATE POLICY "Users view own allocations" ON fill_allocations
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'::integer);

CREATE POLICY "Service role full access allocations" ON fill_allocations
    FOR ALL USING (current_setting('role') = 'service_role');

-- =============================================================================
-- ROW LEVEL SECURITY - ADMIN TABLES
-- =============================================================================

-- Enable RLS on admin-only tables
ALTER TABLE batch_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_orders ENABLE ROW LEVEL SECURITY;

-- Only service role can access batch and aggregated orders
CREATE POLICY "Service role only batch" ON batch_executions
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role only aggregated" ON aggregated_orders
    FOR ALL USING (current_setting('role') = 'service_role');

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Service role gets full access
GRANT ALL ON virtual_portfolios TO service_role;
GRANT ALL ON virtual_holdings TO service_role;
GRANT ALL ON order_intentions TO service_role;
GRANT ALL ON virtual_transactions TO service_role;
GRANT ALL ON fill_allocations TO service_role;
GRANT ALL ON batch_executions TO service_role;
GRANT ALL ON aggregated_orders TO service_role;

-- Authenticated users get limited access (RLS enforces per-user)
GRANT SELECT ON virtual_portfolios TO authenticated;
GRANT SELECT ON virtual_holdings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON order_intentions TO authenticated;
GRANT SELECT ON virtual_transactions TO authenticated;
GRANT SELECT ON fill_allocations TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE virtual_portfolios IS 'User virtual cash balances for batch trading. One per user.';
COMMENT ON COLUMN virtual_portfolios.reserved_balance IS 'Cash reserved for pending buy orders, cannot be used until order fills or cancels';

COMMENT ON TABLE virtual_holdings IS 'User virtual share holdings. Updated after batch fill allocation.';
COMMENT ON COLUMN virtual_holdings.avg_cost_basis IS 'Weighted average cost per share';

COMMENT ON TABLE order_intentions IS 'User order intentions awaiting batch execution. BUY orders reserve cash at submission.';
COMMENT ON COLUMN order_intentions.reserved_amount IS 'Cash reserved for this BUY order (estimated price + buffer)';

COMMENT ON TABLE batch_executions IS 'Records of batch execution runs. Admin only.';
COMMENT ON TABLE aggregated_orders IS 'Orders aggregated from multiple user intentions for single IB execution. Admin only.';

COMMENT ON TABLE fill_allocations IS 'How fills were allocated to individual users pro-rata.';
COMMENT ON COLUMN fill_allocations.allocation_percentage IS 'User quantity / total aggregated quantity';

COMMENT ON TABLE virtual_transactions IS 'Complete audit trail of all balance and holding changes.';
