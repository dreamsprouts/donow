const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: '新任務'
  },
  color: {
    type: String,
    default: function() {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', 
                     '#D4A5A5', '#9B6B70', '#E9967A', '#66CDAA', '#DEB887'];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Task', taskSchema); 