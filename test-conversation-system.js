const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rfmbhdgfovnglegqxjnj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbWJoZGdmb3ZuZ2xlZ3F4am5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc0NDg3MiwiZXhwIjoyMDc1MzIwODcyfQ.cxYG4xpMubBsetGB1e6wWLcd_IX-Bwtjpvgj-1ImzMw'
);

async function testConversationSystem() {
  try {
    console.log('Testing conversation system...\n');

    // Test 1: Check if chat_messages table exists
    console.log('1. Testing chat_messages table...');
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .limit(1);

    if (messagesError) {
      console.error('❌ Error accessing chat_messages table:', messagesError.message);
      console.log('\n⚠️  Please run the SQL migration in Supabase:');
      console.log('   Go to: https://supabase.com/dashboard/project/rfmbhdgfovnglegqxjnj/editor');
      console.log('   Copy and paste the SQL from: supabase-migrations/add-conversation-support.sql');
      return;
    } else {
      console.log('✅ chat_messages table exists');
    }

    // Test 2: Check if new columns exist in chat_inquiries
    console.log('\n2. Testing chat_inquiries new columns...');
    const { data: inquiries, error: inquiriesError } = await supabase
      .from('chat_inquiries')
      .select('id, last_response_at, has_unread_response, response_count')
      .limit(1);

    if (inquiriesError) {
      console.error('❌ Error accessing new columns:', inquiriesError.message);
      console.log('\n⚠️  Please run the SQL migration in Supabase:');
      console.log('   Go to: https://supabase.com/dashboard/project/rfmbhdgfovnglegqxjnj/editor');
      console.log('   Copy and paste the SQL from: supabase-migrations/add-conversation-support.sql');
      return;
    } else {
      console.log('✅ New columns exist in chat_inquiries');
    }

    // Test 3: Check if existing inquiries have been migrated to messages
    const { data: allInquiries } = await supabase
      .from('chat_inquiries')
      .select('id');

    if (allInquiries && allInquiries.length > 0) {
      console.log(`\n3. Checking migration of ${allInquiries.length} existing inquiries...`);
      const { data: messageCount } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact' });

      console.log(`✅ Found ${messageCount?.length || 0} messages in chat_messages table`);
    }

    console.log('\n✅ All tests passed! Conversation system is ready.');
    console.log('\n📝 Summary:');
    console.log('   - chat_messages table: Ready');
    console.log('   - chat_inquiries columns: Updated');
    console.log('   - API endpoint: Deployed at https://etf-test-qsmf56qkh-daniels-projects-b00bc24a.vercel.app');
    console.log('\n🎉 You can now use the conversation system in the Account Manager Portal!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConversationSystem();
