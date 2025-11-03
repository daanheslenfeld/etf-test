-- Add conversation tracking fields to chat_inquiries
ALTER TABLE chat_inquiries
ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_unread_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_count INTEGER DEFAULT 0;

-- Create chat_messages table for conversation threads
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  inquiry_id INTEGER NOT NULL REFERENCES chat_inquiries(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'customer' or 'manager'
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_inquiry_id ON chat_messages(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_inquiries_has_unread ON chat_inquiries(has_unread_response) WHERE has_unread_response = true;

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to do everything
CREATE POLICY "Service role can do everything on messages" ON chat_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert initial customer messages for existing inquiries
INSERT INTO chat_messages (inquiry_id, sender, message, created_at)
SELECT id, 'customer', question, created_at
FROM chat_inquiries
WHERE NOT EXISTS (
  SELECT 1 FROM chat_messages WHERE inquiry_id = chat_inquiries.id
);
