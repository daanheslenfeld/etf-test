-- Add onboarding_data column to customers table
-- This stores the questionnaire answers and risk profile recommendation

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS onboarding_data TEXT;

-- Add comment for documentation
COMMENT ON COLUMN customers.onboarding_data IS 'JSON string containing questionnaire answers, recommended profile, selected profile, and disclaimer acceptance';
