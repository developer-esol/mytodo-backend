const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  taskCreatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  taskTakerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  offer: {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "AUD",
    },
    message: {
      type: String,
      required: false,
    },
    estimatedDuration: {
      type: String,
      required: false,
      trim: true,
    },
  },
  // questions: [
  //   {
  //     question: {
  //       type: String,
  //       required: true,
  //       trim: true,
  //     },
  //     answer: {
  //       type: String,
  //       trim: true,
  //     },
  //   },
  // ],
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "countered", "withdrawn"],
    default: "pending",
  },
  isActive: {
    type: Number,
    default: 1,
    enum: [0, 1],
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
offerSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Offer", offerSchema);
