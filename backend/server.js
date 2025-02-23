const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const tasksRouter = require('./routes/tasks');
const https = require('https');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// 定時喚醒機制
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

// Routes
app.use('/api/timer', require('./routes/timer'));
app.use('/api/tasks', tasksRouter);

// 加入根路徑處理
app.get('/', (req, res) => {
  res.json({ 
    message: 'DoNow API is running',
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
  server.close(async () => {
    console.log(`${new Date().toISOString()} HTTP 伺服器已關閉`);
    try {
      await mongoose.connection.close();
      console.log(`${new Date().toISOString()} MongoDB 連接已關閉`);
      process.exit(0);
    } catch (err) {
      console.error(`${new Date().toISOString()} 關閉 MongoDB 連接時發生錯誤:`, err);
      process.exit(1);
    }
  });

  // 如果 10 秒內無法正常關閉，強制退出
  setTimeout(() => {
    console.error(`${new Date().toISOString()} 無法在時限內正常關閉，強制退出`);
    process.exit(1);
  }, 10000);
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