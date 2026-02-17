import { defineStore } from 'pinia';
import * as semiAuthApi from '../api/semiAuth';
import { getSocket } from '../plugins/websocket';

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
    lastRequestTime: null,  // 记录上次请求验证码的时间
    requestCooldown: 15000,  // 15秒冷却时间，30秒限制在页面上进行
    socketConnected: false   // WebSocket 连接状态
  }),

  getters: {
    isAuthenticated: (state) => !!state.sessionToken && !!state.sessionId,
    isExpired: () => false  // Semi-auth tokens do not expire by design
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
        this.sessionId = response.data.sessionId;
        this.expiresAt = response.data.expiresAt;
        this.lastRequestTime = Date.now();
        return response;
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
        this.sessionToken = response.data.sessionToken;
        this.expiresAt = response.data.expiresAt;
        this.lastPing = new Date();
        await this.connectWebSocket();
        this.startPingInterval();
        this.saveToStorage();
        return response;
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
        const socket = getSocket();

        if (!socket) {
          console.warn('[Semi-auth] WebSocket not initialized, will retry later');
          // 不强制退出，而是等待WebSocket初始化
          // 10秒后重试连接
          setTimeout(() => {
            if (this.sessionToken && this.sessionId && !this.socketConnected) {
              this.connectWebSocket();
            }
          }, 10000);
          return;
        }

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
      const socket = getSocket();
      if (this.socketConnected && socket) {
        socket.emit('semi-auth-disconnect');
        this.socketConnected = false;
      }
    },

    async ping() {
      if (!this.sessionToken || !this.sessionId) return;

      try {
        const response = await semiAuthApi.ping(this.sessionToken, this.sessionId);
        this.expiresAt = response.data.expiresAt;
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
      const username = localStorage.getItem('semiAuthUsername');

      if (sessionToken && sessionId && username) {
        this.sessionToken = sessionToken;
        this.sessionId = sessionId;
        this.username = username;

        // 延迟连接WebSocket，确保应用已完全初始化
        setTimeout(() => {
          this.connectWebSocket().then(() => {
            if (this.socketConnected) {
              this.startPingInterval();
            }
            // 不再强制退出，即使WebSocket未连接也保持semi-auth状态
          });
        }, 1000);
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
