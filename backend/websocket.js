/**
 * WebSocket Setup for Push Notifications
 * Initializes Socket.io and sets up event handlers
 */

const { createServer } = require('http');
const { Server } = require('socket.io');
const pushNotificationService = require('./services/pushNotificationService');
const semiAuthService = require('./services/semiAuthService');

let io;

// Semi-auth session management
const semiAuthSessions = new Map();

/**
 * Initialize WebSocket server
 * @param {Object} app - Express app instance
 */
//const initializeWebSocket = (app) => {
const initializeWebSocket = (httpServer) => {
  //const httpServer = createServer(app);
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`[WebSocket] New client connected (socket id: ${socket.id})`);

    // User authentication and registration
    socket.on('register', (userId) => {
      console.log(`[WebSocket] Registration request from user ${userId} (socket id: ${socket.id})`);
      pushNotificationService.registerUser(userId, socket);
    });

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

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected (socket id: ${socket.id})`);

      // Find user ID by socket and unregister
      if (pushNotificationService.userSockets) {
        for (const [userId, userSocket] of pushNotificationService.userSockets.entries()) {
          if (userSocket === socket) {
            console.log(`[WebSocket] Unregistering user ${userId} (socket id: ${socket.id})`);
            pushNotificationService.unregisterUser(userId);
            break;
          }
        }
      }

      // Clean up semi-auth session
      const sessionData = semiAuthSessions.get(socket.id);
      if (sessionData) {
        console.log(`[Semi-auth] Socket ${socket.id} disconnected for user ${sessionData.username}`);
        socket.leave(`semi-auth-${sessionData.sessionId}`);
        semiAuthSessions.delete(socket.id);

        // Mark semi-auth session as expired in database
        semiAuthService.invalidateSession(sessionData.sessionToken, sessionData.sessionId)
          .catch(error => console.error('[Semi-auth] Error invalidating session:', error));
      }
    });
  });

  // Make io accessible globally
  global.io = io;

  console.log('WebSocket server initialized');
  return io;
};

/**
 * Get WebSocket instance
 * @returns {Object} Socket.io instance
 */
const getIo = () => {
  return io;
};

module.exports = {
  initializeWebSocket,
  getIo
};
