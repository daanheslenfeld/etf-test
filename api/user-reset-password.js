const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rfmbhdgfovnglegqxjnj.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

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

  const { action, email, newPassword } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is verplicht' });
  }

  try {
    if (action === 'check-email') {
      // Check if email exists in database
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

      // Update password in database
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
    console.error('User reset password error:', error);
    res.status(500).json({ success: false, message: 'Er is een fout opgetreden' });
  }
};
