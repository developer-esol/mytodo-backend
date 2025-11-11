const adminTaskRepository = require("../../../repository/admin/task/admin.task.repository");
const logger = require("../../../config/logger");

class AdminTaskService {
  buildTaskFilter(search, status, category) {
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (category && category !== "All Categories") {
      filter.categories = {
        $regex: new RegExp(`\\b${category.trim()}\\b`, "i"),
      };
    }

    return filter;
  }

  processTaskData(task) {
    const taskObj = task.toObject();

    if (!taskObj.createdBy) {
      taskObj.createdBy = {
        firstName: "Unknown",
        lastName: "User",
        email: "unknown@example.com",
      };
    }

    if (taskObj.assignedTo === null) {
      taskObj.assignedTo = null;
    }

    return taskObj;
  }

  async getTasks(page, limit, search, status, category) {
    try {
      const skip = (page - 1) * limit;
      const filter = this.buildTaskFilter(search, status, category);

      const tasks = await adminTaskRepository.findTasks(filter, skip, limit);
      const total = await adminTaskRepository.countTasks(filter);

      const processedTasks = tasks.map((task) => this.processTaskData(task));

      return {
        tasks: processedTasks,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTasks: total,
          limit,
        },
      };
    } catch (error) {
      logger.error("Get tasks service error", {
        service: "admin.task.service",
        error: error.message,
      });
      throw error;
    }
  }

  async getTaskById(taskId) {
    try {
      const task = await adminTaskRepository.findTaskById(taskId);

      if (!task) {
        throw new Error("Task not found");
      }

      return task;
    } catch (error) {
      logger.error("Get task by ID service error", {
        service: "admin.task.service",
        error: error.message,
      });
      throw error;
    }
  }

  async updateTaskStatus(taskId, status) {
    try {
      const validStatuses = [
        "open",
        "assigned",
        "in-progress",
        "completed",
        "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        throw new Error("Invalid status");
      }

      const task = await adminTaskRepository.updateTaskStatus(taskId, status);

      if (!task) {
        throw new Error("Task not found");
      }

      return task;
    } catch (error) {
      logger.error("Update task status service error", {
        service: "admin.task.service",
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new AdminTaskService();
