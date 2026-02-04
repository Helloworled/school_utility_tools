const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

// Get all notifications with optional filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, read } = req.query;

    // Build filter object
    const filter = { user_id: req.user._id };
    if (read !== undefined) {
      filter.read = read === 'true';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get notifications
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting notifications',
      error: error.message
    });
  }
});

// Search notifications with advanced filtering
router.get('/search', authenticate, async (req, res) => {
  try {
    const {
      query,
      read,
      type,
      related_type,
      created_after,
      created_before,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = { user_id: req.user._id };

    // Add text search if provided
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { message: { $regex: query, $options: 'i' } }
      ];
    }

    // Add optional filters
    if (read !== undefined) {
      filter.read = read === 'true';
    }

    if (type) {
      filter.type = type;
    }

    if (related_type) {
      filter.related_type = related_type;
    }

    // Add date range filter
    if (created_after || created_before) {
      filter.createdAt = {};
      if (created_after) {
        filter.createdAt.$gte = new Date(created_after);
      }
      if (created_before) {
        filter.createdAt.$lte = new Date(created_before);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Get notifications
    const notifications = await Notification.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Search notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching notifications',
      error: error.message
    });
  }
});

// Get a specific notification
router.get('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting notification',
      error: error.message
    });
  }
});

// Mark notification as read or unread
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { read } = req.body;

    if (typeof read !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Read status must be a boolean value'
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { read },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification',
      error: error.message
    });
  }
});

// Create a new notification (internal use only)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      user_id,
      title,
      message,
      type = 'info',
      related_id,
      related_type
    } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Create new notification
    const notification = new Notification({
      user_id,
      title,
      message,
      type,
      related_id,
      related_type
    });

    await notification.save();

    res.status(201).json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating notification',
      error: error.message
    });
  }
});

module.exports = router;
