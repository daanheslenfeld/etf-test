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

  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
  }

  try {
    const { data: simulationState, error } = await supabase
      .from('simulation_state')
      .select('*')
      .eq('customer_id', customer_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    if (simulationState) {
      res.status(200).json({
        success: true,
        state: {
          currentMonth: simulationState.current_month,
          performanceData: simulationState.performance_data
        }
      });
    } else {
      res.status(200).json({
        success: true,
        state: null
      });
    }

  } catch (error) {
    console.error('Error getting simulation state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get simulation state'
    });
  }
};
