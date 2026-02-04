const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  related_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  related_type: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Create indexes for frequently queried fields
notificationSchema.index({ user_id: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ user_id: 1, read: 1 });

// Create text index for search
notificationSchema.index({ title: 'text', message: 'text' });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
