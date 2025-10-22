const mongoose = require("mongoose");

const PasswordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  resetToken: {
    type: String,
    required: true
  },
  tokenExpires: {
    type: Date,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("PasswordReset", PasswordResetSchema);
