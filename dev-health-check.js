// Development Health Check Script for RP Cars
const http = require('http');
const { exec } = require('child_process');

function checkServerHealth() {
  console.log('🏥 RP Cars Development Health Check');
  console.log('=====================================');
  
  // Check if server is responding
  const req = http.get('http://localhost:5173', (res) => {
    console.log('✅ Server Status: HEALTHY');
    console.log(`📊 Response Code: ${res.statusCode}`);
    console.log(`🔗 URL: http://localhost:5173`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    
    // Check WebSocket port
    exec('netstat -ano | findstr :5173', (error, stdout) => {
      if (stdout.includes('LISTENING')) {
        console.log('✅ WebSocket Port: ACTIVE');
      } else {
        console.log('⚠️  WebSocket Port: CHECK NEEDED');
      }
    });
    
  }).on('error', (err) => {
    console.log('❌ Server Status: ERROR');
    console.log(`🔥 Error: ${err.message}`);
    console.log('💡 Try running: npm run dev');
  });
  
  req.setTimeout(5000, () => {
    console.log('⏰ Server Status: TIMEOUT');
    req.destroy();
  });
}

// Run health check
checkServerHealth();

// Optional: Run health check every 30 seconds
// setInterval(checkServerHealth, 30000);