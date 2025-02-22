const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  // 系統記錄的時間（不可編輯）
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  
  // 使用者可編輯的時間
  userStartTime: {
    type: Date,
    required: true,
    default: function() {
      return this.startTime;
    }
  },
  userEndTime: {
    type: Date,
    default: function() {
      return this.endTime;
    }
  },
  
  note: {
    type: String,
    default: '專注'
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

// 虛擬欄位：計算持續時間（毫秒）
actionSchema.virtual('duration').get(function() {
  if (!this.userEndTime) return 0;
  return this.userEndTime - this.userStartTime;
});

// 添加 pre save 中間件來自動同步時間
actionSchema.pre('save', function(next) {
  // 如果是新建立的記錄，或是更新了 startTime
  if (this.isNew || this.isModified('startTime')) {
    if (!this.userStartTime) {
      this.userStartTime = this.startTime;
    }
  }
  
  // 如果更新了 endTime
  if (this.isModified('endTime')) {
    if (!this.userEndTime) {
      this.userEndTime = this.endTime;
    }
  }
  
  next();
});

module.exports = mongoose.model('Action', actionSchema);