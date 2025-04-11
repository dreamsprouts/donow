const mongoose = require('mongoose');

const TestItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, '名稱為必填項'],
    trim: true
  },
  description: { 
    type: String,
    trim: true,
    default: ''
  },
  priority: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  completed: { 
    type: Boolean, 
    default: false
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, '必須關聯一個用戶']
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

// 更新時自動更新updatedAt
TestItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('TestItem', TestItemSchema); 