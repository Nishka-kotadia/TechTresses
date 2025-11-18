const express = require('express');
const path = require('path');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'], // Allow frontend and backend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h', // Cache for 1 hour
  etag: true, // Enable ETag
  lastModified: true // Enable Last-Modified
}));

// Enable pretty JSON output
app.set('json spaces', 2);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Frontend server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API redirect route (proxy to backend)
app.use('/api', (req, res) => {
  const http = require('http');

  // Remove the '/api' prefix when forwarding to backend
  const backendPath = req.originalUrl.replace(/^\/api/, '');

  // Build proxy options to backend running on port 3000
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: backendPath,
    method: req.method,
    headers: Object.assign({}, req.headers)
  };

  // Remove host header to avoid conflicts
  delete options.headers.host;

  const proxyReq = http.request(options, (backendRes) => {
    // Copy headers from backend response
    res.writeHead(backendRes.statusCode, backendRes.headers);
    backendRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.status(502).json({ 
        success: false,
        error: 'Backend service unavailable',
        message: 'The backend server is not running on port 3000'
      });
    } else {
      res.end();
    }
  });

  // Handle request body forwarding
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (req.body && Object.keys(req.body).length > 0) {
      const payload = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(payload));
      proxyReq.write(payload);
      proxyReq.end();
      return;
    }
  }

  // Forward the original request body for other cases
  req.pipe(proxyReq);
});

// Catch-all handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Frontend server started on port ${PORT}`);
  console.log(`📱 Frontend URL: http://localhost:${PORT}`);
  console.log(`🔗 Backend API: http://localhost:3000/api`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log('\n📋 Available routes:');
  console.log(`   GET  http://localhost:${PORT}/ - Frontend app`);
  console.log(`   GET  http://localhost:${PORT}/health - Health check`);
  console.log(`   ALL  http://localhost:${PORT}/api/* - Backend API (proxied)`);
  console.log('\n💡 Make sure your backend server is running on port 3000');
  console.log('   npm start');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
