-- Add current_portfolio_value column to investment_details table
ALTER TABLE investment_details
ADD COLUMN IF NOT EXISTS current_portfolio_value DECIMAL(15,2) DEFAULT NULL;

-- Add total_return column to track the return percentage
ALTER TABLE investment_details
ADD COLUMN IF NOT EXISTS total_return DECIMAL(10,2) DEFAULT NULL;
