const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const { authenticate } = require('../middleware/auth');

// Get all todos with optional filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'start_date', category, status, tag, search } = req.query;

    // Build filter object
    const filter = { user_id: req.user._id };

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (tag) filter.tag = tag;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get todos
    const todos = await Todo.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Todo.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        todos,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting todos',
      error: error.message
    });
  }
});

//moved to the very front to avoid some problem with express (idk)
// Search todos with advanced filtering
router.get('/search', authenticate, async (req, res) => {
  try {
    const { 
      query, 
      page = 1, 
      limit = 10, 
      sort = 'start_date', 
      category, 
      status, 
      tag, 
      priority,
      theme,
      start_date,
      end_date
    } = req.query;

    // Build filter object
    const filter = { user_id: req.user._id };

    // Add optional filters
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (theme) filter.theme = theme;
    
    // Add fuzzy search for tag and title/description using OR relationship
    if (tag || query) {
      filter.$or = [];
      
      // Add tag search if provided
      if (tag) {
        filter.$or.push({ tag: { $regex: tag, $options: 'i' } });
      }
      
      // Add title and description search if query is provided
      if (query) {
        filter.$or.push(
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        );
      }
    }
    
    // Add date range filter
    if (start_date || end_date) {
      filter.start_date = {};
      if (start_date) filter.start_date.$gte = new Date(start_date);
      if (end_date) {
        // Set end_date to the end of the day to make it inclusive
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
        filter.start_date.$lte = endDate;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build search query
    let searchQuery = Todo.find(filter);
    

    
    // Apply sorting
    if (sort) {
      searchQuery = searchQuery.sort(sort);
    }
    
    // Apply pagination
    searchQuery = searchQuery.skip(skip).limit(parseInt(limit));

    // Execute search
    const todos = await searchQuery;

    // Get total count
    const total = await Todo.find(filter).countDocuments();


    res.status(200).json({
      success: true,
      data: {
        todos,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        query: query || null
      }
    });
  } catch (error) {
    console.error('Search todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching todos',
      error: error.message
    });
  }
});


// Get a specific todo
router.get('/:id', authenticate, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { todo }
    });
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting todo',
      error: error.message
    });
  }
});

// Create a new todo
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      tag,
      category,
      status,
      theme,
      priority,
      reminder,
      recurrence,
      start_date,
      end_date
    } = req.body;

    // Validate required fields
    if (!title || !description || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, start_date and end_date are required'
      });
    }

    // Validate date format and logic
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Create new todo
    const todo = new Todo({
      user_id: req.user._id,
      title,
      description,
      tag,
      category,
      status,
      theme,
      priority,
      reminder,
      recurrence,
      start_date,
      end_date
    });

    await todo.save();

    res.status(201).json({
      success: true,
      data: { todo }
    });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating todo',
      error: error.message
    });
  }
});

// Update a todo
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      tag,
      category,
      status,
      theme,
      priority,
      reminder,
      recurrence,
      start_date,
      end_date
    } = req.body;

    // Validate date format and logic if dates are provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
      
      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }
    }

    // Find and update todo
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      {
        title,
        description,
        tag,
        category,
        status,
        theme,
        priority,
        reminder,
        recurrence,
        start_date,
        end_date
      },
      { new: true, runValidators: true }
    );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { todo }
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating todo',
      error: error.message
    });
  }
});

// Delete a todo
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting todo',
      error: error.message
    });
  }
});

module.exports = router;
