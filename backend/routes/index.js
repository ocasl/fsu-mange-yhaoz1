const express = require("express");
const router = express.Router();
const fsuOnlineRoutes = require("./fsuOnlineRoutes");
const alarmRoutes = require("./alarmRoutes");
const configRoutes = require("./configRoutes");
const heartbeatRoutes = require("./heartbeatRoutes");
const userRoutes = require("./userRoutes");
const operationLogRoutes = require("./operationLogRoutes");
const demoRoutes = require("./demoRoutes");

// API路由
router.use("/fsu/online", fsuOnlineRoutes);
router.use("/alarm", alarmRoutes);
router.use("/config", configRoutes);
router.use("/heartbeat", heartbeatRoutes);
router.use("/user", userRoutes);
router.use("/logs", operationLogRoutes);
router.use("/demo", demoRoutes);

// 根路由
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FSU管理系统API服务",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// 健康检查
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API服务正常运行",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
