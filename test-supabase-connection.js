const { supabase } = require('./src/integrations/supabase/client.ts');

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test connection by fetching cars table (read operation)
    const { data, error } = await supabase
      .from('cars')
      .select('id, title, make, model')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Sample data:', data);
    return true;
  } catch (err) {
    console.error('❌ Unexpected error during Supabase test:', err);
    return false;
  }
}

// Run the test
testSupabaseConnection().then(success => {
  if (success) {
    console.log('\n✅ All tests passed! The project is properly connected to Supabase.');
  } else {
    console.log('\n❌ Connection tests failed. Check your Supabase configuration.');
  }
});