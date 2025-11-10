const express = require("express");
const router = express.Router();
const adminAuthController = require("../../../../controllers/admin/auth/admin.auth.controller");
const validators = require("../../../../validators/v1/admin/admin.validator");

// Admin login route
router.post(
  "/login",
  ...validators.adminLogin,
  adminAuthController.login.bind(adminAuthController)
);

module.exports = router;
