const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
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
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log('Generated verification token:', verificationToken);

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
          email_verified: false,
          verification_token: verificationToken
        }
      ])
      .select()
      .single();

    console.log('Insert result - customer:', customer);
    console.log('Insert result - error:', error);

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

    // Send verification email to the user
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${verificationToken}`;
    const verificationEmail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Bevestig je email - PIGG',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #28EBCF;">Welkom bij PIGG!</h2>
          <p>Hi ${firstName},</p>
          <p>Bedankt voor je registratie bij PIGG - Your digital Piggy Bank for global Investing.</p>
          <p>Om je account te activeren, moet je eerst je emailadres bevestigen.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #28EBCF;
                      color: #0A0B0D;
                      padding: 12px 30px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: bold;
                      display: inline-block;">
              Bevestig Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Of kopieer deze link naar je browser:<br>
            <a href="${verificationUrl}" style="color: #28EBCF;">${verificationUrl}</a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Deze link is geldig voor 24 uur. Als je deze email niet hebt aangevraagd, kun je deze negeren.
          </p>
          <p>Best regards,<br>The PIGG Team</p>
        </div>
      `
    };

    await transporter.sendMail(verificationEmail);

    res.status(200).json({
      success: true,
      message: 'Registratie succesvol! Controleer je email om je account te activeren.',
      emailSent: true,
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
