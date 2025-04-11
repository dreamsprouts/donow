const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task'); // 引入 Task 模型用於創建預設任務
const auth = require('../middleware/auth');
const passport = require('passport');

// 簡單函數：為用戶創建預設任務
async function createDefaultTask(userId) {
  try {
    // 檢查是否已有預設任務
    const existingTask = await Task.findOne({ 
      userId: userId, 
      isDefault: true 
    });
    
    if (existingTask) {
      return; // 已有預設任務，不需要創建
    }
    
    // 創建預設任務
    const defaultTask = new Task({
      name: '一般任務',
      userId: userId,
      isDefault: true,
      color: '#0891B2', // 默認使用深青色
      type: 'project'
    });
    
    await defaultTask.save();
    console.log(`為用戶 ${userId} 創建了預設任務`);
  } catch (error) {
    console.error('創建預設任務失敗:', error);
    // 不拋出錯誤，允許註冊/登入繼續進行
  }
}

// ===== Google 登入相關路由 =====

// Google 登入入口點
router.get('/google', (req, res, next) => {
  console.log('Google 登入請求開始，準備重定向到 Google 認證頁面');
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })(req, res, next);
});

// Google 登入回調處理
router.get('/google/callback', 
  (req, res, next) => {
    console.log('Google 登入回調收到，準備驗證');
    passport.authenticate('google', { 
      session: false,
      failureRedirect: '/api/auth/google/failure' 
    })(req, res, next);
  }, 
  async (req, res) => {
    try {
      console.log('Google 認證成功，生成 JWT');
      // 使用 Passport 回調中的用戶生成 JWT
      const user = req.user;
      
      // 為新用戶創建預設任務
      await createDefaultTask(user._id);
      
      // 生成 JWT，加強安全性
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'secret-key',
        { 
          expiresIn: '7d',  // 延長有效期至7天
          algorithm: 'HS256' // 明確指定算法
        }
      );
      
      // 設置 HTTP-only cookie，加強安全性
      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
        sameSite: 'lax' // 防止CSRF攻擊
      });
      
      console.log('準備重定向到前端頁面，帶有令牌');
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
        
        // 生成JWT，加強安全性
        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET || 'secret-key',
          { 
            expiresIn: '7d',  // 延長有效期至7天
            algorithm: 'HS256' // 明確指定算法
          }
        );
        
        // 設置HTTP-only cookie，加強安全性
        res.cookie('accessToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
          sameSite: 'lax' // 防止CSRF攻擊
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
    
    // 為新用戶創建預設任務
    await createDefaultTask(user._id);
    
    // 生成JWT，加強安全性
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret-key',
      { 
        expiresIn: '7d',  // 延長有效期至7天
        algorithm: 'HS256' // 明確指定算法
      }
    );
    
    // 設置HTTP-only cookie，加強安全性
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      sameSite: 'lax' // 防止CSRF攻擊
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
    
    // 為用戶創建預設任務（如果沒有）
    await createDefaultTask(user._id);
    
    // 更新最後登入時間
    user.lastLoginAt = new Date();
    await user.save();
    
    // 生成token，加強安全性
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret-key',
      { 
        expiresIn: '7d',  // 延長有效期至7天
        algorithm: 'HS256' // 明確指定算法
      }
    );
    
    // 設置HTTP-only cookie，加強安全性
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
      sameSite: 'lax' // 防止CSRF攻擊
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

module.exports = router; 