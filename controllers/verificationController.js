const ratifyIDService = require("../services/ratifyIDService");
const User = require("../models/user/User");

exports.initializeVerification = async (req, res) => {
  try {
    const userId = req.user._id;

    // Initialize verification session with RatifyID
    const verificationSession = await ratifyIDService.initialize(userId);

    // Store verification session ID in user record
    await User.findByIdAndUpdate(userId, {
      "verification.ratifyId.sessionId": verificationSession.id,
      "verification.ratifyId.status": "pending",
    });

    res.status(200).json({
      success: true,
      data: {
        verificationUrl: verificationSession.redirectUrl,
        sessionId: verificationSession.id,
      },
    });
  } catch (error) {
    console.error("Verification initialization error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize verification",
    });
  }
};

exports.handleCallback = async (req, res) => {
  try {
    const { sessionId, verificationData } = req.body;

    // Verify the callback data with RatifyID
    const verificationResult = await ratifyIDService.verifyCallback(
      verificationData
    );

    // Find user by session ID
    const user = await User.findOne({
      "verification.ratifyId.sessionId": sessionId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user verification status
    user.verification.ratifyId.status = verificationResult.status;
    user.verification.ratifyId.completedAt = new Date();
    user.verification.ratifyId.details = verificationResult;

    if (verificationResult.status === "verified") {
      user.isVerified = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        status: verificationResult.status,
      },
    });
  } catch (error) {
    console.error("Verification callback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process verification callback",
    });
  }
};

exports.checkVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user?.verification?.ratifyId?.sessionId) {
      return res.status(400).json({
        success: false,
        message: "No verification session found",
      });
    }

    const status = await ratifyIDService.getVerificationStatus(
      user.verification.ratifyId.sessionId
    );

    res.status(200).json({
      success: true,
      data: {
        status: status.status,
        completedAt: user.verification.ratifyId.completedAt,
      },
    });
  } catch (error) {
    console.error("Verification status check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check verification status",
    });
  }
};

// Exports are handled directly above with each function
