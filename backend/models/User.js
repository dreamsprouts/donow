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
    select: true // 確保密碼在預設查詢時可以被選擇用於比較
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
      // 如果沒提供名稱，使用郵箱前綴
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

// 清除現有索引並重建
UserSchema.pre('save', async function() {
  console.log(`保存用戶前進行驗證: ${this.email}`);
});

// 密碼加密中間件
UserSchema.pre('save', async function(next) {
  console.log(`檢查密碼是否需要加密: ${this._id}`);
  // 僅在密碼被修改時才重新加密
  if (!this.isModified('password')) {
    console.log('密碼未修改，跳過加密');
    return next();
  }
  
  try {
    // 生成鹽並雜湊密碼
    console.log('密碼已修改，進行加密');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date();
    console.log('密碼加密完成');
    next();
  } catch (error) {
    console.error('密碼加密錯誤:', error);
    next(error);
  }
});

// 驗證密碼的方法
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log(`比較密碼: ${this._id}`);
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('密碼比較失敗:', error);
    throw new Error('密碼比較失敗');
  }
};

// 更新登入時間的方法
UserSchema.methods.updateLoginTime = async function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// 檢查用戶是否使用 Google 登入
UserSchema.methods.isGoogleUser = function() {
  return !!this.googleId;
};

// 確保在模型建立之前索引已經就緒
const User = mongoose.model('User', UserSchema);

// 確保索引正確建立
const createIndexes = async () => {
  try {
    console.log('確保 User 模型索引正確建立');
    await User.collection.dropIndexes();
    console.log('已清除原有索引');
    await User.ensureIndexes();
    console.log('已重建索引');
  } catch (error) {
    console.error('索引重建錯誤:', error);
  }
};

// 調用索引重建
createIndexes();

module.exports = User; 