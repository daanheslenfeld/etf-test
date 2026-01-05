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

  const { customerId, tradingStatus, adminEmail } = req.body;

  // Validate inputs
  if (!customerId || !tradingStatus) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID and trading status are required'
    });
  }

  // Validate trading status value
  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!validStatuses.includes(tradingStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid trading status. Must be: pending, approved, or rejected'
    });
  }

  try {
    // Verify admin access (simple check - in production use proper auth)
    if (adminEmail) {
      const { data: admin } = await supabase
        .from('customers')
        .select('role')
        .eq('email', adminEmail)
        .single();

      if (!admin || admin.role !== 'accountmanager') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Admin access required'
        });
      }
    }

    // Update the trading status
    const { data, error } = await supabase
      .from('customers')
      .update({ trading_status: tradingStatus })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating trading status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update trading status'
      });
    }

    res.status(200).json({
      success: true,
      message: `Trading status updated to "${tradingStatus}"`,
      customer: {
        id: data.id,
        email: data.email,
        trading_status: data.trading_status
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
