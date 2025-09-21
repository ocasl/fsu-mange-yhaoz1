const mongoose = require("mongoose");

/**
 * 操作日志模型
 * 记录所有用户的操作行为
 */
const operationLogSchema = new mongoose.Schema(
  {
    // 操作用户信息
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      description: "操作用户ID",
    },
    username: {
      type: String,
      required: true,
      description: "操作用户名",
    },

    // 操作信息
    operation: {
      type: String,
      required: true,
      description: "操作类型",
    },
    module: {
      type: String,
      required: true,
      description: "操作模块",
    },
    description: {
      type: String,
      required: true,
      description: "操作描述",
    },

    // 请求信息
    method: {
      type: String,
      required: true,
      description: "HTTP方法",
    },
    url: {
      type: String,
      required: true,
      description: "请求URL",
    },

    // 请求和响应数据
    requestData: {
      type: mongoose.Schema.Types.Mixed,
      description: "请求数据",
    },
    responseData: {
      type: mongoose.Schema.Types.Mixed,
      description: "响应数据",
    },

    // 操作结果
    success: {
      type: Boolean,
      required: true,
      description: "操作是否成功",
    },
    errorMessage: {
      type: String,
      description: "错误信息（如果操作失败）",
    },

    // 客户端信息
    ip: {
      type: String,
      required: true,
      description: "客户端IP地址",
    },
    userAgent: {
      type: String,
      description: "用户代理字符串",
    },

    // 性能信息
    duration: {
      type: Number,
      description: "操作耗时（毫秒）",
    },

    // 额外标签
    tags: [
      {
        type: String,
        description: "操作标签",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 静态方法：记录操作日志
operationLogSchema.statics.logOperation = async function (logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error("记录操作日志失败:", error);
    throw error;
  }
};

// 静态方法：获取用户操作日志
operationLogSchema.statics.getUserLogs = function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    module,
    operation,
    startTime,
    endTime,
    success,
  } = options;

  const query = { userId };

  // 添加筛选条件
  if (module) query.module = module;
  if (operation) query.operation = operation;
  if (success !== undefined) query.success = success;
  if (startTime || endTime) {
    query.createdAt = {};
    if (startTime) query.createdAt.$gte = new Date(startTime);
    if (endTime) query.createdAt.$lte = new Date(endTime);
  }

  return this.find(query)
    .populate("userId", "username realName")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// 静态方法：获取所有操作日志（总账号使用）
operationLogSchema.statics.getAllLogs = function (options = {}) {
  const {
    page = 1,
    limit = 20,
    userId,
    module,
    operation,
    startTime,
    endTime,
    success,
  } = options;

  const query = {};

  // 添加筛选条件
  if (userId) query.userId = userId;
  if (module) query.module = module;
  if (operation) query.operation = operation;
  if (success !== undefined) query.success = success;
  if (startTime || endTime) {
    query.createdAt = {};
    if (startTime) query.createdAt.$gte = new Date(startTime);
    if (endTime) query.createdAt.$lte = new Date(endTime);
  }

  return this.find(query)
    .populate("userId", "username realName role")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// 添加索引
operationLogSchema.index({ userId: 1, createdAt: -1 });
operationLogSchema.index({ module: 1 });
operationLogSchema.index({ operation: 1 });
operationLogSchema.index({ success: 1 });
operationLogSchema.index({ createdAt: -1 });
operationLogSchema.index({ ip: 1 });

const OperationLog = mongoose.model("OperationLog", operationLogSchema);

module.exports = OperationLog;
