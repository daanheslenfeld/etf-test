const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rfmbhdgfovnglegqxjnj.supabase.co',
  process.env.SUPABASE_KEY || ''
);

function getMailTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { ownerId, ownerName, amount } = body;

    if (!ownerId || !amount) {
      return res.status(400).json({ success: false, message: 'ownerId and amount are required' });
    }

    // Look up owner email from customers table
    const { data: customer, error: dbError } = await supabase
      .from('customers')
      .select('email, first_name')
      .eq('id', ownerId)
      .maybeSingle();

    if (dbError || !customer || !customer.email) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const transporter = getMailTransporter();
    if (!transporter) {
      return res.status(500).json({ success: false, message: 'Email service not configured' });
    }

    const formattedAmount = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
    const firstName = customer.first_name || ownerName?.split(' ')[0] || 'Klant';

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: 'Geld gestort op je PIGG rekening',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C9885;">Geld beschikbaar op je rekening</h2>
          <p>Hallo ${firstName},</p>
          <p>Er is <strong>${formattedAmount}</strong> op je PIGG rekening gestort.</p>
          <p>Je kunt nu beginnen met beleggen! Log in op je account om je portfolio samen te stellen.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://etf-test.vercel.app" style="display: inline-block; padding: 14px 32px; background-color: #7C9885; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Inloggen op PIGG</a>
          </div>
          <p>Met vriendelijke groet,<br>Het PIGG Team</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: 'Notification email sent' });

  } catch (error) {
    console.error('Notify allocation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send notification' });
  }
};
