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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !customer) {
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
};
