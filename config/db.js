const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected successfully", {
      file: "config/db.js",
      function: "connectDB",
    });
  } catch (err) {
    logger.error("MongoDB connection failed", {
      file: "config/db.js",
      function: "connectDB",
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

module.exports = connectDB;
