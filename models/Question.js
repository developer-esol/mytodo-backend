const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    userId: {
      // User asking the question
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    posterId: {
      // Task creator (for quick filtering)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      text: {type: String, required: true},
      timestamp: {type: Date, default: Date.now},
      images: [{
        type: String,  // S3 URLs for question images
        validate: {
          validator: function(url) {
            // Validate S3 URL format
            return !url || url.startsWith('https://') && url.includes('.s3.');
          },
          message: 'Invalid S3 image URL format'
        }
      }]
    },
    answer: {
      text: {type: String},
      timestamp: {type: Date},
      answeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      images: [{
        type: String,  // S3 URLs for answer images
        validate: {
          validator: function(url) {
            // Validate S3 URL format
            return !url || url.startsWith('https://') && url.includes('.s3.');
          },
          message: 'Invalid S3 image URL format'
        }
      }]
    },
    status: {
      type: String,
      enum: ["pending", "answered"],
      default: "pending",
    },
  },
  {timestamps: true}
);

module.exports = mongoose.model("Question", questionSchema);