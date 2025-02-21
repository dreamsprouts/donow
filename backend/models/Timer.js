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

module.exports = mongoose.model('Action', actionSchema);