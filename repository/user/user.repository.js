const User = require("../../models/user/User");
const PendingUser = require("../../models/user/PendingUser");
const logger = require("../../config/logger");

/**
 * User Repository - Data Access Layer
 * Handles all database operations for User and PendingUser models
 */
class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email) {
    logger.debug("Finding user by email", {
      repository: "user.repository",
      function: "findByEmail",
      email,
    });
    return await User.findOne({ email });
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone) {
    logger.debug("Finding user by phone", {
      repository: "user.repository",
      function: "findByPhone",
      hasPhone: !!phone,
    });
    return phone ? await User.findOne({ phone }) : null;
  }

  /**
   * Find user by ID
   */
  async findById(userId, selectFields = "-password") {
    logger.debug("Finding user by ID", {
      repository: "user.repository",
      function: "findById",
      userId,
    });
    return await User.findById(userId).select(selectFields);
  }

  /**
   * Find pending user by email
   */
  async findPendingByEmail(email) {
    logger.debug("Finding pending user by email", {
      repository: "user.repository",
      function: "findPendingByEmail",
      email,
    });
    return await PendingUser.findOne({ email });
  }

  /**
   * Find pending user by phone
   */
  async findPendingByPhone(phone) {
    logger.debug("Finding pending user by phone", {
      repository: "user.repository",
      function: "findPendingByPhone",
      hasPhone: !!phone,
    });
    return phone ? await PendingUser.findOne({ phone }) : null;
  }

  /**
   * Create new pending user
   */
  async createPendingUser(userData) {
    logger.info("Creating pending user", {
      repository: "user.repository",
      function: "createPendingUser",
      email: userData.email,
    });
    return await PendingUser.create(userData);
  }

  /**
   * Update pending user
   */
  async updatePendingUser(pendingUser) {
    logger.info("Updating pending user", {
      repository: "user.repository",
      function: "updatePendingUser",
      email: pendingUser.email,
    });
    return await pendingUser.save();
  }

  /**
   * Delete pending user by email
   */
  async deletePendingByEmail(email) {
    logger.info("Deleting pending user by email", {
      repository: "user.repository",
      function: "deletePendingByEmail",
      email,
    });
    return await PendingUser.deleteOne({ email });
  }

  /**
   * Delete pending user by phone
   */
  async deletePendingByPhone(phone) {
    logger.info("Deleting pending user by phone", {
      repository: "user.repository",
      function: "deletePendingByPhone",
      hasPhone: !!phone,
    });
    return await PendingUser.deleteOne({ phone });
  }

  /**
   * Update user by ID
   */
  async updateUser(userId, updateData) {
    logger.info("Updating user", {
      repository: "user.repository",
      function: "updateUser",
      userId,
      fields: Object.keys(updateData),
    });
    return await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId, avatarUrl) {
    logger.info("Updating user avatar", {
      repository: "user.repository",
      function: "updateAvatar",
      userId,
    });
    return await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select("-password");
  }

  /**
   * Check if user exists by email or phone (parallel check)
   */
  async checkUserExistence(email, phone) {
    logger.debug("Checking user existence", {
      repository: "user.repository",
      function: "checkUserExistence",
      email,
      hasPhone: !!phone,
    });

    const [existingUser, existingUserByPhone, pendingUser, pendingUserByPhone] =
      await Promise.all([
        this.findByEmail(email),
        this.findByPhone(phone),
        this.findPendingByEmail(email),
        this.findPendingByPhone(phone),
      ]);

    return {
      existingUser,
      existingUserByPhone,
      pendingUser,
      pendingUserByPhone,
    };
  }
}

// Export singleton instance
module.exports = new UserRepository();
