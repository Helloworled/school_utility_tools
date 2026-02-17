/**
 * Notification Check Service
 * Periodically checks for new notifications and pushes them to connected users
 */

const Notification = require('../models/Notification');
const pushNotificationService = require('./pushNotificationService');

// Store for tracking last check time per user
const lastCheckTimes = new Map();

// Check interval in milliseconds (5 minutes)
const CHECK_INTERVAL = 5 * 60 * 1000;

/**
 * Check for new notifications for a specific user
 * @param {string} userId - User ID to check notifications for
 */
const checkNewNotificationsForUser = async (userId) => {
  try {
    const lastCheckTime = lastCheckTimes.get(userId) || new Date(0);

    // Find notifications created after last check time
    const newNotifications = await Notification.find({
      user_id: userId,
      created_at: { $gt: lastCheckTime }
    }).sort({ created_at: 1 });

    if (newNotifications.length > 0) {
      console.log(`Found ${newNotifications.length} new notifications for user ${userId}`);

      // Push each new notification
      for (const notification of newNotifications) {
        pushNotificationService.sendNotificationToUser(userId, notification);
      }
    }

    // Update last check time
    lastCheckTimes.set(userId, new Date());
  } catch (error) {
    console.error(`Error checking notifications for user ${userId}:`, error);
  }
};

/**
 * Check for new notifications for all connected users
 */
const checkNewNotificationsForAllUsers = async () => {
  try {
    const connectedUserCount = pushNotificationService.getConnectedUserCount();

    if (connectedUserCount === 0) {
      console.log('No connected users, skipping notification check');
      return;
    }

    console.log(`Checking notifications for ${connectedUserCount} connected users`);

    // Get all users with notifications created after their last check time
    const pipeline = [
      {
        $group: {
          _id: '$user_id',
          latestNotification: { $max: '$created_at' }
        }
      }
    ];

    const userLatestNotifications = await Notification.aggregate(pipeline);

    for (const userDoc of userLatestNotifications) {
      const userId = userDoc._id;
      const lastCheckTime = lastCheckTimes.get(userId) || new Date(0);

      if (userDoc.latestNotification > lastCheckTime) {
        await checkNewNotificationsForUser(userId);
      }
    }

    console.log('Notification check completed');
  } catch (error) {
    console.error('Error checking notifications for all users:', error);
  }
};

// Check interval timer
let checkInterval = null;

/**
 * Start the periodic notification check
 */
const startPeriodicCheck = () => {
  if (checkInterval) {
    console.warn('Notification check service already running');
    return;
  }

  // Perform initial check
  checkNewNotificationsForAllUsers();

  // Set up periodic check
  checkInterval = setInterval(() => {
    checkNewNotificationsForAllUsers();
  }, CHECK_INTERVAL);

  console.log(`Notification check service started (runs every ${CHECK_INTERVAL / 1000} seconds)`);
};

/**
 * Stop the periodic notification check
 */
const stopPeriodicCheck = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('Notification check service stopped');
  }
};

/**
 * Reset the last check time for a user (useful for testing)
 * @param {string} userId - User ID to reset
 */
const resetUserCheckTime = (userId) => {
  lastCheckTimes.delete(userId);
  console.log(`Reset last check time for user ${userId}`);
};

module.exports = {
  checkNewNotificationsForUser,
  checkNewNotificationsForAllUsers,
  startPeriodicCheck,
  stopPeriodicCheck,
  resetUserCheckTime
};
