import api from './axios';

/**
 * Get all notifications for the authenticated user
 * @param {Object} params - Query parameters (page, limit, read)
 * @returns {Promise} API response
 */
export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

/**
 * Get a specific notification by ID
 * @param {string} id - Notification ID
 * @returns {Promise} API response
 */
export const getNotification = async (id) => {
  const response = await api.get(`/notifications/${id}`);
  return response.data;
};

/**
 * Search notifications with advanced filtering
 * @param {Object} params - Query parameters (query, read, type, related_type, created_after, created_before, page, limit, sort, order)
 * @returns {Promise} API response
 */
export const searchNotifications = async (params = {}) => {
  const response = await api.get('/notifications/search', { params });
  return response.data;
};

/**
 * Mark notification as read or unread
 * @param {string} id - Notification ID
 * @param {boolean} read - Read status
 * @returns {Promise} API response
 */
export const markNotificationRead = async (id, read) => {
  const response = await api.put(`/notifications/${id}/read`, { read });
  return response.data;
};

/**
 * Create a new notification (internal use only)
 * @param {Object} notificationData - Notification data
 * @returns {Promise} API response
 */
export const createNotification = async (notificationData) => {
  const response = await api.post('/notifications', notificationData);
  return response.data;
};
