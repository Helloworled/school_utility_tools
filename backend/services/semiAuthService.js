const SemiAuth = require('../models/SemiAuth');
const User = require('../models/User');
const notificationService = require('./notificationService');
const crypto = require('crypto');

// Generate cryptographically secure verification code
const generateVerificationCode = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  const randomValues = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[randomValues[i] % chars.length];
  }
  return code;
};

// Generate session token with sufficient entropy
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate unique session ID
const generateSessionId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Check rate limit
const checkRateLimit = (username) => {
  const lastSent = rateLimitStore.get(username);
  if (lastSent && (Date.now() - lastSent) < 5000) {
    return false; // Rate limit exceeded
  }
  rateLimitStore.set(username, Date.now());
  return true;
};

// Create semi-auth request
const createSemiAuthRequest = async (username) => {
  try {
    // Check if user exists
    const user = await User.findOne({ user_name: username });
    if (!user) {
      throw new Error('User not found');
    }

    // Check rate limit
    if (!checkRateLimit(username)) {
      throw new Error('Please wait before requesting another verification code');
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Generate unique session ID
    const sessionId = generateSessionId();

    // Create semi-auth record
    const semiAuth = new SemiAuth({
      username,
      verificationCode,
      sessionId,
      expiresAt: new Date(Date.now() + 60 * 1000) // 1 minute
    });

    await semiAuth.save();

    // Send notification to authenticated user
    try {
      await notificationService.createNotification(
        user._id,
        'Semi-authentication Request',
        `Verification code: ${verificationCode}. Valid for 1 minute.`,
        'info',
        semiAuth._id,
        'semi_auth'
      );
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // 不中断流程，因为验证码已经保存，用户可能通过其他方式获取
    }

    return semiAuth;
  } catch (error) {
    console.error('Error creating semi-auth request:', error);
    throw error;
  }
};

// Verify code and activate session
const verifyCodeAndActivate = async (username, code, sessionId) => {
  try {
    // 查找待验证的半认证记录
    const semiAuth = await SemiAuth.findOne({
      username,
      sessionId,
      status: 'pending'
    });

    if (!semiAuth) {
      throw new Error('Invalid or expired verification request');
    }

    // 检查尝试次数
    if (semiAuth.attemptCount >= semiAuth.maxAttempts) {
      semiAuth.status = 'expired';
      await semiAuth.save();
      throw new Error('Maximum verification attempts exceeded. Please request a new code.');
    }

    // 验证验证码
    if (semiAuth.verificationCode !== code) {
      semiAuth.attemptCount += 1;
      await semiAuth.save();

      const remainingAttempts = semiAuth.maxAttempts - semiAuth.attemptCount;
      throw new Error(`Invalid verification code. ${remainingAttempts} attempts remaining.`);
    }

    // 检查是否过期
    if (semiAuth.isExpired()) {
      semiAuth.status = 'expired';
      await semiAuth.save();
      throw new Error('Verification code has expired');
    }

    // 生成会话令牌
    const sessionToken = generateSessionToken();

    // 更新半认证记录
    semiAuth.sessionToken = sessionToken;
    semiAuth.status = 'active';
    semiAuth.lastPing = Date.now();
    await semiAuth.save();

    return { 
      sessionToken, 
      expiresAt: semiAuth.expiresAt,
      sessionId: semiAuth.sessionId
    };
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
};

// Update ping to keep session alive
const updatePing = async (sessionToken, sessionId) => {
  try {
    const semiAuth = await SemiAuth.findOne({
      sessionToken,
      sessionId,
      status: 'active'
    });

    if (!semiAuth) {
      throw new Error('Invalid session token or session ID');
    }

    semiAuth.lastPing = Date.now();
    await semiAuth.save();

    return semiAuth;
  } catch (error) {
    console.error('Error updating ping:', error);
    throw error;
  }
};

// Validate session
const validateSession = async (sessionToken, sessionId) => {
  try {
    const semiAuth = await SemiAuth.findOne({
      sessionToken,
      sessionId,
      status: 'active'
    });

    if (!semiAuth) {
      return null;
    }

    return semiAuth;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
};

// Invalidate session (called when WebSocket disconnects)
const invalidateSession = async (sessionToken, sessionId) => {
  try {
    const semiAuth = await SemiAuth.findOne({
      sessionToken,
      sessionId,
      status: 'active'
    });

    if (!semiAuth) {
      return null;
    }

    semiAuth.status = 'expired';
    await semiAuth.save();

    console.log(`[Semi-auth] Session invalidated for user ${semiAuth.username}`);
    return semiAuth;
  } catch (error) {
    console.error('Error invalidating session:', error);
    throw error;
  }
};

// Clean up expired sessions
const cleanupExpiredSessions = async () => {
  try {
    const result = await SemiAuth.updateMany(
      { expiresAt: { $lt: new Date() }, status: { $ne: 'expired' } },
      { status: 'expired' }
    );
    console.log(`[${new Date().toISOString()}] Cleaned up ${result.modifiedCount} expired semi-auth sessions`);
    return result.modifiedCount;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
};

// Start cleanup scheduler (runs every 5 minutes)
let cleanupInterval = null;
const startCleanupScheduler = () => {
  if (cleanupInterval) {
    console.warn('Cleanup scheduler already running');
    return;
  }

  // 立即执行一次清理
  cleanupExpiredSessions();

  // 每5分钟执行一次清理
  cleanupInterval = setInterval(() => {
    cleanupExpiredSessions();
  }, 5 * 60 * 1000);

  console.log('Semi-auth cleanup scheduler started (runs every 5 minutes)');
};

// Stop cleanup scheduler
const stopCleanupScheduler = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('Semi-auth cleanup scheduler stopped');
  }
};

module.exports = {
  createSemiAuthRequest,
  verifyCodeAndActivate,
  updatePing,
  validateSession,
  invalidateSession,
  cleanupExpiredSessions,
  startCleanupScheduler,
  stopCleanupScheduler
};
