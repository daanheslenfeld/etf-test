-- Add id_document_image column to customers table
-- This stores the uploaded ID document as base64

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS id_document_image TEXT;

-- Add kyc_data column if it doesn't exist
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS kyc_data TEXT;
