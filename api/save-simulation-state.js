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

  const { customer_id, currentMonth, performanceData } = req.body;

  if (!customer_id) {
    return res.status(400).json({
      success: false,
      message: 'Customer ID is required'
    });
  }

  try {
    // Check if simulation state already exists
    const { data: existingState } = await supabase
      .from('simulation_state')
      .select('id')
      .eq('customer_id', customer_id)
      .single();

    const simulationState = {
      customer_id,
      current_month: currentMonth,
      performance_data: performanceData,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingState) {
      // Update existing state
      result = await supabase
        .from('simulation_state')
        .update(simulationState)
        .eq('customer_id', customer_id);
    } else {
      // Insert new state
      result = await supabase
        .from('simulation_state')
        .insert([simulationState]);
    }

    if (result.error) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      message: 'Simulation state saved successfully'
    });

  } catch (error) {
    console.error('Error saving simulation state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save simulation state'
    });
  }
};
