const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("../../../models/user/User");
const PasswordReset = require("../../../models/user/PasswordReset");
const AuthValidator = require("../../../validators/v1/auth/auth.validator");
const { auth } = require("firebase-admin");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email Transporter Configuration (reuse from UserRoutes pattern)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: true, // Enable debug logs
  logger: true, // Enable logger
});

// Google Authentication route
router.post("/google", AuthValidator.googleAuth, async (req, res) => {
  try {
    const { credential } = req.body;

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new Error("No email provided from Google");
    }

    // Check if user exists
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Create new user with Google profile picture
      user = await User.create({
        email: payload.email,
        firstName: payload.given_name || "User",
        lastName: payload.family_name || "",
        googleId: payload.sub,
        avatar: payload.picture || "", // Add Google profile picture
        isVerified: true, // Google users are verified by default
        verified: payload.email_verified || true,
        role: "user",
      });
    } else if (!user.avatar && payload.picture) {
      // Update existing user's avatar if they don't have one
      user.avatar = payload.picture;
      await user.save();
    }

    // Generate JWT token (exclude avatar from JWT to avoid large headers)
    const token = jwt.sign(
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || "user",
          isVerified: user.isVerified,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar || "",
        isVerified: user.isVerified,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      error: "Google authentication failed",
    });
  }
});

// Forgot Password Route
router.post(
  "/forgot-password",
  AuthValidator.forgotPassword,
  async (req, res) => {
    try {
      const { email } = req.body;

      console.log("Forgot password request received for email:", email);

      // Validate email
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists or not for security
        console.log("User not found for email:", email);
        return res.status(200).json({
          success: true,
          message:
            "If your email is registered, you will receive a password reset link",
        });
      }

      console.log("User found, generating reset token for:", email);

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = await bcrypt.hash(resetToken, 10);

      // Set token expiration (15 minutes)
      const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

      // Remove any existing reset tokens for this user
      await PasswordReset.deleteMany({ userId: user._id });

      // Save reset token
      await PasswordReset.create({
        email: user.email,
        resetToken: hashedToken,
        tokenExpires,
        userId: user._id,
      });

      console.log("Reset token saved to database");

      // Create reset URL matching frontend's expected format (Vite default port)
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const resetURL = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
        email
      )}`;

      console.log("Reset URL generated:", resetURL);

      // Verify transporter configuration
      try {
        await transporter.verify();
        console.log("Email transporter verified successfully");
      } catch (verifyError) {
        console.error("Email transporter verification failed:", verifyError);
        return res.status(500).json({
          success: false,
          message: "Email service configuration error",
        });
      }

      // Send reset email
      try {
        const mailOptions = {
          to: email,
          subject: "Password Reset Request",
          text: `You requested a password reset. Click the link below to reset your password:\n\n${resetURL}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetURL}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link expires in 15 minutes.<br>
              If you didn't request this password reset, please ignore this email.
            </p>
            <p style="color: #666; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              ${resetURL}
            </p>
          </div>
        `,
        };

        console.log("Attempting to send email to:", email);
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);
        console.log("Email response:", info.response);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        return res.status(500).json({
          success: false,
          message: "Failed to send reset email. Please try again later.",
        });
      }

      res.status(200).json({
        success: true,
        message:
          "If your email is registered, you will receive a password reset link",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Reset Password Route
router.post(
  "/reset-password",
  AuthValidator.resetPassword,
  async (req, res) => {
    try {
      const { token, email, newPassword } = req.body;

      console.log("Reset password attempt:", {
        email,
        hasToken: !!token,
        hasPassword: !!newPassword,
      });

      // Validate required fields
      if (!token || !email || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Token, email, and new password are required",
        });
      }

      // Validate password strength
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      console.log(
        "Attempting password reset with token:",
        token,
        "for email:",
        email
      );

      // Find the reset token
      const resetRecord = await PasswordReset.findOne({
        email,
        tokenExpires: { $gt: new Date() },
      });

      console.log("Reset record found:", resetRecord ? "Yes" : "No");

      if (!resetRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      // Verify the token
      const isValidToken = await bcrypt.compare(token, resetRecord.resetToken);
      if (!isValidToken) {
        return res.status(400).json({
          success: false,
          message: "Invalid reset token",
        });
      }

      // Find the user
      const user = await User.findById(resetRecord.userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      user.password = hashedPassword;
      await user.save();

      // Delete the used reset token
      await PasswordReset.deleteOne({ _id: resetRecord._id });

      // Send confirmation email
      try {
        await transporter.sendMail({
          to: email,
          subject: "Password Reset Successful",
          text: `Your password has been successfully reset. If you didn't make this change, please contact support immediately.`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Successful</h2>
            <p>Your password has been successfully reset.</p>
            <p>If you didn't make this change, please contact support immediately.</p>
            <p style="color: #666; font-size: 14px;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        `,
        });
      } catch (emailError) {
        console.error("Confirmation email error:", emailError);
        // Don't fail the password reset if confirmation email fails
      }

      res.status(200).json({
        success: true,
        message:
          "Password reset successful. You can now log in with your new password.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Validate Reset Token Route
router.post(
  "/validate-reset-token",
  AuthValidator.validateResetToken,
  async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          valid: false,
          message: "Token is required",
        });
      }

      // Find any valid reset record with this token
      const resetRecord = await PasswordReset.findOne({
        tokenExpires: { $gt: new Date() },
      });

      if (!resetRecord) {
        return res.status(200).json({
          valid: false,
          message: "Invalid or expired reset token",
        });
      }

      // Verify the token
      const isValidToken = await bcrypt.compare(token, resetRecord.resetToken);

      return res.status(200).json({
        valid: isValidToken,
        message: isValidToken ? "Token is valid" : "Invalid reset token",
      });
    } catch (error) {
      console.error("Token validation error:", error);
      return res.status(500).json({
        valid: false,
        message: "Error validating token",
      });
    }
  }
);

// Resend Password Reset Email Route
router.post(
  "/resend-forgot-password",
  AuthValidator.resendForgotPassword,
  async (req, res) => {
    try {
      const { email } = req.body;

      console.log("Resend forgot password request received for email:", email);

      // Validate email
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists or not for security
        console.log("User not found for resend request:", email);
        return res.status(200).json({
          success: true,
          message:
            "If your email is registered, you will receive a password reset link",
        });
      }

      console.log("User found, generating new reset token for:", email);

      // Generate new reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = await bcrypt.hash(resetToken, 10);

      // Set token expiration (15 minutes)
      const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

      // Remove any existing reset tokens for this user
      await PasswordReset.deleteMany({ userId: user._id });

      // Save new reset token
      await PasswordReset.create({
        email: user.email,
        resetToken: hashedToken,
        tokenExpires,
        userId: user._id,
      });

      console.log("New reset token saved to database");

      // Create reset URL (using Vite's default port)
      const resetURL = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      console.log("New reset URL generated:", resetURL);

      // Send reset email
      try {
        const mailOptions = {
          to: email,
          subject: "Password Reset Request (Resent)",
          text: `You requested a password reset. Click the link below to reset your password:\n\n${resetURL}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request (Resent)</h2>
            <p>You requested a password reset for your account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetURL}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link expires in 15 minutes.<br>
              If you didn't request this password reset, please ignore this email.
            </p>
            <p style="color: #666; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              ${resetURL}
            </p>
          </div>
        `,
        };

        console.log("Attempting to resend email to:", email);
        const info = await transporter.sendMail(mailOptions);
        console.log("Resend email sent successfully:", info.messageId);
        console.log("Resend email response:", info.response);
      } catch (emailError) {
        console.error("Resend email sending failed:", emailError);
        return res.status(500).json({
          success: false,
          message: "Failed to resend reset email. Please try again later.",
        });
      }

      res.status(200).json({
        success: true,
        message:
          "If your email is registered, you will receive a new password reset link",
      });
    } catch (error) {
      console.error("Resend forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Cleanup expired password reset tokens (runs every hour)
setInterval(async () => {
  try {
    const result = await PasswordReset.deleteMany({
      tokenExpires: { $lt: new Date() },
    });
    if (result.deletedCount > 0) {
      console.log(
        `Cleaned up ${result.deletedCount} expired password reset tokens`
      );
    }
  } catch (error) {
    console.error("Error cleaning up expired password reset tokens:", error);
  }
}, 60 * 60 * 1000); // Run every hour

module.exports = router;
