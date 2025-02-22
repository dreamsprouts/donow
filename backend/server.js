const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const tasksRouter = require('./routes/tasks');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/timer', require('./routes/timer'));
app.use('/api/tasks', tasksRouter);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 優雅關閉處理
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('正在關閉服務器...');
  server.close(() => {
    console.log('服務器已關閉');
    mongoose.connection.close(false, () => {
      console.log('MongoDB 連接已關閉');
      process.exit(0);
    });
  });
}