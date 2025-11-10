const logger = require("../config/logger");

/**
 * Extract request metadata for logging
 */
const getRequestMetadata = (req) => {
  // Get IP address (handles proxies)
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    "unknown";

  // Get user agent details
  const userAgent = req.headers["user-agent"] || "unknown";

  // Extract browser and device info from user-agent
  const getBrowserInfo = (ua) => {
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    if (ua.includes("Opera")) return "Opera";
    return "Unknown";
  };

  const getDeviceInfo = (ua) => {
    if (ua.includes("Mobile")) return "Mobile";
    if (ua.includes("Tablet")) return "Tablet";
    if (ua.includes("Android")) return "Android Device";
    if (ua.includes("iPhone")) return "iPhone";
    if (ua.includes("iPad")) return "iPad";
    return "Desktop";
  };

  const getOSInfo = (ua) => {
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac OS")) return "MacOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS")) return "iOS";
    return "Unknown";
  };

  return {
    ip,
    userAgent,
    browser: getBrowserInfo(userAgent),
    device: getDeviceInfo(userAgent),
    os: getOSInfo(userAgent),
    userId: req.user?._id?.toString() || req.user?.id?.toString() || "guest",
    userEmail: req.user?.email || "guest",
    userRole: req.user?.role || "guest",
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params,
  };
};

/**
 * Log successful request
 */
const logSuccess = (req, service, action, additionalData = {}) => {
  const metadata = getRequestMetadata(req);

  logger.info(`${action} - Success`, {
    service,
    action,
    status: "success",
    ...metadata,
    ...additionalData,
  });
};

/**
 * Log error request
 */
const logError = (req, service, action, error, additionalData = {}) => {
  const metadata = getRequestMetadata(req);

  logger.error(`${action} - Error`, {
    service,
    action,
    status: "error",
    error: error.message,
    stack: error.stack,
    ...metadata,
    ...additionalData,
  });
};

module.exports = {
  getRequestMetadata,
  logSuccess,
  logError,
};
