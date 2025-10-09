-- Fix Row Level Security for email verification
-- Run this in Supabase SQL Editor

-- First, check if RLS is enabled on customers table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'customers';

-- If RLS is enabled, we need to add a policy to allow verification
-- This policy allows reading customer data when verifying by token
CREATE POLICY IF NOT EXISTS "Allow email verification by token"
ON customers
FOR SELECT
TO service_role
USING (true);

-- Also allow authenticated users to verify themselves
CREATE POLICY IF NOT EXISTS "Allow public email verification"
ON customers
FOR SELECT
TO anon
USING (verification_token IS NOT NULL);

-- Allow updating email_verified status
CREATE POLICY IF NOT EXISTS "Allow updating verification status"
ON customers
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
