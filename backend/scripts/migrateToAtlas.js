const mongoose = require('mongoose');
require('dotenv').config();

const Task = require('../models/Task');
const Action = require('../models/Timer');

// 本地和 Atlas 的連線字串
const LOCAL_URI = 'mongodb://localhost:27017/pomodoro';
const ATLAS_URI = "mongodb+srv://morrisdreamsprouts:5q6xScpgmZoofiqM@cluster0.pepcr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function migrateData() {
  // 連接本地資料庫
  const localDb = await mongoose.createConnection(LOCAL_URI);
  console.log('已連接本地資料庫');
  
  // 連接 Atlas
  const atlasDb = await mongoose.createConnection(ATLAS_URI);
  console.log('已連接 Atlas 資料庫');

  try {
    // 遷移 Tasks
    const tasks = await localDb.model('Task', Task.schema).find();
    console.log(`找到 ${tasks.length} 個任務`);
    
    for (const task of tasks) {
      await atlasDb.model('Task', Task.schema).create(task.toObject());
    }
    console.log('任務遷移完成');

    // 遷移 Actions
    const actions = await localDb.model('Action', Action.schema).find();
    console.log(`找到 ${actions.length} 個計時記錄`);
    
    for (const action of actions) {
      await atlasDb.model('Action', Action.schema).create(action.toObject());
    }
    console.log('計時記錄遷移完成');

  } catch (error) {
    console.error('遷移錯誤：', error);
  } finally {
    await localDb.close();
    await atlasDb.close();
    console.log('資料庫連接已關閉');
  }
}

migrateData().catch(console.error); 