const jwt = require("jsonwebtoken");
const adminAuthRepository = require("../../../repository/admin/auth/admin.auth.repository");
const logger = require("../../../config/logger");

class AdminAuthService {
  async login(email, password) {
    try {
      const user = await adminAuthRepository.findAdminByEmail(email);
      if (!user || !adminAuthRepository.isAdminRole(user.role)) {
        throw new Error("Invalid admin credentials");
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new Error("Invalid admin credentials");
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      logger.error("Admin login service error", {
        service: "admin.auth.service",
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new AdminAuthService();
