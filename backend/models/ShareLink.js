const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shareCode: {
    type: String,
    required: true,
    unique: true
  },
  authType: {
    type: String,
    enum: ['none', 'password'],
    default: 'none'
  },
  password: {
    type: String,
    default: null
  },
  expirationDate: {
    type: Date,
    default: null
  },
  maxAccessCount: {
    type: Number,
    default: null
  },
  currentAccessCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 索引
shareLinkSchema.index({ fileId: 1 });
shareLinkSchema.index({ userId: 1 });
shareLinkSchema.index({ shareCode: 1 });
shareLinkSchema.index({ isActive: 1, expirationDate: 1 });

// 检查分享链接是否有效
shareLinkSchema.methods.isValid = function() {
  if (!this.isActive) {
    return false;
  }

  if (this.expirationDate && this.expirationDate < new Date()) {
    return false;
  }

  if (this.maxAccessCount && this.currentAccessCount >= this.maxAccessCount) {
    return false;
  }

  return true;
};

// 增加访问计数
shareLinkSchema.methods.incrementAccessCount = async function() {
  this.currentAccessCount += 1;
  return await this.save();
};

module.exports = mongoose.model('ShareLink', shareLinkSchema);
