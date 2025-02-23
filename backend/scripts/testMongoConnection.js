const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = "mongodb+srv://morrisdreamsprouts:5q6xScpgmZoofiqM@cluster0.pepcr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  try {
    console.log('正在嘗試連接到 MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Atlas 連接成功！');
    
    // 測試資料庫操作
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('資料庫中的集合：', collections.map(c => c.name));
    
  } catch (error) {
    console.error('MongoDB Atlas 連接錯誤：', error);
  } finally {
    await mongoose.disconnect();
    console.log('連接已關閉');
  }
}

testConnection(); 