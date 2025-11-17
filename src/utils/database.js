const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/freelancer-tax-buddy');
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create sample user if no users exist
    const User = require('../models/user');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await createSampleUser();
    }
    
  } catch (error) {
    console.warn('MongoDB connection failed, running in demo mode without database:', error.message);
    console.log('To use full features, please start MongoDB or update MONGODB_URI in .env');
    
    // Don't exit process, continue without database for demo
    return false;
  }
};

const createSampleUser = async () => {
  const User = require('../models/user');
  const Income = require('../models/income');
  
  try {
    // Create sample user
    const user = new User({
      name: 'John Doe',
      email: 'john@freelancer.com',
      gstRegistered: false,
      panNumber: 'ABCDE1234F',
      bankDetails: {
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        upiId: 'john@paytm'
      },
      expenses: [
        { category: 'laptop', amount: 40000, date: new Date('2024-01-15'), description: 'MacBook Pro for work' },
        { category: 'internet', amount: 12000, date: new Date('2024-01-01'), description: 'Annual internet bill' }
      ]
    });
    
    const savedUser = await user.save();
    console.log('Sample user created:', savedUser.email);
    
    // Create sample income entries
    const sampleIncomes = [
      {
        clientName: 'Tech Corp',
        amount: 50000,
        date: new Date('2024-03-15'),
        tdsDeducted: true,
        gstApplicable: false,
        notes: 'Website development project',
        userId: savedUser._id
      },
      {
        clientName: 'Design Studio',
        amount: 30000,
        date: new Date('2024-04-20'),
        tdsDeducted: false,
        gstApplicable: false,
        notes: 'UI/UX consulting',
        userId: savedUser._id
      },
      {
        clientName: 'Startup XYZ',
        amount: 75000,
        date: new Date('2024-05-10'),
        tdsDeducted: true,
        gstApplicable: true,
        notes: 'Mobile app development',
        userId: savedUser._id
      }
    ];
    
    await Income.insertMany(sampleIncomes);
    console.log('Sample income entries created');
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

module.exports = connectDB;
