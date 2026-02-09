-- Add last_seen_at column for online user tracking
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_customers_last_seen ON customers(last_seen_at DESC);
