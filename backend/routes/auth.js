const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const passwordRoutes = require('./passwordRoutes');
const profileRoutes = require('./profileRoutes');
const verificationRoutes = require('./verificationRoutes');

// Mount route modules
router.use('/', authRoutes);
router.use('/', passwordRoutes);
router.use('/', profileRoutes);
router.use('/', verificationRoutes);

module.exports = router;
