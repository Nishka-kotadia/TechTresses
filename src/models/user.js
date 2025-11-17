const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  gstRegistered: {
    type: Boolean,
    default: false
  },
  deductions: {
    type: Object,
    default: {}
  },
  expenses: [{
    category: String,
    amount: Number,
    date: Date,
    description: String
  }],
  panNumber: {
    type: String,
    trim: true
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    upiId: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
