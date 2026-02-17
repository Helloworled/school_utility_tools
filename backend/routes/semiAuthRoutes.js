const express = require('express');
const router = express.Router();
const semiAuthService = require('../services/semiAuthService');
const { authenticate } = require('../middleware/auth');

// Middleware to check if user is NOT authenticated
const checkNotAuthenticated = (req, res, next) => {
  if (req.user) {
    return res.status(403).json({
      success: false,
      message: 'You are already authenticated and have full access to all resources. Semi-authentication is not required.'
    });
  }
  next();
};

// Request verification code
router.post('/request', checkNotAuthenticated, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const semiAuth = await semiAuthService.createSemiAuthRequest(username);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to user',
      data: {
        requestId: semiAuth._id,
        sessionId: semiAuth.sessionId,
        expiresAt: semiAuth.expiresAt
      }
    });
  } catch (error) {
    console.error('[Semi-auth] Request error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to request verification code'
    });
  }
});

// Verify code and activate session
router.post('/verify', checkNotAuthenticated, async (req, res) => {
  try {
    const { username, code, sessionId } = req.body;

    if (!username || !code || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Username, verification code and session ID are required'
      });
    }

    const result = await semiAuthService.verifyCodeAndActivate(username, code, sessionId);

    res.status(200).json({
      success: true,
      message: 'Session activated successfully',
      data: result
    });
  } catch (error) {
    console.error('[Semi-auth] Verify error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify code'
    });
  }
});

// Ping to keep session alive
router.post('/ping', async (req, res) => {
  try {
    const { sessionToken, sessionId } = req.body;

    if (!sessionToken || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session token and session ID are required'
      });
    }

    const semiAuth = await semiAuthService.updatePing(sessionToken, sessionId);

    res.status(200).json({
      success: true,
      message: 'Ping updated',
      data: {
        expiresAt: semiAuth.expiresAt,
        lastPing: semiAuth.lastPing
      }
    });
  } catch (error) {
    console.error('[Semi-auth] Ping error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(401).json({
      success: false,
      message: error.message || 'Failed to update ping'
    });
  }
});

module.exports = router;
