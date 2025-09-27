# PowerShell script to apply service charge migration directly via Supabase API

Write-Host "🚀 Applying service charge column migration directly..." -ForegroundColor Green

# Get the service role key from environment
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzODc5MywiZXhwIjoyMDcyMTE0NzkzfQ.uqmG-uplIVvwnhrCakr8QK2rIaZFeBqlkvQAH8VOgQM"

if (-not $serviceRoleKey) {
    Write-Host "❌ SUPABASE_SERVICE_ROLE_KEY not found" -ForegroundColor Red
    Write-Host "Please set the environment variable and try again" -ForegroundColor Yellow
    exit 1
}

# Migration SQL
$sql = @"
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS service_charge NUMERIC DEFAULT 0;
UPDATE public.cars SET service_charge = 0 WHERE service_charge IS NULL;
CREATE INDEX IF NOT EXISTS idx_cars_service_charge ON public.cars (service_charge);
NOTIFY pgrst, 'reload schema';
"@

# Supabase project URL
$projectUrl = "https://rcpkhtlvfvafympulywx.supabase.co"

# Execute the SQL via the Supabase REST API
$headers = @{
    "Authorization" = "Bearer $serviceRoleKey"
    "apikey" = $serviceRoleKey
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$body = @{
    "sql" = $sql
} | ConvertTo-Json

try {
    Write-Host "🔧 Executing migration SQL..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$projectUrl/rest/v1/rpc/execute_sql" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Migration executed successfully" -ForegroundColor Green
    Write-Host "Response: $response" -ForegroundColor Gray
    
    # Wait a bit for the schema cache to refresh
    Write-Host "⏳ Waiting for schema cache to refresh..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host "🎉 Service charge migration applied successfully!" -ForegroundColor Green
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Regenerate Supabase types: npm run gen:supabase-types" -ForegroundColor Cyan
    Write-Host "2. Restart your development server" -ForegroundColor Cyan
    Write-Host "3. Test the admin car creation functionality" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Error details: $($_.ErrorDetails)" -ForegroundColor Red
    exit 1
}