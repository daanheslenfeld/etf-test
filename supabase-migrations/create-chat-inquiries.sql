-- Create chat_inquiries table
CREATE TABLE IF NOT EXISTS chat_inquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  question TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_inquiries_status ON chat_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_chat_inquiries_created_at ON chat_inquiries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE chat_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to do everything
CREATE POLICY "Service role can do everything" ON chat_inquiries
  FOR ALL
  USING (true)
  WITH CHECK (true);
