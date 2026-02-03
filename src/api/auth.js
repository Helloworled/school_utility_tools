import api from './axios';

// Register a new user
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Login
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// Logout
export const logout = async (refreshToken) => {
  const response = await api.post('/auth/logout', { refreshToken });
  return response.data;
};

// Refresh access token
export const refreshTokens = async (refreshToken) => {
  const response = await api.post('/auth/refresh', { refreshToken });
  return response.data;
};

// Request password reset
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

// Reset password
export const resetPassword = async (email, code, password) => {
  const response = await api.post('/auth/reset-password', { email, code, password });
  return response.data;
};

// Send verification code
export const sendVerificationCode = async (email, type) => {
  const response = await api.post('/auth/send-verification-code', { email, type });
  return response.data;
};

// Email login
export const emailLogin = async (email, code, rememberMe) => {
  const response = await api.post('/auth/email-login', { email, code, rememberMe });
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Update profile
export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  return response.data;
};

// Change password
export const changePassword = async (passwordData) => {
  const response = await api.put('/auth/password', passwordData);
  return response.data;
};
