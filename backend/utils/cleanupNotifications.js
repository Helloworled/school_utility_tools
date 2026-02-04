const cron = require('node-cron');
const Notification = require('../models/Notification');

// Function to delete read notifications
const deleteReadNotifications = async () => {
  try {
    console.log('Starting cleanup of read notifications...');

    // Delete all notifications that are marked as read
    const result = await Notification.deleteMany({ read: true });

    console.log(`Deleted ${result.deletedCount} read notifications`);
    console.log('Cleanup of read notifications completed');
  } catch (error) {
    console.error('Error deleting read notifications:', error);
  }
};

// Schedule a job to run monthly on the 1st day at 00:10
const scheduleCleanupNotifications = () => {
  // Run on the 1st day of every month at 00:10
  cron.schedule('10 0 1 * *', deleteReadNotifications);
  console.log('Read notifications cleanup scheduler started');
};

module.exports = {
  deleteReadNotifications,
  scheduleCleanupNotifications
};
