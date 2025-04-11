/**
 * 數據遷移腳本 - 將現有資料關聯到指定用戶
 * 
 * 用途：
 * 1. 遷移現有的 Project、Task 和 Action 數據到指定用戶
 * 2. 確保所有記錄都有用戶 ID 關聯
 * 
 * 執行方式：
 * node backend/scripts/migrateUserData.js
 * 
 * 重要：部署到正式環境前，請將下方 TARGET_USER_ID 改為正式環境中登入的用戶ID
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 模型引入
const Project = require('../models/Project');
const Task = require('../models/Task');
const Action = require('../models/Timer');
const User = require('../models/User');

// 指定的用戶 ID - 正式環境用戶ID (已更新)
const TARGET_USER_ID = '67f8c015cc2a04d4b9d025e5';  // 已更新為正式環境Google帳號的用戶ID

// 連接數據庫
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pomodoro')
  .then(() => console.log('數據庫連接成功'))
  .catch(err => {
    console.error('數據庫連接失敗:', err);
    process.exit(1);
  });

// 主遷移函數
async function migrateData() {
  try {
    console.log('開始數據遷移程序...');
    
    // 驗證目標用戶是否存在
    const user = await User.findById(TARGET_USER_ID);
    if (!user) {
      console.error(`目標用戶 ID ${TARGET_USER_ID} 不存在，終止遷移`);
      process.exit(1);
    }
    console.log(`已確認目標用戶存在: ${user.name} (${user.email})`);
    
    // 1. 遷移項目數據
    console.log('遷移項目數據...');
    const projectsWithoutUser = await Project.find({ userId: { $exists: false } });
    console.log(`找到 ${projectsWithoutUser.length} 個無用戶關聯的項目`);
    
    for (const project of projectsWithoutUser) {
      project.userId = TARGET_USER_ID;
      await project.save();
      console.log(`- 項目已關聯: ${project.name} (${project._id})`);
    }
    
    // 2. 遷移任務數據
    console.log('遷移任務數據...');
    const tasksWithoutUser = await Task.find({ userId: { $exists: false } });
    console.log(`找到 ${tasksWithoutUser.length} 個無用戶關聯的任務`);
    
    for (const task of tasksWithoutUser) {
      task.userId = TARGET_USER_ID;
      await task.save();
      console.log(`- 任務已關聯: ${task.name} (${task._id})`);
    }
    
    // 3. 遷移行動記錄
    console.log('遷移行動記錄...');
    const actionsWithoutUser = await Action.find({ userId: { $exists: false } });
    console.log(`找到 ${actionsWithoutUser.length} 個無用戶關聯的行動記錄`);
    
    // 由於可能數量較多，分批處理以避免內存問題
    const batchSize = 100;
    let processed = 0;
    
    for (let i = 0; i < actionsWithoutUser.length; i += batchSize) {
      const batch = actionsWithoutUser.slice(i, i + batchSize);
      
      for (const action of batch) {
        action.userId = TARGET_USER_ID;
        await action.save();
        processed++;
      }
      
      console.log(`- 已處理 ${processed}/${actionsWithoutUser.length} 個行動記錄`);
    }
    
    // 4. 統計結果
    console.log('\n數據遷移完成!');
    console.log('遷移統計:');
    console.log(`- 項目: ${projectsWithoutUser.length} 個`);
    console.log(`- 任務: ${tasksWithoutUser.length} 個`);
    console.log(`- 行動: ${actionsWithoutUser.length} 個`);
    console.log(`- 總計: ${projectsWithoutUser.length + tasksWithoutUser.length + actionsWithoutUser.length} 個記錄`);
    
    console.log('\n全部數據已成功關聯到用戶 ID:', TARGET_USER_ID);
    
    // 關閉連接
    mongoose.connection.close();
    console.log('數據庫連接已關閉');
    
  } catch (error) {
    console.error('遷移過程中發生錯誤:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// 執行遷移
migrateData(); 