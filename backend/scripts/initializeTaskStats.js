const mongoose = require('mongoose');
const Task = require('../models/Task');
const Action = require('../models/Timer');
require('dotenv').config();

async function initializeAllTaskStats() {
  try {
    // 連接資料庫
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('已連接到 MongoDB');

    // 獲取所有任務
    const tasks = await Task.find({});
    console.log(`開始處理 ${tasks.length} 個任務的統計資料`);

    // 為每個任務更新統計
    for (const task of tasks) {
      console.log(`正在處理任務: ${task.name}`);
      try {
        await task.updateStats();
        console.log(`✓ 完成任務 "${task.name}" 的統計更新`);
      } catch (err) {
        console.error(`✗ 處理任務 "${task.name}" 時發生錯誤:`, err);
      }
    }

    console.log('所有任務統計更新完成');
    
  } catch (error) {
    console.error('初始化任務統計時發生錯誤:', error);
  } finally {
    await mongoose.connection.close();
    console.log('資料庫連線已關閉');
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  initializeAllTaskStats()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = initializeAllTaskStats; 