const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const profileRoutes = require('./routes/profileRoutes');
const notificationRoutes = require('./routes/notifications');
const semiAuthRoutes = require('./routes/semiAuthRoutes');
const fileStorageRoutes = require('./routes/fileStorage');

// Import utilities
const { scheduleRecurringTodos } = require('./utils/recurrence');
const { scheduleTodoReminders } = require('./utils/todoReminder');
const { scheduleCleanupNotifications } = require('./utils/cleanupNotifications');
const semiAuthService = require('./services/semiAuthService');
const { initializeWebSocket } = require('./websocket');
const { startPeriodicCheck: startNotificationCheck, stopPeriodicCheck: stopNotificationCheck } = require('./services/notificationCheckService');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_utility_tools')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/auth', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/semi-auth', semiAuthRoutes);
app.use('/api/files', fileStorageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize WebSocket server
  initializeWebSocket(server);

  // Start recurring todos scheduler
  scheduleRecurringTodos();

  // Start todo reminders scheduler
  scheduleTodoReminders();

  // Start cleanup notifications scheduler
  scheduleCleanupNotifications();

  // Start semi-auth cleanup scheduler
  semiAuthService.startCleanupScheduler();

  // Start notification check service
  startNotificationCheck();
});

// Add graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping schedulers...');
  semiAuthService.stopCleanupScheduler();
  stopNotificationCheck();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping schedulers...');
  semiAuthService.stopCleanupScheduler();
  stopNotificationCheck();
  process.exit(0);
});
