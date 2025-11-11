const express = require("express");
const router = express.Router();
const adminTaskController = require("../../../../controllers/admin/task/admin.task.controller");
const { adminAuth } = require("../../../../middleware/adminAuthSimple");
const validators = require("../../../../validators/v1/admin/admin.validator");

// Tasks list endpoint
router.get(
  "/",
  adminAuth,
  ...validators.getTasks,
  adminTaskController.getTasks.bind(adminTaskController)
);

// Get single task details
router.get(
  "/:id",
  adminAuth,
  ...validators.getTaskById,
  adminTaskController.getTaskById.bind(adminTaskController)
);

// Update task status
router.patch(
  "/:id/status",
  adminAuth,
  ...validators.updateTaskStatus,
  adminTaskController.updateTaskStatus.bind(adminTaskController)
);

module.exports = router;
