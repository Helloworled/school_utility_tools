const cron = require('node-cron');
const Todo = require('../models/Todo');
const Notification = require('../models/Notification');

// Function to check and send reminders for todos
const checkTodoReminders = async () => {
  try {
    console.log('Checking todo reminders...');

    // Get today's date range (start and end of the day)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Find all todos with reminders scheduled for today
    const todosWithReminders = await Todo.find({
      reminder: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    if (todosWithReminders.length === 0) {
      console.log('No todos with reminders for today');
      return;
    }

    // Group todos by user_id
    const todosByUser = {};
    for (const todo of todosWithReminders) {
      if (!todosByUser[todo.user_id]) {
        todosByUser[todo.user_id] = [];
      }
      todosByUser[todo.user_id].push(todo);
    }

    // Create a notification for each user with their todo reminders
    for (const [userId, todos] of Object.entries(todosByUser)) {
      // Create a list of todo titles
      const todoTitles = todos.map(todo => todo.title).join(', ');

      // Create notification
      await Notification.create({
        user_id: userId,
        title: `[${todos.length}]条todo提醒`,
        message: `提醒Todo列表: ${todoTitles}`,
        type: 'info',
        related_type: 'todo_reminder'
      });

      console.log(`Created reminder notification for user ${userId} with ${todos.length} todos`);
    }

    console.log('Todo reminders check completed');
  } catch (error) {
    console.error('Error checking todo reminders:', error);
  }
};

// Schedule a job to run daily at 00:05
const scheduleTodoReminders = () => {
  // Run every day at 00:05
  cron.schedule('5 0 * * *', checkTodoReminders);
  console.log('Todo reminders scheduler started');
};

module.exports = {
  checkTodoReminders,
  scheduleTodoReminders
};
