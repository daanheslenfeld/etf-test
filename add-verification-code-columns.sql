-- Add verification_code and verification_code_expires_at columns to customers table

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_verification_code ON customers(verification_code);

-- Add index for email + verification_code combo
CREATE INDEX IF NOT EXISTS idx_customers_email_verification ON customers(email, verification_code);

-- Comment for documentation
COMMENT ON COLUMN customers.verification_code IS '6-digit code sent via email for account verification';
COMMENT ON COLUMN customers.verification_code_expires_at IS 'Expiry timestamp for verification code (15 minutes from generation)';
