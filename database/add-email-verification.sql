-- Add email verification columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create index on verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_verification_token ON customers(verification_token);

-- Optional: Add a function to clean up expired verification tokens (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS void AS $$
BEGIN
  UPDATE customers
  SET verification_token = NULL
  WHERE verification_token IS NOT NULL
    AND email_verified = FALSE
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-verification-tokens', '0 0 * * *', 'SELECT cleanup_expired_verification_tokens()');
