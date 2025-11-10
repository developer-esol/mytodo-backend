const adminEmailService = require("../../../servicesN/admin/email/admin.email.service");
const { logSuccess, logError } = require("../../../utils/requestLogger");

const CONFIG_FIELDS = [
  "host",
  "port",
  "service",
  "secure",
  "requireTLS",
  "user",
  "pass",
  "from",
  "debug",
  "logger",
];

class AdminEmailController {
  async getSmtpSettings(req, res) {
    try {
      const settings = await adminEmailService.getSmtpSettings();

      logSuccess(req, "admin.email.controller", "Get SMTP Settings", {
        smtpHost: settings.host,
        smtpService: settings.service,
        smtpPort: settings.port,
      });

      res.json({
        status: "success",
        data: settings,
      });
    } catch (error) {
      logError(req, "admin.email.controller", "Get SMTP Settings", error);

      res.status(500).json({
        status: "error",
        message: "Failed to load SMTP settings",
      });
    }
  }

  async updateSmtpSettings(req, res) {
    try {
      const update = {
        ...adminEmailService.extractConfigPayload(req.body, CONFIG_FIELDS),
        ...adminEmailService.extractConfigPayload(
          req.body?.config || {},
          CONFIG_FIELDS
        ),
      };

      const result = await adminEmailService.updateSmtpSettings(update, {
        updatedBy: req.user?._id,
        updatedByEmail: req.user?.email,
      });

      logSuccess(req, "admin.email.controller", "Update SMTP Settings", {
        smtpHost: update.host,
        smtpService: update.service,
        smtpPort: update.port,
        updatedBy: req.user?.email,
      });

      res.json({
        status: "success",
        message: "SMTP settings updated",
        data: result,
      });
    } catch (error) {
      logError(req, "admin.email.controller", "Update SMTP Settings", error, {
        attemptedHost: req.body.host,
        attemptedService: req.body.service,
      });

      res
        .status(
          error.message === "No SMTP configuration fields provided" ? 400 : 500
        )
        .json({
          status: "error",
          message: error.message || "Failed to update SMTP settings",
        });
    }
  }

  async testSmtpConfig(req, res) {
    try {
      const { to, subject, text, html } = req.body || {};
      const config = {
        ...adminEmailService.extractConfigPayload(req.body, CONFIG_FIELDS),
        ...adminEmailService.extractConfigPayload(
          req.body?.config || {},
          CONFIG_FIELDS
        ),
      };

      const result = await adminEmailService.testSmtpConfig(
        config,
        to,
        subject,
        text,
        html
      );

      logSuccess(req, "admin.email.controller", "Test SMTP Configuration", {
        testRecipient: to,
        smtpHost: config.host || "default",
        smtpService: config.service || "default",
        messageId: result.messageId,
        testType: result.messageId ? "email_sent" : "connection_verified",
      });

      res.json({
        status: "success",
        message: result.messageId
          ? "SMTP test email sent"
          : "SMTP connection verified",
        data: result,
      });
    } catch (error) {
      logError(
        req,
        "admin.email.controller",
        "Test SMTP Configuration",
        error,
        {
          testRecipient: req.body.to,
          smtpHost: req.body.host || req.body.config?.host,
          smtpService: req.body.service || req.body.config?.service,
        }
      );

      res.status(500).json({
        status: "error",
        message: "SMTP test failed",
        details: error.message,
      });
    }
  }
}

module.exports = new AdminEmailController();
