// Quick test to verify logger is working correctly
const logger = require("./config/logger");

console.log("=== Logger Verification Test ===\n");

// Test all log levels
logger.error("Test ERROR level", { test: "error", code: 500 });
logger.warn("Test WARN level", { test: "warning", userId: "12345" });
logger.info("Test INFO level", { test: "info", action: "completed" });
logger.debug("Test DEBUG level", { test: "debug", details: { a: 1, b: 2 } });

console.log("\n✓ Logger test completed");
console.log("✓ Check logs/ directory for output files");
console.log("✓ All levels should appear in console (if NODE_ENV=development)");
console.log("✓ Errors should appear in logs/error.log");
console.log("✓ All logs should appear in logs/combined.log\n");
