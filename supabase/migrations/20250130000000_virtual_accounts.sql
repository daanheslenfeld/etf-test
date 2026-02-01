-- Migration: Virtual Trading Accounts
-- Adds support for multiple virtual trading accounts per user.
-- Each virtual account has its own portfolio, holdings, orders, and transactions.
-- All real trades execute on the same physical LYNX/IB account.

-- =============================================================================
-- TABLE: virtual_accounts
-- =============================================================================

CREATE TABLE IF NOT EXISTS virtual_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_virtual_accounts_owner ON virtual_accounts(owner_id);
CREATE INDEX idx_virtual_accounts_active ON virtual_accounts(owner_id, is_active);

-- Updated_at trigger
CREATE TRIGGER update_virtual_accounts_updated_at
    BEFORE UPDATE ON virtual_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ALTER EXISTING TABLES: Add virtual_account_id column
-- =============================================================================

-- virtual_portfolios: Add virtual_account_id, update unique constraint
ALTER TABLE virtual_portfolios
    ADD COLUMN IF NOT EXISTS virtual_account_id UUID REFERENCES virtual_accounts(id) ON DELETE CASCADE;

-- Drop old unique constraint and add new one
-- The old constraint is (user_id). New: (user_id, virtual_account_id) with COALESCE for null-safety.
ALTER TABLE virtual_portfolios
    DROP CONSTRAINT IF EXISTS unique_user_portfolio;

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_virtual_portfolio
    ON virtual_portfolios (user_id, COALESCE(virtual_account_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS idx_virtual_portfolios_account
    ON virtual_portfolios(virtual_account_id);

-- virtual_holdings: Add virtual_account_id, update unique constraint
ALTER TABLE virtual_holdings
    ADD COLUMN IF NOT EXISTS virtual_account_id UUID REFERENCES virtual_accounts(id) ON DELETE CASCADE;

ALTER TABLE virtual_holdings
    DROP CONSTRAINT IF EXISTS unique_user_symbol;

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_account_symbol
    ON virtual_holdings (user_id, COALESCE(virtual_account_id, '00000000-0000-0000-0000-000000000000'::uuid), symbol);

CREATE INDEX IF NOT EXISTS idx_virtual_holdings_account
    ON virtual_holdings(virtual_account_id);

-- order_intentions: Add virtual_account_id
ALTER TABLE order_intentions
    ADD COLUMN IF NOT EXISTS virtual_account_id UUID REFERENCES virtual_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_intentions_account
    ON order_intentions(virtual_account_id);

-- virtual_transactions: Add virtual_account_id
ALTER TABLE virtual_transactions
    ADD COLUMN IF NOT EXISTS virtual_account_id UUID REFERENCES virtual_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_virtual_transactions_account
    ON virtual_transactions(virtual_account_id);

-- fill_allocations: Add virtual_account_id
ALTER TABLE fill_allocations
    ADD COLUMN IF NOT EXISTS virtual_account_id UUID REFERENCES virtual_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fill_allocations_account
    ON fill_allocations(virtual_account_id);

-- =============================================================================
-- ROW LEVEL SECURITY: virtual_accounts
-- =============================================================================

ALTER TABLE virtual_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own virtual accounts" ON virtual_accounts
    FOR SELECT USING (owner_id = (current_setting('request.jwt.claims', true)::json->>'sub')::integer);

CREATE POLICY "Service role full access virtual accounts" ON virtual_accounts
    FOR ALL USING (current_setting('role') = 'service_role');

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT ALL ON virtual_accounts TO service_role;
GRANT SELECT ON virtual_accounts TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE virtual_accounts IS 'Virtual trading accounts. Each user can have multiple accounts, each with independent cash and holdings. All real trades go through the same LYNX/IB account.';
COMMENT ON COLUMN virtual_accounts.owner_id IS 'Customer who owns this virtual account';
COMMENT ON COLUMN virtual_accounts.name IS 'Display name for the account (e.g., "Aggressive Growth")';
COMMENT ON COLUMN virtual_accounts.is_active IS 'Soft-delete flag. Inactive accounts cannot trade.';

COMMENT ON COLUMN virtual_portfolios.virtual_account_id IS 'Links portfolio to a virtual account. NULL for legacy/direct portfolios.';
COMMENT ON COLUMN virtual_holdings.virtual_account_id IS 'Links holding to a virtual account. NULL for legacy/direct holdings.';
COMMENT ON COLUMN order_intentions.virtual_account_id IS 'Links order to a virtual account. NULL for direct/batch orders.';
COMMENT ON COLUMN virtual_transactions.virtual_account_id IS 'Links transaction to a virtual account. NULL for legacy transactions.';
