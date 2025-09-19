/**
 * 心跳服务管理路由
 */

const express = require("express");
const router = express.Router();
const heartbeatController = require("../controllers/heartbeatController");

// 获取心跳服务状态
router.get("/status", heartbeatController.getHeartbeatStatus);

// 启动心跳服务
router.post("/start", heartbeatController.startHeartbeat);

// 停止心跳服务
router.post("/stop", heartbeatController.stopHeartbeat);

// 重启心跳服务
router.post("/restart", heartbeatController.restartHeartbeat);

module.exports = router;
