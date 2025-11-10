const express = require("express");
const router = express.Router();
const adminUserController = require("../../../../controllers/admin/user/admin.user.controller");
const { adminAuth } = require("../../../../middleware/adminAuthSimple");
const validators = require("../../../../validators/v1/admin/admin.validator");

// Users list endpoint
router.get(
  "/",
  adminAuth,
  ...validators.getUsers,
  adminUserController.getUsers.bind(adminUserController)
);

// Get single user details with full rating information
router.get(
  "/:userId",
  adminAuth,
  ...validators.getUserById,
  adminUserController.getUserById.bind(adminUserController)
);

module.exports = router;
