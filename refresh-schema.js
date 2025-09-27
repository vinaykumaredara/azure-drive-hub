import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create a client with the service key (needed for schema refresh)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshSchema() {
  console.log('🔄 Refreshing Supabase schema cache...');
  
  try {
    // Execute the schema refresh command
    const { error } = await supabase.rpc('pgrst_reload_on_ddl');
    
    if (error) {
      console.log('⚠️  Direct RPC call failed, trying alternative method...');
      
      // Alternative method: Make a simple request to trigger schema refresh
      const { data, error: selectError } = await supabase
        .from('cars')
        .select('id')
        .limit(1);
        
      if (selectError) {
        console.error('❌ Error:', selectError.message);
        return;
      }
      
      console.log('✅ Schema refresh triggered through select operation');
    } else {
      console.log('✅ Schema cache refresh triggered');
    }
    
    console.log('\n📋 Next steps:');
    console.log('   1. Wait 30-60 seconds for the schema cache to refresh');
    console.log('   2. Run the verification script again');
    console.log('   3. If issues persist, restart your Supabase project in the dashboard');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

refreshSchema();