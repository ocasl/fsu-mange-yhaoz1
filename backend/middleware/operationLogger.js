const OperationLog = require("../models/OperationLog");
const logger = require("../utils/logger");

/**
 * 操作日志记录中间件
 * 自动记录用户的操作行为
 */
const operationLogger = (options = {}) => {
  const {
    module: defaultModule = "UNKNOWN",
    operation: defaultOperation,
    description: defaultDescription,
    skipPaths = ["/api/health", "/api/heartbeat"],
    skipMethods = ["GET"],
    logResponse = false,
  } = options;

  return async (req, res, next) => {
    const startTime = Date.now();

    // 跳过指定路径
    if (skipPaths.some((path) => req.originalUrl.includes(path))) {
      return next();
    }

    // 跳过指定方法
    if (skipMethods.includes(req.method)) {
      return next();
    }

    // 保存原始的res.json方法
    const originalJson = res.json;
    let responseData = null;
    let isSuccess = true;
    let errorMessage = null;

    // 重写res.json方法以捕获响应数据
    res.json = function (data) {
      responseData = logResponse ? data : null;
      isSuccess = data.success !== false && res.statusCode < 400;
      if (!isSuccess) {
        errorMessage = data.message || data.error || "操作失败";
      }
      return originalJson.call(this, data);
    };

    // 保存原始的res.status方法
    const originalStatus = res.status;
    res.status = function (code) {
      if (code >= 400) {
        isSuccess = false;
      }
      return originalStatus.call(this, code);
    };

    // 当响应结束时记录日志
    res.on("finish", async () => {
      try {
        // 只有在用户已认证时才记录日志
        if (!req.user) {
          return;
        }

        const duration = Date.now() - startTime;

        // 确定操作类型和模块
        const operation = defaultOperation || getOperationFromRequest(req);
        const module =
          defaultModule !== "UNKNOWN"
            ? defaultModule
            : getModuleFromRequest(req);

        // 生成操作描述
        const description =
          defaultDescription || generateDescription(req, operation, module);

        // 准备日志数据
        const logData = {
          userId: req.user._id,
          username: req.user.username,
          operation,
          module,
          description,
          method: req.method,
          url: req.originalUrl,
          requestData: getFilteredRequestData(req),
          responseData,
          success: isSuccess,
          errorMessage,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          duration,
        };

        // 异步记录日志，不阻塞响应
        setImmediate(async () => {
          try {
            await OperationLog.logOperation(logData);
          } catch (error) {
            logger.error("记录操作日志失败:", error);
          }
        });
      } catch (error) {
        logger.error("操作日志中间件错误:", error);
      }
    });

    next();
  };
};

/**
 * 从请求中推断操作类型
 */
function getOperationFromRequest(req) {
  const { method, originalUrl } = req;

  if (originalUrl.includes("/login")) return "LOGIN";
  if (originalUrl.includes("/logout")) return "LOGOUT";
  if (originalUrl.includes("/register")) return "REGISTER";
  if (originalUrl.includes("/alarm")) {
    if (method === "POST") return "CREATE_ALARM";
    if (method === "PUT" || method === "PATCH") return "UPDATE_ALARM";
    if (method === "DELETE") return "DELETE_ALARM";
    return "VIEW_ALARM";
  }
  if (originalUrl.includes("/config")) {
    if (method === "POST") return "CREATE_CONFIG";
    if (method === "PUT" || method === "PATCH") return "UPDATE_CONFIG";
    if (method === "DELETE") return "DELETE_CONFIG";
    return "VIEW_CONFIG";
  }
  if (originalUrl.includes("/fsu")) {
    if (method === "POST") return "CREATE_FSU";
    if (method === "PUT" || method === "PATCH") return "UPDATE_FSU";
    if (method === "DELETE") return "DELETE_FSU";
    return "VIEW_FSU";
  }
  if (originalUrl.includes("/user")) {
    if (method === "POST") return "CREATE_USER";
    if (method === "PUT" || method === "PATCH") return "UPDATE_USER";
    if (method === "DELETE") return "DELETE_USER";
    return "VIEW_USER";
  }

  switch (method) {
    case "POST":
      return "CREATE";
    case "PUT":
    case "PATCH":
      return "UPDATE";
    case "DELETE":
      return "DELETE";
    case "GET":
      return "VIEW";
    default:
      return "UNKNOWN";
  }
}

/**
 * 从请求中推断模块名称
 */
function getModuleFromRequest(req) {
  const { originalUrl } = req;

  if (originalUrl.includes("/user")) return "USER";
  if (originalUrl.includes("/alarm")) return "ALARM";
  if (originalUrl.includes("/config")) return "CONFIG";
  if (originalUrl.includes("/fsu")) return "FSU";
  if (originalUrl.includes("/heartbeat")) return "HEARTBEAT";
  if (originalUrl.includes("/log")) return "LOG";

  return "SYSTEM";
}

/**
 * 生成操作描述
 */
function generateDescription(req, operation, module) {
  const { method, originalUrl } = req;

  // 特殊路径的描述
  if (originalUrl.includes("/login")) return "用户登录";
  if (originalUrl.includes("/logout")) return "用户登出";
  if (originalUrl.includes("/register")) return "注册新用户";

  // 根据操作类型和模块生成描述
  const moduleNames = {
    USER: "用户",
    ALARM: "告警",
    CONFIG: "配置",
    FSU: "FSU设备",
    HEARTBEAT: "心跳",
    LOG: "日志",
    SYSTEM: "系统",
  };

  const operationNames = {
    CREATE: "创建",
    UPDATE: "更新",
    DELETE: "删除",
    VIEW: "查看",
    LOGIN: "登录",
    LOGOUT: "登出",
    REGISTER: "注册",
  };

  const moduleName = moduleNames[module] || module;
  const operationName = operationNames[operation] || operation;

  return `${operationName}${moduleName}`;
}

/**
 * 过滤请求数据，移除敏感信息
 */
function getFilteredRequestData(req) {
  const data = { ...req.body };

  // 移除敏感字段
  const sensitiveFields = ["password", "token", "secret"];
  sensitiveFields.forEach((field) => {
    if (data[field]) {
      data[field] = "***";
    }
  });

  // 限制数据大小
  const dataString = JSON.stringify(data);
  if (dataString.length > 10000) {
    return { _truncated: true, _size: dataString.length };
  }

  return data;
}

/**
 * 特定模块的日志记录器
 */
const createModuleLogger = (module, operation, description) => {
  return operationLogger({
    module,
    operation,
    description,
    logResponse: false,
  });
};

/**
 * 用户操作日志记录器
 */
const userLogger = createModuleLogger("USER");

/**
 * 告警操作日志记录器
 */
const alarmLogger = createModuleLogger("ALARM");

/**
 * 配置操作日志记录器
 */
const configLogger = createModuleLogger("CONFIG");

/**
 * FSU操作日志记录器
 */
const fsuLogger = createModuleLogger("FSU");

module.exports = {
  operationLogger,
  createModuleLogger,
  userLogger,
  alarmLogger,
  configLogger,
  fsuLogger,
};
