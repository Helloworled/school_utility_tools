import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// Create axios instance
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track ongoing token refresh to prevent race conditions
let isRefreshing = false;
let refreshSubscribers = [];

// Add a request to the queue
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Notify all queued requests with the new token
const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if this is a semi-auth request (has semi-auth headers)
    const isSemiAuthRequest = originalRequest.headers['x-semi-auth-token'] || 
                            originalRequest.headers['x-semi-auth-session-id'];

    // If error is 401 and we haven't tried to refresh token yet
    // AND this is NOT a semi-auth request
    if (error.response?.status === 401 && !originalRequest._retry && !isSemiAuthRequest) {
      originalRequest._retry = true;

      const authStore = useAuthStore();

      // Only try to refresh if we have a refresh token
      if (!authStore.refreshToken) {
        // Clear tokens and redirect to login
        authStore.user = null;
        authStore.accessToken = null;
        authStore.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }

      // If a refresh is already in progress, queue the request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      // Start the refresh process
      isRefreshing = true;

      try {
        await authStore.refreshTokens();

        // Retry original request with new token
        if (authStore.accessToken) {
          onRefreshed(authStore.accessToken);
          originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        authStore.user = null;
        authStore.accessToken = null;
        authStore.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
