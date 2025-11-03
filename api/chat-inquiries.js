const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  'https://rfmbhdgfovnglegqxjnj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

// Email transporter setup (using Gmail as example - you can change this)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@pigg.com',
    pass: process.env.EMAIL_PASSWORD || ''
  }
});

// Function to send email notification
async function sendEmailNotification(to, name, question, response) {
  try {
    const mailOptions = {
      from: '"PIGG Support" <noreply@pigg.com>',
      to: to,
      subject: 'Antwoord op jouw vraag - PIGG',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28EBCF 0%, #20D4BA 100%); padding: 30px; text-align: center;">
            <h1 style="color: #1A1B1F; margin: 0;">PIGG</h1>
            <p style="color: #1A1B1F; margin: 5px 0 0 0;">Your digital Piggy Bank for global Investing</p>
          </div>

          <div style="background: #f5f5f5; padding: 30px;">
            <p style="color: #333; font-size: 16px;">Hallo ${name},</p>

            <p style="color: #333; font-size: 16px;">We hebben je vraag ontvangen en beantwoord!</p>

            <div style="background: white; border-left: 4px solid #28EBCF; padding: 15px; margin: 20px 0;">
              <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;"><strong>Jouw vraag:</strong></p>
              <p style="color: #333; font-size: 14px; margin: 0;">${question}</p>
            </div>

            <div style="background: white; border-left: 4px solid #20D4BA; padding: 15px; margin: 20px 0;">
              <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;"><strong>Ons antwoord:</strong></p>
              <p style="color: #333; font-size: 14px; margin: 0; white-space: pre-wrap;">${response}</p>
            </div>

            <p style="color: #333; font-size: 16px;">Heb je nog meer vragen? Beantwoord gewoon deze email!</p>

            <p style="color: #333; font-size: 16px;">Met vriendelijke groet,<br>Het PIGG Team</p>
          </div>

          <div style="background: #1A1B1F; padding: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} PIGG - Your digital Piggy Bank for global Investing
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

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

        // First, get the current inquiry to read the response_count
        const { data: currentInquiry, error: fetchError } = await supabase
          .from('chat_inquiries')
          .select('response_count, name, email, question')
          .eq('id', inquiry_id)
          .single();

        if (fetchError) {
          console.error('Error fetching inquiry:', fetchError);
        }

        // Update the inquiry with response tracking
        const updates = {
          last_response_at: new Date().toISOString(),
          response_count: (currentInquiry?.response_count || 0) + 1
        };

        // If sender is customer, mark as having unread response
        if (sender === 'customer') {
          updates.has_unread_response = true;
        }

        // If sender is manager, update status to 'responded' and send email
        if (sender === 'manager') {
          updates.status = 'responded';
          updates.has_unread_response = false;

          if (currentInquiry) {
            // Send email notification (don't wait for it to complete)
            sendEmailNotification(
              currentInquiry.email,
              currentInquiry.name,
              currentInquiry.question,
              message
            ).catch(err => console.error('Email send failed:', err));
          }
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
            status: 'new',
            response_count: 1
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

      // Also insert the initial question as a message
      if (data && data[0]) {
        const { error: messageError } = await supabase
          .from('chat_messages')
          .insert([
            {
              inquiry_id: data[0].id,
              sender: 'customer',
              message: question,
              created_at: timestamp || new Date().toISOString()
            }
          ]);

        if (messageError) {
          console.error('Error saving initial message:', messageError);
          // Don't fail the whole request if message insert fails
        }
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
