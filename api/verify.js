const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rfmbhdgfovnglegqxjnj.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET: verify email via token link (verify-email)
  if (req.method === 'GET') {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verificatie token ontbreekt'
      });
    }

    try {
      const { data: customer, error: findError } = await supabase
        .from('customers')
        .select('*')
        .eq('verification_token', token)
        .maybeSingle();

      if (findError || !customer) {
        return res.status(400).json({
          success: false,
          message: 'Ongeldige of verlopen verificatie link'
        });
      }

      if (customer.email_verified) {
        return res.status(200).json({
          success: true,
          message: 'Email is al geverifieerd. Je kunt nu inloggen.',
          alreadyVerified: true
        });
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update({
          email_verified: true,
          verification_token: null,
          verified_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (updateError) {
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het verifiëren van je email'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Je email is succesvol geverifieerd! Je kunt nu inloggen.',
        email: customer.email
      });

    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden. Probeer het later opnieuw.'
      });
    }
  }

  // POST: verify email via 6-digit code (verify-code)
  if (req.method === 'POST') {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email en code zijn verplicht'
      });
    }

    try {
      const { data: customer, error: findError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .eq('verification_code', code)
        .maybeSingle();

      if (findError || !customer) {
        return res.status(400).json({
          success: false,
          message: 'Ongeldige verificatiecode'
        });
      }

      if (customer.email_verified) {
        return res.status(200).json({
          success: true,
          message: 'Email is al geverifieerd. Je kunt nu inloggen.',
          alreadyVerified: true
        });
      }

      const expiresAt = new Date(customer.verification_code_expires_at);
      if (new Date() > expiresAt) {
        return res.status(400).json({
          success: false,
          message: 'Verificatiecode is verlopen. Vraag een nieuwe code aan.',
          expired: true
        });
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update({
          email_verified: true,
          verification_code: null,
          verification_code_expires_at: null,
          verified_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (updateError) {
        return res.status(500).json({
          success: false,
          message: 'Er is een fout opgetreden bij het verifiëren van je email'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Je email is succesvol geverifieerd! Je kunt nu inloggen.',
        email: customer.email
      });

    } catch (error) {
      console.error('Code verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden. Probeer het later opnieuw.'
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};
