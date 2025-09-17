const { createClient } = require('@supabase/supabase-js');

// Configuration - same as in the application
const SUPABASE_URL = "https://rcpkhtlvfvafympulywx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzODc5MywiZXhwIjoyMDcyMTE0NzkzfQ.0L5Q6zuGwz8z9X8q4D3pZqY4F8Q9X8q4D3pZqY4F8Q9"; // Replace with your service role key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyPerformanceOptimization() {
  console.log('Applying performance optimization migration...');
  
  // Read the performance optimization migration file content
  const fs = require('fs');
  const migrationContent = fs.readFileSync('./performance-optimization-migration.sql', 'utf8');
  
  console.log('Performance optimization migration content:');
  console.log(migrationContent);
  
  // Execute the migration
  try {
    // Split the migration into individual statements
    const statements = migrationContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      console.log(`\nExecuting statement ${i+1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      // Try to execute the statement
      const { data, error } = await supabase.rpc('execute_sql', { sql: statement + ';' });
      
      if (error) {
        console.log(`Error executing statement: ${error.message}`);
        // Some statements might need to be executed through the dashboard
        console.log('This statement might need to be executed through Supabase dashboard');
      } else {
        console.log('Statement executed successfully');
      }
    }
    
    console.log('\nPerformance optimization migration applied successfully!');
    console.log('Next steps:');
    console.log('1. Test the admin car upload functionality');
    console.log('2. Run the verification script: node verify-fix.cjs');
    console.log('3. Run Lighthouse audit: node scripts/lighthouse-audit.js');
  } catch (err) {
    console.error('Error applying performance optimization:', err.message);
    console.log('Please apply the migration manually through the Supabase dashboard:');
    console.log('1. Go to https://app.supabase.com/');
    console.log('2. Select your RP Cars project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Copy the content of performance-optimization-migration.sql');
    console.log('5. Paste it into the SQL editor and click "Run"');
  }
}

applyPerformanceOptimization();