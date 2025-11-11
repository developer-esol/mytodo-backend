const User = require("../../../models/user/User");
const Task = require("../../../models/task/Task");
const Payment = require("../../../models/payment/Payment");

class AdminAnalyticsRepository {
  async getUserRegistrations(startDate) {
    return await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: "deleted" },
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

  async getRevenueData(startDate) {
    return await Payment.aggregate([
      {
        $match: {
          status: "completed",
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
          totalRevenue: { $sum: "$serviceFee" },
          totalPayments: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          avgPayment: { $avg: "$amount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);
  }

  async getPaymentStatuses(startDate) {
    return await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);
  }

  async getMonthlyRevenue(startOfYear) {
    return await Payment.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$serviceFee" },
          payments: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);
  }

  async getTopEarningCategories(startDate) {
    return await Payment.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task",
          foreignField: "_id",
          as: "taskInfo",
        },
      },
      {
        $unwind: "$taskInfo",
      },
      {
        $group: {
          _id: "$taskInfo.category",
          totalRevenue: { $sum: "$serviceFee" },
          totalPayments: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          avgRevenue: { $avg: "$serviceFee" },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 10,
      },
    ]);
  }

  async getTotalRevenue(startDate) {
    return await Payment.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$serviceFee" },
          totalPayments: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          avgTransaction: { $avg: "$amount" },
        },
      },
    ]);
  }
}

module.exports = new AdminAnalyticsRepository();
