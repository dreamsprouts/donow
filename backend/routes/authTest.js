const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TestItem = require('../models/TestItem');
const auth = require('../middleware/auth');
const passport = require('passport');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Action = require('../models/Timer');

// ===== Google 登入相關路由 =====

// Google 登入入口點
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// Google 登入回調處理
router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/api/auth-test/google/failure' 
  }), 
  async (req, res) => {
    try {
      // 使用 Passport 回調中的用戶生成 JWT
      const user = req.user;
      
      // 生成 JWT
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '1h' }
      );
      
      // 設置 HTTP-only cookie
      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000 // 1小時
      });
      
      // 重定向到前端 (帶著成功訊息和 token)
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?login=success&provider=google&token=${token}&userId=${user._id}&userName=${encodeURIComponent(user.name)}&userEmail=${encodeURIComponent(user.email)}`);
    } catch (error) {
      console.error('Google 登入處理錯誤:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?login=error&message=${encodeURIComponent('登入處理失敗')}`);
    }
  }
);

// Google 登入失敗處理
router.get('/google/failure', (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?login=error&message=${encodeURIComponent('Google 登入失敗')}`);
});

// ===== 用戶管理相關路由 =====

// 註冊新用戶
router.post('/register', async (req, res) => {
  try {
    console.log('收到註冊請求:', req.body);
    const { email, password, name } = req.body;
    
    // 基本輸入驗證
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: '註冊失敗', 
        error: '電子郵件為必填項'
      });
    }
    
    // 轉換為小寫並去除前後空格
    const normalizedEmail = email.toLowerCase().trim();
    
    // 驗證電子郵件格式
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: '註冊失敗', 
        error: '無效的電子郵件格式'
      });
    }
    
    // 驗證密碼
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: '註冊失敗', 
        error: '密碼為必填項'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: '註冊失敗', 
        error: '密碼長度至少為6個字符'
      });
    }
    
    // 檢查用戶是否已存在
    let user = await User.findOne({ email: normalizedEmail });
    
    if (user) {
      // 檢查密碼是否匹配 - 如果郵箱、密碼和名稱都相同，視為用戶想登入
      const isMatch = await user.comparePassword(password);
      
      if (isMatch && user.name === name) {
        // 這裡假設用戶想要登入，但點錯了按鈕
        // 更新最後登入時間
        user.lastLoginAt = new Date();
        await user.save();
        
        // 生成JWT
        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET || 'test-secret-key',
          { expiresIn: '1h' }
        );
        
        // 設置HTTP-only cookie
        res.cookie('accessToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 3600000 // 1小時
        });
        
        return res.status(200).json({
          success: true,
          message: '您已經註冊過，已為您自動登入',
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            lastLoginAt: user.lastLoginAt
          }
        });
      } else {
        // 如果密碼或名稱不匹配，則拒絕註冊
        return res.status(400).json({
          success: false,
          message: '註冊失敗',
          error: '此電子郵件已被註冊'
        });
      }
    }
    
    // 創建新用戶
    user = new User({
      email: normalizedEmail,
      password,
      name: name || normalizedEmail.split('@')[0] // 如果沒提供名稱，使用郵箱前綴
    });
    
    await user.save();
    
    // 創建兩個測試項目與用戶關聯
    try {
      await TestItem.create([
        {
          name: '測試項目 1',
          description: '這是第一個測試項目',
          priority: 3,
          userId: user._id
        },
        {
          name: '測試項目 2',
          description: '這是第二個測試項目',
          completed: true,
          userId: user._id
        }
      ]);
    } catch (itemError) {
      console.error('創建測試項目錯誤:', itemError);
      // 繼續處理，不中斷註冊流程
    }
    
    // 生成JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
    
    // 設置HTTP-only cookie
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 // 1小時
    });
    
    res.status(201).json({
      success: true,
      message: '用戶註冊成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('註冊錯誤:', error);
    
    // 處理不同類型的錯誤
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: '註冊失敗', 
        error: messages.join(', ')
      });
    } else if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: '註冊失敗', 
        error: '此電子郵件已被註冊'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: '註冊失敗', 
      error: error.message 
    });
  }
});

// 用戶登入
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 基本輸入驗證
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '登入失敗', 
        error: '電子郵件和密碼為必填項'
      });
    }
    
    // 查找用戶
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: '登入失敗', 
        error: '用戶不存在'
      });
    }
    
    // 驗證密碼
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: '登入失敗', 
        error: '密碼錯誤'
      });
    }
    
    // 更新最後登入時間
    user.lastLoginAt = new Date();
    await user.save();
    
    // 生成token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
    
    // 設置HTTP-only cookie
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 // 1小時
    });
    
    res.json({
      success: true,
      message: '登入成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '登入失敗', 
      error: error.message 
    });
  }
});

// 獲取當前登入用戶資料
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '獲取用戶資料失敗', 
        error: '用戶不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        loginType: user.googleId ? 'google' : 'local'
      }
    });
  } catch (error) {
    console.error('獲取用戶資料錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取用戶資料失敗', 
      error: error.message 
    });
  }
});

// 獲取所有用戶列表
router.get('/users', async (req, res) => {
  try {
    console.log('獲取所有用戶列表');
    const users = await User.find().select('-password');
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }))
    });
  } catch (error) {
    console.error('獲取用戶列表錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取用戶列表失敗', 
      error: error.message 
    });
  }
});

// 刪除指定用戶
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`嘗試刪除用戶 ID: ${userId}`);
    
    // 先檢查用戶是否存在
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '刪除用戶失敗', 
        error: '用戶不存在' 
      });
    }
    
    // 刪除該用戶的所有測試項目
    await TestItem.deleteMany({ userId });
    
    // 刪除用戶
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: '用戶已成功刪除'
    });
  } catch (error) {
    console.error('刪除用戶錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '刪除用戶失敗', 
      error: error.message 
    });
  }
});

// ===== 測試項目相關路由 =====

// 獲取當前用戶的測試項目
router.get('/items', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await TestItem.find({ userId });
    
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('獲取測試項目錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取測試項目失敗', 
      error: error.message 
    });
  }
});

// 創建測試項目
router.post('/items', auth, async (req, res) => {
  try {
    const { name, description, priority } = req.body;
    
    // 驗證項目名稱
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '創建測試項目失敗',
        error: '項目名稱為必填項'
      });
    }
    
    // 創建項目
    const newItem = new TestItem({
      name,
      description,
      priority: priority || 0,
      userId: req.user.id
    });
    
    await newItem.save();
    
    res.status(201).json({
      success: true,
      message: '測試項目創建成功',
      data: newItem
    });
  } catch (error) {
    console.error('創建測試項目錯誤:', error);
    
    // 處理驗證錯誤
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: '創建測試項目失敗', 
        error: messages.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: '創建測試項目失敗', 
      error: error.message 
    });
  }
});

// ===== 項目路由整合 =====

// 獲取當前用戶的專案項目
router.get('/projects', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查詢條件：專案沒有userId欄位或專案的userId等於當前用戶
    const query = { $or: [{ userId: { $exists: false } }, { userId: userId }] };
    const projects = await Project.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('獲取專案項目錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取專案項目失敗', 
      error: error.message 
    });
  }
});

// 創建專案項目
router.post('/projects', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '專案名稱為必填項'
      });
    }
    
    const project = new Project({
      name,
      userId,
      isBillable: false, // 預設非計費
      hourlyRate: 0,
      monthlyBudgetLimit: 0
    });
    
    await project.save();
    
    res.status(201).json({
      success: true,
      message: '專案創建成功',
      data: project
    });
  } catch (error) {
    console.error('創建專案錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '創建專案失敗', 
      error: error.message 
    });
  }
});

// 刪除專案項目
router.delete('/projects/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '找不到指定專案'
      });
    }
    
    // 檢查專案所有權
    if (project.userId && project.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '無權限刪除此專案'
      });
    }
    
    // 檢查是否有關聯的任務
    const hasTasks = await Task.exists({ project: project._id });
    if (hasTasks) {
      return res.status(400).json({
        success: false,
        message: '無法刪除已有關聯任務的專案'
      });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '專案刪除成功'
    });
  } catch (error) {
    console.error('刪除專案錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '刪除專案失敗', 
      error: error.message 
    });
  }
});

// ===== 任務相關路由 =====

// 獲取用戶的所有任務（包括專案任務和直接關聯任務）
router.get('/tasks', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查找用戶的所有專案
    const userProjects = await Project.find({
      $or: [{ userId }, { userId: { $exists: false } }]
    }).select('_id');
    const projectIds = userProjects.map(p => p._id);
    
    // 查詢條件：直接關聯到用戶的任務或屬於用戶專案的任務
    const query = {
      $or: [
        { userId },
        { project: { $in: projectIds } }
      ]
    };
    
    // 獲取所有符合條件的任務
    const tasks = await Task.find(query)
      .populate('project')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('獲取用戶任務錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取用戶任務失敗', 
      error: error.message 
    });
  }
});

// 獲取特定專案的所有任務
router.get('/projects/:projectId/tasks', auth, async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;
    
    // 先檢查專案所有權
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '找不到指定專案'
      });
    }
    
    // 檢查專案所有權（如果專案有指定用戶ID）
    if (project.userId && project.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '無權限訪問此專案的任務'
      });
    }
    
    // 獲取該專案所有任務
    const tasks = await Task.find({ project: projectId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('獲取專案任務錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取專案任務失敗', 
      error: error.message 
    });
  }
});

// 創建專案關聯任務
router.post('/projects/:projectId/tasks', auth, async (req, res) => {
  try {
    const { name, color } = req.body;
    const projectId = req.params.projectId;
    const userId = req.user.id;
    
    // 檢查任務名稱
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '任務名稱為必填項'
      });
    }
    
    // 檢查專案存在性
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '找不到指定專案'
      });
    }
    
    // 檢查專案所有權（如果專案有指定用戶ID）
    if (project.userId && project.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '無權限在此專案中創建任務'
      });
    }
    
    // 創建新任務
    const task = new Task({
      name,
      color: color || undefined, // 如果未提供顏色，則使用默認值
      type: 'project',
      project: projectId,
      userId // 同時關聯用戶ID，便於後續查詢
    });
    
    await task.save();
    
    res.status(201).json({
      success: true,
      message: '任務創建成功',
      data: task
    });
  } catch (error) {
    console.error('創建任務錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '創建任務失敗', 
      error: error.message 
    });
  }
});

// 創建直接關聯用戶的任務（不關聯任何專案）
router.post('/tasks', auth, async (req, res) => {
  try {
    const { name, color } = req.body;
    const userId = req.user.id;
    
    // 檢查任務名稱
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '任務名稱為必填項'
      });
    }
    
    // 創建新任務（直接關聯用戶）
    const task = new Task({
      name,
      color: color || undefined, // 如果未提供顏色，則使用默認值
      type: 'project',
      userId: userId
    });
    
    await task.save();
    
    res.status(201).json({
      success: true,
      message: '用戶任務創建成功',
      data: task
    });
  } catch (error) {
    console.error('創建用戶任務錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '創建用戶任務失敗', 
      error: error.message 
    });
  }
});

// 刪除任務
router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    
    // 先查找任務
    const task = await Task.findById(taskId).populate('project');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '找不到指定任務'
      });
    }
    
    // 檢查任務所有權
    // 1. 檢查任務是否直接關聯用戶
    // 2. 如果關聯專案，檢查專案所有權
    if (
      (task.userId && task.userId.toString() !== userId) ||
      (task.project && task.project.userId && task.project.userId.toString() !== userId)
    ) {
      return res.status(403).json({
        success: false,
        message: '無權限刪除此任務'
      });
    }
    
    // 檢查是否有關聯計時記錄
    // 在真實環境中，我們可能會先檢查是否有計時記錄，這裡簡化處理直接刪除
    
    await Task.findByIdAndDelete(taskId);
    
    res.json({
      success: true,
      message: '任務刪除成功'
    });
  } catch (error) {
    console.error('刪除任務錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '刪除任務失敗', 
      error: error.message 
    });
  }
});

// ===== Action (Timer) 相關路由 =====

// 獲取用戶的所有行動記錄
router.get('/actions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 查詢條件：直接關聯到用戶的行動記錄
    const actions = await Action.find({ userId })
      .populate('task')
      .sort({ userStartTime: -1 }); // 按開始時間降序排列
    
    res.json({
      success: true,
      count: actions.length,
      data: actions
    });
  } catch (error) {
    console.error('獲取用戶行動記錄錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取用戶行動記錄失敗', 
      error: error.message 
    });
  }
});

// 獲取特定任務的所有行動記錄
router.get('/tasks/:taskId/actions', auth, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;
    
    // 先檢查任務所有權
    const task = await Task.findById(taskId).populate('project');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '找不到指定任務'
      });
    }
    
    // 檢查任務所有權（直接關聯或通過專案關聯）
    const isOwner = 
      (task.userId && task.userId.toString() === userId) || 
      (task.project && task.project.userId && task.project.userId.toString() === userId);
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '無權限訪問此任務的行動記錄'
      });
    }
    
    // 查詢任務的行動記錄
    const actions = await Action.find({ task: taskId })
      .sort({ userStartTime: -1 });
    
    res.json({
      success: true,
      count: actions.length,
      data: actions
    });
  } catch (error) {
    console.error('獲取任務行動記錄錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '獲取任務行動記錄失敗', 
      error: error.message 
    });
  }
});

// 創建新行動記錄
router.post('/tasks/:taskId/actions', auth, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;
    const { userStartTime, userEndTime, note, type } = req.body;
    
    // 先檢查任務是否存在
    const task = await Task.findById(taskId).populate('project');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: '找不到指定任務'
      });
    }
    
    // 檢查任務所有權（直接關聯或通過專案關聯）
    const isOwner = 
      (task.userId && task.userId.toString() === userId) || 
      (task.project && task.project.userId && task.project.userId.toString() === userId);
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '無權限為此任務創建行動記錄'
      });
    }
    
    // 創建新行動記錄
    const action = new Action({
      task: taskId,
      userId, // 同時關聯用戶ID
      userStartTime: userStartTime || new Date(),
      userEndTime: userEndTime,
      note: note || '專注',
      type: type || 'pomodoro',
      isCompleted: !!userEndTime
    });
    
    await action.save();
    
    res.status(201).json({
      success: true,
      message: '行動記錄創建成功',
      data: action
    });
  } catch (error) {
    console.error('創建行動記錄錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '創建行動記錄失敗', 
      error: error.message 
    });
  }
});

// 更新行動記錄
router.put('/actions/:id', auth, async (req, res) => {
  try {
    const actionId = req.params.id;
    const userId = req.user.id;
    const { userStartTime, userEndTime, note, isCompleted } = req.body;
    
    // 查找行動記錄
    const action = await Action.findById(actionId).populate({
      path: 'task',
      populate: { path: 'project' }
    });
    
    if (!action) {
      return res.status(404).json({
        success: false,
        message: '找不到指定行動記錄'
      });
    }
    
    // 檢查行動記錄所有權
    const isOwner = 
      (action.userId && action.userId.toString() === userId) || 
      (action.task.userId && action.task.userId.toString() === userId) || 
      (action.task.project && action.task.project.userId && action.task.project.userId.toString() === userId);
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '無權限更新此行動記錄'
      });
    }
    
    // 更新數據
    if (userStartTime !== undefined) action.userStartTime = userStartTime;
    if (userEndTime !== undefined) action.userEndTime = userEndTime;
    if (note !== undefined) action.note = note;
    if (isCompleted !== undefined) action.isCompleted = isCompleted;
    
    await action.save();
    
    res.json({
      success: true,
      message: '行動記錄更新成功',
      data: action
    });
  } catch (error) {
    console.error('更新行動記錄錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '更新行動記錄失敗', 
      error: error.message 
    });
  }
});

// 刪除行動記錄
router.delete('/actions/:id', auth, async (req, res) => {
  try {
    const actionId = req.params.id;
    const userId = req.user.id;
    
    // 查找行動記錄
    const action = await Action.findById(actionId).populate({
      path: 'task',
      populate: { path: 'project' }
    });
    
    if (!action) {
      return res.status(404).json({
        success: false,
        message: '找不到指定行動記錄'
      });
    }
    
    // 檢查行動記錄所有權
    const isOwner = 
      (action.userId && action.userId.toString() === userId) || 
      (action.task.userId && action.task.userId.toString() === userId) || 
      (action.task.project && action.task.project.userId && action.task.project.userId.toString() === userId);
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '無權限刪除此行動記錄'
      });
    }
    
    // 保存任務ID，以便稍後更新統計數據
    const taskId = action.task._id;
    
    // 刪除行動記錄
    await Action.findByIdAndDelete(actionId);
    
    // 更新任務統計
    const task = await Task.findById(taskId);
    if (task && task.updateStats) {
      await task.updateStats();
    }
    
    res.json({
      success: true,
      message: '行動記錄刪除成功'
    });
  } catch (error) {
    console.error('刪除行動記錄錯誤:', error);
    res.status(500).json({ 
      success: false, 
      message: '刪除行動記錄失敗', 
      error: error.message 
    });
  }
});

// ===== 前端測試面板 =====

// 添加測試面板入口點
router.get('/test-panel', auth, async (req, res) => {
  const userId = req.user.id;
  
  try {
    // 獲取用戶信息
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
    }
    
    // 獲取用戶的專案
    const projects = await Project.find({
      $or: [{ userId }, { userId: { $exists: false } }]
    });
    
    // 獲取用戶的任務
    const tasks = await Task.find({ userId });
    
    // 獲取用戶的計時記錄（最近10條）
    const actions = await Action.find({ userId })
      .populate('task')
      .sort({ userStartTime: -1 })
      .limit(10);
    
    // 返回整合數據
    res.json({
      success: true,
      data: {
        user,
        projects: projects.length,
        tasks: tasks.length,
        actions: actions.length,
        recentActions: actions
      }
    });
  } catch (error) {
    console.error('獲取測試面板數據錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取測試面板數據失敗',
      error: error.message
    });
  }
});

// ===== 清理測試數據 =====

// 清除所有測試數據（僅非生產環境可用）
router.delete('/clear-all', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: '此操作在生產環境中被禁用'
    });
  }
  
  try {
    // 刪除所有測試項目
    await TestItem.deleteMany({});
    
    // 刪除所有用戶
    await User.deleteMany({});
    
    return res.json({
      success: true,
      message: '已清除所有測試數據'
    });
  } catch (error) {
    console.error('清除所有測試數據錯誤:', error);
    res.status(500).json({
      success: false,
      message: '清除所有測試數據失敗',
      error: error.message
    });
  }
});

module.exports = router; 