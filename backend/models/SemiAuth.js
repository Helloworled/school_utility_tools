const mongoose = require('mongoose');

const semiAuthSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  verificationCode: {
    type: String,
    required: true
  },
  sessionToken: {
    type: String,
    default: null
  },
  lastPing: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'expired'],
    default: 'pending'
  },
  // 验证码尝试次数
  attemptCount: {
    type: Number,
    default: 0
  },
  // 最大尝试次数
  maxAttempts: {
    type: Number,
    default: 3
  },
  // 会话ID，用于管理并发会话
  sessionId: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
semiAuthSchema.index({ username: 1 });
semiAuthSchema.index({ sessionToken: 1 });
semiAuthSchema.index({ expiresAt: 1 });
semiAuthSchema.index({ sessionId: 1 });

// Method to check if session is expired
// Semi-auth tokens do not expire by design - they only become invalid when WebSocket ping is disconnected
semiAuthSchema.methods.isExpired = function() {
  return false;
};

const SemiAuth = mongoose.model('SemiAuth', semiAuthSchema);
module.exports = SemiAuth;
