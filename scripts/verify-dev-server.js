#!/usr/bin/env node

// Simple script to verify the dev server is working
// This would typically be run as part of the smoke test

import http from 'http';

function verifyDevServer() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          // Check if root element exists in the response
          if (data.includes('id="root"') || data.includes('root')) {
            console.log('✅ Dev server verification passed');
            console.log(`✅ Status code: ${res.statusCode}`);
            console.log('✅ Root element found in HTML');
            resolve(true);
          } else {
            console.error('❌ Root element not found in HTML response');
            reject(new Error('Root element missing'));
          }
        } else {
          console.error(`❌ Unexpected status code: ${res.statusCode}`);
          reject(new Error(`Status code ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Problem with request: ${e.message}`);
      reject(e);
    });

    req.on('timeout', () => {
      console.error('❌ Request timeout - server may not be running');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run verification if script is called directly
if (require.main === module) {
  verifyDevServer()
    .then(() => {
      console.log('🎉 Dev server verification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Dev server verification failed:', error.message);
      process.exit(1);
    });
}

export default verifyDevServer;