const express = require("express");
const router = express.Router();
const fsuRecoveryService = require("../services/fsuRecoveryService");
const logger = require("../utils/logger");

/**
 * @desc    手动触发FSU设备恢复
 * @route   POST /api/fsu/recovery/start
 * @access  Public
 */
router.post("/start", async (req, res) => {
  try {
    logger.info("收到手动触发FSU设备恢复请求");

    const result = await fsuRecoveryService.startRecovery();

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error) {
    logger.error("手动触发FSU设备恢复失败", { error: error.message });
    res.status(500).json({
      success: false,
      message: "触发恢复失败",
      error: error.message,
    });
  }
});

/**
 * @desc    获取FSU恢复状态
 * @route   GET /api/fsu/recovery/status
 * @access  Public
 */
router.get("/status", async (req, res) => {
  try {
    const status = fsuRecoveryService.getRecoveryStatus();

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("获取FSU恢复状态失败", { error: error.message });
    res.status(500).json({
      success: false,
      message: "获取恢复状态失败",
      error: error.message,
    });
  }
});

/**
 * @desc    恢复特定FSU设备
 * @route   POST /api/fsu/recovery/device/:fsuid
 * @access  Public
 */
router.post("/device/:fsuid", async (req, res) => {
  try {
    const { fsuid } = req.params;

    logger.info(`收到恢复特定FSU设备请求: ${fsuid}`);

    const result = await fsuRecoveryService.recoverSpecificFsu(fsuid);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error) {
    logger.error(`恢复特定FSU设备失败: ${req.params.fsuid}`, {
      error: error.message,
    });
    res.status(500).json({
      success: false,
      message: "恢复设备失败",
      error: error.message,
    });
  }
});

module.exports = router;
