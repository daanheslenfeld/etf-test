const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rfmbhdgfovnglegqxjnj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

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
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  console.log('=== RESEND VERIFICATION CODE ===');
  console.log('Email:', email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is verplicht'
    });
  }

  try {
    // Find customer with this email
    const { data: customer, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (findError || !customer) {
      return res.status(400).json({
        success: false,
        message: 'Geen account gevonden met dit emailadres'
      });
    }

    // Check if already verified
    if (customer.email_verified) {
      return res.status(200).json({
        success: false,
        message: 'Dit emailadres is al geverifieerd',
        alreadyVerified: true
      });
    }

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    console.log('New verification code:', verificationCode);

    // Update customer with new code
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        verification_code: verificationCode,
        verification_code_expires_at: codeExpiresAt.toISOString()
      })
      .eq('id', customer.id);

    if (updateError) {
      console.error('Error updating verification code:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden'
      });
    }

    // Send verification code email
    const verificationEmail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Nieuwe verificatiecode - PIGG',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28EBCF;">Nieuwe verificatiecode</h2>
          <p>Hallo ${customer.first_name},</p>
          <p>Je hebt een nieuwe verificatiecode aangevraagd:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #1A1B1F; font-size: 36px; letter-spacing: 8px; margin: 0;">${verificationCode}</h1>
          </div>
          <p>Deze code is <strong>15 minuten geldig</strong>.</p>
          <p>Met vriendelijke groet,<br>Het PIGG Team</p>
        </div>
      `
    };

    await transporter.sendMail(verificationEmail);
    console.log('New verification code sent to:', email);

    res.status(200).json({
      success: true,
      message: 'Nieuwe verificatiecode is verzonden naar je email'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden. Probeer het later opnieuw.'
    });
  }
};
