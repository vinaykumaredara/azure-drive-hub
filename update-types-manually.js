#!/usr/bin/env node

// Script to manually update Supabase types file with currency fields
import { existsSync, readFileSync, writeFileSync } from 'fs';

console.log('📝 Manually Updating Supabase Types with Currency Fields');
console.log('=====================================================');

const typesFilePath = './src/integrations/supabase/types.ts';

// Check if types file exists
if (!existsSync(typesFilePath)) {
  console.error('❌ Supabase types file not found:', typesFilePath);
  process.exit(1);
}

try {
  // Read the current types file
  let typesContent = readFileSync(typesFilePath, 'utf8');
  
  console.log('✅ Found Supabase types file');
  
  // Check if currency fields already exist
  if (typesContent.includes('currency: string | null') && 
      typesContent.includes('price_in_paise: number | null') &&
      typesContent.includes('amount_in_paise: number | null') &&
      typesContent.includes('total_amount_in_paise: number | null')) {
    console.log('✅ Currency fields already exist in types file');
    process.exit(0);
  }
  
  // Add currency fields to cars table
  typesContent = typesContent.replace(
    /(\s+price_per_day: number\s+price_per_hour: number \| null\s+service_charge: number \| null)/,
    '$1\n          price_in_paise: number | null\n          currency: string | null'
  );
  
  // Add currency fields to bookings table
  typesContent = typesContent.replace(
    /(\s+total_amount: number \| null\s+status: string\s+payment_id: string \| null)/,
    '$1\n          total_amount_in_paise: number | null\n          currency: string | null'
  );
  
  // Add currency fields to payments table
  typesContent = typesContent.replace(
    /(\s+amount: number \| null\s+status: string\s+payment_method: string \| null)/,
    '$1\n          amount_in_paise: number | null\n          currency: string | null'
  );
  
  // Write the updated content back to the file
  writeFileSync(typesFilePath, typesContent);
  
  console.log('✅ Successfully updated Supabase types file with currency fields');
  console.log('\n📋 Changes made:');
  console.log('  - Added price_in_paise: number | null to cars table');
  console.log('  - Added currency: string | null to cars table');
  console.log('  - Added total_amount_in_paise: number | null to bookings table');
  console.log('  - Added currency: string | null to bookings table');
  console.log('  - Added amount_in_paise: number | null to payments table');
  console.log('  - Added currency: string | null to payments table');
  
  console.log('\n🎉 Manual type update completed successfully!');
  
} catch (error) {
  console.error('❌ Failed to update Supabase types file:', error.message);
  process.exit(1);
}