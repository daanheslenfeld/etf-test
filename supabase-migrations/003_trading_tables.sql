-- Migration: Add trading tables for LYNX/Interactive Brokers integration
-- Run this in Supabase SQL Editor

-- 1. Add trading_status to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trading_status VARCHAR(20) DEFAULT 'pending';
-- Values: pending, approved, rejected

-- 2. Broker accounts table - links customers to their LYNX/IB accounts
CREATE TABLE IF NOT EXISTS broker_accounts (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
  broker VARCHAR(50) DEFAULT 'LYNX',
  account_id VARCHAR(50) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'paper', -- paper, live
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, broker)
);

-- 3. Trade audit log - records all trading activity
CREATE TABLE IF NOT EXISTS trade_audit_log (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  broker_account_id BIGINT REFERENCES broker_accounts(id),
  action VARCHAR(50) NOT NULL, -- order_placed, order_cancelled, order_filled, order_rejected, quote_requested
  order_id VARCHAR(100),
  symbol VARCHAR(20),
  side VARCHAR(10), -- BUY, SELL
  quantity DECIMAL(18,6),
  price DECIMAL(18,6),
  status VARCHAR(50),
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_broker_accounts_customer ON broker_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_trade_audit_customer ON trade_audit_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_trade_audit_created ON trade_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_trading_status ON customers(trading_status);

-- 5. Update trigger for broker_accounts
CREATE OR REPLACE FUNCTION update_broker_accounts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS broker_accounts_updated ON broker_accounts;
CREATE TRIGGER broker_accounts_updated
  BEFORE UPDATE ON broker_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_broker_accounts_timestamp();
