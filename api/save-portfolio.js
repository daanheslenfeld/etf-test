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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { customer_id, portfolio, investmentDetails, account_type } = req.body;

  if (!customer_id) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
  }

  try {
    // Update customer with account type if provided
    if (account_type) {
      await supabase
        .from('customers')
        .update({ account_type })
        .eq('id', customer_id);
    }

    // Delete existing portfolio items for this customer
    await supabase
      .from('portfolio')
      .delete()
      .eq('customer_id', customer_id);

    // Insert new portfolio items
    if (portfolio && portfolio.length > 0) {
      const portfolioItems = portfolio.map(item => ({
        customer_id,
        naam: item.naam,
        isin: item.isin,
        categorie: item.categorie,
        weight: item.weight,
        ter_pa: item['ter p.a.'] || item.ter_pa
      }));

      const { error: portfolioError } = await supabase
        .from('portfolio')
        .insert(portfolioItems);

      if (portfolioError) {
        throw portfolioError;
      }
    }

    // Save or update investment details
    if (investmentDetails && Object.keys(investmentDetails).length > 0) {
      const { data: existing } = await supabase
        .from('investment_details')
        .select('id')
        .eq('customer_id', customer_id)
        .single();

      const investmentData = {
        customer_id,
        goal: investmentDetails.goal,
        horizon: investmentDetails.horizon,
        amount: investmentDetails.amount,
        monthly_contribution: investmentDetails.monthlyContribution,
        risk_profile: investmentDetails.riskProfile
      };

      if (existing) {
        await supabase
          .from('investment_details')
          .update(investmentData)
          .eq('customer_id', customer_id);
      } else {
        await supabase
          .from('investment_details')
          .insert([investmentData]);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Portfolio saved successfully'
    });

  } catch (error) {
    console.error('Error saving portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save portfolio',
      error: error.message,
      details: error
    });
  }
};
