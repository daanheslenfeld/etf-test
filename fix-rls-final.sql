-- Disable RLS temporarily to test
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, create proper policies:
-- First, drop existing policies
DROP POLICY IF EXISTS "Allow public email verification" ON customers;
DROP POLICY IF EXISTS "Allow updating verification status" ON customers;

-- Re-enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create new policies that work with service_role
CREATE POLICY "service_role_all" ON customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon to read customers for verification
CREATE POLICY "anon_select_for_verification" ON customers
  FOR SELECT
  TO anon
  USING (verification_token IS NOT NULL OR email_verified = true);
