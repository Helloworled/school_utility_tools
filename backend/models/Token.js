const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true
  },
  type: {
    type: String,
    enum: ['access', 'refresh', 'reset'],
    required: [true, 'Token type is required']
  },
  expires_at: {
    type: Date,
    required: [true, 'Expiration date is required']
  }
}, {
  timestamps: true
});

// Create indexes for frequently queried fields
tokenSchema.index({ user_id: 1 });
tokenSchema.index({ token: 1 });
tokenSchema.index({ expires_at: 1 });

// Method to check if token is expired
tokenSchema.methods.isExpired = function() {
  return new Date() > this.expires_at;
};

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
