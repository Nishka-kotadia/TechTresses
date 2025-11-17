const app = require('./src/app');
const connectDB = require('./src/utils/database');

// Start server
const PORT = process.env.PORT || 3000;

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB (optional for demo)
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Freelancer Tax Buddy API is running on port ${PORT}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}/`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('\n📝 Available Endpoints:');
      console.log('  POST /api/income/addIncome - Add income entry');
      console.log('  GET  /api/tax/calculateTax?userId=... - Calculate tax');
      console.log('  POST /api/tax/getDeductions - Get deductions');
      console.log('  POST /api/invoice/generateInvoice - Generate PDF invoice');
      console.log('  GET  /api/tax/nextDueDate?userId=... - Get due dates');
      console.log('\n🎯 Ready for hackathon demo!');
      console.log('💡 Note: MongoDB not connected - using demo mode');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
