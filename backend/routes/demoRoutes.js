const express = require("express");
const router = express.Router();
const demoController = require("../controllers/demoController");
const { optionalAuth } = require("../middleware/auth");

/**
 * 演示数据路由 - 用于测试操作记录功能
 */

// 创建示例FSU数据
router.post("/fsu", optionalAuth, demoController.createSampleFsuData);

// 创建示例告警数据
router.post("/alarm", optionalAuth, demoController.createSampleAlarmData);

// 获取操作统计信息
router.get("/summary", optionalAuth, demoController.getOperationSummary);

module.exports = router;
