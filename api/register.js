const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

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
    // Insert customer into Supabase
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
          role: 'customer'
        }
      ])
      .select()
      .single();

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

    // Send welcome email to the user
    const welcomeEmail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to PIGG - Your digital Piggy Bank',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28EBCF;">Welcome to PIGG!</h2>
          <p>Hi ${firstName},</p>
          <p>Thank you for registering with PIGG - Your digital Piggy Bank for global Investing.</p>
          <p>You can now start building your investment portfolio.</p>
          <p>Best regards,<br>The PIGG Team</p>
        </div>
      `
    };

    await transporter.sendMail(welcomeEmail);

    res.status(200).json({
      success: true,
      message: 'Registration successful! Check your email.',
      customer: customer
    });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};
