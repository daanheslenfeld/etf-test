-- Create simulation_state table to store paused simulation data
CREATE TABLE IF NOT EXISTS simulation_state (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  current_month INTEGER NOT NULL DEFAULT 0,
  performance_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- Create index on customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_simulation_state_customer_id ON simulation_state(customer_id);

-- Add RLS policies
ALTER TABLE simulation_state ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own simulation state
CREATE POLICY "Users can view their own simulation state"
  ON simulation_state
  FOR SELECT
  USING (customer_id = auth.uid()::bigint);

-- Policy: Users can only insert their own simulation state
CREATE POLICY "Users can insert their own simulation state"
  ON simulation_state
  FOR INSERT
  WITH CHECK (customer_id = auth.uid()::bigint);

-- Policy: Users can only update their own simulation state
CREATE POLICY "Users can update their own simulation state"
  ON simulation_state
  FOR UPDATE
  USING (customer_id = auth.uid()::bigint);

-- Policy: Users can only delete their own simulation state
CREATE POLICY "Users can delete their own simulation state"
  ON simulation_state
  FOR DELETE
  USING (customer_id = auth.uid()::bigint);
