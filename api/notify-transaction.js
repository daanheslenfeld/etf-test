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
    const { customerId, orders, portfolioName, totalAmount } = body;

    if (!customerId || !orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ success: false, message: 'customerId and orders are required' });
    }

    // Look up customer email
    const { data: customer, error: dbError } = await supabase
      .from('customers')
      .select('email, first_name')
      .eq('id', customerId)
      .maybeSingle();

    if (dbError || !customer || !customer.email) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const transporter = getMailTransporter();
    if (!transporter) {
      return res.status(500).json({ success: false, message: 'Email service not configured' });
    }

    const firstName = customer.first_name || 'Belegger';
    const formattedTotal = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(totalAmount || 0);

    // Build order rows
    const orderRows = orders.map(order => {
      const value = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(order.estimatedValue || 0);
      const price = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(order.estimatedPrice || 0);
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E8E8E6; font-weight: 600; color: #2D3436;">${order.symbol}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E8E8E6; color: #636E72; font-size: 13px;">${order.name || ''}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E8E8E6; text-align: center; color: #2D3436;">${order.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E8E8E6; text-align: right; color: #636E72; font-size: 13px;">${price}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E8E8E6; text-align: right; font-weight: 600; color: #2D3436;">${value}</td>
        </tr>
      `;
    }).join('');

    const portfolioLine = portfolioName
      ? `<p style="margin: 0 0 8px 0; color: #636E72;">Je hebt het model portfolio <strong style="color: #2D3436;">${portfolioName}</strong> toegevoegd aan je basket.</p>`
      : `<p style="margin: 0 0 8px 0; color: #636E72;">Je hebt de volgende orders toegevoegd aan je basket.</p>`;

    const subject = portfolioName
      ? `Order bevestiging — ${portfolioName}`
      : `Order bevestiging — ${orders.length} ETF${orders.length > 1 ? "'s" : ''}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FEFEFE;">
          <!-- Header -->
          <div style="background-color: #7C9885; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">Order bevestiging</h1>
          </div>

          <!-- Content -->
          <div style="padding: 32px; border: 1px solid #E8E8E6; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin: 0 0 16px 0; color: #2D3436; font-size: 16px;">Hallo ${firstName},</p>

            ${portfolioLine}

            <p style="margin: 0 0 20px 0; color: #636E72; font-size: 14px;">Hieronder vind je een overzicht van je orders:</p>

            <!-- Order table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <thead>
                <tr style="background-color: #F5F6F4;">
                  <th style="padding: 10px 12px; text-align: left; color: #636E72; font-weight: 600; font-size: 12px; text-transform: uppercase;">ETF</th>
                  <th style="padding: 10px 12px; text-align: left; color: #636E72; font-weight: 600; font-size: 12px; text-transform: uppercase;">Naam</th>
                  <th style="padding: 10px 12px; text-align: center; color: #636E72; font-weight: 600; font-size: 12px; text-transform: uppercase;">Stuks</th>
                  <th style="padding: 10px 12px; text-align: right; color: #636E72; font-weight: 600; font-size: 12px; text-transform: uppercase;">Prijs</th>
                  <th style="padding: 10px 12px; text-align: right; color: #636E72; font-weight: 600; font-size: 12px; text-transform: uppercase;">Waarde</th>
                </tr>
              </thead>
              <tbody>
                ${orderRows}
              </tbody>
              <tfoot>
                <tr style="background-color: #F5F6F4;">
                  <td colspan="4" style="padding: 12px; font-weight: 700; color: #2D3436;">Totaal</td>
                  <td style="padding: 12px; text-align: right; font-weight: 700; color: #7C9885; font-size: 16px;">${formattedTotal}</td>
                </tr>
              </tfoot>
            </table>

            <p style="margin: 0 0 24px 0; color: #636E72; font-size: 13px;">
              De orders worden uitgevoerd tijdens de eerstvolgende batch (14:00 CET).
              Je kunt orders tot 13:55 annuleren via de app.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://etf-test.vercel.app" style="display: inline-block; padding: 14px 32px; background-color: #7C9885; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Bekijk je portfolio</a>
            </div>

            <p style="margin: 24px 0 0 0; color: #2D3436;">Met vriendelijke groet,<br>Het PIGG Team</p>
          </div>
        </div>
      `
    });

    res.status(200).json({ success: true, message: 'Transaction notification email sent' });

  } catch (error) {
    console.error('Notify transaction error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send notification' });
  }
};
