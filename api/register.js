const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rfmbhdgfovnglegqxjnj.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
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

  const {
    firstName,
    lastName,
    email,
    password,
    street,
    houseNumber,
    postalCode,
    city,
    phone,
    birthDate
  } = req.body;

  try {
    console.log('=== REGISTRATION DEBUG ===');
    console.log('SUPABASE_KEY first 50 chars:', process.env.SUPABASE_KEY?.substring(0, 50));
    console.log('SUPABASE_KEY length:', process.env.SUPABASE_KEY?.length);
    console.log('Contains service_role:', process.env.SUPABASE_KEY?.includes('service_role'));

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    console.log('Generated verification code:', verificationCode);
    console.log('Code expires at:', codeExpiresAt.toISOString());

    // Insert customer into Supabase (unverified)
    const customerData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password,
      street: street,
      house_number: houseNumber,
      postal_code: postalCode,
      city: city,
      phone: phone,
      role: 'customer',
      account_type: 'fictief',  // Default to fictief (simulated) mode
      email_verified: false,  // User must verify email
      verification_code: verificationCode,
      verification_code_expires_at: codeExpiresAt.toISOString()
    };

    // Only add birthDate if provided
    if (birthDate) {
      customerData.birth_date = birthDate;
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    console.log('Insert result - customer:', JSON.stringify(customer, null, 2));
    console.log('Insert result - error:', JSON.stringify(error, null, 2));

    // Double check what's actually in the database
    if (customer && customer.id) {
      const { data: dbCheck, error: dbCheckError } = await supabase
        .from('customers')
        .select('id, email, verification_token, email_verified')
        .eq('id', customer.id)
        .single();

      console.log('DATABASE CHECK - What is actually stored:');
      console.log('- Customer ID:', customer.id);
      console.log('- Token from INSERT response:', customer.verification_token);
      console.log('- Token from DB query:', dbCheck?.verification_token);
      console.log('- Are they the same?', customer.verification_token === dbCheck?.verification_token);
    }

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: error.message.includes('duplicate') ? 'Dit emailadres is al geregistreerd' : 'Registratie mislukt'
      });
    }

    // Send verification code email to user
    const verificationEmail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Bevestig je emailadres - PIGG',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28EBCF;">Welkom bij PIGG!</h2>
          <p>Hallo ${firstName},</p>
          <p>Bedankt voor je registratie! Gebruik de onderstaande code om je emailadres te bevestigen:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #1A1B1F; font-size: 36px; letter-spacing: 8px; margin: 0;">${verificationCode}</h1>
          </div>
          <p>Deze code is <strong>15 minuten geldig</strong>.</p>
          <p>Als je deze registratie niet hebt aangevraagd, kun je deze email negeren.</p>
          <p>Met vriendelijke groet,<br>Het PIGG Team</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(verificationEmail);
      console.log('Verification code email sent to:', email);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    // Send notification email to admin
    const notificationEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: 'New User Registration - PIGG',
      html: `
        <h2>New User Registration</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Registration Date:</strong> ${new Date().toLocaleString('nl-NL')}</p>
        <p><strong>Status:</strong> Awaiting email verification</p>
      `
    };

    try {
      await transporter.sendMail(notificationEmail);
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Registratie succesvol! Check je email voor de verificatiecode.',
      emailSent: true,
      email: email,
      requiresVerification: true
    });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};
