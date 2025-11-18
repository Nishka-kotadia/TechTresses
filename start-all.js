/**
 * TechTresses - Complete Application Startup Script
 * Starts both frontend and backend servers simultaneously
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting TechTresses Application');
console.log('==================================\n');

// Start backend server
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Starting Backend API Server...');
    
    const backend = spawn('node', ['index.js'], {
      stdio: 'pipe',
      cwd: __dirname
    });
    
    backend.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[BACKEND] ${output}`);
      
      if (output.includes('Backend API server started successfully')) {
        resolve(backend);
      }
    });
    
    backend.stderr.on('data', (data) => {
      process.stderr.write(`[BACKEND ERROR] ${data}`);
    });
    
    backend.on('error', (error) => {
      console.error('❌ Failed to start backend:', error.message);
      reject(error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!backend.killed) {
        console.log('⏰ Backend startup timeout, but continuing...');
        resolve(backend);
      }
    }, 10000);
  });
}

// Start frontend server
function startFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🌐 Starting Frontend Server...');
    
    const frontend = spawn('node', ['server.js'], {
      stdio: 'pipe',
      cwd: __dirname
    });
    
    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[FRONTEND] ${output}`);
      
      if (output.includes('Frontend server started on port')) {
        resolve(frontend);
      }
    });
    
    frontend.stderr.on('data', (data) => {
      process.stderr.write(`[FRONTEND ERROR] ${data}`);
    });
    
    frontend.on('error', (error) => {
      console.error('❌ Failed to start frontend:', error.message);
      reject(error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!frontend.killed) {
        console.log('⏰ Frontend startup timeout, but continuing...');
        resolve(frontend);
      }
    }, 10000);
  });
}

// Main startup function
async function startAll() {
  let backend, frontend;
  
  try {
    // Start backend first
    backend = await startBackend();
    
    // Wait a moment for backend to fully start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start frontend
    frontend = await startFrontend();
    
    console.log('\n✅ Application Started Successfully!');
    console.log('================================');
    console.log('🌐 Frontend: http://localhost:3001');
    console.log('🔧 Backend:  http://localhost:3000');
    console.log('🏥 Health:   http://localhost:3001/health');
    console.log('📚 API:      http://localhost:3001/api/');
    console.log('\n💡 Press Ctrl+C to stop both servers');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down servers...');
      
      if (backend) {
        backend.kill('SIGTERM');
      }
      
      if (frontend) {
        frontend.kill('SIGTERM');
      }
      
      setTimeout(() => {
        console.log('✅ Servers stopped successfully');
        process.exit(0);
      }, 2000);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received, shutting down...');
      
      if (backend) backend.kill('SIGTERM');
      if (frontend) frontend.kill('SIGTERM');
      
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    });
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    process.exit(1);
  }
}

// Check if required files exist
function checkFiles() {
  const fs = require('fs');
  
  const requiredFiles = [
    'index.js',
    'server.js',
    'src/app.js',
    'public/index.html',
    'package.json'
  ];
  
  const missingFiles = requiredFiles.filter(file => {
    return !fs.existsSync(path.join(__dirname, file));
  });
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    console.error('\n💡 Make sure you\'re in the correct directory');
    process.exit(1);
  }
}

// Run startup
console.log('🔍 Checking required files...');
checkFiles();

startAll().catch(error => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
});
