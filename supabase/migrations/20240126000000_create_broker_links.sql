-- Migration: Create broker_links table for per-user broker account linking
-- Run this in your Supabase SQL editor

-- Create enum for broker link status
CREATE TYPE broker_link_status AS ENUM ('unlinked', 'linked', 'disabled');

-- Create broker_links table
CREATE TABLE IF NOT EXISTS broker_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    broker VARCHAR(50) NOT NULL DEFAULT 'LYNX',
    ib_account_id VARCHAR(50),  -- e.g., DU0521473
    status broker_link_status NOT NULL DEFAULT 'unlinked',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one active link per user per broker
    CONSTRAINT unique_user_broker UNIQUE (user_id, broker)
);

-- Create index for fast lookups
CREATE INDEX idx_broker_links_user_id ON broker_links(user_id);
CREATE INDEX idx_broker_links_status ON broker_links(status);
CREATE INDEX idx_broker_links_ib_account ON broker_links(ib_account_id) WHERE ib_account_id IS NOT NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to broker_links
CREATE TRIGGER update_broker_links_updated_at
    BEFORE UPDATE ON broker_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE broker_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own broker links
CREATE POLICY "Users can view own broker links" ON broker_links
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'::integer);

-- Policy: Users can insert their own broker links
CREATE POLICY "Users can insert own broker links" ON broker_links
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub'::integer);

-- Policy: Users can update their own broker links
CREATE POLICY "Users can update own broker links" ON broker_links
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub'::integer);

-- Policy: Service role can do anything (for backend API)
CREATE POLICY "Service role full access" ON broker_links
    FOR ALL USING (current_setting('role') = 'service_role');

-- Grant permissions
GRANT ALL ON broker_links TO service_role;
GRANT SELECT, INSERT, UPDATE ON broker_links TO authenticated;

-- Add comment
COMMENT ON TABLE broker_links IS 'Per-user broker account linking. One active link per user max.';
COMMENT ON COLUMN broker_links.ib_account_id IS 'Interactive Brokers account ID (e.g., DU0521473 for paper, U... for live)';
COMMENT ON COLUMN broker_links.status IS 'unlinked=no account, linked=active connection, disabled=manually disabled';
