const express = require('express');
const router = express.Router();
const Action = require('../models/Timer');

// 獲取所有計時記錄
router.get('/actions', async (req, res) => {
  try {
    const actions = await Action.find().sort({ systemStartTime: -1 });
    res.json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 開始新的計時
router.post('/start', async (req, res) => {
  try {
    const { note, startTime } = req.body;
    const action = new Action({
      startTime: startTime || new Date(),
      note: note || '專注'
    });
    const newAction = await action.save();
    res.status(201).json(newAction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 結束計時
router.put('/end/:id', async (req, res) => {
  try {
    const { endTime } = req.body;
    const action = await Action.findById(req.params.id);
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }
    action.endTime = endTime || new Date();
    action.isCompleted = true;
    const updatedAction = await action.save();
    res.json(updatedAction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 更新筆記
router.put('/note/:id', async (req, res) => {
  try {
    const action = await Action.findById(req.params.id);
    action.note = req.body.note;
    const updatedAction = await action.save();
    res.json(updatedAction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 添加一個清理未完成記錄的路由
router.post('/cleanup', async (req, res) => {
  try {
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000);
    const result = await Action.updateMany(
      { 
        systemEndTime: null, 
        systemStartTime: { $lt: cutoffTime } 
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

// 刪除計時記錄
router.delete('/delete/:id', async (req, res) => {
  try {
    await Action.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Action deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 更新使用者時間
router.put('/time/:id', async (req, res) => {
  try {
    const { userStartTime, userEndTime } = req.body;
    const action = await Action.findById(req.params.id);
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }
    
    if (userStartTime) action.userStartTime = new Date(userStartTime);
    if (userEndTime) action.userEndTime = new Date(userEndTime);
    
    const updatedAction = await action.save();
    res.json(updatedAction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;