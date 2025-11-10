const adminUserService = require("../../../servicesN/admin/user/admin.user.service");
const { logSuccess, logError } = require("../../../utils/requestLogger");

class AdminUserController {
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || "";
      const role = req.query.role || "";
      const status = req.query.status || "";

      const result = await adminUserService.getUsers(
        page,
        limit,
        search,
        role,
        status
      );

      logSuccess(req, "admin.user.controller", "Get Users", {
        page,
        limit,
        totalUsers: result.total,
        totalPages: result.pages,
        filters: { search, role, status },
      });

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      logError(req, "admin.user.controller", "Get Users", error, {
        page: req.query.page,
        limit: req.query.limit,
        role: req.query.role,
        status: req.query.status,
      });

      res.status(500).json({
        status: "error",
        message: "Failed to fetch users",
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { userId } = req.params;

      const user = await adminUserService.getUserById(userId);

      logSuccess(req, "admin.user.controller", "Get User Details", {
        targetUserId: userId,
        targetUserEmail: user.email,
        targetUserRole: user.role,
      });

      res.json({
        status: "success",
        data: user,
      });
    } catch (error) {
      logError(req, "admin.user.controller", "Get User Details", error, {
        targetUserId: req.params.userId,
      });

      res.status(error.message === "User not found" ? 404 : 500).json({
        status: "error",
        message: error.message || "Failed to fetch user details",
      });
    }
  }
}

module.exports = new AdminUserController();
