const jwt = require('../utils/jwt');
const Token = require('../models/Token');
const User = require('../models/User');
const SemiAuth = require('../models/SemiAuth');

// Authenticate user with JWT
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify access token (JWT signature and expiration only, no database query)
    const decoded = jwt.verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify access token (JWT signature and expiration only, no database query)
      const decoded = jwt.verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Ignore token errors for optional auth
      console.log('authjs access token error (ignored): ',err.message)
    }

    next();
  } catch (error) {
    next();
  }
};

// Semi-auth authentication - allows access to public folders
const semiAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Semi-authentication required'
      });
    }

    const token = authHeader.split(' ')[1];

    // Get semi-auth session from database
    const semiAuthSession = await SemiAuth.findOne({ sessionToken: token, status: 'active' });

    if (!semiAuthSession) {
      return res.status(401).json({
        success: false,
        message: 'Invalid semi-auth token'
      });
    }

    // Attach semi-auth user to request
    req.semiAuthUser = {
      username: semiAuthSession.username,
      sessionToken: semiAuthSession.sessionToken,
      sessionId: semiAuthSession.sessionId
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Semi-authentication failed',
      error: error.message
    });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  semiAuth
};
