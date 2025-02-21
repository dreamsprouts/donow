const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: '無效的日期格式'
    }
  },
  endTime: {
    type: Date
  },
  note: {
    type: String,
    default: '專注'
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Action', actionSchema);