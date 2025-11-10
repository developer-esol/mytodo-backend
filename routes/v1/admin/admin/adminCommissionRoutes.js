const express = require("express");
const router = express.Router();
const adminCommissionController = require("../../../../controllers/admin/commission/admin.commission.controller");
const { adminAuth } = require("../../../../middleware/adminAuthSimple");
const validators = require("../../../../validators/v1/admin/admin.validator");

// Commission Settings Endpoint (maps to service fee configuration)
router.get(
  "/",
  adminAuth,
  adminCommissionController.getCommissionSettings.bind(
    adminCommissionController
  )
);

// Update Commission Settings Endpoint
router.put(
  "/",
  adminAuth,
  ...validators.updateCommissionSettings,
  adminCommissionController.updateCommissionSettings.bind(
    adminCommissionController
  )
);

module.exports = router;
