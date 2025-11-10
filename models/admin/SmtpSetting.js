const mongoose = require("mongoose");

const smtpSettingSchema = new mongoose.Schema(
  {
    host: { type: String, trim: true },
    port: { type: Number, min: 1 },
    service: { type: String, trim: true },
    secure: { type: Boolean, default: false },
    requireTLS: { type: Boolean, default: false },
    user: { type: String, trim: true },
    pass: { type: String },
    from: { type: String, trim: true },
    debug: { type: Boolean, default: false },
    logger: { type: Boolean, default: false },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedByEmail: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

smtpSettingSchema.statics.getLatest = function () {
  return this.findOne().sort({ updatedAt: -1 }).lean();
};

module.exports = mongoose.model("SmtpSetting", smtpSettingSchema);
