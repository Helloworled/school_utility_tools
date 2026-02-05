const cron = require('node-cron');
const Todo = require('../models/Todo');

// Function to update recurring todos
const updateRecurringTodos = async () => {
  try {
    const now = new Date();

    // Find all recurring todos that are due (end_date has passed)
    // and status is not 'not_done' (meaning they've been completed or are in progress) //this is not used, the todo will update no matter what
    const dueTodos = await Todo.find({
      recurrence: { $ne: 'once' },
      end_date: { $lt: now },
      //status: { $ne: 'not_done' }
    });

    for (const todo of dueTodos) {
      let newStartDate = new Date(todo.start_date);
      let newEndDate = new Date(todo.end_date);
      console.log('todo recurence: ',todo.recurrence)

      // Calculate new dates based on recurrence type
      switch (todo.recurrence) {
        case 'day':
          // Move to next day
          newStartDate.setDate(newStartDate.getDate() + 1);
          newEndDate.setDate(newEndDate.getDate() + 1);
          break;

        case 'week':
          // Move to next week
          newStartDate.setDate(newStartDate.getDate() + 7);
          newEndDate.setDate(newEndDate.getDate() + 7);
          break;

        case 'month':
          // Move to next month
          const originalStartDay = newStartDate.getDate();
          const originalEndDay = newEndDate.getDate();

          newStartDate.setMonth(newStartDate.getMonth() + 1);
          newEndDate.setMonth(newEndDate.getMonth() + 1);

          // Adjust for months with different number of days
          // If the original day was the last day of the month, keep it as the last day
          const daysInNewStartMonth = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0).getDate();
          const daysInNewEndMonth = new Date(newEndDate.getFullYear(), newEndDate.getMonth() + 1, 0).getDate();

          if (originalStartDay > daysInNewStartMonth) {
            newStartDate.setDate(daysInNewStartMonth);
          }
          if (originalEndDay > daysInNewEndMonth) {
            newEndDate.setDate(daysInNewEndMonth);
          }
          break;
      }

      // Update the todo with new dates and reset status
      await Todo.findByIdAndUpdate(todo._id, {
        start_date: newStartDate,
        end_date: newEndDate,
        status: 'not_done',
        reminder: null // Reset reminder
      });

      console.log(`Updated recurring todo: ${todo.title} to ${newStartDate.toISOString()}`);
    }
  } catch (error) {
    console.error('Error updating recurring todos:', error);
  }
};

// Schedule a job to run daily at midnight
const scheduleRecurringTodos = () => {
  // Run every day at midnight
  cron.schedule('5 0 * * *', updateRecurringTodos);
  console.log('Recurring todos scheduler started');
};

module.exports = {
  updateRecurringTodos,
  scheduleRecurringTodos
};
