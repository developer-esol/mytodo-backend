const adminUserRepository = require("../../../repository/admin/user/admin.user.repository");
const logger = require("../../../config/logger");

class AdminUserService {
  buildUserFilter(search, role, status) {
    const filter = {};

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "" && role !== "All Roles" && role !== "all") {
      const roleMapping = {
        Poster: "poster",
        Tasker: "tasker",
        Admin: "admin",
        "Super Admin": "superadmin",
        User: "user",
      };
      const mappedRole = roleMapping[role] || role.toLowerCase();
      filter.role = mappedRole;
    }

    if (
      status &&
      status !== "" &&
      status !== "All Statuses" &&
      status !== "all"
    ) {
      const statusMapping = {
        Active: "active",
        Inactive: "inactive",
        Suspended: "suspended",
      };
      const mappedStatus = statusMapping[status] || status.toLowerCase();
      filter.status = mappedStatus;
    } else {
      filter.status = { $ne: "deleted" };
    }

    return filter;
  }

  formatUserData(userObj) {
    return {
      _id: userObj._id,
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      email: userObj.email,
      phone: userObj.phone,
      role: userObj.role,
      status: userObj.status,
      avatar: userObj.avatar,
      location: userObj.location,
      completedTasks: userObj.completedTasks || 0,
      isVerified: userObj.isVerified,
      isEmailVerified: userObj.isEmailVerified,
      isPhoneVerified: userObj.isPhoneVerified,
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt,
      rating: userObj.rating || 0,
      ratingStats: {
        overall: {
          average: userObj.ratingStats?.overall?.average || 0,
          count: userObj.ratingStats?.overall?.count || 0,
          distribution: userObj.ratingStats?.overall?.distribution || {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        },
        asPoster: {
          average: userObj.ratingStats?.asPoster?.average || 0,
          count: userObj.ratingStats?.asPoster?.count || 0,
        },
        asTasker: {
          average: userObj.ratingStats?.asTasker?.average || 0,
          count: userObj.ratingStats?.asTasker?.count || 0,
        },
      },
    };
  }

  async getUsers(page, limit, search, role, status) {
    try {
      const skip = (page - 1) * limit;
      const filter = this.buildUserFilter(search, role, status);

      const users = await adminUserRepository.findUsers(filter, skip, limit);
      const total = await adminUserRepository.countUsers(filter);

      const formattedUsers = users.map((user) => {
        const userObj = user.toObject({ transform: false });
        return this.formatUserData(userObj);
      });

      return {
        users: formattedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          limit,
        },
      };
    } catch (error) {
      logger.error("Get users service error", {
        service: "admin.user.service",
        error: error.message,
      });
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await adminUserRepository.findUserById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      const userObj = user.toObject({ transform: false });

      return {
        ...this.formatUserData(userObj),
        bio: userObj.bio,
        skills: userObj.skills,
        verification: userObj.verification,
      };
    } catch (error) {
      logger.error("Get user by ID service error", {
        service: "admin.user.service",
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new AdminUserService();
