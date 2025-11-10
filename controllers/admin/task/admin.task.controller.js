const adminTaskService = require("../../../servicesN/admin/task/admin.task.service");
const { logSuccess, logError } = require("../../../utils/requestLogger");

class AdminTaskController {
  async getTasks(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || "";
      const status = req.query.status || "";
      const category = req.query.category || "";

      const result = await adminTaskService.getTasks(
        page,
        limit,
        search,
        status,
        category
      );

      logSuccess(req, "admin.task.controller", "Get Tasks", {
        page,
        limit,
        totalTasks: result.total,
        totalPages: result.pages,
        filters: { search, status, category },
      });

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      logError(req, "admin.task.controller", "Get Tasks", error, {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        category: req.query.category,
      });

      res.status(500).json({
        status: "error",
        message: "Failed to fetch tasks",
      });
    }
  }

  async getTaskById(req, res) {
    try {
      const task = await adminTaskService.getTaskById(req.params.id);

      logSuccess(req, "admin.task.controller", "Get Task Details", {
        taskId: req.params.id,
        taskTitle: task.title,
        taskStatus: task.status,
        taskCategory: task.category?.name,
      });

      res.json({
        status: "success",
        data: { task },
      });
    } catch (error) {
      logError(req, "admin.task.controller", "Get Task Details", error, {
        taskId: req.params.id,
      });

      res.status(error.message === "Task not found" ? 404 : 500).json({
        status: "error",
        message: error.message || "Failed to fetch task",
      });
    }
  }

  async updateTaskStatus(req, res) {
    try {
      const { status } = req.body;
      const task = await adminTaskService.updateTaskStatus(
        req.params.id,
        status
      );

      logSuccess(req, "admin.task.controller", "Update Task Status", {
        taskId: req.params.id,
        oldStatus: task.status,
        newStatus: status,
        taskTitle: task.title,
      });

      res.json({
        status: "success",
        data: { task },
        message: "Task status updated successfully",
      });
    } catch (error) {
      logError(req, "admin.task.controller", "Update Task Status", error, {
        taskId: req.params.id,
        attemptedStatus: req.body.status,
      });

      const statusCode =
        error.message === "Task not found"
          ? 404
          : error.message === "Invalid status"
          ? 400
          : 500;
      res.status(statusCode).json({
        status: "error",
        message: error.message || "Failed to update task status",
      });
    }
  }
}

module.exports = new AdminTaskController();
