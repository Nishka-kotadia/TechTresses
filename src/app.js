const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const incomeRoutes = require('./routes/income');
const taxRoutes = require('./routes/tax');
const invoiceRoutes = require('./routes/invoice');

const app = express();

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
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Freelancer Tax Buddy API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/income', incomeRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/invoice', invoiceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Freelancer Tax Buddy API',
    version: '1.0.0',
    endpoints: {
      income: '/api/income',
      tax: '/api/tax',
      invoice: '/api/invoice',
      health: '/health'
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: ['/api/income', '/api/tax', '/api/invoice', '/health']
  });
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

module.exports = app;
