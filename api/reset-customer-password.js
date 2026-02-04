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

function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

module.exports = async (req, res) => {
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
    const { customerId } = body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'customerId is required' });
    }

    // Look up customer
    const { data: customer, error: findError } = await supabase
      .from('customers')
      .select('id, email, first_name')
      .eq('id', customerId)
      .maybeSingle();

    if (findError || !customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Generate new password
    const newPassword = generatePassword();

    // Update in database
    const { error: updateError } = await supabase
      .from('customers')
      .update({ password: newPassword })
      .eq('id', customerId);

    if (updateError) {
      return res.status(500).json({ success: false, message: 'Failed to update password' });
    }

    // Send email with new password
    const transporter = getMailTransporter();
    if (transporter) {
      const firstName = customer.first_name || 'Klant';
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: customer.email,
        subject: 'Je wachtwoord is gereset - PIGG',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7C9885;">Wachtwoord gereset</h2>
            <p>Hallo ${firstName},</p>
            <p>Je wachtwoord is gereset door een beheerder. Je kunt nu inloggen met je nieuwe wachtwoord:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <code style="font-size: 24px; letter-spacing: 2px; color: #2D3436; font-weight: bold;">${newPassword}</code>
            </div>
            <p>We raden je aan om na het inloggen je wachtwoord te wijzigen.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://etf-test.vercel.app" style="display: inline-block; padding: 14px 32px; background-color: #7C9885; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Inloggen op PIGG</a>
            </div>
            <p>Met vriendelijke groet,<br>Het PIGG Team</p>
          </div>
        `
      });
    }

    res.status(200).json({ success: true, message: 'Password reset and email sent' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
  }
};
