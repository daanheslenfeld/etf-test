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

  // GET - Fetch all inquiries OR messages for a specific inquiry
  if (req.method === 'GET') {
    const { inquiry_id } = req.query;

    // If inquiry_id is provided, fetch messages for that inquiry
    if (inquiry_id) {
      try {
        const { data: messages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('inquiry_id', inquiry_id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Supabase error:', error);
          return res.status(400).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
          });
        }

        return res.status(200).json({
          success: true,
          messages: messages || []
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch messages',
          error: error.message
        });
      }
    }

    // Otherwise, fetch all inquiries
    try {
      const { data: inquiries, error } = await supabase
        .from('chat_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to fetch chat inquiries',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        inquiries: inquiries || []
      });
    } catch (error) {
      console.error('Error fetching chat inquiries:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch chat inquiries',
        error: error.message
      });
    }
  }

  // POST - Create new inquiry OR send a message in conversation
  if (req.method === 'POST') {
    const { inquiry_id, sender, message, name, email, phone, question, timestamp } = req.body;

    // If inquiry_id and sender are provided, this is a new message in a conversation
    if (inquiry_id && sender && message) {
      try {
        // Insert the new message
        const { data: newMessage, error: messageError } = await supabase
          .from('chat_messages')
          .insert([
            {
              inquiry_id: inquiry_id,
              sender: sender,
              message: message
            }
          ])
          .select();

        if (messageError) {
          console.error('Supabase error:', messageError);
          return res.status(400).json({
            success: false,
            error: 'Failed to send message',
            details: messageError.message
          });
        }

        // Update the inquiry with response tracking
        const updates = {
          last_response_at: new Date().toISOString(),
          response_count: supabase.raw('response_count + 1')
        };

        // If sender is customer, mark as having unread response
        if (sender === 'customer') {
          updates.has_unread_response = true;
        }

        // If sender is manager, update status to 'responded'
        if (sender === 'manager') {
          updates.status = 'responded';
          updates.has_unread_response = false;
        }

        const { error: updateError } = await supabase
          .from('chat_inquiries')
          .update(updates)
          .eq('id', inquiry_id);

        if (updateError) {
          console.error('Error updating inquiry:', updateError);
        }

        return res.status(200).json({
          success: true,
          message: 'Message sent successfully',
          data: newMessage
        });
      } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to send message',
          details: error.message
        });
      }
    }

    // Otherwise, this is a new inquiry
    try {
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
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
