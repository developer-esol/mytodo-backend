//Two Factor Auth
const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../../../models/user/User");
const PendingUser = require("../../../models/user/PendingUser");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const twofactorAuthValidator = require("../../../validators/v1/auth/twofactorAuth.validator");

const router = express.Router();
require("dotenv").config(); // if using .env

console.log("SID:", process.env.TWILIO_ACCOUNT_SID ? "[present]" : "[MISSING]");
console.log(
  "TOKEN:",
  process.env.TWILIO_AUTH_TOKEN ? "[present]" : "[MISSING]"
);
console.log(
  "VERIFY_SID:",
  process.env.VERIFY_SERVICE_SID ? "[present]" : "[MISSING]"
);

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Twilio Client Configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// OTP Generation
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Utility function to clean up conflicting registrations
const cleanupConflictingRegistrations = async (email, phone) => {
  try {
    // Remove any expired pending users first
    await PendingUser.deleteMany({
      otpExpires: { $lt: new Date() },
    });

    // If a user tries to register with the same email but different phone,
    // or same phone but different email, handle appropriately
    if (phone) {
      const conflictingPendingUser = await PendingUser.findOne({
        phone: phone,
        email: { $ne: email },
      });

      if (conflictingPendingUser) {
        // Check if the conflicting registration is expired
        if (conflictingPendingUser.otpExpires < new Date()) {
          await PendingUser.deleteOne({ _id: conflictingPendingUser._id });
        } else {
          return {
            error:
              "This phone number is currently being used for another registration. Please try again later or use a different phone number.",
          };
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Cleanup error:", error);
    return { error: "System error during cleanup" };
  }
};

// Send OTP via both Email and SMS
const sendOTP = async (email, phone, otp) => {
  try {
    // Send Email
    await transporter.sendMail({
      to: email,
      subject: "Your Verification OTP",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });
    console.log(`OTP sent to email: ${email}`);

    // Send SMS if phone number exists and Twilio is configured
    if (
      phone &&
      process.env.TWILIO_PHONE_NUMBER &&
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN
    ) {
      try {
        await twilioClient.messages.create({
          body: `Your verification OTP is ${otp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        });
        console.log(`OTP sent to phone: ${phone}`);
      } catch (smsError) {
        console.warn(`Failed to send SMS to ${phone}:`, smsError.message);
        // Don't throw error for SMS failure, email is sufficient
      }
    } else if (phone) {
      console.warn(
        `SMS sending skipped for ${phone}: Twilio not properly configured`
      );
    }

    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

// OTP Verification Route
router.post(
  "/otp-verification",
  ...twofactorAuthValidator.otpVerification,
  async (req, res) => {
    const { email, otp } = req.body;
    console.log("OTP verification request received:", { email, otp });
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    try {
      const pendingUser = await PendingUser.findOne({
        email: { $regex: new RegExp(`^${email}$`, "i") },
      });

      if (!pendingUser) {
        return res.status(400).json({
          success: false,
          message: "No pending verification found or OTP expired",
        });
      }

      if (new Date(pendingUser.otpExpires) < new Date()) {
        await PendingUser.deleteOne({ email });
        return res.status(400).json({
          success: false,
          message: "OTP expired. Please request a new one.",
        });
      }

      const isValidOTP = await bcrypt.compare(otp, pendingUser.otp);
      if (!isValidOTP) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        await PendingUser.deleteOne({ email });
        return res.status(409).json({
          success: false,
          message: "Account already exists. Please login.",
        });
      }

      // Send SMS OTP via Twilio Verify
      const verification = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
          to: pendingUser.phone,
          channel: "sms",
        });

      console.log("Twilio SMS OTP sent:", verification.status);

      // Respond with success and move to next step
      return res.status(200).json({
        verified: true,
        stage: "sms",
        message: "Email verified. SMS OTP sent to phone.",
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during verification",
      });
    }
  }
);
router.post(
  "/sms-verification",
  ...twofactorAuthValidator.smsVerification,
  async (req, res) => {
    const { email, otp } = req.body;
    console.log("SMS verification request received:", { email, otp });

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and SMS OTP are required" });
    }

    try {
      const pendingUser = await PendingUser.findOne({ email });
      if (!pendingUser) {
        return res
          .status(400)
          .json({ success: false, message: "No pending verification found" });
      }

      // Verify SMS OTP using Twilio
      const verificationCheck = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: pendingUser.phone,
          code: otp,
        });
      if (verificationCheck.status !== "approved") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired SMS OTP" });
      }
      const isValidOTP = await bcrypt.compare(otp, pendingUser.otp);

      // Check if user with same email already exists
      const existingUserByEmail = await User.findOne({
        email: pendingUser.email,
      });
      if (existingUserByEmail) {
        await PendingUser.deleteOne({ email });
        return res.status(400).json({
          success: false,
          message: "Account with this email already exists. Please login.",
        });
      }

      // Check if user with same phone already exists
      const existingUserByPhone = await User.findOne({
        phone: pendingUser.phone,
      });
      if (existingUserByPhone) {
        // If phone is already used by a different email, handle appropriately
        if (existingUserByPhone.email !== pendingUser.email) {
          await PendingUser.deleteOne({ email });
          return res.status(400).json({
            success: false,
            message:
              "This phone number is already registered with another account.",
          });
        }
      }

      try {
        // Create the verified user
        const newUser = new User({
          firstName: pendingUser.firstName,
          lastName: pendingUser.lastName,
          email: pendingUser.email,
          phone: pendingUser.phone,
          password: pendingUser.password,
          location: pendingUser.location, // Transfer location data
          dateOfBirth: pendingUser.dateOfBirth, // Transfer date of birth
          isVerified: true,
          verifiedAt: new Date(),
        });

        await newUser.save();
        await PendingUser.deleteOne({ email });

        const token = jwt.sign(
          {
            user: {
              id: newUser.id,
              email: newUser.email,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              role: newUser.role || "user",
              isVerified: true,
            },
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 3600000,
          sameSite: "strict",
        });

        return res.status(200).json({
          verified: true,
          token,
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phone: newUser.phone,
            location: newUser.location, // Include location in response
            age: newUser.age, // Include calculated age (virtual property)
            ageRange: newUser.ageRange, // Include age range for privacy
            role: newUser.role || "user",
            isVerified: true,
          },
          message: "Account verified and created successfully!",
        });
      } catch (saveError) {
        console.error("User creation error:", saveError);

        // If it's a duplicate key error, provide specific message
        if (saveError.code === 11000) {
          if (saveError.keyPattern.email) {
            return res.status(400).json({
              success: false,
              message:
                "This email is already registered. Please login or use a different email.",
            });
          } else if (saveError.keyPattern.phone) {
            return res.status(400).json({
              success: false,
              message:
                "This phone number is already registered. Please use a different phone number.",
            });
          }
        }

        return res.status(500).json({
          success: false,
          message: "Failed to create account. Please try again.",
        });
      }
    } catch (error) {
      console.error("SMS verification error:", error);
      return res.status(500).json({
        verified: false,
        message: "An error occurred during SMS verification",
      });
    }
  }
);

// Resend OTP Route
router.post(
  "/resend-otp",
  ...twofactorAuthValidator.resendOtp,
  async (req, res) => {
    const { email, phone } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    try {
      // Clean up expired registrations first
      await cleanupConflictingRegistrations(email, phone);

      let pendingUser = await PendingUser.findOne({ email });
      if (!pendingUser) {
        return res.status(400).json({
          success: false,
          message: "No pending verification found. Please signup first.",
        });
      }

      // Generate new OTP
      const otp = generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);

      // Update pending user
      pendingUser.otp = hashedOTP;
      pendingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update phone if provided and different
      if (phone && phone !== pendingUser.phone) {
        // Check if new phone is already in use
        const existingUserByPhone = await User.findOne({ phone });
        const existingPendingByPhone = await PendingUser.findOne({
          phone,
          email: { $ne: email },
        });

        if (existingUserByPhone) {
          return res.status(400).json({
            success: false,
            message:
              "This phone number is already registered with another account.",
          });
        }

        if (existingPendingByPhone) {
          return res.status(400).json({
            success: false,
            message:
              "This phone number is currently being used for another registration.",
          });
        }

        pendingUser.phone = phone;
      }

      await pendingUser.save();

      // Send OTP via both channels
      try {
        await sendOTP(email, phone || pendingUser.phone, otp);

        return res.status(200).json({
          success: true,
          message: "New OTP sent successfully",
        });
      } catch (sendError) {
        console.error("Error sending OTP:", sendError);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP. Please try again.",
        });
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP",
      });
    }
  }
);

// Send Email OTP Route
router.post(
  "/send-email",
  ...twofactorAuthValidator.sendEmail,
  async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Check if there's a pending user
      let pendingUser = await PendingUser.findOne({ email });
      if (!pendingUser) {
        return res.status(400).json({
          success: false,
          message: "No pending verification found. Please signup first.",
        });
      }

      // Generate new OTP
      const otp = generateOTP();
      const hashedOTP = await bcrypt.hash(otp, 10);

      // Update pending user with new OTP
      pendingUser.otp = hashedOTP;
      pendingUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await pendingUser.save();

      // Send OTP via email only
      await transporter.sendMail({
        to: email,
        subject: "Your Verification OTP",
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
      });

      console.log(`OTP sent to email: ${email}`);

      return res.status(200).json({
        success: true,
        message: "OTP sent to your email successfully",
      });
    } catch (error) {
      console.error("Send email OTP error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
      });
    }
  }
);

// Check availability route (email and phone)
router.post(
  "/check-availability",
  ...twofactorAuthValidator.checkAvailability,
  async (req, res) => {
    const { email, phone } = req.body;

    try {
      const results = {};

      if (email) {
        const [existingUser, pendingUser] = await Promise.all([
          User.findOne({ email }),
          PendingUser.findOne({ email }),
        ]);

        results.email = {
          available: !existingUser,
          pending: !!pendingUser,
          message: existingUser
            ? "Email is already registered"
            : pendingUser
            ? "Email has pending verification"
            : "Email is available",
        };
      }

      if (phone) {
        const [existingUserByPhone, pendingUserByPhone] = await Promise.all([
          User.findOne({ phone }),
          PendingUser.findOne({ phone }),
        ]);

        results.phone = {
          available: !existingUserByPhone && !pendingUserByPhone,
          message: existingUserByPhone
            ? "Phone number is already registered"
            : pendingUserByPhone
            ? "Phone number has pending verification"
            : "Phone number is available",
        };
      }

      return res.status(200).json({
        success: true,
        results,
      });
    } catch (error) {
      console.error("Check availability error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to check availability",
      });
    }
  }
);

// Cleanup expired OTPs
setInterval(async () => {
  try {
    const result = await PendingUser.deleteMany({
      otpExpires: { $lt: new Date() },
    });
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
    }
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error);
  }
}, 60000); // Run every minute

module.exports = router;
