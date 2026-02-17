const Notification = require('../models/Notification');
const pushNotificationService = require('./pushNotificationService');

/**
 * Create a new notification
 * @param {string} userId - User ID to send notification to
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, warning, error, success)
 * @param {string} relatedId - Optional ID of related entity
 * @param {string} relatedType - Optional type of related entity
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (userId, title, message, type = 'info', relatedId = null, relatedType = null) => {
  try {
    const notification = new Notification({
      user_id: userId,
      title,
      message,
      type,
      related_id: relatedId,
      related_type: relatedType
    });

    await notification.save();

    // 立即通过 WebSocket 推送通知
    pushNotificationService.sendNotificationToUser(userId, notification);

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create a todo reminder notification
 * @param {string} userId - User ID
 * @param {string} todoId - Todo ID
 * @returns {Promise<Object>} Created notification
 */
const createTodoReminder = async (userId, todoId) => {
  return createNotification(
    userId,
    'Todo Reminder',
    'You have an upcoming todo that needs attention.',
    'info',
    todoId,
    'todo'
  );
};

/**
 * Create a todo overdue notification
 * @param {string} userId - User ID
 * @param {string} todoId - Todo ID
 * @returns {Promise<Object>} Created notification
 */
const createTodoOverdue = async (userId, todoId) => {
  return createNotification(
    userId,
    'Todo Overdue',
    'One of your todos has passed its due date.',
    'warning',
    todoId,
    'todo'
  );
};

/**
 * Create a system message notification
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (default: info)
 * @returns {Promise<Object>} Created notification
 */
const createSystemMessage = async (userId, title, message, type = 'info') => {
  return createNotification(userId, title, message, type);
};

/**
 * Clean up old read notifications
 * Deletes read notifications older than specified days
 * @param {number} days - Number of days to keep (default: 30)
 * @returns {Promise<number>} Number of deleted notifications
 */
const cleanupOldNotifications = async (days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await Notification.deleteMany({
      read: true,
      created_at: { $lt: cutoffDate }
    });

    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createTodoReminder,
  createTodoOverdue,
  createSystemMessage,
  cleanupOldNotifications
};
