const adminAuthService = require("../../../servicesN/admin/auth/admin.auth.service");
const { logSuccess, logError } = require("../../../utils/requestLogger");

class AdminAuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await adminAuthService.login(email, password);

      logSuccess(req, "admin.auth.controller", "Admin Login", {
        email,
        userId: result.user?._id,
        userRole: result.user?.role,
      });

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      logError(req, "admin.auth.controller", "Admin Login", error, {
        email: req.body.email,
        attemptedEmail: req.body.email,
      });

      res
        .status(error.message === "Invalid admin credentials" ? 401 : 500)
        .json({
          status: "error",
          message: error.message || "Internal server error",
        });
    }
  }
}

module.exports = new AdminAuthController();
