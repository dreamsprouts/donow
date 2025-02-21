const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // 不要直接結束程序，讓服務繼續運行
    // process.exit(1);
  }
};

module.exports = connectDB;