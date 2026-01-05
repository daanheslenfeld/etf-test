const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rfmbhdgfovnglegqxjnj.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

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

  const { email, code } = req.body;

  console.log('=== VERIFICATION CODE CHECK ===');
  console.log('Email:', email);
  console.log('Code:', code);

  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message: 'Email en code zijn verplicht'
    });
  }

  try {
    // Find customer with this email and verification code
    const { data: customer, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .eq('verification_code', code)
      .maybeSingle();

    console.log('Customer found:', !!customer);
    console.log('Find error:', findError);

    if (findError || !customer) {
      return res.status(400).json({
        success: false,
        message: 'Ongeldige verificatiecode'
      });
    }

    // Check if already verified
    if (customer.email_verified) {
      return res.status(200).json({
        success: true,
        message: 'Email is al geverifieerd. Je kunt nu inloggen.',
        alreadyVerified: true
      });
    }

    // Check if code is expired
    const expiresAt = new Date(customer.verification_code_expires_at);
    const now = new Date();

    console.log('Code expires at:', expiresAt);
    console.log('Current time:', now);
    console.log('Is expired:', now > expiresAt);

    if (now > expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Verificatiecode is verlopen. Vraag een nieuwe code aan.',
        expired: true
      });
    }

    // Update customer to mark email as verified
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
      console.error('Error updating customer:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het verifiëren van je email'
      });
    }

    console.log('Email successfully verified for:', email);

    res.status(200).json({
      success: true,
      message: 'Je email is succesvol geverifieerd! Je kunt nu inloggen.',
      email: customer.email
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Er is een fout opgetreden. Probeer het later opnieuw.'
    });
  }
};
