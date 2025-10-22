const mongoose = require("mongoose");

const TransActionSchema = new mongoose.Schema(
  {
    taskId: {type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true},
    posterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {type: Number, required: true},
    serviceFee: {type: Number, required: true},
    totalAmount: {type: Number, required: true},
    paymentStatus: {
      type: String,
      enum: ["requires_payment_method", "pending", "succeeded", "failed"],
      default: "requires_payment_method",
    },
    taskStatus: {
      type: String,
      enum: ["open", "todo", "completed", "overdue", "expired", "done"],
      default: "open",
    },
    serviceType: {
      type: String,
      enum: [
        "Accounting",
        "Admin",
        "Appliance Repair",
        "Assembly",
        "Auto Repair",
        "Babysitting",
        "Baking",
        "Beauty Services",
        "Bookkeeping",
        "Building",
        "Catering",
        "Carpentry",
        "Cleaning",
        "Computer Help",
        "Cooking",
        "Delivery",
        "Design",
        "Dog Walking",
        "Driving",
        "Decoration",
        "Editing",
        "Electrical",
        "Event Planning",
        "Exercise",
        "Equipment Rental",
        "Furniture Assembly",
        "Flooring",
        "Food Delivery",
        "Fencing",
        "Financial Planning",
        "Gardening",
        "Graphic Design",
        "Grocery Shopping",
        "Gutter Cleaning",
        "Gift Shopping",
      ],
      required: true,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
  }
);

// Virtuals for populated data
TransActionSchema.virtual("task", {
  ref: "Task",
  localField: "taskId",
  foreignField: "_id",
  justOne: true,
});

// Add pre-save hook to update task status
TransActionSchema.pre("save", async function (next) {
  if (this.isModified("taskStatus")) {
    try {
      const Task = mongoose.model("Task");
      await Task.findByIdAndUpdate(this.taskId, {status: this.taskStatus});
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  }
  next();
});

module.exports = mongoose.model("TransAction", TransActionSchema);
