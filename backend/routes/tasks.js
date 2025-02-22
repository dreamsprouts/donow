const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { migrateActions } = require('../scripts/migrateActions');
const Action = require('../models/Timer');

// 取得所有任務
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 建立新任務
router.post('/', async (req, res) => {
  const task = new Task({
    name: req.body.name
  });

  try {
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

module.exports = router; 