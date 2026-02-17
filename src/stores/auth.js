import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as authApi from '@/api/auth';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const accessToken = ref(localStorage.getItem('accessToken') || null);
  const refreshToken = ref(localStorage.getItem('refreshToken') || null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

  // Actions
  const login = async (credentials) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.login(credentials);

      if (response.success) {
        user.value = response.data.user;
        accessToken.value = response.data.accessToken;
        refreshToken.value = response.data.refreshToken;

        // Store tokens and user_id in localStorage
        localStorage.setItem('accessToken', accessToken.value);
        localStorage.setItem('refreshToken', refreshToken.value);
        localStorage.setItem('user_id', response.data.user._id);
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (userData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.register(userData);

      if (response.success) {
        user.value = response.data.user;
        accessToken.value = response.data.accessToken;
        refreshToken.value = response.data.refreshToken;

        // Store tokens and user_id in localStorage
        localStorage.setItem('accessToken', accessToken.value);
        localStorage.setItem('refreshToken', refreshToken.value);
        localStorage.setItem('user_id', response.data.user._id);
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (refreshToken.value) {
        await authApi.logout(refreshToken.value);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear state and localStorage
      user.value = null;
      accessToken.value = null;
      refreshToken.value = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user_id');
      loading.value = false;
    }
  };

  const refreshTokens = async () => {
    if (!refreshToken.value) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authApi.refreshTokens(refreshToken.value);

      if (response.success) {
        accessToken.value = response.data.accessToken;
        refreshToken.value = response.data.refreshToken;

        // Update tokens and user_id in localStorage
        localStorage.setItem('accessToken', accessToken.value);
        localStorage.setItem('refreshToken', refreshToken.value);
        if (response.data.user) {
          localStorage.setItem('user_id', response.data.user._id);
          user.value = response.data.user;
        }
      }

      return response;
    } catch (err) {
      // If refresh fails, clear tokens and redirect to login
      user.value = null;
      accessToken.value = null;
      refreshToken.value = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw err;
    }
  };

  const getCurrentUser = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.getCurrentUser();

      if (response.success) {
        user.value = response.data.user;
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to get user information';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (profileData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.updateProfile(profileData);

      if (response.success) {
        user.value = response.data.user;
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update profile';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const changePassword = async (passwordData) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.changePassword(passwordData);
      
      // After password change, clear all tokens and redirect to login
      // because backend deletes all refresh tokens
      user.value = null;
      accessToken.value = null;
      refreshToken.value = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user_id');
      
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to change password';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const forgotPassword = async (email) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.forgotPassword(email);
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to request password reset';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const resetPassword = async (email, code, password) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.resetPassword(email, code, password);
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to reset password';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const sendVerificationCode = async (email, type) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.sendVerificationCode(email, type);
      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to send verification code';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const emailLogin = async (email, code, rememberMe) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await authApi.emailLogin(email, code, rememberMe);

      if (response.success) {
        user.value = response.data.user;
        accessToken.value = response.data.accessToken;
        refreshToken.value = response.data.refreshToken;

        // Store tokens and user_id in localStorage
        localStorage.setItem('accessToken', accessToken.value);
        localStorage.setItem('refreshToken', refreshToken.value);
        localStorage.setItem('user_id', response.data.user._id);
      }

      return response;
    } catch (err) {
      error.value = err.response?.data?.message || 'Email login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Initialize auth state from localStorage
  const initializeAuth = async () => {
    if (accessToken.value && !user.value) {
      try {
        const response = await getCurrentUser();
        if (response.success && response.data.user) {
          localStorage.setItem('user_id', response.data.user._id);
        }
      } catch (err) {
        // If getting user fails, clear tokens directly without calling logout API
        user.value = null;
        accessToken.value = null;
        refreshToken.value = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user_id');
      }
    }
  };

  return {
    // State
    user,
    accessToken,
    refreshToken,
    loading,
    error,

    // Getters
    isAuthenticated,

    // Actions
    login,
    register,
    logout,
    refreshTokens,
    getCurrentUser,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    sendVerificationCode,
    emailLogin,
    initializeAuth
  };
});
