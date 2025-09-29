// Diagnostic script to identify why car deletion is not working
import { supabase } from '../src/integrations/supabase/client';

async function diagnoseDeleteIssue(carId) {
  console.log(`=== Diagnosing Delete Issue for Car ID: ${carId} ===\n`);
  
  try {
    // 1. Check if car exists
    console.log('1. Checking if car exists...');
    const { data: car, error: fetchError } = await supabase
      .from('cars')
      .select('id, title, image_urls, created_at')
      .eq('id', carId)
      .single();
      
    if (fetchError) {
      console.error('❌ Error fetching car:', fetchError);
      console.error('Error details:', {
        message: fetchError.message,
        code: fetchError.code,
        details: fetchError.details,
        hint: fetchError.hint
      });
      return;
    }
    
    if (!car) {
      console.log('❌ Car not found with ID:', carId);
      return;
    }
    
    console.log('✅ Car found:');
    console.log('   ID:', car.id);
    console.log('   Title:', car.title);
    console.log('   Created At:', car.created_at);
    console.log('   Image URLs:', car.image_urls);
    console.log('   Image Count:', car.image_urls ? car.image_urls.length : 0);
    
    // 2. Check user permissions
    console.log('\n2. Checking user permissions...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('   Current user:', user ? user.id : 'Not logged in');
    
    // 3. Check if user has admin role
    if (user) {
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { user_id: user.id });
      console.log('   Is admin:', isAdmin);
      if (adminError) {
        console.log('   Admin check error:', adminError.message);
      }
    }
    
    // 4. Test direct deletion
    console.log('\n3. Testing direct deletion...');
    console.log('   Attempting to delete car with ID:', carId);
    
    const { error: deleteError } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId);
    
    if (deleteError) {
      console.error('❌ Direct deletion failed:');
      console.error('   Message:', deleteError.message);
      console.error('   Code:', deleteError.code);
      console.error('   Details:', deleteError.details);
      console.error('   Hint:', deleteError.hint);
      
      // Check if it's a permissions issue
      if (deleteError.code === '42501') {
        console.log('   🔍 This appears to be a permissions issue (insufficient_privilege)');
        console.log('   🔍 The user may not have DELETE permissions on the cars table');
      }
    } else {
      console.log('✅ Direct deletion successful');
    }
    
    // 5. Verify deletion
    console.log('\n4. Verifying deletion...');
    const { data: verifyCar, error: verifyError } = await supabase
      .from('cars')
      .select('id')
      .eq('id', carId)
      .single();
    
    if (verifyError && verifyError.code !== 'PGRST116') {
      console.error('❌ Error verifying deletion:', verifyError);
    } else if (verifyCar) {
      console.log('❌ Car still exists in database');
    } else {
      console.log('✅ Car successfully deleted from database');
    }
    
    // 6. Check RLS policies
    console.log('\n5. Checking RLS policies...');
    console.log('   RLS (Row Level Security) might be preventing deletion');
    console.log('   Check if there are policies on the cars table that restrict DELETE operations');
    
    console.log('\n=== Diagnosis Complete ===');
    
  } catch (error) {
    console.error('❌ Unexpected error during diagnosis:', error);
    console.error('Error stack:', error.stack);
  }
}

// Get car ID from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: npm run diagnose-delete <car-id>');
  console.log('Example: npm run diagnose-delete 123e4567-e89b-12d3-a456-426614174000');
  process.exit(1);
}

const carId = args[0];
diagnoseDeleteIssue(carId);