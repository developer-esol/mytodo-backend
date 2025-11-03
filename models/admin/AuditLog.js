// In this file is not used

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "password_change",
        "profile_update",
        "task_create",
        "task_update",
        "task_delete",
        "user_suspend",
        "user_activate",
        "user_delete",
        "payment_process",
        "admin_access",
        "settings_change",
        "export_data",
        "import_data",
        "bulk_action",
        "system_config",
        "security_event",
        "error_event",
      ],
    },
    resource: {
      type: String,
      required: [true, "Resource is required"],
      enum: [
        "user",
        "task",
        "payment",
        "offer",
        "review",
        "message",
        "admin_setting",
        "system_config",
        "export",
        "import",
        "notification",
        "media",
        "category",
        "tag",
      ],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return (
          this.resource !== "system_config" &&
          this.resource !== "export" &&
          this.resource !== "import" &&
          this.action !== "login"
        );
      },
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow null for failed login attempts
    },
    performedByRole: {
      type: String,
      required: true,
      enum: ["admin", "superadmin", "system", "user"],
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    previousValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
    },
    sessionId: {
      type: String,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    category: {
      type: String,
      enum: [
        "authentication",
        "authorization",
        "data_modification",
        "system_administration",
        "security",
        "user_management",
        "content_management",
        "financial",
        "communication",
        "reporting",
      ],
      required: true,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
    collection: "audit_logs",
  }
);

// Indexes for efficient querying
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ targetUser: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });
auditLogSchema.index({ resourceId: 1, timestamp: -1 });

// Compound indexes for common queries
auditLogSchema.index({ performedBy: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, action: 1, timestamp: -1 });

// TTL index to automatically delete old logs (optional - keep 2 years)
auditLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 * 2 }
);

// Static methods for common queries
auditLogSchema.statics.findByUser = function (userId, limit = 50) {
  return this.find({ performedBy: userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("performedBy", "firstName lastName email");
};

auditLogSchema.statics.findByResource = function (
  resource,
  resourceId,
  limit = 50
) {
  return this.find({ resource, resourceId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("performedBy", "firstName lastName email");
};

auditLogSchema.statics.findByAction = function (action, limit = 50) {
  return this.find({ action })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("performedBy", "firstName lastName email");
};

auditLogSchema.statics.findByDateRange = function (
  startDate,
  endDate,
  limit = 100
) {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("performedBy", "firstName lastName email");
};

auditLogSchema.statics.findSecurityEvents = function (limit = 100) {
  return this.find({
    $or: [
      { category: "security" },
      { severity: { $in: ["high", "critical"] } },
      { success: false },
    ],
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("performedBy", "firstName lastName email");
};

auditLogSchema.statics.getActivityStats = function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          action: "$action",
          resource: "$resource",
        },
        count: { $sum: 1 },
        lastActivity: { $max: "$timestamp" },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 20,
    },
  ]);
};

auditLogSchema.statics.getUserActivitySummary = function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        performedBy: mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
        lastActivity: { $max: "$timestamp" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

// Instance method to format for display
auditLogSchema.methods.getDisplayFormat = function () {
  return {
    id: this._id,
    action: this.action,
    resource: this.resource,
    resourceId: this.resourceId,
    performedBy: this.performedBy,
    timestamp: this.timestamp,
    success: this.success,
    details: this.details,
    severity: this.severity,
    category: this.category,
    ipAddress: this.ipAddress,
  };
};

module.exports = mongoose.model("AuditLog", auditLogSchema);
