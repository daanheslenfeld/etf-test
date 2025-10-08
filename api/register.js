const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

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

    // Verification token generation disabled
    // const verificationToken = crypto.randomBytes(32).toString('hex');
    // console.log('Generated verification token:', verificationToken);

    // Insert customer into Supabase (unverified)
    const { data: customer, error } = await supabase
      .from('customers')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
          street: street,
          house_number: houseNumber,
          postal_code: postalCode,
          city: city,
          phone: phone,
          birth_date: birthDate,
          role: 'customer',
          email_verified: true  // Auto-verify since we disabled email verification
          // verification_token: verificationToken
        }
      ])
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

    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: 'New User Registration - PIGG',
      html: `
        <h2>New User Registration</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Registration Date:</strong> ${new Date().toLocaleString('nl-NL')}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    // Verification email disabled - users can login immediately
    // const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${verificationToken}`;
    // const verificationEmail = { ... };
    // await transporter.sendMail(verificationEmail);

    res.status(200).json({
      success: true,
      message: 'Registratie succesvol! Je kunt nu inloggen.',
      emailSent: false,
      email: email
    });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};
