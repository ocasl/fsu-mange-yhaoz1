/**
 * FSU配置管理路由
 */

const express = require("express");
const router = express.Router();
const configController = require("../controllers/configController");

// 获取所有配置
router.get("/", configController.getAllConfigs);

// 获取活动配置
router.get("/active", configController.getActiveConfig);

// 创建配置
router.post("/", configController.createConfig);

// 更新配置
router.put("/:id", configController.updateConfig);

// 删除配置
router.delete("/:id", configController.deleteConfig);

// 激活配置
router.post("/:id/activate", configController.activateConfig);

module.exports = router;
