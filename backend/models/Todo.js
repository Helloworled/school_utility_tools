const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  tag: {
    type: String,
    default: 'default'
  },
  category: {
    type: String,
    enum: ['default', 'study', 'work', 'life'],
    default: 'default'
  },
  status: {
    type: String,
    enum: ['not_done', 'wait_submit', 'already_done'],
    default: 'not_done'
  },
  theme: {
    type: String,
    enum: ['red', 'green', 'blue', 'yellow', 'black', 'white', 'grey'],
    default: 'grey'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  reminder: {
    type: Date,
    default: null
  },
  recurrence: {
    type: String,
    enum: ['once', 'day', 'week', 'month'],
    default: 'once'
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required']
  }
}, {
  timestamps: true
});

// Create indexes for frequently queried fields
todoSchema.index({ user_id: 1 });
todoSchema.index({ start_date: 1 });
todoSchema.index({ end_date: 1 });
todoSchema.index({ category: 1 });
todoSchema.index({ status: 1 });
todoSchema.index({ priority: 1 });
todoSchema.index({ tag: 1 });

// Create text index for full-text search
todoSchema.index({ title: 'text', description: 'text' });

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;
