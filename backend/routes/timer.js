const express = require('express');
const router = express.Router();
const Action = require('../models/Timer');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const checkOwnership = require('../middleware/checkOwnership');

/**
 * 注意：命名約定說明
 * 
 * 數據庫模型中使用的字段名稱和路由代碼中使用的變量名稱存在一些差異：
 * - 數據庫模型(Timer.js)中的字段：startTime, endTime
 * - 路由代碼中的變量：systemStartTime, systemEndTime
 * 
 * 在查詢條件、排序等操作中，需要使用與數據庫一致的字段名，
 * 但是在其他地方的變量名稱保持原樣，以保持代碼一致性。
 * 
 * 若出現查詢問題，請檢查字段名稱是否與模型一致。
 */

// 使用認證中間件保護所有路由
router.use(auth);

// 獲取所有計時記錄（加入 type 過濾）
router.get('/actions', async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user.id;
    
    // 添加用戶篩選條件
    const query = { 
      userId: userId,
      ...(type ? { type } : {})
    };
    
    // 注意：這裡使用 systemStartTime 進行排序，如果與模型不符可能需要修改
    const actions = await Action.find(query)
      .populate('task')
      .sort({ systemStartTime: -1 });
    res.json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 在路由處理之前先獲取用戶的預設任務 ID
async function getDefaultTaskId(userId) {
  try {
    // 查找用戶的預設任務
    let defaultTask = await Task.findOne({ 
      isDefault: true,
      userId: userId
    });
    
    // 如果沒有預設任務，創建一個
    if (!defaultTask) {
      console.log(`找不到用戶 ${userId} 的預設任務，正在創建一個`);
      defaultTask = new Task({
        name: '一般任務',
        userId: userId,
        isDefault: true,
        color: '#0891B2', // 默認使用深青色
        type: 'project'
      });
      
      await defaultTask.save();
      console.log(`已為用戶 ${userId} 創建預設任務: ${defaultTask._id}`);
    }
    
    return defaultTask._id;
  } catch (error) {
    console.error('獲取或創建預設任務時出錯:', error);
    return null;
  }
}

// 開始新的計時
router.post('/start', async (req, res) => {
  try {
    const { note, startTime, taskId } = req.body;
    const userId = req.user.id;
    const systemStartTime = startTime || new Date();
    
    // 如果沒有指定 taskId，使用該用戶的預設任務
    let actualTaskId = taskId;
    if (!actualTaskId) {
      actualTaskId = await getDefaultTaskId(userId);
      if (!actualTaskId) {
        return res.status(500).json({ message: '找不到預設任務' });
      }
    }
    
    // 檢查任務是否屬於該用戶
    const task = await Task.findOne({ 
      _id: actualTaskId,
      userId: userId
    });
    
    if (!task) {
      return res.status(404).json({ message: '找不到有效的任務或任務不屬於您' });
    }

    // 注意：這裡使用 startTime 作為數據庫字段名，與 systemStartTime 變量對應
    const action = new Action({
      startTime: systemStartTime,
      userStartTime: systemStartTime,
      note: note || '專注',
      task: actualTaskId,
      userId: userId  // 添加用戶 ID
    });
    
    const newAction = await action.save();
    const populatedAction = await Action.findById(newAction._id).populate('task');
    res.status(201).json(populatedAction);

    // 更新任務統計
    await task.updateStats();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 結束計時 - 添加所有權檢查
router.put('/end/:id', checkOwnership(Action), async (req, res) => {
  try {
    const { endTime } = req.body;
    const systemEndTime = endTime || new Date();
    
    const action = await Action.findById(req.params.id);
    
    // 注意：這裡使用 endTime 作為數據庫字段名，與 systemEndTime 變量對應
    action.endTime = systemEndTime;
    action.userEndTime = systemEndTime; // 自動設定使用者時間
    action.isCompleted = true;
    
    const updatedAction = await action.save();
    res.json(updatedAction);

    // 更新任務統計
    const task = await Task.findById(action.task);
    await task.updateStats();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 更新筆記 - 添加所有權檢查
router.put('/note/:id', checkOwnership(Action), async (req, res) => {
  try {
    const action = await Action.findById(req.params.id);
    action.note = req.body.note;
    const updatedAction = await action.save();
    res.json(updatedAction);

    // 更新任務統計
    const task = await Task.findById(action.task);
    await task.updateStats();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 添加一個清理未完成記錄的路由
router.post('/cleanup', async (req, res) => {
  try {
    const userId = req.user.id;
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000);
    
    // 注意：查詢字段名需與數據庫字段名一致，這裡可能需要檢查
    const result = await Action.updateMany(
      { 
        systemEndTime: null, 
        systemStartTime: { $lt: cutoffTime },
        userId: userId  // 只清理當前用戶的記錄
      },
      { 
        $set: { 
          systemEndTime: new Date(),
          userEndTime: new Date(),
          note: '意外中斷'
        } 
      }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 刪除計時記錄 - 添加所有權檢查
router.delete('/delete/:id', checkOwnership(Action), async (req, res) => {
  try {
    const actionId = req.params.id;
    // 先獲取行動記錄以獲取任務ID
    const action = await Action.findById(actionId);
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }
    
    const taskId = action.task;
    
    // 使用現代的方法刪除
    const deletedAction = await Action.findByIdAndDelete(actionId);
    if (!deletedAction) {
      return res.status(404).json({ message: 'Action not found or already deleted' });
    }
    
    res.status(200).json({ message: 'Action deleted successfully' });
    
    // 更新任務統計
    const task = await Task.findById(taskId);
    if (task) {
      await task.updateStats();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 更新使用者時間 - 添加所有權檢查
router.put('/time/:id', checkOwnership(Action), async (req, res) => {
  try {
    const { userStartTime, userEndTime } = req.body;
    const action = await Action.findById(req.params.id);
    
    if (userStartTime) action.userStartTime = new Date(userStartTime);
    if (userEndTime) action.userEndTime = new Date(userEndTime);
    
    const updatedAction = await action.save();
    res.json(updatedAction);

    // 更新任務統計
    const task = await Task.findById(action.task);
    await task.updateStats();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 更新 action 的 task - 添加所有權檢查
router.put('/actions/:id/task', checkOwnership(Action, 'id'), async (req, res) => {
  try {
    const { id } = req.params;
    const { taskId } = req.body;
    const userId = req.user.id;

    // 檢查任務是否屬於該用戶
    const task = await Task.findOne({
      _id: taskId,
      userId: userId
    });
    
    if (!task) {
      return res.status(404).json({ message: '找不到有效的任務或任務不屬於您' });
    }

    const action = await Action.findById(id);
    action.task = taskId;
    await action.save();
    
    const updatedAction = await Action.findById(id).populate('task');
    res.json(updatedAction);

    // 更新任務統計
    await task.updateStats();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 獲取特定日期的計時記錄
router.get('/actions/date/:date', async (req, res) => {
  try {
    const userId = req.user.id;
    const date = new Date(req.params.date);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    // 注意：查詢字段名需與數據庫字段名一致，這裡可能需要檢查
    const actions = await Action.find({
      systemStartTime: {
        $gte: date,
        $lt: nextDate
      },
      userId: userId  // 只獲取當前用戶的記錄
    }).populate('task').sort({ systemStartTime: -1 });
    
    res.json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 獲取最近的計時記錄
router.get('/actions/recent', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 注意：排序字段名需與數據庫字段名一致，這裡可能需要檢查
    const actions = await Action.find({ userId: userId })
      .populate('task')
      .sort({ systemStartTime: -1 })
      .limit(10);
    res.json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 新增 habit 記錄
router.post('/habit', async (req, res) => {
  try {
    const { taskId, note, startTime } = req.body;
    const userId = req.user.id;
    const systemStartTime = startTime || new Date();
    
    // 檢查任務是否屬於該用戶
    const task = await Task.findOne({ 
      _id: taskId,
      userId: userId
    });
    
    if (!task) {
      return res.status(404).json({ message: '找不到有效的任務或任務不屬於您' });
    }
    
    // 注意：這裡使用 startTime, endTime 作為數據庫字段名，與變量名對應
    const action = new Action({
      startTime: systemStartTime,
      endTime: systemStartTime,
      userStartTime: systemStartTime,
      userEndTime: systemStartTime,
      userId: userId,  // 添加用戶 ID
      note: note || '完成習慣',
      task: taskId,
      type: 'habit',
      isCompleted: true
    });
    
    const newAction = await action.save();
    const populatedAction = await Action.findById(newAction._id)
      .populate('task')
      .lean();  // 使用 lean() 來獲取純 JavaScript 物件
      
    // 計算當日進度
    const progress = await action.goalProgress;
    
    res.status(201).json({
      ...populatedAction,
      progress  // 加入進度資訊
    });

    // 更新任務統計
    await task.updateStats();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;