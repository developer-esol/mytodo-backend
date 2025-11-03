const verificationService = require("../../servicesN/verifications/verification.services");
const logger = require("../../config/logger");

exports.initializeVerification = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await verificationService.initializeVerification(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Verification initialization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize verification",
    });
  }
};

exports.handleCallback = async (req, res) => {
  try {
    const { sessionId, verificationData } = req.body;

    const result = await verificationService.handleCallback(
      sessionId,
      verificationData
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Verification callback error:", error);
    const statusCode = error.message === "User not found" ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to process verification callback",
    });
  }
};

exports.checkVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await verificationService.checkVerificationStatus(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Verification status check error:", error);
    const statusCode =
      error.message === "No verification session found" ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to check verification status",
    });
  }
};


