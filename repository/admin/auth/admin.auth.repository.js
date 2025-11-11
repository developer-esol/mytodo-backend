const User = require("../../../models/user/User");

class AdminAuthRepository {
  async findAdminByEmail(email) {
    return await User.findOne({ email }).select("+password");
  }

  async isAdminRole(role) {
    return ["admin", "superadmin"].includes(role);
  }
}

module.exports = new AdminAuthRepository();
