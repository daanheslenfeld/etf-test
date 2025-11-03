const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rfmbhdgfovnglegqxjnj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, question, timestamp } = req.body;

    // Validate required fields
    if (!name || !email || !question) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('chat_inquiries')
      .insert([
        {
          name: name,
          email: email,
          phone: phone || null,
          question: question,
          created_at: timestamp || new Date().toISOString(),
          status: 'new'
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({
        success: false,
        error: 'Failed to save inquiry',
        details: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Inquiry saved successfully',
      data: data
    });
  } catch (error) {
    console.error('Error saving chat inquiry:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save inquiry',
      details: error.message
    });
  }
};
