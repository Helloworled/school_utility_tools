/**
 * WebSocket Setup for Push Notifications
 * Initializes Socket.io and sets up event handlers
 */

const { createServer } = require('http');
const { Server } = require('socket.io');
const pushNotificationService = require('./services/pushNotificationService');

let io;

/**
 * Initialize WebSocket server
 * @param {Object} app - Express app instance
 */
const initializeWebSocket = (app) => {
  const httpServer = createServer(app);
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log('New client connected to notification service');

    // User authentication and registration
    socket.on('register', (userId) => {
      pushNotificationService.registerUser(userId, socket);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      // Find user ID by socket and unregister
      for (const [userId, userSocket] of pushNotificationService.userSockets.entries()) {
        if (userSocket === socket) {
          pushNotificationService.unregisterUser(userId);
          break;
        }
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
