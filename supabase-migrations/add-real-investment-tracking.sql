-- Add columns for real investment tracking
-- These columns store the purchase price and units to calculate real gains/losses

-- Add purchase_price column (price per unit at time of investment)
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(15,4);

-- Add units column (number of units/shares bought)
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS units DECIMAL(15,6);

-- Add purchase_date column (when the investment was made)
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add invested_amount column (total amount invested in this ETF)
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS invested_amount DECIMAL(15,2);

-- Create a table to track portfolio value history (for charts)
CREATE TABLE IF NOT EXISTS portfolio_history (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_invested DECIMAL(15,2),
  total_value DECIMAL(15,2),
  total_return_pct DECIMAL(10,4)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_history_customer_id ON portfolio_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_recorded_at ON portfolio_history(recorded_at);

-- Enable RLS
ALTER TABLE portfolio_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to portfolio_history"
  ON portfolio_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
