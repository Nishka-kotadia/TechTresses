/**
 * TechTresses - Integrated Application
 * Single server that serves both frontend and backend
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import backend routes and database
const connectDB = require('./src/utils/database');
const incomeRoutes = require('./src/routes/income');
const taxRoutes = require('./src/routes/tax');
const invoiceRoutes = require('./src/routes/invoice');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Freelancer Tax Buddy API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Additional health endpoint for consistency
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Freelancer Tax Buddy API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// User model for creating test users
const User = require('./src/models/user');

// Create test user endpoint
app.post('/api/create-user', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      gstRegistered: false,
      deductions: {},
      expenses: [],
      panNumber: '',
      bankDetails: {}
    });

    const savedUser = await user.save();

    res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      data: {
        userId: savedUser._id,
        name: savedUser.name,
        email: savedUser.email
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/income', incomeRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/invoice', invoiceRoutes);

// Root endpoint for API documentation
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Freelancer Tax Buddy API',
    version: '1.0.0',
    endpoints: {
      income: '/api/income',
      tax: '/api/tax',
      invoice: '/api/invoice',
      health: '/api/health'
    },
    documentation: {
      addIncome: 'POST /api/income/addIncome',
      calculateTax: 'GET /api/tax/calculateTax?userId=...',
      getDeductions: 'POST /api/tax/getDeductions',
      generateInvoice: 'POST /api/invoice/generateInvoice',
      nextDueDate: 'GET /api/tax/nextDueDate?userId=...'
    }
  });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

// Enable pretty JSON output
app.set('json spaces', 2);

// Frontend routes - serve index.html for all non-API routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle SPA routing - serve index.html for all frontend routes
app.get(['/dashboard', '/income', '/tax', '/invoice', '/profile'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    availableEndpoints: ['/api/income', '/api/tax', '/api/invoice', '/api/health']
  });
});

// 404 handler for frontend routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start the integrated server
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log('🚀 TechTresses Application Started Successfully!');
      console.log('==========================================');
      console.log(`🌐 Application URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api`);
      console.log('\n📋 Available Features:');
      console.log('   📊 Dashboard - Financial overview and charts');
      console.log('   💰 Income - Track and manage income sources');
      console.log('   🧾 Tax - Calculate taxes with Indian tax rules');
      console.log('   📄 Invoice - Generate professional invoices');
      console.log('   👤 Profile - Manage personal and business info');
      console.log('\n💡 The application is now fully integrated!');
      console.log('   Frontend and backend are running on the same server.');
      console.log('   No need to run separate servers.');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
