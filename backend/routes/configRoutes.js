/**
 * FSU配置管理路由
 */

const express = require("express");
const router = express.Router();
const configController = require("../controllers/configController");
const { optionalAuth } = require("../middleware/auth");
const { configLogger } = require("../middleware/operationLogger");

// 获取所有配置
router.get("/", optionalAuth, configController.getAllConfigs);

// 获取活动配置
router.get("/active", optionalAuth, configController.getActiveConfig);

// 创建配置
router.post("/", optionalAuth, configLogger, configController.createConfig);

// 更新配置
router.put("/:id", optionalAuth, configLogger, configController.updateConfig);

// 删除配置
router.delete(
  "/:id",
  optionalAuth,
  configLogger,
  configController.deleteConfig
);

// 激活配置
router.post(
  "/:id/activate",
  optionalAuth,
  configLogger,
  configController.activateConfig
);

module.exports = router;
