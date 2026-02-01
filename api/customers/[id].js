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

  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Delete related records first to avoid foreign key constraints
    const relatedTables = [
      'investment_details',
      'broker_links',
      'virtual_accounts',
      'chat_inquiries',
      'notifications',
    ];

    for (const table of relatedTables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('customer_id', id);

      if (error) {
        console.log(`Note: Could not delete from ${table}:`, error.message);
      }
    }

    // Now delete the customer
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error deleting customer:', error);
      return res.status(400).json({
        success: false,
        message: `Verwijderen mislukt: ${error.message}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Klant succesvol verwijderd'
    });

  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Verwijderen mislukt. Probeer opnieuw.'
    });
  }
};
