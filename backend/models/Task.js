const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: '新任務'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  color: {
    type: String,
    default: function() {
      const colors = [
        '#99781f', // 深黃
        '#DC2626', // 深紅
        '#059669', // 深綠
        '#7C3AED', // 深紫
        '#C026D3', // 深粉
        '#0891B2', // 深青
        '#EA580C', // 深橙
        '#4338CA', // 靛藍
        '#B91C1C', // 暗紅
        '#065F46', // 森綠
        '#6D28D9', // 紫羅蘭
        '#BE185D'  // 洋紅
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['project', 'habit'],
    default: 'project'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  dailyGoal: {
    type: Number,
    default: function() {
      return this.type === 'habit' ? 10 : null;
    }
  },
  stats: {
    totalActions: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    firstActionDate: Date,
    lastActionDate: Date,
    lastUpdated: Date
  },
  habitStats: {
    currentStreak: { 
      type: Number, 
      default: 0 
    },
    longestStreak: { 
      type: Number, 
      default: 0 
    },
    todayCompletedCount: { 
      type: Number, 
      default: 0 
    }
  }
});

// 更新統計資料的方法
taskSchema.methods.updateStats = async function() {
  try {
    const Action = mongoose.model('Action');  // 使用正確的 model 名稱
    
    // 查詢該任務的所有已完成行動
    const actions = await Action.find({ 
      task: this._id,
      isCompleted: true  // 只計算已完成的行動
    }).sort({ userStartTime: 1 });  // 按時間排序

    if (actions.length > 0) {
      // 計算總時長（分鐘）
      const totalDuration = actions.reduce((total, action) => {
        if (action.userEndTime && action.userStartTime) {
          return total + (new Date(action.userEndTime) - new Date(action.userStartTime)) / 60000;
        }
        return total;
      }, 0);

      // 更新基本統計
      this.stats = {
        totalActions: actions.length,
        totalDuration: Math.round(totalDuration), // 四捨五入到整數分鐘
        firstActionDate: actions[0].userStartTime,
        lastActionDate: actions[actions.length - 1].userStartTime,
        lastUpdated: new Date()
      };

      // 如果是習慣類型，更新特定統計
      if (this.type === 'habit') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 計算今日完成次數
        const todayActions = actions.filter(action => {
          const actionDate = new Date(action.userStartTime);
          actionDate.setHours(0, 0, 0, 0);
          return actionDate.getTime() === today.getTime();
        });

        this.habitStats.todayCompletedCount = todayActions.length;

        // 計算連續天數
        let currentStreak = 0;
        let longestStreak = 0;
        let currentDate = new Date();
        
        // 將行動按日期分組
        const actionsByDate = {};
        actions.forEach(action => {
          const date = new Date(action.userStartTime);
          date.setHours(0, 0, 0, 0);
          const dateStr = date.toISOString().split('T')[0];
          actionsByDate[dateStr] = true;
        });

        // 計算當前連續天數
        while (actionsByDate[currentDate.toISOString().split('T')[0]]) {
          currentStreak++;
          currentDate.setDate(currentDate.getDate() - 1);
        }

        // 更新最長連續天數
        longestStreak = Math.max(currentStreak, this.habitStats.longestStreak || 0);

        this.habitStats.currentStreak = currentStreak;
        this.habitStats.longestStreak = longestStreak;
      }

      await this.save();
    }
  } catch (error) {
    console.error('更新任務統計時發生錯誤:', error);
    throw error;
  }
};

module.exports = mongoose.model('Task', taskSchema); 