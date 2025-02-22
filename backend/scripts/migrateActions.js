const mongoose = require('mongoose');
const Task = require('../models/Task');
const Action = require('../models/Timer');

// 將遷移邏輯抽出成可重用的函數
async function migrateActions(mongoose) {
  try {
    // 建立或獲取預設任務
    let defaultTask = await Task.findOne({ isDefault: true });
    if (!defaultTask) {
      defaultTask = await Task.create({
        name: '一般任務',
        color: '#808080',  // 使用中性的灰色
        isDefault: true
      });
      console.log('Created default task');
    }

    // 更新所有沒有 task 的 actions
    const result = await Action.updateMany(
      { task: { $exists: false } },
      { $set: { task: defaultTask._id } }
    );

    return {
      defaultTask,
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    throw error;
  }
}

// 如果直接執行腳本
if (require.main === module) {
  require('dotenv').config();
  
  // 連接資料庫並執行遷移
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      const result = await migrateActions(mongoose);
      console.log(`Updated ${result.modifiedCount} actions`);
      console.log('Migration completed');
    })
    .catch(error => {
      console.error('Migration failed:', error);
    })
    .finally(() => {
      mongoose.connection.close();
    });
}

module.exports = { migrateActions }; 