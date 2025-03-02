const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { migrateActions } = require('../scripts/migrateActions');
const Action = require('../models/Timer');

// 取得所有任務（加入排序）
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    
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
    const task = new Task({
      name: req.body.name,
      type: req.body.type || 'project',
      dailyGoal: req.body.dailyGoal
    });

    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 遷移 API endpoint
router.post('/migrate', async (req, res) => {
  try {
    const result = await migrateActions();
    res.json({
      message: '遷移完成',
      ...result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 刪除任務
router.delete('/:taskId', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    
    // 檢查是否有關聯的 actions
    const relatedActions = await Action.find({ task: taskId });
    if (relatedActions.length > 0) {
      return res.status(400).json({
        message: '無法刪除：此任務已有關聯的時間記錄',
        actionCount: relatedActions.length
      });
    }
    
    // 執行刪除
    const result = await Task.findByIdAndDelete(taskId);
    if (!result) {
      return res.status(404).json({ message: '找不到該任務' });
    }
    
    res.json({ message: '任務已刪除', deletedTask: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 更新任務
router.put('/:taskId', async (req, res) => {
  try {
    const { name, color, dailyGoal } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { name, color, dailyGoal },
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: '找不到該任務' });
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 獲取預設任務
router.get('/default', async (req, res) => {
  try {
    const defaultTask = await Task.findOne({ isDefault: true });
    res.json(defaultTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 