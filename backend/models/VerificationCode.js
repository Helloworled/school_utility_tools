const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  code: {
    type: String,
    required: [true, 'Verification code is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['login', 'password_reset'],
    required: [true, 'Verification code type is required']
  },
  expires_at: {
    type: Date,
    required: [true, 'Expiration date is required']
  }
}, {
  timestamps: true
});

// Create indexes for frequently queried fields
verificationCodeSchema.index({ email: 1 });
verificationCodeSchema.index({ code: 1 });
verificationCodeSchema.index({ expires_at: 1 });

// Method to check if verification code is expired
verificationCodeSchema.methods.isExpired = function() {
  return new Date() > this.expires_at;
};

const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);

module.exports = VerificationCode;
