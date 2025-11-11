const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const logger = require("../../config/logger");

let SmtpSettingModel;
let transporter;
let transporterVerified = false;
let activeConfigSignature = null;
let defaultFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || "";
let cachedDbConfig = null;
let cachedDbLoadedAt = 0;

const DB_CACHE_TTL = 5 * 60 * 1000;
const CONFIG_KEYS = [
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

const envConfig = {
  host: process.env.SMTP_HOST || null,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null,
  service: process.env.SMTP_SERVICE || null,
  secure: parseBoolean(process.env.SMTP_SECURE),
  requireTLS: parseBoolean(process.env.SMTP_REQUIRE_TLS),
  user: process.env.EMAIL_USER || null,
  pass: process.env.EMAIL_PASS || null,
  from: process.env.EMAIL_FROM || null,
  debug: parseBoolean(process.env.SMTP_DEBUG),
  logger: parseBoolean(process.env.SMTP_LOGGER),
};

function parseBoolean(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return undefined;
}

function toStringValue(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function toNumberValue(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function toBooleanValue(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return undefined;
}

function getSmtpModel() {
  if (!SmtpSettingModel) {
    SmtpSettingModel = require("../../models/admin/SmtpSetting");
  }
  return SmtpSettingModel;
}

function normalizeConfigInput(input = {}) {
  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(input, "host")) {
    normalized.host = toStringValue(input.host);
  }
  if (Object.prototype.hasOwnProperty.call(input, "service")) {
    normalized.service = toStringValue(input.service);
  }
  if (Object.prototype.hasOwnProperty.call(input, "user")) {
    normalized.user = toStringValue(input.user);
  }
  if (Object.prototype.hasOwnProperty.call(input, "pass")) {
    const value = toStringValue(input.pass);
    normalized.pass = value === undefined ? undefined : value;
  }
  if (Object.prototype.hasOwnProperty.call(input, "from")) {
    normalized.from = toStringValue(input.from);
  }
  if (Object.prototype.hasOwnProperty.call(input, "port")) {
    normalized.port = toNumberValue(input.port);
  }
  ["secure", "requireTLS", "debug", "logger"].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      normalized[key] = toBooleanValue(input[key]);
    }
  });

  return normalized;
}

function assignDefined(target, source) {
  CONFIG_KEYS.forEach((key) => {
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      if (value !== undefined) {
        target[key] = value;
      }
    }
  });
}

async function loadDbConfig(force = false) {
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    return null;
  }

  if (
    !force &&
    cachedDbConfig &&
    Date.now() - cachedDbLoadedAt < DB_CACHE_TTL
  ) {
    return cachedDbConfig;
  }

  try {
    const doc = await getSmtpModel().getLatest();
    cachedDbConfig = doc || null;
    cachedDbLoadedAt = Date.now();
    return cachedDbConfig;
  } catch (error) {
    logger.error("Failed to load SMTP settings from database", {
      service: "email.service",
      error: error.message,
    });
    return null;
  }
}

function finalizeConfig(config) {
  const resolved = { ...config };

  if (resolved.port === undefined || resolved.port === null) {
    delete resolved.port;
  }

  if (resolved.secure === undefined || resolved.secure === null) {
    if (resolved.port === 465) {
      resolved.secure = true;
    } else if (resolved.port) {
      resolved.secure = false;
    }
  }

  if (resolved.requireTLS === undefined || resolved.requireTLS === null) {
    resolved.requireTLS = false;
  }

  resolved.debug = resolved.debug === true;
  resolved.logger = resolved.logger === true;

  const envFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || "";
  resolved.from = resolved.from || resolved.user || envFrom;

  return resolved;
}

async function resolveEffectiveConfig({
  overrides = {},
  forceRefresh = false,
} = {}) {
  const effective = { ...envConfig };
  const dbConfig = await loadDbConfig(forceRefresh);

  if (dbConfig) {
    assignDefined(effective, dbConfig);
  }

  assignDefined(effective, overrides);

  return finalizeConfig(effective);
}

function buildTransportConfigFrom(config) {
  const base = {};

  if (config.user || config.pass) {
    base.auth = {
      user: config.user,
      pass: config.pass,
    };
  }

  if (config.debug) {
    base.debug = true;
  }

  if (config.logger) {
    base.logger = true;
  }

  const requireTLS = config.requireTLS === true;

  if (config.host || config.port) {
    const transport = {
      host: config.host || "smtp.gmail.com",
      port: config.port || 465,
      secure: config.secure === true,
      ...base,
    };

    if (requireTLS) {
      transport.requireTLS = true;
    }

    return transport;
  }

  const transport = {
    service: config.service || "Gmail",
    ...base,
  };

  if (config.secure === true) {
    transport.secure = true;
  }

  if (requireTLS) {
    transport.requireTLS = true;
  } else {
    transport.tls = { rejectUnauthorized: false };
  }

  return transport;
}

function configSignature(config) {
  return JSON.stringify(config);
}

async function ensureTransport(force = false) {
  const config = await resolveEffectiveConfig({ forceRefresh: force });
  const signature = configSignature(config);

  if (!transporter || activeConfigSignature !== signature || force) {
    transporter = nodemailer.createTransport(buildTransportConfigFrom(config));
    activeConfigSignature = signature;
    transporterVerified = false;
    defaultFrom =
      config.from || process.env.EMAIL_FROM || process.env.EMAIL_USER || "";

    if (!config.user || !config.pass) {
      logger.warn("SMTP credentials may be incomplete", {
        service: "email.service",
        hasUser: !!config.user,
        hasPass: !!config.pass,
      });
    }
  }

  return transporter;
}

async function verifyConnection(force = false) {
  await ensureTransport(force);

  if (transporterVerified && !force) {
    return true;
  }

  try {
    await transporter.verify();
    transporterVerified = true;
    logger.info("Email transporter verified successfully", {
      service: "email.service",
    });
    return true;
  } catch (error) {
    logger.error("Email transporter verification failed", {
      service: "email.service",
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

function applyDefaultFrom(mailOptions = {}) {
  if (!mailOptions.from && defaultFrom) {
    return { ...mailOptions, from: defaultFrom };
  }
  return mailOptions;
}

async function sendEmail(mailOptions, context = {}) {
  const options = applyDefaultFrom(mailOptions);

  await verifyConnection();

  try {
    const info = await transporter.sendMail(options);
    logger.info("Email sent successfully", {
      service: "email.service",
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
      context,
    });
    return info;
  } catch (error) {
    logger.error("Failed to send email", {
      service: "email.service",
      to: options.to,
      subject: options.subject,
      error: error.message,
      stack: error.stack,
      context,
    });
    throw error;
  }
}

function buildPasswordResetEmail(resetUrl, { isResend = false } = {}) {
  const subject = isResend
    ? "Password Reset Request (Resent)"
    : "Password Reset Request";

  const text = `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`;

  const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>${subject}</h2>
			<p>You requested a password reset for your account.</p>
			<p>Click the button below to reset your password:</p>
			<div style="text-align: center; margin: 30px 0;">
				<a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
					Reset Password
				</a>
			</div>
			<p style="color: #666; font-size: 14px;">
				This link expires in 15 minutes.<br>
				If you didn't request this password reset, please ignore this email.
			</p>
			<p style="color: #666; font-size: 12px;">
				If the button doesn't work, copy and paste this link into your browser:<br>
				${resetUrl}
			</p>
		</div>
	`;

  return { subject, text, html };
}

function buildPasswordResetConfirmationEmail() {
  const subject = "Password Reset Successful";
  const text =
    "Your password has been successfully reset. If you didn't make this change, please contact support immediately.";
  const html = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2>Password Reset Successful</h2>
			<p>Your password has been successfully reset.</p>
			<p>If you didn't make this change, please contact support immediately.</p>
			<p style="color: #666; font-size: 14px;">
				This is an automated message, please do not reply to this email.
			</p>
		</div>
	`;

  return { subject, text, html };
}

function buildOtpEmail(otp) {
  const subject = "Your Verification OTP";
  const text = `Your OTP is ${otp}. It expires in 10 minutes.`;
  const html = `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
  return { subject, text, html };
}

async function sendPasswordResetEmail({
  email,
  resetUrl,
  isResend = false,
  context = {},
}) {
  const template = buildPasswordResetEmail(resetUrl, { isResend });
  return sendEmail(
    {
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    },
    {
      ...context,
      template: isResend ? "password-reset-resend" : "password-reset",
    }
  );
}

async function sendPasswordResetConfirmationEmail({ email, context = {} }) {
  const template = buildPasswordResetConfirmationEmail();
  return sendEmail(
    {
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    },
    { ...context, template: "password-reset-confirmation" }
  );
}

async function sendOtpEmail({ email, otp, subject, text, html, context = {} }) {
  const template = subject || text || html ? {} : buildOtpEmail(otp);
  return sendEmail(
    {
      to: email,
      subject: subject || template.subject,
      text: text || template.text,
      html: html || template.html,
    },
    { ...context, template: context.template || "otp" }
  );
}

async function sendReviewRequestEmail({
  to,
  subject,
  text,
  html,
  context = {},
}) {
  return sendEmail(
    {
      to,
      subject,
      text,
      html,
    },
    { ...context, template: "review-request" }
  );
}

function maskSecret(value) {
  if (!value) return null;
  if (value.length <= 4) {
    return "*".repeat(value.length);
  }
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}

async function getStoredConfig(options = {}) {
  const doc = await loadDbConfig(options.forceRefresh);
  if (!doc) return null;

  return {
    host: doc.host ?? null,
    port: doc.port ?? null,
    service: doc.service ?? null,
    secure: doc.secure ?? null,
    requireTLS: doc.requireTLS ?? null,
    user: doc.user ?? null,
    from: doc.from ?? null,
    debug: doc.debug ?? null,
    logger: doc.logger ?? null,
    hasPassword: !!doc.pass,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
    updatedByEmail: doc.updatedByEmail,
  };
}

async function getEffectiveConfig(options = {}) {
  const config = await resolveEffectiveConfig({
    forceRefresh: options.forceRefresh,
  });
  const { pass, ...rest } = config;

  return {
    ...rest,
    hasPassword: !!pass,
    passwordMasked: pass ? maskSecret(pass) : null,
  };
}

async function upsertConfig(input = {}, metadata = {}) {
  const Model = getSmtpModel();
  const normalized = normalizeConfigInput(input);
  const update = {};

  CONFIG_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(normalized, key)) {
      const value = normalized[key];
      if (value !== undefined) {
        update[key] = value;
      }
    }
  });

  if (metadata.updatedBy) {
    update.updatedBy = metadata.updatedBy;
  }

  if (metadata.updatedByEmail) {
    update.updatedByEmail = metadata.updatedByEmail;
  }

  const result = await Model.findOneAndUpdate(
    {},
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await refreshConfig();

  return result.toObject();
}

function invalidateCache() {
  cachedDbConfig = null;
  cachedDbLoadedAt = 0;
  transporter = null;
  transporterVerified = false;
  activeConfigSignature = null;
  defaultFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || "";
}

async function refreshConfig() {
  invalidateCache();
  try {
    await ensureTransport(true);
  } catch (error) {
    logger.warn("SMTP refresh failed during transport bootstrap", {
      service: "email.service",
      error: error.message,
    });
  }
}

async function testConfig({ config = {}, to, subject, text, html } = {}) {
  const overrides = normalizeConfigInput(config);
  const effective = await resolveEffectiveConfig({ overrides });
  const transport = nodemailer.createTransport(
    buildTransportConfigFrom(effective)
  );

  try {
    await transport.verify();
    let info = null;

    if (to) {
      const message = {
        from: effective.from || effective.user,
        to,
        subject: subject || "SMTP Test",
        text:
          text ||
          "Your SMTP configuration is working. This email confirms a successful connection.",
      };

      if (html) {
        message.html = html;
      }

      info = await transport.sendMail(message);
    }

    return {
      verified: true,
      messageId: info ? info.messageId : null,
    };
  } finally {
    if (typeof transport.close === "function") {
      transport.close();
    }
  }
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendReviewRequestEmail,
  verifyConnection,
  getStoredConfig,
  getEffectiveConfig,
  upsertConfig,
  refreshConfig,
  testConfig,
};
