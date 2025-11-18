/**
 * Freelancer Tax Buddy - Backend Server Entry Point
 * 
 * This is the main entry point for the backend API server.
 * It starts the Express app and connects to the database.
 */

const app = require('./src/app');
const connectDB = require('./src/utils/database');

const PORT = process.env.PORT || 3000;

// Start the server
async function startServer() {
  try {
    // Connect to database
    const dbConnected = await connectDB();
    
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, running in demo mode');
      console.log('📝 To use full features, please start MongoDB or update MONGODB_URI in .env');
    }
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log('🚀 Backend API server started successfully!');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/`);
      console.log('\n📋 Available endpoints:');
      console.log('   GET  / - API documentation');
      console.log('   GET  /health - Health check');
      console.log('   POST /api/income/addIncome - Add income entry');
      console.log('   GET  /api/tax/calculateTax - Calculate tax');
      console.log('   POST /api/tax/getDeductions - Get deductions');
      console.log('   POST /api/invoice/generateInvoice - Generate invoice');
      console.log('   GET  /api/tax/nextDueDate - Get next due date');
      console.log('\n💡 To test the API, run: node demo.js');
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
