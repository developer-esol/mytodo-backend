const emailService = require("../../../shared/services/email.service");
const logger = require("../../../config/logger");

class AdminEmailService {
  extractConfigPayload(body, fields) {
    const payload = {};
    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        payload[field] = body[field];
      }
    });
    return payload;
  }

  async getSmtpSettings() {
    try {
      const [stored, effective] = await Promise.all([
        emailService.getStoredConfig(),
        emailService.getEffectiveConfig(),
      ]);

      return {
        stored,
        effective,
        source: stored ? "database" : "environment",
      };
    } catch (error) {
      logger.error("Get SMTP settings service error", {
        service: "admin.email.service",
        error: error.message,
      });
      throw error;
    }
  }

  async updateSmtpSettings(update, metadata) {
    try {
      if (!Object.keys(update).length) {
        throw new Error("No SMTP configuration fields provided");
      }

      await emailService.upsertConfig(update, metadata);

      const stored = await emailService.getStoredConfig({ forceRefresh: true });
      const effective = await emailService.getEffectiveConfig({
        forceRefresh: true,
      });

      return {
        stored,
        effective,
      };
    } catch (error) {
      logger.error("Update SMTP settings service error", {
        service: "admin.email.service",
        error: error.message,
      });
      throw error;
    }
  }

  async testSmtpConfig(config, to, subject, text, html) {
    try {
      const result = await emailService.testConfig({
        config,
        to,
        subject,
        text,
        html,
      });

      return result;
    } catch (error) {
      logger.error("Test SMTP config service error", {
        service: "admin.email.service",
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new AdminEmailService();
