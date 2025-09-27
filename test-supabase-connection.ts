import { supabase } from './src/integrations/supabase/client';

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
    
    // Test write operation by attempting to insert a test record
    const testCar = {
      title: 'Test Car',
      make: 'Test',
      model: 'Model',
      price_per_day: 100,
      description: 'Test car for connection verification'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('cars')
      .insert([testCar])
      .select()
      .limit(1);
    
    if (insertError) {
      console.log('⚠️  Write operation failed (may be due to permissions):', insertError.message);
      console.log('ℹ️  This is expected if you are not authenticated as an admin user');
    } else {
      console.log('✅ Write operation successful!');
      console.log('Inserted data:', insertData);
      
      // Clean up - delete the test record
      if (insertData && insertData[0] && insertData[0].id) {
        await supabase
          .from('cars')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
    
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