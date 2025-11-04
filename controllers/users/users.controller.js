const userService = require("../../servicesN/users/user.services");
const multer = require("multer");
const logger = require("../../config/logger");

/**
 * User Controller - HTTP Request/Response Handling Layer
 * Handles HTTP-specific logic and delegates business logic to services
 */
class UserController {
  /**
   * User Signup
   * POST /api/v1/users/signup
   */
  async signup(req, res) {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      location,
      dateOfBirth,
    } = req.body;

    logger.info("Signup request received", {
      controller: "user.controller",
      function: "signup",
      email,
    });

    try {
      const result = await userService.signup({
        firstName,
        lastName,
        email,
        phone,
        password,
        location,
        dateOfBirth,
      });

      logger.info("Signup successful", {
        controller: "user.controller",
        function: "signup",
        email,
      });

      res.status(201).json(result);
    } catch (error) {
      logger.error("Signup error", {
        controller: "user.controller",
        function: "signup",
        email,
        error: error.message,
        stack: error.stack,
      });

      // Handle validation errors with specific field information
      if (error.field) {
        return res.status(400).json({
          success: false,
          message: error.message,
          field: error.field,
          currentAge: error.currentAge,
          minimumAge: error.minimumAge,
        });
      }

      // Handle other errors
      const statusCode = error.message.includes("already") ? 400 : 500;
      res.status(statusCode).json({
        message: error.message || "Server error",
        error: error.message,
      });
    }
  }

  /**
   * User Login
   * POST /api/v1/users/login
   */
  async login(req, res) {
    const { email, password } = req.body;

    logger.info("Login request received at controller - INSPECTING REQUEST", {
      controller: "user.controller",
      function: "login",
      email,
      emailLength: email?.length || 0,
      hasDot: email?.includes(".") || false,
      hasPassword: !!password,
      passwordLength: password?.length || 0,
      rawBody: JSON.stringify(req.body),
      contentType: req.headers["content-type"],
    });

    try {
      const result = await userService.login({ email, password });

      logger.info("Login successful", {
        controller: "user.controller",
        function: "login",
        email,
        userId: result.user._id,
      });

      res.json(result);
    } catch (error) {
      logger.error("Login error", {
        controller: "user.controller",
        function: "login",
        email,
        error: error.message,
        stack: error.stack,
      });

      const statusCode = error.message === "Invalid credentials" ? 400 : 500;
      res.status(statusCode).json({
        message: error.message || "Server error",
      });
    }
  }

  /**
   * Get Firebase Custom Token
   * GET /api/v1/users/firebase-token
   */
  async getFirebaseToken(req, res) {
    logger.info("Firebase token request received", {
      controller: "user.controller",
      function: "getFirebaseToken",
    });

    try {
      // Get token from header
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        logger.warn("Firebase token request without authorization header", {
          controller: "user.controller",
          function: "getFirebaseToken",
        });
        return res.status(401).json({ error: "Authorization token required" });
      }

      const result = await userService.generateFirebaseToken(token);

      logger.info("Firebase token generated successfully", {
        controller: "user.controller",
        function: "getFirebaseToken",
      });

      res.json(result);
    } catch (error) {
      logger.error("Firebase token error", {
        controller: "user.controller",
        function: "getFirebaseToken",
        error: error.message,
        stack: error.stack,
      });

      const statusCode = error.message === "Invalid token" ? 401 : 500;
      res.status(statusCode).json({
        error: error.message || "Failed to generate Firebase token",
      });
    }
  }

  /**
   * Get User Profile
   * GET /api/v1/users/profile
   */
  async getProfile(req, res) {
    const userId = req.user._id;

    logger.info("Profile fetch request received", {
      controller: "user.controller",
      function: "getProfile",
      userId,
    });

    try {
      const profile = await userService.getProfile(userId);

      logger.info("Profile fetched successfully", {
        controller: "user.controller",
        function: "getProfile",
        userId,
      });

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error("Profile fetch error", {
        controller: "user.controller",
        function: "getProfile",
        userId,
        error: error.message,
        stack: error.stack,
      });

      const statusCode = error.message === "User not found" ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error while fetching profile",
      });
    }
  }

  /**
   * Update User Profile
   * PUT /api/v1/users/profile
   */
  async updateProfile(req, res) {
    const userId = req.user._id;
    const { firstName, lastName, phone, location, bio, skills } = req.body;

    logger.info("Profile update request received", {
      controller: "user.controller",
      function: "updateProfile",
      userId,
      hasSkills: !!skills,
    });

    try {
      const profile = await userService.updateProfile(userId, {
        firstName,
        lastName,
        phone,
        location,
        bio,
        skills,
      });

      logger.info("Profile updated successfully", {
        controller: "user.controller",
        function: "updateProfile",
        userId,
      });

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error("Profile update error", {
        controller: "user.controller",
        function: "updateProfile",
        userId,
        error: error.message,
        stack: error.stack,
      });

      const statusCode = error.message === "User not found" ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error while updating profile",
      });
    }
  }

  /**
   * Upload User Avatar
   * POST /api/v1/users/avatar
   */
  async uploadAvatar(req, res) {
    const userId = req.user._id;

    logger.info("Avatar upload request received", {
      controller: "user.controller",
      function: "uploadAvatar",
      userId,
      hasFile: !!req.file,
    });

    try {
      const result = await userService.uploadAvatar(userId, req.file);

      logger.info("Avatar uploaded successfully", {
        controller: "user.controller",
        function: "uploadAvatar",
        userId,
      });

      res.json({
        success: true,
        data: result,
        message: "Avatar uploaded successfully",
      });
    } catch (error) {
      logger.error("Avatar upload error", {
        controller: "user.controller",
        function: "uploadAvatar",
        userId,
        error: error.message,
        stack: error.stack,
        errorCode: error.code,
      });

      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          logger.warn("Avatar file size exceeded", {
            controller: "user.controller",
            function: "uploadAvatar",
            userId,
          });
          return res.status(400).json({
            success: false,
            message: "File size too large. Maximum size is 1MB.",
          });
        }
      }

      const statusCode =
        error.message === "User not found"
          ? 404
          : error.message.includes("too large")
          ? 400
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error while uploading avatar",
      });
    }
  }
}

// Export singleton instance
module.exports = new UserController();
