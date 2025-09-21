const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

// JWT密钥 - 生产环境应该从环境变量获取
const JWT_SECRET = process.env.JWT_SECRET || "fsu-management-system-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

/**
 * 生成JWT令牌
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * 验证JWT令牌中间件
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "访问令牌缺失",
        error: "MISSING_TOKEN",
      });
    }

    // 验证令牌
    const decoded = jwt.verify(token, JWT_SECRET);

    // 获取用户信息
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "用户不存在",
        error: "USER_NOT_FOUND",
      });
    }

    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "账号已被禁用",
        error: "ACCOUNT_DISABLED",
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "无效的访问令牌",
        error: "INVALID_TOKEN",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "访问令牌已过期",
        error: "TOKEN_EXPIRED",
      });
    }

    logger.error("认证中间件错误:", error);
    return res.status(500).json({
      success: false,
      message: "认证服务异常",
      error: "AUTH_SERVICE_ERROR",
    });
  }
};

/**
 * 管理员权限验证中间件
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "请先登录",
      error: "NOT_AUTHENTICATED",
    });
  }

  if (!req.user.isAdmin()) {
    return res.status(403).json({
      success: false,
      message: "需要管理员权限",
      error: "INSUFFICIENT_PERMISSIONS",
    });
  }

  next();
};

/**
 * 检查用户是否有权限管理指定用户
 */
const canManageUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // 管理员可以管理所有用户
    if (currentUser.isAdmin()) {
      return next();
    }

    // 用户只能管理自己
    if (currentUser._id.toString() === userId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "无权限管理此用户",
      error: "INSUFFICIENT_PERMISSIONS",
    });
  } catch (error) {
    logger.error("权限检查错误:", error);
    return res.status(500).json({
      success: false,
      message: "权限检查异常",
      error: "PERMISSION_CHECK_ERROR",
    });
  }
};

/**
 * 可选认证中间件 - 如果有token则验证，没有token也不报错
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      if (user && user.status === "active") {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // 可选认证失败不阻止请求
    next();
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  canManageUser,
  optionalAuth,
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
