require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_utility_tools')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Import task functions
const { checkTodoReminders } = require('../utils/todoReminder');
const { updateRecurringTodos } = require('../utils/recurrence');
const { deleteReadNotifications } = require('../utils/cleanupNotifications');

// Function to run tasks
const runTasks = async () => {
  try {
    console.log('Running todo reminders check...');
    await checkTodoReminders();
    console.log('Todo reminders check completed');

    console.log('Running recurring todos update...');
    await updateRecurringTodos();
    console.log('Recurring todos update completed');

    console.log('Running read notifications cleanup...');
    await deleteReadNotifications();
    console.log('Read notifications cleanup completed');

    console.log('All tasks completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running tasks:', error);
    process.exit(1);
  }
};

// Run tasks
runTasks();
