const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
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
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const ip_address = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || null;
  const user_agent = req.headers['user-agent'] || null;

  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !customer) {
      await supabase.from('login_log').insert({ email: email || 'unknown', success: false, failure_reason: 'invalid_credentials', ip_address, user_agent }).catch(() => {});
      return res.status(401).json({
        success: false,
        message: 'Onjuiste email of wachtwoord'
      });
    }

    // Get portfolio
    const { data: portfolio } = await supabase
      .from('portfolio')
      .select('*')
      .eq('customer_id', customer.id);

    // Get investment details
    const { data: investmentDetails } = await supabase
      .from('investment_details')
      .select('*')
      .eq('customer_id', customer.id)
      .single();

    await supabase.from('login_log').insert({ customer_id: customer.id, email: customer.email, success: true, ip_address, user_agent }).catch(() => {});

    res.status(200).json({
      success: true,
      customer: {
        ...customer,
        portfolio: portfolio || [],
        investmentDetails: investmentDetails || {}
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Login mislukt. Probeer opnieuw.'
    });
  }
});

// Log login (for admin/demo logins from frontend)
app.post('/api/log-login', async (req, res) => {
  const { email, success = true, role } = req.body;
  const ip_address = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || null;
  const user_agent = req.headers['user-agent'] || null;
  try {
    await supabase.from('login_log').insert({ email, success, failure_reason: role ? `role:${role}` : null, ip_address, user_agent });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(200).json({ success: true });
  }
});

// Fetch login logs (for admin portal)
app.get('/api/login-log', async (req, res) => {
  try {
    const { email, days } = req.query;
    const daysLimit = parseInt(days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - daysLimit);

    let query = supabase
      .from('login_log')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(200);

    if (email) {
      query = query.ilike('email', `%${email}%`);
    }

    const { data: logs, error } = await query;
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch login logs' });
    }
    res.status(200).json({ success: true, logs: logs || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch login logs' });
  }
});

// User-initiated password reset
app.post('/api/user-reset-password', async (req, res) => {
  const { action, email, newPassword } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is verplicht' });

  try {
    if (action === 'check-email') {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('id, email, first_name')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      if (error || !customer) {
        return res.status(404).json({ success: false, message: 'Geen account gevonden met dit email adres' });
      }
      return res.status(200).json({ success: true, firstName: customer.first_name });
    } else if (action === 'reset-password') {
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Wachtwoord moet minimaal 6 tekens zijn' });
      }
      const { error: updateError } = await supabase
        .from('customers')
        .update({ password: newPassword })
        .eq('email', email.toLowerCase());
      if (updateError) {
        return res.status(500).json({ success: false, message: 'Wachtwoord resetten mislukt' });
      }
      return res.status(200).json({ success: true, message: 'Wachtwoord succesvol gewijzigd' });
    } else {
      return res.status(400).json({ success: false, message: 'Ongeldige actie' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Er is een fout opgetreden' });
  }
});

// Delete customer endpoint
app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: 'Verwijderen mislukt'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Klant succesvol verwijderd'
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Verwijderen mislukt. Probeer opnieuw.'
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
