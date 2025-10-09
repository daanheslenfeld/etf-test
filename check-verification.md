# Email Verification Debugging Steps

## Possible Issues:

### 1. Row Level Security (RLS) Blocking the Query
Supabase has RLS enabled by default. The `verification_token` lookup might be blocked.

**Fix in Supabase Dashboard:**
1. Go to Database → Tables → customers
2. Click on "RLS" or "Policies"
3. Check if RLS is enabled
4. Add a policy to allow reading customers by verification_token:

```sql
-- Policy to allow verifying email with token
CREATE POLICY "Allow email verification by token"
ON customers
FOR SELECT
USING (verification_token IS NOT NULL);
```

### 2. Using Service Role Key Instead of Anon Key
The API should use the **service role key** (not the anon key) to bypass RLS.

**Check your .env file:**
```
SUPABASE_KEY=your_service_role_key_here  # Should be service_role, not anon key
```

**How to find it:**
1. Go to Supabase Dashboard → Project Settings → API
2. Look for "Project API keys"
3. Copy the `service_role` key (not the `anon` key)
4. Update your `.env` file

### 3. Database Column Case Sensitivity
Check if the `verification_token` column exists and is the correct type.

**Run this query in Supabase SQL Editor:**
```sql
-- Check table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name LIKE '%verif%';

-- Check for unverified customers with tokens
SELECT id, email, email_verified, verification_token
FROM customers
WHERE email_verified = false
  AND verification_token IS NOT NULL;
```

### 4. Token Not Being Saved
Check if tokens are actually being saved when users register.

**Test Registration:**
1. Register a new test account
2. Check the database immediately after:
```sql
SELECT email, verification_token, email_verified
FROM customers
ORDER BY created_at DESC
LIMIT 5;
```

## Testing Steps:

1. **Deploy the updated code:**
   ```bash
   vercel --prod
   ```

2. **Register a new test account**

3. **Check the Vercel logs:**
   ```bash
   vercel logs
   ```
   Look for the console.log output from verify-email.js

4. **Check the exact token in the database** and compare with the token in the email link

## Quick Test Query

Run this in Supabase SQL Editor to manually verify a user:

```sql
-- Find a user to test with
SELECT id, email, verification_token, email_verified
FROM customers
WHERE email = 'your-test-email@example.com';

-- Manually verify (for testing only)
UPDATE customers
SET email_verified = true,
    verification_token = NULL,
    verified_at = NOW()
WHERE email = 'your-test-email@example.com';
```
