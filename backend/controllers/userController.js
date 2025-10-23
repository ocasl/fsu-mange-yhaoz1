const User = require("../models/User");
const OperationLog = require("../models/OperationLog");
const { generateToken } = require("../middleware/auth");
const logger = require("../utils/logger");

/**
 * 用户登录
 */
const login = async (req, res) => {
  const startTime = Date.now();

  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      await OperationLog.logOperation({
        userId: null,
        username: username || "unknown",
        operation: "LOGIN",
        module: "USER",
        description: "用户登录失败 - 参数缺失",
        method: req.method,
        url: req.originalUrl,
        requestData: { username },
        success: false,
        errorMessage: "用户名和密码不能为空",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        duration: Date.now() - startTime,
      });

      return res.status(400).json({
        success: false,
        message: "用户名和密码不能为空",
        error: "MISSING_PARAMETERS",
      });
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      await OperationLog.logOperation({
        userId: null,
        username,
        operation: "LOGIN",
        module: "USER",
        description: "用户登录失败 - 用户不存在",
        method: req.method,
        url: req.originalUrl,
        requestData: { username },
        success: false,
        errorMessage: "用户名或密码错误",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        duration: Date.now() - startTime,
      });

      return res.status(401).json({
        success: false,
        message: "用户名或密码错误",
        error: "INVALID_CREDENTIALS",
      });
    }

    // 检查账号状态
    if (user.status !== "active") {
      await OperationLog.logOperation({
        userId: user._id,
        username,
        operation: "LOGIN",
        module: "USER",
        description: `用户登录失败 - 账号状态异常: ${user.status}`,
        method: req.method,
        url: req.originalUrl,
        requestData: { username },
        success: false,
        errorMessage: "账号已被禁用",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        duration: Date.now() - startTime,
      });

      return res.status(401).json({
        success: false,
        message: "账号已被禁用",
        error: "ACCOUNT_DISABLED",
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await OperationLog.logOperation({
        userId: user._id,
        username,
        operation: "LOGIN",
        module: "USER",
        description: "用户登录失败 - 密码错误",
        method: req.method,
        url: req.originalUrl,
        requestData: { username },
        success: false,
        errorMessage: "用户名或密码错误",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        duration: Date.now() - startTime,
      });

      return res.status(401).json({
        success: false,
        message: "用户名或密码错误",
        error: "INVALID_CREDENTIALS",
      });
    }

    // 生成令牌
    const token = generateToken(user._id);

    // 更新最后登录信息
    user.lastLoginTime = new Date();
    user.lastLoginIp = req.ip;
    await user.save();

    // 记录成功日志
    await OperationLog.logOperation({
      userId: user._id,
      username,
      operation: "LOGIN",
      module: "USER",
      description: "用户登录成功",
      method: req.method,
      url: req.originalUrl,
      requestData: { username },
      responseData: { role: user.role },
      success: true,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      duration: Date.now() - startTime,
    });

    res.json({
      success: true,
      message: "登录成功",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          realName: user.realName,
          role: user.role,
          lastLoginTime: user.lastLoginTime,
        },
      },
    });
  } catch (error) {
    logger.error("用户登录错误:", error);

    await OperationLog.logOperation({
      userId: null,
      username: req.body.username || "unknown",
      operation: "LOGIN",
      module: "USER",
      description: "用户登录失败 - 系统异常",
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
      message: "登录服务异常",
      error: "LOGIN_SERVICE_ERROR",
    });
  }
};

/**
 * 用户注册（仅管理员可操作）
 */
const register = async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      username,
      password,
      email,
      realName,
      role = "user",
      description,
    } = req.body;
    const currentUser = req.user;

    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "用户名和密码不能为空",
        error: "MISSING_PARAMETERS",
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      await OperationLog.logOperation({
        userId: currentUser._id,
        username: currentUser.username,
        operation: "REGISTER",
        module: "USER",
        description: `注册用户失败 - 用户名已存在: ${username}`,
        method: req.method,
        url: req.originalUrl,
        requestData: { username, email, realName, role },
        success: false,
        errorMessage: "用户名已存在",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        duration: Date.now() - startTime,
      });

      return res.status(400).json({
        success: false,
        message: "用户名已存在",
        error: "USERNAME_EXISTS",
      });
    }

    // 创建新用户
    const newUser = new User({
      username,
      password,
      email,
      realName,
      role,
      description,
      createdBy: currentUser._id,
      parentUser: role === "user" ? currentUser._id : undefined,
    });

    await newUser.save();

    // 记录操作日志
    await OperationLog.logOperation({
      userId: currentUser._id,
      username: currentUser.username,
      operation: "REGISTER",
      module: "USER",
      description: `注册用户成功: ${username} (${role})`,
      method: req.method,
      url: req.originalUrl,
      requestData: { username, email, realName, role },
      responseData: { userId: newUser._id },
      success: true,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      duration: Date.now() - startTime,
    });

    res.status(201).json({
      success: true,
      message: "用户注册成功",
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          realName: newUser.realName,
          role: newUser.role,
          status: newUser.status,
          createdAt: newUser.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error("用户注册错误:", error);

    await OperationLog.logOperation({
      userId: req.user._id,
      username: req.user.username,
      operation: "REGISTER",
      module: "USER",
      description: "注册用户失败 - 系统异常",
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
      message: "注册服务异常",
      error: "REGISTER_SERVICE_ERROR",
    });
  }
};

/**
 * 获取当前用户信息
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          realName: user.realName,
          role: user.role,
          status: user.status,
          lastLoginTime: user.lastLoginTime,
          lastLoginIp: user.lastLoginIp,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error("获取用户信息错误:", error);
    res.status(500).json({
      success: false,
      message: "获取用户信息失败",
      error: "GET_USER_ERROR",
    });
  }
};

/**
 * 获取用户列表（管理员功能）
 */
const getUserList = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;

    const query = {};

    // 添加筛选条件
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { realName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .populate("createdBy", "username realName")
      .populate("parentUser", "username realName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("获取用户列表错误:", error);
    res.status(500).json({
      success: false,
      message: "获取用户列表失败",
      error: "GET_USER_LIST_ERROR",
    });
  }
};

/**
 * 更新用户状态
 */
const updateUserStatus = async (req, res) => {
  const startTime = Date.now();

  try {
    const { userId } = req.params;
    const { status } = req.body;
    const currentUser = req.user;

    if (!["active", "inactive", "locked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "无效的状态值",
        error: "INVALID_STATUS",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
        error: "USER_NOT_FOUND",
      });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // 记录操作日志
    await OperationLog.logOperation({
      userId: currentUser._id,
      username: currentUser.username,
      operation: "UPDATE_USER_STATUS",
      module: "USER",
      description: `更新用户状态: ${user.username} (${oldStatus} -> ${status})`,
      method: req.method,
      url: req.originalUrl,
      requestData: { userId, status },
      responseData: { oldStatus, newStatus: status },
      success: true,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      duration: Date.now() - startTime,
    });

    res.json({
      success: true,
      message: "用户状态更新成功",
      data: {
        user: {
          id: user._id,
          username: user.username,
          status: user.status,
        },
      },
    });
  } catch (error) {
    logger.error("更新用户状态错误:", error);

    await OperationLog.logOperation({
      userId: req.user._id,
      username: req.user.username,
      operation: "UPDATE_USER_STATUS",
      module: "USER",
      description: "更新用户状态失败 - 系统异常",
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
      message: "更新用户状态失败",
      error: "UPDATE_USER_STATUS_ERROR",
    });
  }
};

/**
 * 删除用户
 */
const deleteUser = async (req, res) => {
  const startTime = Date.now();

  try {
    const { userId } = req.params;
    const currentUser = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
        error: "USER_NOT_FOUND",
      });
    }

    // 不能删除自己
    if (user._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "不能删除自己",
        error: "CANNOT_DELETE_SELF",
      });
    }

    await User.findByIdAndDelete(userId);

    // 记录操作日志
    await OperationLog.logOperation({
      userId: currentUser._id,
      username: currentUser.username,
      operation: "DELETE_USER",
      module: "USER",
      description: `删除用户: ${user.username} (${user.role})`,
      method: req.method,
      url: req.originalUrl,
      requestData: { userId },
      responseData: { deletedUser: user.username },
      success: true,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      duration: Date.now() - startTime,
    });

    res.json({
      success: true,
      message: "用户删除成功",
    });
  } catch (error) {
    logger.error("删除用户错误:", error);

    await OperationLog.logOperation({
      userId: req.user._id,
      username: req.user.username,
      operation: "DELETE_USER",
      module: "USER",
      description: "删除用户失败 - 系统异常",
      method: req.method,
      url: req.originalUrl,
      requestData: req.params,
      success: false,
      errorMessage: error.message,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      duration: Date.now() - startTime,
    });

    res.status(500).json({
      success: false,
      message: "删除用户失败",
      error: "DELETE_USER_ERROR",
    });
  }
};

/**
 * 修改用户密码（管理员功能）
 */
const updateUserPassword = async (req, res) => {
  const startTime = Date.now();

  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const currentUser = req.user;

    // 参数验证
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "新密码不能为空且长度至少为6位",
        error: "INVALID_PASSWORD",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
        error: "USER_NOT_FOUND",
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    // 记录操作日志
    await OperationLog.logOperation({
      userId: currentUser._id,
      username: currentUser.username,
      operation: "UPDATE_PASSWORD",
      module: "USER",
      description: `修改用户密码: ${user.username}`,
      method: req.method,
      url: req.originalUrl,
      requestData: { userId, targetUsername: user.username },
      success: true,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      duration: Date.now() - startTime,
    });

    res.json({
      success: true,
      message: "密码修改成功",
      data: {
        username: user.username,
      },
    });
  } catch (error) {
    logger.error("修改密码错误:", error);

    await OperationLog.logOperation({
      userId: req.user._id,
      username: req.user.username,
      operation: "UPDATE_PASSWORD",
      module: "USER",
      description: "修改用户密码失败 - 系统异常",
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
      message: "修改密码失败",
      error: "UPDATE_PASSWORD_ERROR",
    });
  }
};

module.exports = {
  login,
  register,
  getCurrentUser,
  getUserList,
  updateUserStatus,
  deleteUser,
  updateUserPassword,
};
