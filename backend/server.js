const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const profileRoutes = require('./routes/profileRoutes');
const notificationRoutes = require('./routes/notifications');

// Import utilities
const { scheduleRecurringTodos } = require('./utils/recurrence');
const { scheduleTodoReminders } = require('./utils/todoReminder');
const { scheduleCleanupNotifications } = require('./utils/cleanupNotifications');

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start recurring todos scheduler
  scheduleRecurringTodos();

  // Start todo reminders scheduler
  scheduleTodoReminders();

  // Start cleanup notifications scheduler
  scheduleCleanupNotifications();
});
