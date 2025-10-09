-- Create portfolio table if it doesn't exist
CREATE TABLE IF NOT EXISTS portfolio (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  naam TEXT NOT NULL,
  isin TEXT NOT NULL,
  categorie TEXT,
  weight DECIMAL(10,2),
  ter_pa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_customer_id ON portfolio(customer_id);

-- Enable RLS (Row Level Security)
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role (your API uses service_role key)
CREATE POLICY "Allow service role full access to portfolio"
  ON portfolio
  FOR ALL
  USING (true)
  WITH CHECK (true);
