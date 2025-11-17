const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  tdsDeducted: {
    type: Boolean,
    default: false
  },
  gstApplicable: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Income', incomeSchema);
