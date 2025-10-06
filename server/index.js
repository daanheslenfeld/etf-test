const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your email provider
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD // Your email password or app password
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL, // Your email where you want to receive notifications
      subject: 'New User Registration - PIGG',
      html: `
        <h2>New User Registration</h2>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Registration Date:</strong> ${new Date().toLocaleString('nl-NL')}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    // Also send welcome email to the user
    const welcomeEmail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to PIGG - Your digital Piggy Bank',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28EBCF;">Welcome to PIGG!</h2>
          <p>Hi ${name || 'there'},</p>
          <p>Thank you for registering with PIGG - Your digital Piggy Bank for global Investing.</p>
          <p>You can now start building your investment portfolio.</p>
          <p>Best regards,<br>The PIGG Team</p>
        </div>
      `
    };

    await transporter.sendMail(welcomeEmail);

    res.status(200).json({
      success: true,
      message: 'Registration successful! Check your email.'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
