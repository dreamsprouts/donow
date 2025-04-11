const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { migrateActions } = require('../scripts/migrateActions');
const Action = require('../models/Timer');
const auth = require('../middleware/auth');
const checkOwnership = require('../middleware/checkOwnership');

// 使用認證中間件保護所有路由
router.use(auth);

// 取得所有任務（加入排序）
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user.id;
    
    // 添加用戶篩選條件
    const query = { 
      userId: userId,
      ...(type ? { type } : {})
    };
    
    const tasks = await Task.find(query)
      .sort({ 'stats.totalActions': -1 }); // 依總行動次數降序排列
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 建立新任務
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const task = new Task({
      name: req.body.name,
      type: req.body.type || 'project',
      dailyGoal: req.body.dailyGoal,
      userId: userId,  // 添加用戶 ID
      project: req.body.project || null
    });

    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 遷移 API endpoint - 限制為管理員功能
router.post('/migrate', async (req, res) => {
  try {
    // 這裡可以添加管理員檢查
    const result = await migrateActions();
    res.json({
      message: '遷移完成',
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 刪除任務 - 添加所有權檢查
router.delete('/:taskId', checkOwnership(Task, 'taskId'), async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;
    
    // 檢查是否有關聯的 actions
    const relatedActions = await Action.find({ 
      task: taskId,
      userId: userId
    });
    
    if (relatedActions.length > 0) {
      return res.status(400).json({
        message: '無法刪除：此任務已有關聯的時間記錄',
        actionCount: relatedActions.length
      });
    }
    
    // 執行刪除 - 使用現代的方法替代 remove()
    const result = await Task.findByIdAndDelete(taskId);
    if (!result) {
      return res.status(404).json({ message: '找不到該任務' });
    }
    
    res.json({ message: '任務已刪除', deletedTask: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 更新任務 - 添加所有權檢查
router.put('/:taskId', checkOwnership(Task, 'taskId'), async (req, res) => {
  try {
    const { name, color, dailyGoal, project } = req.body;
    const updateData = { name, color, dailyGoal };
    
    // 如果提供了 project，加入更新資料中
    if (project !== undefined) {
      updateData.project = project || null;  // 如果是空字串，設為 null
    }

    const task = await Task.findById(req.params.taskId);
    
    // 更新欄位
    Object.assign(task, updateData);
    await task.save();
    
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 獲取預設任務 - 改為獲取用戶的預設任務
router.get('/default', async (req, res) => {
  try {
    const userId = req.user.id;
    const defaultTask = await Task.findOne({ 
      isDefault: true,
      userId: userId
    });
    
    res.json(defaultTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 