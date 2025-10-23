ALTER TABLE customers
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_customers_verification_code ON customers(verification_code);

CREATE INDEX IF NOT EXISTS idx_customers_email_verification ON customers(email, verification_code);
