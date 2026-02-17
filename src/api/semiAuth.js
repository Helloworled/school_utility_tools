import api from './axios';

// Request verification code
export const requestVerificationCode = async (username) => {
  const response = await api.post('/semi-auth/request', { username });
  return response.data;
};

// Verify code and activate session
export const verifyCode = async (username, code, sessionId) => {
  const response = await api.post('/semi-auth/verify', { username, code, sessionId });
  return response.data;
};

// Ping to keep session alive
export const ping = async (sessionToken, sessionId) => {
  const response = await api.post('/semi-auth/ping', { sessionToken, sessionId });
  return response.data;
};
