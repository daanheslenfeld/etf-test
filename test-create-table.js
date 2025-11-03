const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rfmbhdgfovnglegqxjnj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

async function createTable() {
  try {
    console.log('Creating chat_inquiries table...');

    // Test if we can insert a test record
    const { data, error } = await supabase
      .from('chat_inquiries')
      .insert([{
        name: 'Test User',
        email: 'test@example.com',
        phone: '0612345678',
        question: 'This is a test question',
        status: 'new'
      }])
      .select();

    if (error) {
      console.error('Error:', error);
      console.log('\nThe table might not exist yet. Please run the SQL migration in Supabase dashboard:');
      console.log('Go to https://supabase.com/dashboard/project/rfmbhdgfovnglegqxjnj/editor');
      console.log('And run the SQL from supabase-migrations/create-chat-inquiries.sql');
    } else {
      console.log('Success! Test record inserted:', data);

      // Clean up test record
      if (data && data[0]) {
        await supabase
          .from('chat_inquiries')
          .delete()
          .eq('id', data[0].id);
        console.log('Test record cleaned up');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTable();
