/**
 * Test script to verify frontend functionality
 * Run this to check if all modules are working correctly
 */

const http = require('http');

function testFrontend() {
  console.log('🧪 Testing Frontend...');
  
  // Test frontend server
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Frontend server is accessible');
        
        // Check if HTML contains module scripts
        if (body.includes('type="module"')) {
          console.log('✅ JavaScript modules are properly configured');
        } else {
          console.log('❌ JavaScript modules not found');
        }
        
        // Check for key elements
        if (body.includes('id="dashboard"')) {
          console.log('✅ Dashboard page found');
        }
        
        if (body.includes('id="loadingOverlay"')) {
          console.log('✅ Loading overlay found');
        }
        
        if (body.includes('id="toastContainer"')) {
          console.log('✅ Toast container found');
        }
        
        console.log('\n🌐 Open http://localhost:3001 in your browser to test the full application');
        
      } else {
        console.log(`❌ Frontend server returned status: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (err) => {
    console.log('❌ Frontend server not accessible:', err.message);
    console.log('💡 Make sure the frontend server is running: npm start');
  });

  req.end();
}

// Test API proxy
function testAPIProxy() {
  console.log('\n🔗 Testing API Proxy...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ API proxy is working');
        try {
          const data = JSON.parse(body);
          console.log(`✅ Backend API response: ${data.message}`);
        } catch (e) {
          console.log('❌ Invalid JSON response from API');
        }
      } else {
        console.log(`❌ API proxy returned status: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (err) => {
    console.log('❌ API proxy not accessible:', err.message);
    console.log('💡 Make sure the backend server is running: npm run backend');
  });

  req.end();
}

// Run tests
console.log('🚀 TechTresses Frontend Test');
console.log('=============================\n');

testFrontend();
testAPIProxy();

console.log('\n📋 Manual Testing Checklist:');
console.log('1. Open http://localhost:3001 in browser');
console.log('2. Check browser console for JavaScript errors');
console.log('3. Test navigation between pages');
console.log('4. Try adding income entry');
console.log('5. Test tax calculator');
console.log('6. Generate an invoice');
console.log('7. Update profile settings');
