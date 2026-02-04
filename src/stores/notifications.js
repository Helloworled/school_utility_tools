import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as notificationsApi from '@/api/notifications';

export const useNotificationsStore = defineStore('notifications', () => {
  // State
  const notifications = ref([]);
  const currentNotification = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0
  });
  const filters = ref({
    query: '',
    read: null,
    type: null,
    related_type: null,
    created_after: null,
    created_before: null
  });

  // Getters
  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length;
  });

  const filteredNotifications = computed(() => {
    let result = [...notifications.value];

    // Apply filters
    if (filters.value.read !== null) {
      result = result.filter(n => n.read === (filters.value.read === 'true'));
    }

    if (filters.value.type) {
      result = result.filter(n => n.type === filters.value.type);
    }

    if (filters.value.related_type) {
      result = result.filter(n => n.related_type === filters.value.related_type);
    }

    if (filters.value.query) {
      const query = filters.value.query.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(query) || 
        n.message.toLowerCase().includes(query)
      );
    }

    return result;
  });

  // Actions
  const fetchNotifications = async (params = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await notificationsApi.getNotifications({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...params
      });

      if (response.success) {
        notifications.value = response.data.notifications;
        pagination.value.total = response.data.total;
        pagination.value.page = response.data.page;
        pagination.value.limit = response.data.limit;
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch notifications';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const searchNotifications = async (params = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await notificationsApi.searchNotifications({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters.value,
        ...params
      });

      if (response.success) {
        notifications.value = response.data.notifications;
        pagination.value.total = response.data.total;
        pagination.value.page = response.data.page;
        pagination.value.limit = response.data.limit;
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to search notifications';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchNotification = async (id) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await notificationsApi.getNotification(id);

      if (response.success) {
        currentNotification.value = response.data.notification;
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch notification';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const markAsRead = async (id, read = true) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await notificationsApi.markNotificationRead(id, read);

      if (response.success) {
        // Update notification in the list
        const index = notifications.value.findIndex(n => n._id === id);
        if (index !== -1) {
          notifications.value[index] = response.data.notification;
        }

        // Update current notification if it's the one being viewed
        if (currentNotification.value && currentNotification.value._id === id) {
          currentNotification.value = response.data.notification;
        }
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update notification';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const addNotification = (notification) => {
    // Add new notification to the beginning of the list
    notifications.value.unshift(notification);
    pagination.value.total += 1;
  };

  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const resetFilters = () => {
    filters.value = {
      query: '',
      read: null,
      type: null,
      related_type: null,
      created_after: null,
      created_before: null
    };
  };

  const setPagination = (newPagination) => {
    pagination.value = { ...pagination.value, ...newPagination };
  };

  const clearCurrentNotification = () => {
    currentNotification.value = null;
  };

  return {
    // State
    notifications,
    currentNotification,
    loading,
    error,
    pagination,
    filters,

    // Getters
    unreadCount,
    filteredNotifications,

    // Actions
    fetchNotifications,
    searchNotifications,
    fetchNotification,
    markAsRead,
    addNotification,
    setFilters,
    resetFilters,
    setPagination,
    clearCurrentNotification
  };
});
