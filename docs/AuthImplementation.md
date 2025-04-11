# 使用者身份驗證實現文件

本文件詳細記錄了 DoNow 專案中使用者身份驗證系統的實現方式，包含本地帳號註冊/登入和 Google OAuth 登入功能。

## 目錄

- [架構概述](#架構概述)
- [後端實現](#後端實現)
  - [配置文件](#配置文件)
  - [用戶模型](#用戶模型)
  - [API 路由](#api-路由)
  - [Google OAuth 集成](#google-oauth-集成)
- [前端實現](#前端實現)
  - [測試面板](#測試面板)
  - [正式 Auth 組件](#正式-auth-組件)
  - [登入流程](#登入流程)
  - [Google 登入處理](#google-登入處理)
- [錯誤處理與優化](#錯誤處理與優化)
- [後續整合建議](#後續整合建議)

## 架構概述

身份驗證系統採用 JWT（JSON Web Token）為基礎，支援以下功能：

- 本地帳號註冊與登入
- Google OAuth 2.0 登入
- 用戶身份驗證與認證
- 用戶關聯數據管理

技術棧：
- 後端：Express.js, Passport.js, MongoDB (Mongoose)
- 前端：React, Material-UI
- 認證：JWT, Google OAuth 2.0

## 後端實現

### 配置文件

#### 環境變量 (.env)

```
MONGODB_URI=mongodb://localhost:27017/pomodoro
GOOGLE_CLIENT_ID=19939650154-9po4sejv9ehfeah0vun4ohdb9gvjsr4l.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
JWT_SECRET=your-jwt-secret-key
```

#### Passport 配置 (config/passport.js)

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// 檢測環境，決定使用哪個回調 URL
const getCallbackURL = () => {
  // 在非生產環境同時支持測試和正式路由
  if (process.env.NODE_ENV !== 'production') {
    // 從查詢參數或環境變量中獲取目標路由類型
    const targetRoute = process.env.OAUTH_TARGET_ROUTE || 'auth';
    return `/api/${targetRoute}/google/callback`;
  }
  
  // 生產環境只使用正式路由
  return '/api/auth/google/callback';
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getCallbackURL(),
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google 認證回調', profile.id);
        
        // 查找是否存在使用此 Google ID 的用戶
        let user = await User.findOne({ googleId: profile.id });
        
        // 如果沒有找到用戶，檢查是否有使用相同 email 的用戶
        if (!user && profile.emails && profile.emails.length > 0) {
          const email = profile.emails[0].value;
          user = await User.findOne({ email });
          
          if (user) {
            // 如果找到相同 email 的用戶，更新其 googleId
            user.googleId = profile.id;
            await user.save();
            console.log(`為已存在的用戶 ${user.email} 關聯 Google 帳戶`);
          }
        }
        
        // 如果都沒有找到，創建新用戶
        if (!user) {
          let email = profile.emails && profile.emails.length > 0 
            ? profile.emails[0].value 
            : `${profile.id}@google.user`;
            
          let name = profile.displayName || email.split('@')[0];
          
          console.log(`創建新用戶: ${name}, ${email}`);
          
          user = new User({
            googleId: profile.id,
            email: email,
            name: name,
            password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10), // 隨機密碼
            lastLoginAt: new Date()
          });
          
          await user.save();
        } else {
          // 更新最後登入時間
          user.lastLoginAt = new Date();
          await user.save();
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Google 認證錯誤:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
```

### 用戶模型

#### User 模型 (models/User.js)

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: [true, '電子郵件為必填項'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, '請提供有效的電子郵件地址']
  },
  password: { 
    type: String, 
    required: [true, '密碼為必填項'],
    minlength: [6, '密碼長度至少為6個字符'],
    select: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  name: { 
    type: String,
    trim: true,
    required: false,
    default: function() {
      return this.email ? this.email.split('@')[0] : '';
    }
  },
  lastLoginAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 密碼加密中間件
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// 驗證密碼的方法
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('密碼比較失敗');
  }
};

// 檢查用戶是否使用 Google 登入
UserSchema.methods.isGoogleUser = function() {
  return !!this.googleId;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
```

### API 路由

> **注意：** 目前系統同時存在測試路由(`/api/auth-test/*`)和正式路由(`/api/auth/*`)。以下描述適用於兩者，但引用路徑將使用正式路由。

#### 認證路由 (routes/auth.js)

關鍵部分摘錄：

```javascript
// Google 登入入口點
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// Google 登入回調處理
router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/api/auth/google/failure' 
  }), 
  async (req, res) => {
    try {
      // 使用 Passport 回調中的用戶生成 JWT
      const user = req.user;
      
      // 生成 JWT
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'secret-key',
        { 
          expiresIn: '7d',  // 7天有效期
          algorithm: 'HS256' // 明確指定算法
        }
      );
      
      // 設置 HTTP-only cookie
      res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
        sameSite: 'lax' // 防止CSRF攻擊
      });
      
      // 重定向到前端 (帶著成功訊息和 token)
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?login=success&provider=google&token=${token}&userId=${user._id}&userName=${encodeURIComponent(user.name)}&userEmail=${encodeURIComponent(user.email)}`);
    } catch (error) {
      console.error('Google 登入處理錯誤:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?login=error&message=${encodeURIComponent('登入處理失敗')}`);
    }
  }
);

// 註冊新用戶
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // 驗證輸入...
    
    // 創建新用戶
    user = new User({
      email: normalizedEmail,
      password,
      name: name || normalizedEmail.split('@')[0]
    });
    
    await user.save();
    
    // 生成JWT，加強安全性
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret-key',
      { 
        expiresIn: '7d',
        algorithm: 'HS256'
      }
    );
    
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
    // 錯誤處理...
  }
});

// 用戶登入
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 驗證輸入...
    
    // 查找用戶
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // 驗證密碼
    const isMatch = await user.comparePassword(password);
    
    // 生成token，加強安全性
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret-key',
      { 
        expiresIn: '7d',
        algorithm: 'HS256'
      }
    );
    
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
    // 錯誤處理...
  }
});

// 獲取當前登入用戶資料
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        loginType: user.googleId ? 'google' : 'local'
      }
    });
  } catch (error) {
    // 錯誤處理...
  }
});
```

### Google OAuth 集成

#### Google 開發者控制台配置

1. 前往 Google Developer Console 創建專案
2. 啟用 Google+ API 和 OAuth 2.0
3. 配置 OAuth 同意畫面
4. 創建 OAuth 憑證
5. 設定重定向 URI:
   ```
   http://localhost:5001/api/auth-test/google/callback
   http://localhost:5001/api/auth/google/callback
   https://api.donow.futurin.tw/api/auth/google/callback
   ```

#### server.js 中初始化 Passport

```javascript
const passport = require('passport');

// 初始化 Passport
app.use(passport.initialize());

// 加載 Passport 設定
require('./config/passport');
```

## 前端實現

> **注意：** 前端實現分為兩個部分：測試面板和正式 Auth 組件。測試面板用於開發測試，而正式 Auth 組件將整合到生產環境。

### 測試面板

> 此部分僅用於開發和測試，不會在生產環境中使用

`AuthTestPanel` 組件是一個獨立的測試工具，包含了完整的註冊、登入與 Google OAuth 功能，但它設計為獨立測試組件，不適合直接整合到現有應用。

#### 關鍵功能：

```javascript
// 處理 Google 登入
const handleGoogleLogin = () => {
  // 跳轉到後端的 Google 登入路由
  window.location.href = `${API_URL}/api/auth-test/google`;
};

// 在組件加載時檢查 URL 參數，用於處理 Google 登入回調
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const loginStatus = params.get('login');
  const provider = params.get('provider');
  const token = params.get('token');
  
  if (loginStatus === 'success' && provider === 'google' && token) {
    console.log('Google 登入成功，獲取到token');
    // 保存 token 到 localStorage
    localStorage.setItem('test-token', token);
    setToken(token);
    setMessage('Google 登入成功！');
    
    // 獲取用戶信息
    fetchUserInfo();
    
    // 清除 URL 參數
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}, []);
```

### 正式 Auth 組件

正式整合到應用中的 Auth 組件由兩部分組成：`AuthContext` 和 `Auth` 模態框組件。

#### AuthContext.jsx - 認證狀態管理

```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  useEffect(() => {
    // 檢查用戶是否已登入
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.data) {
              setCurrentUser(data.data);
            }
          } else {
            // 令牌無效，清除本地存儲
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, [API_URL]);

  // 登入函數
  const login = async (email, password) => {
    // ...實現省略...
  };

  // 註冊函數
  const register = async (name, email, password) => {
    // ...實現省略...
  };

  // Google 登入
  const googleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  // 登出函數
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    googleLogin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
```

#### Auth.jsx - 登入/註冊模態框

```jsx
import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Divider,
  Alert,
  Paper,
  IconButton,
  Modal
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from './AuthContext';

const Auth = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' 或 'register'
  
  const { login, register, googleLogin, error: authError } = useAuth();

  // 表單驗證和提交處理
  // ...省略實現細節...

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="auth-modal-title"
    >
      <Paper sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 400 },
        p: 4
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography id="auth-modal-title" variant="h6" component="h2">
            {authMode === 'login' ? '登入' : '註冊'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Google 登入按鈕 */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          sx={{ 
            mb: 3, 
            bgcolor: '#4285F4', 
            '&:hover': { bgcolor: '#3367d6' }
          }}
        >
          使用 Google 帳號{authMode === 'login' ? '登入' : '註冊'}
        </Button>
        
        <Divider sx={{ mb: 3 }}>
          <Typography variant="caption">或使用本地帳號</Typography>
        </Divider>
        
        {/* 登入/註冊表單 */}
        {/* ...表單內容省略... */}
        
        {/* 切換登入/註冊模式 */}
        <Button 
          variant="text" 
          fullWidth 
          onClick={() => setAuthMode(prev => prev === 'login' ? 'register' : 'login')}
          sx={{ mt: 2 }}
        >
          {authMode === 'login' ? '還沒有帳號？註冊' : '已有帳號？登入'}
        </Button>
      </Paper>
    </Modal>
  );
};

export default Auth;
```

### 登入流程

整合後的登入流程：

1. 用戶點擊應用中的「登入」按鈕，打開 Auth 模態框
2. 用戶選擇登入方式（本地帳號或 Google）
3. 成功登入後，系統將 JWT 存儲在 localStorage 中
4. AuthContext 通過 JWT 自動獲取並維護用戶狀態
5. App.js 通過 useAuth hook 獲取用戶資訊並相應地渲染界面

### Google 登入處理

處理 Google 登入的關鍵步驟：

1. 前端：用戶點擊 Google 登入按鈕，轉到後端 OAuth 入口點
   ```javascript
   const handleGoogleLogin = () => {
     googleLogin(); // 調用 AuthContext 中的方法
   };
   ```

2. 後端：處理 OAuth 回調，生成 JWT
   ```javascript
   // 在 auth.js 路由中
   router.get('/google/callback', passport.authenticate('google', {...}), 
     async (req, res) => {
       // 生成 JWT...
       // 重定向到前端，帶著 token 和用戶信息...
     }
   );
   ```

3. 前端：在 AuthContext 中處理 URL 參數獲取 token 和用戶信息
   ```javascript
   // 在 useEffect 中獲取 URL 參數
   const token = new URLSearchParams(window.location.search).get('token');
   if (token) {
     localStorage.setItem('token', token);
     // ...其他處理...
   }
   ```

## 錯誤處理與優化

### 速率限制處理

為防止請求過多導致的 429 錯誤，實施了以下優化：

1. 使用 sessionStorage 避免重複請求
2. 為按鈕添加冷卻時間
3. 處理 429 錯誤響應

### 表單驗證

實施了客戶端和服務器端的雙重驗證：

1. 客戶端驗證
   ```javascript
   const validateEmail = (email) => {
     const regex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
     return regex.test(email);
   };

   const validatePassword = (password) => {
     return password.length >= 6;
   };
   ```

2. 服務器端驗證
   ```javascript
   if (!email) {
     return res.status(400).json({ 
       success: false, 
       message: '註冊失敗', 
       error: '電子郵件為必填項'
     });
   }
   ```

## 後續整合建議

將認證系統完全整合到生產環境需要以下步驟：

1. **適應無路由架構**:
   - 使用模態框設計替代路由導航
   - 將 AuthProvider 整合到應用的根組件

2. **與現有UI無縫整合**:
   - 遵循現有應用的設計風格
   - 保持認證組件輕量化，不干擾現有功能

3. **安全性增強**:
   - 實施 JWT 刷新機制
   - 添加請求速率限制
   - 設置安全的 Cookie 策略

4. **用戶體驗改進**:
   - 添加記住我功能
   - 增加密碼重置功能
   - 優化錯誤消息提示

5. **數據關聯**:
   - 將用戶ID關聯到任務、項目等資源
   - 實現基於用戶的數據隔離
   - 添加權限檢查中間件

6. **整合前注意事項**:
   - **不要直接修改 App.js 的渲染邏輯**，而是通過條件渲染添加功能
   - **使用模態框設計**避免與現有狀態管理衝突
   - **分階段整合**，先確保基本登入功能正常，再完善其他功能
   - **適當使用組件解耦**，避免認證邏輯影響核心功能

7. **代碼風格建議**:
   - 保持一致的命名風格
   - 完善錯誤處理
   - 添加適當註釋
   - 確保代碼可維護性 