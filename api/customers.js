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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch customers'
      });
    }

    // Fetch portfolio and investment details for each customer
    const customersWithDetails = await Promise.all(
      (customers || []).map(async (customer) => {
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

        console.log('Raw investment details from DB for customer', customer.id, ':', investmentDetails);
        console.log('risk_profile value:', investmentDetails?.risk_profile);

        // Transform snake_case to camelCase for consistency with frontend
        const transformedInvestmentDetails = investmentDetails ? {
          goal: investmentDetails.goal,
          horizon: investmentDetails.horizon,
          amount: investmentDetails.amount,
          monthlyContribution: investmentDetails.monthly_contribution,
          riskProfile: investmentDetails.risk_profile,
          current_portfolio_value: investmentDetails.current_portfolio_value,
          total_return: investmentDetails.total_return
        } : null;

        console.log('Transformed investment details:', transformedInvestmentDetails);

        // Parse KYC data if available
        let kycData = null;
        if (customer.kyc_data) {
          try {
            kycData = typeof customer.kyc_data === 'string'
              ? JSON.parse(customer.kyc_data)
              : customer.kyc_data;
          } catch (e) {
            console.error('Error parsing kyc_data:', e);
          }
        }

        // Build idDocument object for frontend
        const idDocument = customer.id_document_image ? {
          image: customer.id_document_image,
          type: 'ID Card/Passport',
          number: kycData?.documentNumber || null,
          expiry: kycData?.expiryDate || null,
          bsn: kycData?.bsnNumber || null
        } : null;

        return {
          ...customer,
          portfolio: portfolio || [],
          investmentDetails: transformedInvestmentDetails,
          idDocument: idDocument,
          kycData: kycData
        };
      })
    );

    res.status(200).json({
      success: true,
      customers: customersWithDetails
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
};
