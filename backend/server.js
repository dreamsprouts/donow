const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const tasksRouter = require('./routes/tasks');
const projectsRouter = require('./routes/projects');
const reportsRouter = require('./routes/reports');
const https = require('https');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const passport = require('passport');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://donow.futurin.tw', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: false,  // 如果前端需要載入外部資源，可以關閉
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser()); // 添加 cookie-parser 中間件

// 初始化 Passport
app.use(passport.initialize());
require('./config/passport'); // 載入 Passport 配置

// 在其他 middleware 之前加入
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 500, // 調整為 500 次
  message: {
    message: '請求太頻繁，請稍後再試',
    waitTime: '15分鐘'
  }
});

app.use('/api/', limiter);  // 只限制 API 路由

// 請求日誌中間件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Connect to MongoDB
connectDB();

// 定時喚醒機制 - 已停用，改用外部 ping 服務
/*
const PING_INTERVAL = 14 * 60 * 1000; // 14分鐘
const pingServer = () => {
  const url = process.env.NODE_ENV === 'production' 
    ? 'https://donow-backend.onrender.com/api/health'
    : `http://localhost:${process.env.PORT || 5001}/api/health`;

  https.get(url, (resp) => {
    if (resp.statusCode === 200) {
      console.log(`${new Date().toISOString()} 服務保持運行中`);
    }
  }).on('error', (err) => {
    console.error(`${new Date().toISOString()} 喚醒請求失敗:`, err.message);
  });
};

if (process.env.NODE_ENV === 'production') {
  setInterval(pingServer, PING_INTERVAL);
}
*/

// Routes
app.use('/api/timer', require('./routes/timer'));
app.use('/api/tasks', tasksRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/reports', reportsRouter);
// 添加認證路由
app.use('/api/auth', require('./routes/auth'));

// 處理 /export 路徑轉發到 /api/reports/export
app.get('/export', (req, res) => {
  console.log(`${new Date().toISOString()} 捕獲 /export 路徑請求，準備轉發`);
  console.log('原始URL:', req.url); // 完整的 URL 包含查詢參數
  
  // 將請求轉發到 /api/reports/export 路徑
  const fullUrl = `/api/reports/export${req.url.replace(/^\/export/, '')}`;
  console.log('轉發到:', fullUrl);
  
  res.redirect(fullUrl);
});

// 加入根路徑處理
app.get('/', (req, res) => {
  res.json({ 
    message: 'DoNow API is running',
    version: '0.4.1'
  });
});

// 加入 API 路徑說明
app.get('/api', (req, res) => {
  res.json({
    message: 'DoNow API 文件',
    endpoints: {
      tasks: '/api/tasks',
      timer: '/api/timer',
      projects: '/api/projects',
      reports: '/api/reports',
      health: '/api/health'
    },
    version: '0.4.1'
  });
});

// 加入 mongoose 連線狀態檢查
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: "已斷開",
      1: "已連接",
      2: "正在連接",
      3: "正在斷開",
    };
    
    // 加入集合數量檢查
    const collections = await mongoose.connection.db.listCollections().toArray();
    const tasksCount = await mongoose.connection.db.collection('tasks').countDocuments();
    const actionsCount = await mongoose.connection.db.collection('actions').countDocuments();
    
    res.json({
      server: 'running',
      database: dbStatus[dbState],
      collections: collections.map(c => c.name),
      counts: {
        tasks: tasksCount,
        actions: actionsCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 在所有路由之後，錯誤處理中間件之前加入
app.use((req, res) => {
  console.log(`${new Date().toISOString()} 404 錯誤: ${req.method} ${req.path}`);
  res.status(404).json({
    message: '找不到該路徑',
    path: req.path,
    method: req.method
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error(`${new Date().toISOString()} 錯誤:`, err);
  res.status(500).json({
    message: '伺服器錯誤',
    error: process.env.NODE_ENV === 'development' ? err.message : '請稍後再試'
  });
});

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`${new Date().toISOString()} 伺服器啟動於 port ${PORT}`);
});

// 優雅關閉處理
const gracefulShutdown = async () => {
  console.log(`${new Date().toISOString()} 正在關閉服務器...`);
  
  try {
    await new Promise((resolve) => {
      server.close(() => {
        console.log(`${new Date().toISOString()} HTTP 伺服器已關閉`);
        resolve();
      });
    });
    
    await mongoose.connection.close();
    console.log(`${new Date().toISOString()} MongoDB 連接已關閉`);
    process.exit(0);
  } catch (err) {
    console.error(`${new Date().toISOString()} 關閉時發生錯誤:`, err);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 未捕獲的 Promise 異常處理
process.on('unhandledRejection', (reason, promise) => {
  console.error(`${new Date().toISOString()} 未處理的 Promise 異常:`, reason);
});

process.on('uncaughtException', (error) => {
  console.error(`${new Date().toISOString()} 未捕獲的異常:`, error);
  gracefulShutdown();
});