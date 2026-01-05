-- Add wealth_proof_document column to customers table
-- This stores the uploaded proof of wealth document as base64

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS wealth_proof_document TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN customers.wealth_proof_document IS 'Base64 encoded proof of wealth document (image or PDF)';
