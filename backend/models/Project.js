const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  isBillable: {
    type: Boolean,
    default: false
  },
  hourlyRate: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyBudgetLimit: {
    type: Number,
    default: 0,
    min: 0,
    description: '每月預算上限 (0表示未設置)'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新時自動更新 updatedAt
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Project', projectSchema); 