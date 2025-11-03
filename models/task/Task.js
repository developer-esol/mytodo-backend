const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    categories: { type: [String], required: true },
    locationType: {
      type: String,
      enum: ["In-person", "Online"],
      required: true,
      default: "In-person", // Default for backward compatibility
      index: true,
    },
    dateType: {
      type: String,
      enum: ["Easy", "DoneBy", "DoneOn"],
      required: true,
    },
    dateRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    // ADD BACK MISSING FIELDS
    time: { type: String, required: true },
    location: {
      address: { type: String },
      coordinates: {
        type: new mongoose.Schema(
          {
            type: {
              type: String,
              enum: ["Point"],
              default: "Point",
            },
            coordinates: {
              type: [Number],
              index: "2dsphere",
            },
          },
          { _id: false }
        ),
        required: false,
        default: undefined, // Don't create this field if not provided
      },
    },
    // Moving-specific fields for mobile app
    isMovingTask: { type: Boolean, default: false },
    movingDetails: {
      pickupLocation: {
        address: { type: String },
        postalCode: { type: String },
      },
      dropoffLocation: {
        address: { type: String },
        postalCode: { type: String },
      },
    },
    details: { type: String, required: true },
    budget: { type: Number, required: true },
    currency: { type: String, required: true, default: "USD" },
    images: [{ type: String }],
    // KEEP NEW IMPROVEMENTS
    status: {
      type: String,
      enum: [
        "open",
        "todo",
        "done",
        "completed",
        "cancelled",
        "expired",
        "overdue",
      ],
      default: "open",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // You added required here
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedAt: Date,
    doneAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better performance
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ "dateRange.end": 1 });

// Virtual for offers
TaskSchema.virtual("offers", {
  ref: "Offer",
  localField: "_id",
  foreignField: "taskId",
});

// Middleware to update related transactions
TaskSchema.post("save", async function (doc) {
  if (doc.isModified("status")) {
    try {
      const Transaction = mongoose.model("Transaction");
      await Transaction.updateMany(
        { taskId: doc._id },
        { $set: { taskStatus: doc.status } }
      );
    } catch (error) {
      console.error("Error updating transactions:", error);
    }
  }
});

module.exports = mongoose.model("Task", TaskSchema);
//Chamith
