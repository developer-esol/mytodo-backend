const User = require("../../../models/user/User");

class AdminUserRepository {
  async findUsers(filter, skip, limit) {
    return await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async countUsers(filter) {
    return await User.countDocuments(filter);
  }

  async findUserById(userId) {
    return await User.findById(userId).select("-password");
  }

  async getUserStats(thirtyDaysAgo, sevenDaysAgo) {
    const totalUsers = await User.countDocuments({
      status: { $ne: "deleted" },
    });
    const activeUsers = await User.countDocuments({ status: "active" });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      status: { $ne: "deleted" },
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      status: { $ne: "deleted" },
    });

    return {
      total: totalUsers,
      active: activeUsers,
      newThisMonth: newUsersThisMonth,
      newThisWeek: newUsersThisWeek,
    };
  }

  async getUserRoleDistribution() {
    return await User.aggregate([
      {
        $match: { status: { $ne: "deleted" } },
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);
  }
}

module.exports = new AdminUserRepository();
