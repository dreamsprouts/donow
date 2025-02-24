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
  },
  
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true  // 保持必填
  },
  type: {
    type: String,
    enum: ['pomodoro', 'habit'],
    default: 'pomodoro'
  },
  habitCount: {
    type: Number,
    default: 1  // habit type 的 action 固定為 1
  }
});

// 虛擬欄位：計算持續時間（毫秒）
actionSchema.virtual('duration').get(function() {
  if (!this.userEndTime) return 0;
  return this.userEndTime - this.userStartTime;
});

// 新增虛擬欄位：當日累計次數
actionSchema.virtual('dailyProgress').get(async function() {
  if (this.type !== 'habit') return null;
  
  const startOfDay = new Date(this.userStartTime);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);
  
  const count = await this.model('Action').countDocuments({
    task: this.task,
    type: 'habit',
    userStartTime: { 
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  return count;
});

// 新增虛擬欄位：目標完成進度
actionSchema.virtual('goalProgress').get(async function() {
  if (this.type !== 'habit') return null;
  
  const startOfDay = new Date(this.userStartTime);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);
  
  const task = await mongoose.model('Task').findById(this.task);
  if (!task || !task.dailyGoal) return null;
  
  const count = await this.model('Action').countDocuments({
    task: this.task,
    type: 'habit',
    userStartTime: { 
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  return {
    current: count,
    goal: task.dailyGoal,
    percentage: Math.round((count / task.dailyGoal) * 100)
  };
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

// 確保在 JSON 輸出時包含虛擬欄位
actionSchema.set('toJSON', { virtuals: true });
actionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Action', actionSchema);