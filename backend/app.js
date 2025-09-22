const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const config = require("./config/config");
const connectDB = require("./config/db");
const apiRoutes = require("./routes");
const logger = require("./utils/logger");

// 加载环境变量
require("dotenv").config();

// 创建Express应用
const app = express();
const PORT = config.port;

// 创建日志目录
const logDir = path.join(__dirname, config.logger.dir);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 连接MongoDB数据库
connectDB();

// 中间件配置
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// 请求体解析
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.text({ type: "text/xml", limit: "10mb" }));

// 请求IP获取
app.use((req, res, next) => {
  req.ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
  next();
});

// 请求日志记录
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// API路由
app.use("/api", apiRoutes);

// 根路径处理
app.get("/", (req, res) => {
  res.json({
    message: "FSU管理系统API服务",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      fsuOnline: "/api/fsu/online",
      alarm: "/api/alarm",
      health: "/api/health",
    },
  });
});

// 404处理
app.use("*", (req, res) => {
  logger.warn(`404 - 未找到路由: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.status(404).json({
    success: false,
    message: "接口不存在",
    error: "NOT_FOUND",
    timestamp: new Date().toISOString(),
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  logger.error(`全局错误处理: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    message: "服务器内部错误",
    error:
      process.env.NODE_ENV === "development" ? err.message : "INTERNAL_ERROR",
    timestamp: new Date().toISOString(),
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  logger.info(`FSU管理系统API服务启动成功`, {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    platform: process.platform,
  });

  console.log(`🚀 FSU管理系统API服务启动成功！`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📋 API文档: http://localhost:${PORT}/api`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);

  // 初始化心跳管理器
  const heartbeatManager = require("./services/heartbeatManager");
  logger.info("心跳管理器初始化完成，等待FSU上线");

  // 启动FSU设备恢复服务
  const fsuRecoveryService = require("./services/fsuRecoveryService");
  setTimeout(async () => {
    try {
      logger.info("🔄 启动FSU设备自动恢复流程...");
      const recoveryResult = await fsuRecoveryService.startRecovery();

      if (recoveryResult.success) {
        logger.info("✅ FSU设备自动恢复完成", {
          totalCount: recoveryResult.data.totalCount,
          recoveredCount: recoveryResult.data.recoveredCount,
          failureCount: recoveryResult.data.failureCount,
        });
      } else {
        logger.warn("⚠️ FSU设备自动恢复失败", {
          message: recoveryResult.message,
        });
      }
    } catch (error) {
      logger.error("FSU设备自动恢复异常", { error: error.message });
    }
  }, 3000); // 延迟3秒启动，确保数据库连接稳定
});

// 优雅关闭处理
process.on("SIGTERM", () => {
  logger.info("收到SIGTERM信号，开始优雅关闭服务器");
  server.close(() => {
    logger.info("服务器已关闭");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("收到SIGINT信号，开始优雅关闭服务器");
  server.close(() => {
    logger.info("服务器已关闭");
    process.exit(0);
  });
});

// 未捕获异常处理
process.on("uncaughtException", (err) => {
  logger.error("未捕获的异常:", { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("未处理的Promise拒绝:", { reason, promise });
  process.exit(1);
});

module.exports = app;
