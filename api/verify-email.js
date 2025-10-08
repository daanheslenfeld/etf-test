const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rfmbhdgfovnglegqxjnj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;

  console.log('=== VERIFICATION DEBUG ===');
  console.log('Token received:', token);
  console.log('Token length:', token ? token.length : 0);
  console.log('Supabase URL:', process.env.SUPABASE_URL);
  console.log('Using service_role key:', process.env.SUPABASE_KEY?.includes('service_role'));

  if (!token) {
    console.log('No token provided in request');
    return res.status(400).json({
      success: false,
      message: 'Verificatie token ontbreekt'
    });
  }

  try {
    // First, let's try to get ALL unverified customers to see what we have
    const { data: allUnverified, error: allError } = await supabase
      .from('customers')
      .select('id, email, verification_token')
      .eq('email_verified', false);

    console.log('All unverified customers:', allUnverified?.length || 0);
    if (allUnverified && allUnverified.length > 0) {
      console.log('Sample tokens:', allUnverified.map(c => ({ email: c.email, token: c.verification_token?.substring(0, 20) + '...' })));
    }

    // Find customer with this verification token (exact match)
    const { data: customer, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('verification_token', token)
      .maybeSingle();

    console.log('Database lookup result:');
    console.log('- Customer found:', !!customer);
    console.log('- Error:', findError);
    if (customer) {
      console.log('- Customer email:', customer.email);
      console.log('- Already verified:', customer.email_verified);
    }

    if (findError || !customer) {
      console.log('FAILURE - No match found for token:', token.substring(0, 20) + '...');
      return res.status(400).json({
        success: false,
        message: 'Ongeldige of verlopen verificatie link'
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

    // Update customer to mark email as verified
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        email_verified: true,
        verification_token: null,
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
