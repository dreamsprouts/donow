const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    // 判斷是本地還是雲端連線
    const isLocalConnection = uri.includes('localhost') || uri.includes('127.0.0.1');
    console.log('MongoDB 連線成功');
    console.log(`連線類型: ${isLocalConnection ? '本地端' : '雲端'}`);
    console.log(`資料庫位置: ${uri}`);
    
  } catch (error) {
    console.error('MongoDB 連線錯誤:', error);
    // 不要直接結束程序，讓服務繼續運行
    // process.exit(1);
  }
};

module.exports = connectDB;