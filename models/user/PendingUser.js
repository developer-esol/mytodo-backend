const mongoose = require("mongoose");

const PendingUserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    phone: { type: String }, // Allow null/undefined values, but enforce uniqueness when present
    password: String, // Hashed password
    otp: String, // Hashed OTP
    otpExpires: Date,
    // Location data to be transferred to User after verification
    location: {
      country: {
        type: String,
      },
      countryCode: {
        type: String,
      },
      suburb: {
        type: String,
      },
      region: String,
      city: String,
    },
    // Date of birth to be transferred to User after verification
    dateOfBirth: {
      type: Date,
    },
  },
  {
    timestamps: true, // Add createdAt and updatedAt timestamps
  }
);

// Create compound index to ensure phone uniqueness when present
PendingUserSchema.index({ phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("PendingUser", PendingUserSchema);
