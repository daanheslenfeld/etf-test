const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
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

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verificatie token ontbreekt'
    });
  }

  try {
    // Find customer with this verification token
    const { data: customer, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (findError || !customer) {
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
