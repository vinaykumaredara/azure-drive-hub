# Script to apply RP Cars database migrations
# This script assumes you have the Supabase CLI properly configured

Write-Host "🚀 Applying RP Cars Database Migrations"

# Check if Supabase CLI is available
try {
    $supabaseVersion = npx supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion"
} catch {
    Write-Host "❌ Supabase CLI could not be found"
    Write-Host "Please install it first: npm install -g supabase"
    exit 1
}

# Link to the project (if not already linked)
Write-Host "🔗 Linking to Supabase project..."
npx supabase link --project-ref rcpkhtlvfvafympulywx

# Apply the booking_status column migration
Write-Host "🔧 Applying booking_status column migration..."
npx supabase migration up 20250917010000

# Apply the performance optimization migration
Write-Host "⚡ Applying performance optimization migration..."
# Note: This would need to be moved to the migrations folder to be applied via CLI
# For now, we'll just output instructions

Write-Host "📋 Manual steps required for performance optimization:"
Write-Host "1. Go to https://app.supabase.com/"
Write-Host "2. Select your RP Cars project"
Write-Host "3. Navigate to SQL Editor"
Write-Host "4. Copy the content of performance-optimization-migration.sql"
Write-Host "5. Paste it into the SQL editor and click 'Run'"

Write-Host "✅ Migration application process completed!"
Write-Host "Next steps:"
Write-Host "1. Run verification script: node verify-fix.cjs"
Write-Host "2. Test admin car upload functionality"
Write-Host "3. Run Lighthouse audit: node scripts/lighthouse-audit.js"