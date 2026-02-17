const semiAuthService = require('../services/semiAuthService');

// Authenticate with semi-auth token
const authenticateSemiAuth = async (req, res, next) => {
  try {
    const sessionToken = req.headers['x-semi-auth-token'];
    const sessionId = req.headers['x-semi-auth-session-id'];

    if (!sessionToken || !sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Semi-auth token and session ID are required'
      });
    }

    const semiAuth = await semiAuthService.validateSession(sessionToken, sessionId);

    if (!semiAuth) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired semi-auth session'
      });
    }

    req.semiAuth = semiAuth;
    next();
  } catch (error) {
    console.error('[Semi-auth] Middleware error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(401).json({
      success: false,
      message: 'Semi-auth authentication failed',
      error: error.message
    });
  }
};

module.exports = {
  authenticateSemiAuth
};
