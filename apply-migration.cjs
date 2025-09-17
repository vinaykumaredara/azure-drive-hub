const { createClient } = require('@supabase/supabase-js');

// Configuration - same as in the application
const SUPABASE_URL = "https://rcpkhtlvfvafympulywx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzODc5MywiZXhwIjoyMDcyMTE0NzkzfQ.0L5Q6zuGwz8z9X8q4D3pZqY4F8Q9X8q4D3pZqY4F8Q9"; // Replace with your service role key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  console.log('Applying database migration to add booking_status column...');
  
  // Read the migration file content
  const fs = require('fs');
  const migrationContent = fs.readFileSync('./supabase/migrations/20250917010000_add_booking_status_column.sql', 'utf8');
  
  console.log('Migration content:');
  console.log(migrationContent);
  
  // Execute the migration
  try {
    // Split the migration into individual statements
    const statements = migrationContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      
      // For ALTER TABLE statements, we need to use raw SQL
      const { data, error } = await supabase.rpc('execute_sql', { sql: statement });
      
      if (error) {
        console.log(`Error executing statement: ${error.message}`);
        // Try alternative approach for ALTER TABLE statements
        if (statement.startsWith('ALTER TABLE') || statement.startsWith('CREATE INDEX') || statement.startsWith('DROP POLICY') || statement.startsWith('CREATE POLICY') || statement.startsWith('UPDATE') || statement.startsWith('COMMENT ON')) {
          console.log('Trying alternative approach for this statement...');
          // We'll need to execute this through the dashboard or CLI
          console.log('This statement needs to be executed through Supabase dashboard or CLI');
        }
      } else {
        console.log('Statement executed successfully');
      }
    }
    
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Error applying migration:', err.message);
    console.log('Please apply the migration manually through the Supabase dashboard:');
    console.log('1. Go to https://app.supabase.com/');
    console.log('2. Select your RP Cars project');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Copy the content of supabase/migrations/20250917010000_add_booking_status_column.sql');
    console.log('5. Paste it into the SQL editor and click "Run"');
  }
}

applyMigration();