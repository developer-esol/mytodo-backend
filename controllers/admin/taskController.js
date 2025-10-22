const Task = require('../../models/Task');
const User = require('../../models/User');
const { logAdminAction } = require('../../utils/auditLogger');
const logger = require('../../utils/logger');
const { Transform } = require('json2csv');

/**
 * Get all tasks with filtering and pagination
 */
const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      flagged,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (flagged === 'true') {
      filter.flagged = true;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tasks = await Task.find(filter)
      .populate('createdBy', 'firstName lastName email avatar')
      .populate('assignedTo', 'firstName lastName email avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        tasks,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tasks'
    });
  }
};

/**
 * Get single task by ID
 */
const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('createdBy', 'firstName lastName email avatar rating completedTasks')
      .populate('assignedTo', 'firstName lastName email avatar rating completedTasks')
      .populate('offers')
      .populate('reviews')
      .populate({
        path: 'adminNotes.addedBy',
        select: 'firstName lastName email'
      });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Increment view count
    await task.incrementViewCount();

    res.status(200).json({
      status: 'success',
      data: { task }
    });

  } catch (error) {
    logger.error('Get task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch task'
    });
  }
};

/**
 * Update task
 */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Store previous values for audit
    const previousValues = {
      title: task.title,
      status: task.status,
      category: task.category,
      budget: task.budget
    };

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.__v;
    delete updates.createdBy;

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('assignedTo', 'firstName lastName email');

    // Log admin action
    await logAdminAction(
      'update',
      'task',
      task._id,
      req.admin._id,
      req.admin.role,
      {
        taskTitle: task.title,
        updatedFields: Object.keys(updates),
        previousValues,
        newValues: updates
      },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      data: { task: updatedTask }
    });

  } catch (error) {
    logger.error('Update task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update task'
    });
  }
};

/**
 * Delete task
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    // Soft delete by setting status
    task.status = 'deleted';
    await task.save();

    // Log admin action
    await logAdminAction(
      'delete',
      'task',
      task._id,
      req.admin._id,
      req.admin.role,
      {
        taskTitle: task.title,
        taskCreator: task.createdBy,
        deletedAt: new Date()
      },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully'
    });

  } catch (error) {
    logger.error('Delete task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete task'
    });
  }
};

/**
 * Flag task
 */
const flagTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    await task.flagTask(reason, req.admin._id);

    // Log admin action
    await logAdminAction(
      'update',
      'task',
      task._id,
      req.admin._id,
      req.admin.role,
      {
        action: 'flag_task',
        taskTitle: task.title,
        reason,
        flaggedAt: new Date()
      },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      status: 'success',
      message: 'Task flagged successfully'
    });

  } catch (error) {
    logger.error('Flag task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to flag task'
    });
  }
};

/**
 * Unflag task
 */
const unflagTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    task.flagged = false;
    task.flagReason = undefined;
    task.flaggedBy = undefined;
    task.flaggedAt = undefined;
    await task.save();

    // Log admin action
    await logAdminAction(
      'update',
      'task',
      task._id,
      req.admin._id,
      req.admin.role,
      {
        action: 'unflag_task',
        taskTitle: task.title,
        unflaggedAt: new Date()
      },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      status: 'success',
      message: 'Task unflagged successfully'
    });

  } catch (error) {
    logger.error('Unflag task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to unflag task'
    });
  }
};

/**
 * Assign task to a tasker
 */
const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { taskerId } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    const tasker = await User.findById(taskerId);
    if (!tasker) {
      return res.status(404).json({
        status: 'error',
        message: 'Tasker not found'
      });
    }

    const previousAssignee = task.assignedTo;
    task.assignedTo = taskerId;
    task.status = 'assigned';
    task.assignedAt = new Date();
    await task.save();

    // Log admin action
    await logAdminAction(
      'update',
      'task',
      task._id,
      req.admin._id,
      req.admin.role,
      {
        action: 'assign_task',
        taskTitle: task.title,
        previousAssignee,
        newAssignee: taskerId,
        taskerName: `${tasker.firstName} ${tasker.lastName}`,
        assignedAt: new Date()
      },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      status: 'success',
      message: 'Task assigned successfully'
    });

  } catch (error) {
    logger.error('Assign task error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assign task'
    });
  }
};

/**
 * Export tasks to CSV
 */
const exportTasks = async (req, res) => {
  try {
    const { format = 'csv', filters = {} } = req.body;

    const tasks = await Task.find(filters)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    // Transform data for export
    const exportData = tasks.map(task => ({
      id: task._id,
      title: task.title,
      category: task.category,
      status: task.status,
      budget: task.budget,
      currency: task.currency,
      createdBy: task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : '',
      createdByEmail: task.createdBy?.email || '',
      assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '',
      assignedToEmail: task.assignedTo?.email || '',
      address: task.location?.address || '',
      createdAt: task.createdAt,
      dueDate: task.dueDate,
      flagged: task.flagged,
      flagReason: task.flagReason
    }));

    if (format === 'csv') {
      const fields = [
        'id', 'title', 'category', 'status', 'budget', 'currency',
        'createdBy', 'createdByEmail', 'assignedTo', 'assignedToEmail',
        'address', 'createdAt', 'dueDate', 'flagged', 'flagReason'
      ];

      const json2csvParser = new Transform({ fields });
      const csv = json2csvParser.transform(exportData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="tasks.json"');
      res.json(exportData);
    }

    // Log export action
    await logAdminAction(
      'export_data',
      'task',
      null,
      req.admin._id,
      req.admin.role,
      {
        format,
        recordCount: exportData.length,
        filters
      },
      req.ip,
      req.get('User-Agent')
    );

  } catch (error) {
    logger.error('Export tasks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export tasks'
    });
  }
};

/**
 * Bulk update tasks
 */
const bulkUpdateTasks = async (req, res) => {
  try {
    const { taskIds, updates, action } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Task IDs array is required'
      });
    }

    let result;

    switch (action) {
      case 'updateStatus':
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { $set: { status: updates.status } }
        );
        break;

      case 'updateCategory':
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { $set: { category: updates.category } }
        );
        break;

      case 'flag':
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { 
            $set: { 
              flagged: true,
              flagReason: updates.reason,
              flaggedBy: req.admin._id,
              flaggedAt: new Date()
            } 
          }
        );
        break;

      case 'unflag':
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { 
            $set: { flagged: false },
            $unset: { flagReason: 1, flaggedBy: 1, flaggedAt: 1 }
          }
        );
        break;

      case 'delete':
        result = await Task.updateMany(
          { _id: { $in: taskIds } },
          { $set: { status: 'deleted' } }
        );
        break;

      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid bulk action'
        });
    }

    // Log bulk action
    await logAdminAction(
      'bulk_action',
      'task',
      null,
      req.admin._id,
      req.admin.role,
      {
        action,
        taskIds,
        updates,
        affectedCount: result.modifiedCount
      },
      req.ip,
      req.get('User-Agent')
    );

    res.status(200).json({
      status: 'success',
      message: `Bulk ${action} completed`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    logger.error('Bulk update tasks error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to perform bulk update'
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  flagTask,
  unflagTask,
  assignTask,
  exportTasks,
  bulkUpdateTasks
};
