const mongoose = require('mongoose');

/**
 * 報表視圖模型
 */
const reportViewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '視圖名稱為必填項'],
    trim: true,
    maxlength: [50, '視圖名稱不可超過50個字符']
  },
  fields: {
    type: [String],
    required: [true, '必須選擇至少一個欄位'],
    validate: {
      validator: function(fields) {
        return fields && fields.length > 0;
      },
      message: '至少需要選擇一個欄位'
    }
  },
  format: {
    type: String,
    enum: ['xlsx', 'csv'],
    default: 'xlsx'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isSystem: {
    type: Boolean,
    default: false,
    description: '系統預設視圖，不可刪除'
  },
  description: {
    type: String,
    maxlength: [200, '描述不可超過200個字符']
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

// 更新更新時間
reportViewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 確保只有一個默認視圖
reportViewSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('ReportView', reportViewSchema); 