# Semi-authentication System Implementation Plan

## Purpose

This system allows unauthenticated users to access restricted resources (such as public files) with the consent and presence of an authenticated user. The verification code is sent to the authenticated user, not the person trying to access the resource.

## General

- Use WebSocket (via existing Socket.io implementation) to keep the connection alive
- Session timeout: 60 seconds of inactivity (connection not alive, not user no action) will invalidate the session token
- Verification code validity: 1 minute
- Verification code format: 6 characters (digits and uppercase letters)
- Rate limiting: Verification codes can only be sent every 5 seconds (api restriction, the frontend page restricts to 30 seconds(disable the"send"button for 30 seconds))

## Login Flow

1. Unauthenticated user inputs a username (must be an existing user)
2. System sends a timed verification code to the authenticated user via the notification system
3. Authenticated user provides the verification code to the unauthenticated user
4. Unauthenticated user inputs the verification code
5. System validates the code and generates a temporary session token
6. WebSocket connection is established to keep the session alive

## Tech Detail:

### Backend Components

#### 1. SemiAuth Model

Location: `backend/models/SemiAuth.js`

```javascript
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
  // 新增：验证码尝试次数
  attemptCount: {
    type: Number,
    default: 0
  },
  // 新增：最大尝试次数
  maxAttempts: {
    type: Number,
    default: 3
  },
  // 新增：会话ID，用于管理并发会话
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

// Method to check if session is expired
semiAuthSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

const SemiAuth = mongoose.model('SemiAuth', semiAuthSchema);
module.exports = SemiAuth;
```

#### 2. SemiAuth Service

Location: `backend/services/semiAuthService.js`

```javascript
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

    if (semiAuth.isExpired()) {
      semiAuth.status = 'expired';
      await semiAuth.save();
      throw new Error('Session has expired');
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

    if (!semiAuth || semiAuth.isExpired()) {
      return null;
    }

    return semiAuth;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
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
  cleanupExpiredSessions,
  startCleanupScheduler,
  stopCleanupScheduler
};
```

#### 3. SemiAuth Routes

Location: `backend/routes/semiAuthRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const semiAuthService = require('../services/semiAuthService');

// Request verification code
router.post('/request', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const semiAuth = await semiAuthService.createSemiAuthRequest(username);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to user',
      data: {
        requestId: semiAuth._id,
        sessionId: semiAuth.sessionId,
        expiresAt: semiAuth.expiresAt
      }
    });
  } catch (error) {
    console.error('[Semi-auth] Request error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to request verification code'
    });
  }
});

// Verify code and activate session
router.post('/verify', async (req, res) => {
  try {
    const { username, code, sessionId } = req.body;

    if (!username || !code || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Username, verification code and session ID are required'
      });
    }

    const result = await semiAuthService.verifyCodeAndActivate(username, code, sessionId);

    res.status(200).json({
      success: true,
      message: 'Session activated successfully',
      data: result
    });
  } catch (error) {
    console.error('[Semi-auth] Verify error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify code'
    });
  }
});

// Ping to keep session alive
router.post('/ping', async (req, res) => {
  try {
    const { sessionToken, sessionId } = req.body;

    if (!sessionToken || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session token and session ID are required'
      });
    }

    const semiAuth = await semiAuthService.updatePing(sessionToken, sessionId);

    res.status(200).json({
      success: true,
      message: 'Ping updated',
      data: {
        expiresAt: semiAuth.expiresAt,
        lastPing: semiAuth.lastPing
      }
    });
  } catch (error) {
    console.error('[Semi-auth] Ping error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(401).json({
      success: false,
      message: error.message || 'Failed to update ping'
    });
  }
});

module.exports = router;
```

#### 4. SemiAuth Middleware

Location: `backend/middleware/semiAuth.js`

```javascript
const semiAuthService = require('../services/semiAuthService');

// Authenticate with semi-auth token
const authenticateSemiAuth = async (req, res, next) => {
  try {
    const sessionToken = req.headers['x-semi-auth-token'];
    const sessionId = req.headers['x-semi-auth-session-id'];

    if (!sessionToken || !sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Semi-auth token and session ID are required'
      });
    }

    const semiAuth = await semiAuthService.validateSession(sessionToken, sessionId);

    if (!semiAuth) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired semi-auth session'
      });
    }

    req.semiAuth = semiAuth;
    next();
  } catch (error) {
    console.error('[Semi-auth] Middleware error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(401).json({
      success: false,
      message: 'Semi-auth authentication failed',
      error: error.message
    });
  }
};

module.exports = {
  authenticateSemiAuth
};
```

#### 5. WebSocket Integration

Update `backend/websocket.js` to handle semi-auth sessions:

```javascript
// Semi-auth session management
const semiAuthSessions = new Map(); // Store socket ID to session mapping

// Handle semi-auth connection
socket.on('semi-auth-connect', ({ sessionToken, sessionId }) => {
  try {
    // Validate session
    semiAuthService.validateSession(sessionToken, sessionId)
      .then((semiAuth) => {
        if (!semiAuth) {
          socket.emit('semi-auth-connect-response', {
            success: false,
            message: 'Invalid or expired session'
          });
          return;
        }

        // Store session mapping
        semiAuthSessions.set(socket.id, {
          sessionToken,
          sessionId,
          username: semiAuth.username
        });

        // Join user-specific room
        socket.join(`semi-auth-${sessionId}`);

        socket.emit('semi-auth-connect-response', {
          success: true,
          message: 'Connected successfully'
        });

        console.log(`[Semi-auth] Socket ${socket.id} connected for user ${semiAuth.username}`);
      })
      .catch((error) => {
        console.error('[Semi-auth] Connection error:', error);
        socket.emit('semi-auth-connect-response', {
          success: false,
          message: error.message
        });
      });
  } catch (error) {
    console.error('[Semi-auth] Connection error:', error);
    socket.emit('semi-auth-connect-response', {
      success: false,
      message: 'Connection failed'
    });
  }
});

// Handle semi-auth ping
socket.on('semi-auth-ping', (data) => {
  const { sessionToken, sessionId } = data;

  if (!sessionToken || !sessionId) {
    socket.emit('semi-auth-ping-response', {
      success: false,
      message: 'Session token and session ID are required'
    });
    return;
  }

  // Update ping for semi-auth session
  semiAuthService.updatePing(sessionToken, sessionId)
    .then((semiAuth) => {
      socket.emit('semi-auth-ping-response', {
        success: true,
        data: {
          expiresAt: semiAuth.expiresAt,
          lastPing: semiAuth.lastPing
        }
      });
    })
    .catch((error) => {
      console.error('[Semi-auth] Ping error:', error);
      socket.emit('semi-auth-ping-response', {
        success: false,
        message: error.message
      });

      // If session is invalid, disconnect
      if (error.message.includes('expired') || error.message.includes('Invalid')) {
        socket.emit('semi-auth-disconnect', {
          reason: 'Session expired or invalid'
        });
        semiAuthSessions.delete(socket.id);
        socket.leave(`semi-auth-${sessionId}`);
      }
    });
});

// Handle semi-auth disconnect
socket.on('semi-auth-disconnect', () => {
  const sessionData = semiAuthSessions.get(socket.id);
  if (sessionData) {
    console.log(`[Semi-auth] Socket ${socket.id} disconnected for user ${sessionData.username}`);
    socket.leave(`semi-auth-${sessionData.sessionId}`);
    semiAuthSessions.delete(socket.id);
  }
});

// Clean up on socket disconnect
socket.on('disconnect', () => {
  const sessionData = semiAuthSessions.get(socket.id);
  if (sessionData) {
    console.log(`[Semi-auth] Socket ${socket.id} disconnected for user ${sessionData.username}`);
    socket.leave(`semi-auth-${sessionData.sessionId}`);
    semiAuthSessions.delete(socket.id);
  }
});
```

#### 6. Server Configuration

Update `backend/server.js` to include semi-auth routes and start cleanup scheduler:

```javascript
const semiAuthRoutes = require('./routes/semiAuthRoutes');
const semiAuthService = require('./services/semiAuthService');

// Add to routes section
app.use('/api/semi-auth', semiAuthRoutes);

// Start semi-auth cleanup scheduler
semiAuthService.startCleanupScheduler();

// Add graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping cleanup scheduler...');
  semiAuthService.stopCleanupScheduler();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping cleanup scheduler...');
  semiAuthService.stopCleanupScheduler();
  process.exit(0);
});
```

### Frontend Components

#### 1. SemiAuth API

Location: `src/api/semiAuth.js`

```javascript
import api from './axios';

export default {
  // Request verification code
  requestVerificationCode(username) {
    return api.post('/api/semi-auth/request', { username });
  },

  // Verify code and activate session
  verifyCode(username, code, sessionId) {
    return api.post('/api/semi-auth/verify', { username, code, sessionId });
  },

  // Ping to keep session alive
  ping(sessionToken, sessionId) {
    return api.post('/api/semi-auth/ping', { sessionToken, sessionId });
  }
};
```

#### 2. SemiAuth Store (Pinia)

Location: `src/stores/semiAuth.js`

```javascript
import { defineStore } from 'pinia';
import semiAuthApi from '../api/semiAuth';

export const useSemiAuthStore = defineStore('semiAuth', {
  state: () => ({
    username: '',
    sessionToken: null,
    sessionId: null,
    expiresAt: null,
    lastPing: null,
    loading: false,
    error: null,
    pingInterval: null,
    lastRequestTime: null,  // 新增：记录上次请求验证码的时间
    requestCooldown: 15000,  // 新增：15秒冷却时间，30秒限制在页面上进行
    socketConnected: false   // 新增：WebSocket 连接状态
  }),

  getters: {
    isAuthenticated: (state) => !!state.sessionToken && new Date() < new Date(state.expiresAt),
    isExpired: (state) => state.expiresAt && new Date() >= new Date(state.expiresAt)
  },

  actions: {
    async requestVerificationCode(username) {
      // 检查冷却时间
      if (this.lastRequestTime && (Date.now() - this.lastRequestTime) < this.requestCooldown) {
        const remainingTime = Math.ceil((this.requestCooldown - (Date.now() - this.lastRequestTime)) / 1000);
        this.error = `Please wait ${remainingTime} seconds before requesting another code`;
        throw new Error(this.error);
      }
      this.loading = true;
      this.error = null;
      try {
        const response = await semiAuthApi.requestVerificationCode(username);
        this.username = username;
        this.sessionId = response.data.data.sessionId;
        this.expiresAt = response.data.data.expiresAt;
        this.lastRequestTime = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to request verification code';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async verifyCode(code) {
      this.loading = true;
      this.error = null;
      try {
        const response = await semiAuthApi.verifyCode(this.username, code, this.sessionId);
        this.sessionToken = response.data.data.sessionToken;
        this.expiresAt = response.data.data.expiresAt;
        this.lastPing = new Date();
        await this.connectWebSocket();
        this.startPingInterval();
        this.saveToStorage();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to verify code';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async connectWebSocket() {
      if (this.socketConnected || !this.sessionToken || !this.sessionId) {
        return;
      }

      try {
        const socket = useWebSocket();

        // 监听连接响应
        socket.on('semi-auth-connect-response', (response) => {
          if (response.success) {
            this.socketConnected = true;
            console.log('[Semi-auth] WebSocket connected successfully');
          } else {
            console.error('[Semi-auth] WebSocket connection failed:', response.message);
            this.error = response.message;
          }
        });

        // 监听断开连接
        socket.on('semi-auth-disconnect', (data) => {
          console.log('[Semi-auth] WebSocket disconnected:', data.reason);
          this.socketConnected = false;
          this.logout();
        });

        // 发送连接请求
        socket.emit('semi-auth-connect', {
          sessionToken: this.sessionToken,
          sessionId: this.sessionId
        });
      } catch (error) {
        console.error('[Semi-auth] WebSocket connection error:', error);
        this.error = 'Failed to establish WebSocket connection';
      }
    },

    disconnectWebSocket() {
      const socket = useWebSocket();
      if (this.socketConnected) {
        socket.emit('semi-auth-disconnect');
        this.socketConnected = false;
      }
    },

    async ping() {
      if (!this.sessionToken || !this.sessionId) return;

      try {
        const response = await semiAuthApi.ping(this.sessionToken, this.sessionId);
        this.expiresAt = response.data.data.expiresAt;
        this.lastPing = new Date();
        this.saveToStorage();
      } catch (error) {
        console.error('[Semi-auth] Ping failed:', error);
        this.logout();
      }
    },

    startPingInterval(intervalMs = 10000) {
      this.stopPingInterval();
      this.pingInterval = setInterval(() => {
        this.ping();
      }, intervalMs);
    },

    stopPingInterval() {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
    },

    logout() {
      this.stopPingInterval();
      this.disconnectWebSocket();
      this.sessionToken = null;
      this.sessionId = null;
      this.expiresAt = null;
      this.lastPing = null;
      this.username = '';
      this.socketConnected = false;
      this.clearStorage();
    },

    initializeFromStorage() {
      const sessionToken = localStorage.getItem('semiAuthToken');
      const sessionId = localStorage.getItem('semiAuthSessionId');
      const expiresAt = localStorage.getItem('semiAuthExpiresAt');
      const username = localStorage.getItem('semiAuthUsername');

      if (sessionToken && sessionId && expiresAt && username) {
        this.sessionToken = sessionToken;
        this.sessionId = sessionId;
        this.expiresAt = expiresAt;
        this.username = username;

        if (this.isAuthenticated) {
          this.connectWebSocket().then(() => {
            if (this.socketConnected) {
              this.startPingInterval();
            } else {
              this.logout();
            }
          });
        } else {
          this.logout();
        }
      }
    },

    saveToStorage() {
      if (this.sessionToken) {
        localStorage.setItem('semiAuthToken', this.sessionToken);
        localStorage.setItem('semiAuthSessionId', this.sessionId);
        localStorage.setItem('semiAuthExpiresAt', this.expiresAt);
        localStorage.setItem('semiAuthUsername', this.username);
      }
    },

    clearStorage() {
      localStorage.removeItem('semiAuthToken');
      localStorage.removeItem('semiAuthSessionId');
      localStorage.removeItem('semiAuthExpiresAt');
      localStorage.removeItem('semiAuthUsername');
    }
  }
});
```

#### 3. SemiAuth Login Component

Location: `src/components/SemiAuthLogin.vue`

```vue
<template>
  <div class="semi-auth-login">
    <h2>Semi-authentication</h2>
    <p>Access restricted resources with user consent</p>

    <div v-if="!requestSent" class="step-1">
      <div class="form-group">
        <label for="username">Username:</label>
        <input
          id="username"
          v-model="username"
          type="text"
          placeholder="Enter username"
          @keyup.enter="requestCode"
        />
      </div>
      <button
        @click="requestCode"
        :disabled="loading || !username || cooldownRemaining > 0"
        class="btn-primary"
      >
        {{ loading ? 'Sending...' : cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Request Verification Code' }}
      </button>
    </div>

    <div v-else class="step-2">
      <p class="info">
        A verification code has been sent to {{ username }}.
        Please ask them to provide it to you.
      </p>
      <div class="form-group">
        <label for="code">Verification Code:</label>
        <input
          id="code"
          v-model="code"
          type="text"
          placeholder="Enter 6-character code"
          maxlength="6"
          @keyup.enter="verify"
        />
      </div>
      <button
        @click="verify"
        :disabled="loading || !code"
        class="btn-primary"
      >
        {{ loading ? 'Verifying...' : 'Verify' }}
      </button>
      <button
        @click="reset"
        class="btn-secondary"
      >
        Cancel
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue';
import { useSemiAuthStore } from '../stores/semiAuth';

export default {
  name: 'SemiAuthLogin',
  setup(props, { emit }) {
    const semiAuthStore = useSemiAuthStore();
    const username = ref('');
    const code = ref('');
    const requestSent = ref(false);
    const loading = ref(false);
    const error = ref(null);
    const cooldownRemaining = ref(0);  // 新增：冷却倒计时
    let cooldownInterval = null;  // 新增：冷却计时器

    const requestCode = async () => {
      if (!username.value) {
        error.value = 'Please enter a username';
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        await semiAuthStore.requestVerificationCode(username.value);
        requestSent.value = true;
        // 启动冷却倒计时
        startCooldown();  // 新增
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to request verification code';
      } finally {
        loading.value = false;
      }
    };
    // 新增：启动冷却倒计时
    const startCooldown = () => {
      cooldownRemaining.value = 30;  // 30秒冷却
      cooldownInterval = setInterval(() => {
        cooldownRemaining.value--;
        if (cooldownRemaining.value <= 0) {
          clearInterval(cooldownInterval);
          cooldownInterval = null;
        }
      }, 1000);
    };

    // 新增：清理计时器
    onUnmounted(() => {
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
    });

    const verify = async () => {
      if (!code.value) {
        error.value = 'Please enter the verification code';
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        await semiAuthStore.verifyCode(code.value);
        // Emit event to notify parent component
        emit('authenticated');
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to verify code';
      } finally {
        loading.value = false;
      }
    };

    const reset = () => {
      username.value = '';
      code.value = '';
      requestSent.value = false;
      error.value = null;
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
    };

    return {
      username,
      code,
      requestSent,
      loading,
      error,
      cooldownRemaining,
      requestCode,
      verify,
      reset
    };
  },
  emits: ['authenticated']
};
</script>

<style scoped>
.semi-auth-login {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #f44336;
  margin-top: 15px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}

.info {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #e3f2fd;
  border-radius: 4px;
}
</style>
```

#### 4. SemiAuth Status Component

Location: `src/components/SemiAuthStatus.vue`

```vue
<template>
  <div class="semi-auth-status">
    <div v-if="semiAuthStore.isAuthenticated" class="authenticated">
      <span class="status-indicator"></span>
      <span>Semi-authenticated as {{ semiAuthStore.username }}</span>
      <span class="expires-in">Expires in: {{ expiresIn }}</span>
      <button @click="logout" class="logout-btn">Logout</button>
    </div>
    <div v-else class="not-authenticated">
      <span class="status-indicator"></span>
      <span>Not semi-authenticated</span>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useSemiAuthStore } from '../stores/semiAuth';

export default {
  name: 'SemiAuthStatus',
  setup() {
    const semiAuthStore = useSemiAuthStore();
    const isComponentMounted = ref(true);

    onMounted(() => {
      isComponentMounted.value = true;
      semiAuthStore.initializeFromStorage();
    });

    onUnmounted(() => {
      isComponentMounted.value = false;
      // 不停止 ping interval，因为它应该在整个应用级别管理
      // 只有在用户明确登出或会话过期时才停止
    });

    const expiresIn = computed(() => {
      if (!semiAuthStore.expiresAt) return 'N/A';

      const now = new Date();
      const expires = new Date(semiAuthStore.expiresAt);
      const diff = Math.max(0, expires - now);

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      return `${minutes}m ${seconds}s`;
    });

    const logout = () => {
      semiAuthStore.logout();
    };

    return {
      semiAuthStore,
      expiresIn,
      logout
    };
  }
};
</script>

<style scoped>
.semi-auth-status {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.authenticated {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.not-authenticated {
  background-color: #f5f5f5;
  color: #757575;
}

.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.authenticated .status-indicator {
  background-color: #4CAF50;
}

.not-authenticated .status-indicator {
  background-color: #9e9e9e;
}

.expires-in {
  margin-left: 10px;
  font-weight: bold;
}

.logout-btn {
  margin-left: 10px;
  padding: 5px 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

## Implementation Steps

1. **Create the SemiAuth model** (`backend/models/SemiAuth.js`)
   - 添加验证码尝试次数限制
   - 添加会话ID用于并发会话管理
   - 确保所有必要的索引都已创建

2. **Implement the semiAuthService** (`backend/services/semiAuthService.js`)
   - 使用密码学安全的随机数生成验证码
   - 实现验证码尝试次数限制
   - 实现会话ID管理
   - 添加详细的错误处理和日志记录
   - 实现清理调度器

3. **Create semiAuthRoutes** (`backend/routes/semiAuthRoutes.js`)
   - 实现验证码请求端点
   - 实现验证码验证端点
   - 实现 ping 端点
   - 添加详细的错误处理和日志记录

4. **Implement semiAuth middleware** (`backend/middleware/semiAuth.js`)
   - 验证会话令牌和会话ID
   - 添加详细的错误处理和日志记录

5. **Update WebSocket handler** (`backend/websocket.js`)
   - 实现半认证连接处理
   - 实现 ping 机制
   - 实现断开连接处理
   - 添加会话映射管理

6. **Update server.js**
   - 添加半认证路由
   - 启动清理调度器
   - 添加优雅关闭处理

7. **Create frontend API service** (`src/api/semiAuth.js`)
   - 实现验证码请求API
   - 实现验证码验证API
   - 实现 ping API

8. **Implement Pinia store** (`src/stores/semiAuth.js`)
   - 管理会话状态
   - 实现 WebSocket 连接管理
   - 实现 ping 间隔管理
   - 实现本地存储持久化
   - 添加生命周期管理

9. **Create SemiAuthLogin component** (`src/components/SemiAuthLogin.vue`)
   - 实现验证码请求界面
   - 实现验证码输入界面
   - 实现冷却倒计时
   - 添加错误处理

10. **Create SemiAuthStatus component** (`src/components/SemiAuthStatus.vue`)
    - 显示认证状态
    - 显示会话过期时间
    - 实现登出功能
    - 添加生命周期管理

11. **Add cleanup scheduler**
    - 实现自动清理过期会话
    - 添加日志记录
    - 实现优雅关闭

12. **Integration**
    - 将 SemiAuthLogin 组件集成到需要半认证的页面
    - 将 SemiAuthStatus 组件添加到全局布局
    - 配置需要半认证保护的路由
    - 添加中间件到需要保护的路由

## Testing Considerations

### 功能测试
- 测试验证码生成和验证
- 测试验证码尝试次数限制
- 测试会话过期和清理
- 测试 WebSocket ping 机制
- 测试并发会话处理

### 安全性测试
- 测试验证码的随机性和不可预测性
- 测试会话令牌的安全性
- 测试暴力破解防护
- 测试会话劫持防护
- 测试 CSRF 防护

### 性能测试
- 测试大量并发请求的处理
- 测试清理调度器的性能
- 测试 WebSocket 连接的性能
- 测试数据库查询性能

### 用户体验测试
- 测试验证码输入的便捷性
- 测试错误提示的清晰度
- 测试会话过期的处理
- 测试网络中断的恢复

### 集成测试
- 测试与现有认证系统的集成
- 测试与通知系统的集成
- 测试与文件系统的集成
- 测试与 WebSocket 系统的集成

## 安全注意事项

1. **验证码安全**
   - 使用密码学安全的随机数生成器
   - 验证码有效期不宜过长（建议1-2分钟）
   - 限制验证码尝试次数（建议3-5次）

2. **会话安全**
   - 使用足够熵的会话令牌（建议32字节）
   - 会话有效期不宜过长（建议60秒）
   - 实现自动过期机制
   - 使用会话ID防止会话混淆

3. **WebSocket 安全**
   - 验证所有传入的会话令牌和会话ID
   - 实现连接超时机制
   - 实现断开重连机制
   - 记录所有连接和断开事件

4. **日志和监控**
   - 记录所有认证相关事件
   - 记录所有失败尝试
   - 监控异常行为
   - 实现告警机制

## 性能优化建议

1. **数据库优化**
   - 确保所有必要字段都已建立索引
   - 定期清理过期会话
   - 考虑使用 Redis 存储活跃会话

2. **WebSocket 优化**
   - 使用房间（room）管理会话
   - 实现连接池管理
   - 优化消息广播机制

3. **前端优化**
   - 使用本地存储减少网络请求
   - 实现请求节流和防抖
   - 优化组件渲染性能
- Test error handling and edge cases
