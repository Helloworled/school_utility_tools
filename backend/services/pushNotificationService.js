/**
 * Push Notification Service
 * Manages WebSocket connections and broadcasts notifications to connected users
 */

// Store for user-to-socket mapping
const userSockets = new Map();

/**
 * Register a user's socket connection
 * @param {string} userId - User ID
 * @param {Object} socket - Socket connection object
 */
const registerUser = (userId, socket) => {
  userSockets.set(userId, socket);
  console.log(`User ${userId} connected to notification service`);
};

/**
 * Unregister a user's socket connection
 * @param {string} userId - User ID
 */
const unregisterUser = (userId) => {
  userSockets.delete(userId);
  console.log(`User ${userId} disconnected from notification service`);
};

/**
 * Send notification to a specific user
 * @param {string} userId - User ID to send notification to
 * @param {Object} notification - Notification object
 */
const sendNotificationToUser = (userId, notification) => {
  const socket = userSockets.get(userId);

  if (socket) {
    socket.emit('notification', {
      type: 'new',
      data: notification
    });
    console.log(`Notification sent to user ${userId}`);
  } else {
    console.log(`User ${userId} not connected, notification will be stored only`);
  }
};

/**
 * Broadcast notification to all connected users
 * @param {Object} notification - Notification object
 */
const broadcastNotification = (notification) => {
  userSockets.forEach((socket, userId) => {
    socket.emit('notification', {
      type: 'new',
      data: notification
    });
  });
  console.log(`Notification broadcasted to ${userSockets.size} users`);
};

/**
 * Get count of connected users
 * @returns {number} Number of connected users
 */
const getConnectedUserCount = () => {
  return userSockets.size;
};

module.exports = {
  registerUser,
  unregisterUser,
  sendNotificationToUser,
  broadcastNotification,
  getConnectedUserCount
};
