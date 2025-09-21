const OperationLog = require("../models/OperationLog");
const User = require("../models/User");
const logger = require("../utils/logger");

/**
 * 获取操作日志列表
 */
const getOperationLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      module,
      operation,
      success,
      startTime,
      endTime,
      search,
    } = req.query;

    const currentUser = req.user;
    let query = {};

    // 非管理员只能查看自己的日志
    if (!currentUser.isAdmin()) {
      query.userId = currentUser._id;
    } else if (userId) {
      // 管理员可以指定查看某个用户的日志
      query.userId = userId;
    }

    // 添加其他筛选条件
    if (module) query.module = module;
    if (operation) query.operation = operation;
    if (success !== undefined) query.success = success === "true";

    if (startTime || endTime) {
      query.createdAt = {};
      if (startTime) query.createdAt.$gte = new Date(startTime);
      if (endTime) query.createdAt.$lte = new Date(endTime);
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { url: { $regex: search, $options: "i" } },
      ];
    }

    const logs = await OperationLog.find(query)
      .populate("userId", "username realName role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await OperationLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("获取操作日志错误:", error);
    res.status(500).json({
      success: false,
      message: "获取操作日志失败",
      error: "GET_OPERATION_LOGS_ERROR",
    });
  }
};

/**
 * 获取操作日志详情
 */
const getOperationLogDetail = async (req, res) => {
  try {
    const { logId } = req.params;
    const currentUser = req.user;

    const log = await OperationLog.findById(logId).populate(
      "userId",
      "username realName role"
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "操作日志不存在",
        error: "LOG_NOT_FOUND",
      });
    }

    // 非管理员只能查看自己的日志
    if (
      !currentUser.isAdmin() &&
      log.userId.toString() !== currentUser._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "无权限查看此日志",
        error: "INSUFFICIENT_PERMISSIONS",
      });
    }

    res.json({
      success: true,
      data: {
        log,
      },
    });
  } catch (error) {
    logger.error("获取操作日志详情错误:", error);
    res.status(500).json({
      success: false,
      message: "获取操作日志详情失败",
      error: "GET_OPERATION_LOG_DETAIL_ERROR",
    });
  }
};

/**
 * 获取操作统计信息
 */
const getOperationStats = async (req, res) => {
  try {
    const { timeRange = "7d" } = req.query;
    const currentUser = req.user;

    // 计算时间范围
    const now = new Date();
    let startTime;

    switch (timeRange) {
      case "1d":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const baseQuery = {
      createdAt: { $gte: startTime },
    };

    // 非管理员只统计自己的数据
    if (!currentUser.isAdmin()) {
      baseQuery.userId = currentUser._id;
    }

    const [
      totalOperations,
      successOperations,
      failedOperations,
      moduleStats,
      operationStats,
      userStats,
    ] = await Promise.all([
      // 总操作数
      OperationLog.countDocuments(baseQuery),

      // 成功操作数
      OperationLog.countDocuments({ ...baseQuery, success: true }),

      // 失败操作数
      OperationLog.countDocuments({ ...baseQuery, success: false }),

      // 按模块统计
      OperationLog.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$module", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // 按操作类型统计
      OperationLog.aggregate([
        { $match: baseQuery },
        { $group: { _id: "$operation", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // 按用户统计（仅管理员）
      currentUser.isAdmin()
        ? OperationLog.aggregate([
            { $match: baseQuery },
            { $group: { _id: "$userId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $project: {
                count: 1,
                username: { $arrayElemAt: ["$user.username", 0] },
                realName: { $arrayElemAt: ["$user.realName", 0] },
              },
            },
          ])
        : [],
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalOperations,
          successOperations,
          failedOperations,
          successRate:
            totalOperations > 0
              ? ((successOperations / totalOperations) * 100).toFixed(2)
              : 0,
        },
        moduleStats,
        operationStats,
        userStats: currentUser.isAdmin() ? userStats : [],
        timeRange,
      },
    });
  } catch (error) {
    logger.error("获取操作统计信息错误:", error);
    res.status(500).json({
      success: false,
      message: "获取操作统计信息失败",
      error: "GET_OPERATION_STATS_ERROR",
    });
  }
};

/**
 * 清理旧的操作日志
 */
const cleanupOldLogs = async (req, res) => {
  const startTime = Date.now();

  try {
    const { days = 90 } = req.body;
    const currentUser = req.user;

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await OperationLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    // 记录清理操作
    await OperationLog.logOperation({
      userId: currentUser._id,
      username: currentUser.username,
      operation: "CLEANUP_LOGS",
      module: "SYSTEM",
      description: `清理操作日志: 删除${days}天前的${result.deletedCount}条记录`,
      method: req.method,
      url: req.originalUrl,
      requestData: { days },
      responseData: { deletedCount: result.deletedCount },
      success: true,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      duration: Date.now() - startTime,
    });

    res.json({
      success: true,
      message: "日志清理成功",
      data: {
        deletedCount: result.deletedCount,
        cutoffDate,
      },
    });
  } catch (error) {
    logger.error("清理操作日志错误:", error);

    await OperationLog.logOperation({
      userId: req.user._id,
      username: req.user.username,
      operation: "CLEANUP_LOGS",
      module: "SYSTEM",
      description: "清理操作日志失败 - 系统异常",
      method: req.method,
      url: req.originalUrl,
      requestData: req.body,
      success: false,
      errorMessage: error.message,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      duration: Date.now() - startTime,
    });

    res.status(500).json({
      success: false,
      message: "日志清理失败",
      error: "CLEANUP_LOGS_ERROR",
    });
  }
};

module.exports = {
  getOperationLogs,
  getOperationLogDetail,
  getOperationStats,
  cleanupOldLogs,
};
