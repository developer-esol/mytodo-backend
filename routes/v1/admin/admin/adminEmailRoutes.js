const express = require("express");
const router = express.Router();
const adminEmailController = require("../../../../controllers/admin/email/admin.email.controller");
const { adminAuth } = require("../../../../middleware/adminAuthSimple");

router.get(
  "/",
  adminAuth,
  adminEmailController.getSmtpSettings.bind(adminEmailController)
);

router.put(
  "/",
  adminAuth,
  adminEmailController.updateSmtpSettings.bind(adminEmailController)
);

router.post(
  "/test",
  adminAuth,
  adminEmailController.testSmtpConfig.bind(adminEmailController)
);

module.exports = router;
