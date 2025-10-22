const express = require('express');
const router = express.Router();
const Task = require('../../models/Task');
const { adminAuth } = require('../../middleware/adminAuthSimple');

// Tasks list endpoint
router.get('/', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const status = req.query.status || '';
    const category = req.query.category || '';
    
    // Build filter
    let filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (category && category !== 'All Categories') {
      // Handle category filtering using same approach as main backend
      filter.categories = { $regex: new RegExp(`\\b${category.trim()}\\b`, "i") };
    }
    
    const tasks = await Task.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    // Process tasks to handle missing user data
    const processedTasks = tasks.map(task => {
      const taskObj = task.toObject();
      
      // Handle missing createdBy user
      if (!taskObj.createdBy) {
        taskObj.createdBy = {
          firstName: 'Unknown',
          lastName: 'User',
          email: 'unknown@example.com'
        };
      }
      
      // Handle missing assignedTo user
      if (taskObj.assignedTo === null) {
        taskObj.assignedTo = null; // Keep as null for unassigned tasks
      }
      
      return taskObj;
    });
      
    const total = await Task.countDocuments(filter);
    
    res.json({
      status: 'success',
      data: {
        tasks: processedTasks,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTasks: total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tasks'
    });
  }
});

// Get single task details
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email phone')
      .populate({
        path: 'offers',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      });
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }
    
    res.json({
      status: 'success',
      data: { task }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch task'
    });
  }
});

// Update task status
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['open', 'assigned', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('createdBy', 'firstName lastName email');
    
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }
    
    res.json({
      status: 'success',
      data: { task },
      message: 'Task status updated successfully'
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update task status'
    });
  }
});

module.exports = router;