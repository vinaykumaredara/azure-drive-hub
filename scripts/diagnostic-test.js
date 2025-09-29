// Simple diagnostic script to check car data via Supabase REST API
async function runDiagnostic() {
  try {
    console.log('Fetching sample cars via REST API...');
    
    // Using the Supabase REST API directly
    const response = await fetch(
      'https://rcpkhtlvfvafympulywx.supabase.co/rest/v1/cars?select=*&limit=3',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjcGtodGx2ZnZhZnltcHVseXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Mzg3OTMsImV4cCI6MjA3MjExNDc5M30.RE6vsYIpq44QrXwrvHDoHkfC9IE3Fwd-PfXFQ9_2cqE'
        }
      }
    );

    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('Sample cars:', JSON.stringify(data, null, 2));
    
    // Log specific image data
    if (data && data.length > 0) {
      console.log('\n--- Image Data Analysis ---');
      data.forEach((car, index) => {
        console.log(`\nCar ${index + 1} (${car.id}):`);
        console.log(`  Title: ${car.title}`);
        console.log(`  image_urls: ${JSON.stringify(car.image_urls)}`);
        console.log(`  image_paths: ${JSON.stringify(car.image_paths)}`);
        
        // Check if we have image URLs to test
        if (car.image_urls && Array.isArray(car.image_urls) && car.image_urls.length > 0) {
          console.log(`  First image URL: ${car.image_urls[0]}`);
        }
      });
    } else {
      console.log('No cars found in database');
    }
  } catch (err) {
    console.error('Diagnostic error:', err);
  }
}

runDiagnostic();