const Task = require("../../../models/task/Task");

class AdminTaskRepository {
  async findTasks(filter, skip, limit) {
    return await Task.find(filter)
      .populate("createdBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async countTasks(filter) {
    return await Task.countDocuments(filter);
  }

  async findTaskById(taskId) {
    return await Task.findById(taskId)
      .populate("createdBy", "firstName lastName email phone")
      .populate("assignedTo", "firstName lastName email phone")
      .populate({
        path: "offers",
        populate: {
          path: "userId",
          select: "firstName lastName email",
        },
      });
  }

  async updateTaskStatus(taskId, status) {
    return await Task.findByIdAndUpdate(
      taskId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate("createdBy", "firstName lastName email");
  }

  async getTaskStats(thirtyDaysAgo, sevenDaysAgo) {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "completed" });
    const openTasks = await Task.countDocuments({
      status: { $in: ["open", "assigned", "in-progress"] },
    });
    const newTasksThisMonth = await Task.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    const newTasksThisWeek = await Task.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    return {
      total: totalTasks,
      open: openTasks,
      completed: completedTasks,
      newThisMonth: newTasksThisMonth,
      newThisWeek: newTasksThisWeek,
    };
  }

  async getTaskStatusDistribution() {
    return await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async getTaskCreationsAggregation(startDate) {
    return await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);
  }

  async getTaskCompletionsAggregation(startDate) {
    return await Task.aggregate([
      {
        $match: {
          status: "completed",
          updatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
            day: { $dayOfMonth: "$updatedAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);
  }

  async getCategoryPerformance(startDate) {
    return await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$category",
          taskCount: { $sum: 1 },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          avgBudget: { $avg: "$budget" },
          totalBudget: { $sum: "$budget" },
        },
      },
      {
        $project: {
          category: "$_id",
          taskCount: 1,
          completedCount: 1,
          completionRate: {
            $cond: [
              { $eq: ["$taskCount", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$completedCount", "$taskCount"] },
                  100,
                ],
              },
            ],
          },
          avgBudget: 1,
          totalBudget: 1,
        },
      },
      {
        $sort: { taskCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);
  }
}

module.exports = new AdminTaskRepository();
