const jwt = require('jsonwebtoken');

// Generate access token
const generateAccessToken = (userId) => {
  console.log('jwt data: expiresIn: ',process.env.JWT_ACCESS_EXPIRATION)
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET || 'access_secret_key',
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId, rememberMe = false) => {
  const expiresIn = rememberMe 
    ? process.env.JWT_REFRESH_EXPIRATION_REMEMBER_ME || '7d'
    : process.env.JWT_REFRESH_EXPIRATION_NO_REMEMBER_ME || '7d';
  
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
    { expiresIn }
  );
};

// Generate password reset token
const generateResetToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_RESET_SECRET || 'reset_secret_key',
    { expiresIn: '1h' }
  );
};

// Verify access token
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access_secret_key');
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret_key');
};

// Verify reset token
const verifyResetToken = (token) => {
  return jwt.verify(token, process.env.JWT_RESET_SECRET || 'reset_secret_key');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetToken
};
