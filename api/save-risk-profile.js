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

  const { customer_id, risk_profile, answers } = req.body;

  if (!customer_id) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
  }

  try {
    // Update customer with risk profile data
    const { data, error } = await supabase
      .from('customers')
      .update({
        risk_profile: risk_profile,
        risk_profile_answers: answers,
        risk_profile_completed_at: new Date().toISOString()
      })
      .eq('id', customer_id)
      .select()
      .single();

    if (error) {
      console.error('Error saving risk profile:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to save risk profile'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Risk profile saved successfully',
      data: data
    });

  } catch (error) {
    console.error('Error saving risk profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
