/**
 * 心跳服务控制器
 */

const heartbeatService = require("../services/heartbeatService");
const logger = require("../utils/logger");

/**
 * 启动心跳服务
 */
const startHeartbeat = async (req, res) => {
  try {
    if (heartbeatService.getStatus().isRunning) {
      return res.status(400).json({
        success: false,
        message: "心跳服务已在运行中",
      });
    }

    const result = await heartbeatService.start();

    logger.info("通过API启动心跳服务成功", {
      fsuId: result.data.fsuId,
      address: result.data.address,
    });

    res.json(result);
  } catch (error) {
    logger.error("启动心跳服务失败:", error);
    res.status(500).json({
      success: false,
      message: "启动心跳服务失败",
      error: error.message,
    });
  }
};

/**
 * 停止心跳服务
 */
const stopHeartbeat = async (req, res) => {
  try {
    const result = await heartbeatService.stop();

    logger.info("通过API停止心跳服务", {
      heartbeatCount: result.data?.heartbeatCount,
      dataRequestCount: result.data?.dataRequestCount,
    });

    res.json(result);
  } catch (error) {
    logger.error("停止心跳服务失败:", error);
    res.status(500).json({
      success: false,
      message: "停止心跳服务失败",
      error: error.message,
    });
  }
};

/**
 * 重启心跳服务
 */
const restartHeartbeat = async (req, res) => {
  try {
    const result = await heartbeatService.restart();

    logger.info("通过API重启心跳服务成功", {
      fsuId: result.data.fsuId,
      address: result.data.address,
    });

    res.json(result);
  } catch (error) {
    logger.error("重启心跳服务失败:", error);
    res.status(500).json({
      success: false,
      message: "重启心跳服务失败",
      error: error.message,
    });
  }
};

/**
 * 获取心跳服务状态
 */
const getHeartbeatStatus = async (req, res) => {
  try {
    const status = heartbeatService.getStatus();

    res.json({
      success: true,
      data: {
        ...status,
        uptimeFormatted: status.uptime
          ? `${Math.round(status.uptime / 1000)}秒`
          : "0秒",
      },
    });
  } catch (error) {
    logger.error("获取心跳服务状态失败:", error);
    res.status(500).json({
      success: false,
      message: "获取心跳服务状态失败",
      error: error.message,
    });
  }
};

module.exports = {
  startHeartbeat,
  stopHeartbeat,
  restartHeartbeat,
  getHeartbeatStatus,
};
