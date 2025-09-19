/**
 * FSU配置管理控制器
 */

const FsuConfig = require("../models/FsuConfig");
const heartbeatService = require("../services/heartbeatService");
const logger = require("../utils/logger");

/**
 * 获取所有配置
 */
const getAllConfigs = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;

    const configs = await FsuConfig.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));

    const total = await FsuConfig.countDocuments();

    res.json({
      success: true,
      data: {
        list: configs,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
        },
      },
    });
  } catch (error) {
    logger.error("获取配置列表失败:", error);
    res.status(500).json({
      success: false,
      message: "获取配置列表失败",
      error: error.message,
    });
  }
};

/**
 * 获取活动配置
 */
const getActiveConfig = async (req, res) => {
  try {
    const config = await FsuConfig.findOne({ isActive: true });

    if (!config) {
      // 创建默认配置
      const defaultConfig = new FsuConfig({
        name: "default",
        description: "默认FSU配置",
        isActive: true,
      });
      await defaultConfig.save();

      return res.json({
        success: true,
        data: defaultConfig,
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error("获取活动配置失败:", error);
    res.status(500).json({
      success: false,
      message: "获取活动配置失败",
      error: error.message,
    });
  }
};

/**
 * 创建配置
 */
const createConfig = async (req, res) => {
  try {
    const configData = req.body;

    // 验证必填字段
    const requiredFields = ["name", "fsuId", "fsuCode"];
    for (const field of requiredFields) {
      if (!configData[field]) {
        return res.status(400).json({
          success: false,
          message: `缺少必填字段: ${field}`,
        });
      }
    }

    // 检查配置名称是否已存在
    const existingConfig = await FsuConfig.findOne({ name: configData.name });
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: "配置名称已存在",
      });
    }

    const config = new FsuConfig(configData);
    await config.save();

    logger.info("创建FSU配置成功", {
      name: config.name,
      fsuId: config.fsuId,
      creator: config.creator,
    });

    res.status(201).json({
      success: true,
      message: "配置创建成功",
      data: config,
    });
  } catch (error) {
    logger.error("创建配置失败:", error);
    res.status(500).json({
      success: false,
      message: "创建配置失败",
      error: error.message,
    });
  }
};

/**
 * 更新配置
 */
const updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const config = await FsuConfig.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "配置不存在",
      });
    }

    logger.info("更新FSU配置成功", {
      id,
      name: config.name,
      fsuId: config.fsuId,
    });

    // 如果更新的是活动配置，需要重启心跳服务
    if (config.isActive && heartbeatService.getStatus().isRunning) {
      logger.info("检测到活动配置更新，准备重启心跳服务");

      // 异步重启，不阻塞响应
      setTimeout(async () => {
        try {
          await heartbeatService.restart();
          logger.info("心跳服务重启成功");
        } catch (error) {
          logger.error("心跳服务重启失败:", error);
        }
      }, 1000);
    }

    res.json({
      success: true,
      message: "配置更新成功",
      data: config,
    });
  } catch (error) {
    logger.error("更新配置失败:", error);
    res.status(500).json({
      success: false,
      message: "更新配置失败",
      error: error.message,
    });
  }
};

/**
 * 删除配置
 */
const deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await FsuConfig.findById(id);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: "配置不存在",
      });
    }

    // 不能删除活动配置
    if (config.isActive) {
      return res.status(400).json({
        success: false,
        message: "不能删除活动配置",
      });
    }

    await FsuConfig.findByIdAndDelete(id);

    logger.info("删除FSU配置成功", {
      id,
      name: config.name,
    });

    res.json({
      success: true,
      message: "配置删除成功",
    });
  } catch (error) {
    logger.error("删除配置失败:", error);
    res.status(500).json({
      success: false,
      message: "删除配置失败",
      error: error.message,
    });
  }
};

/**
 * 激活配置
 */
const activateConfig = async (req, res) => {
  try {
    const { id } = req.params;

    // 先将所有配置设为非活动
    await FsuConfig.updateMany({}, { isActive: false });

    // 激活指定配置
    const config = await FsuConfig.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "配置不存在",
      });
    }

    logger.info("激活FSU配置成功", {
      id,
      name: config.name,
      fsuId: config.fsuId,
    });

    // 如果心跳服务正在运行，重启以应用新配置
    if (heartbeatService.getStatus().isRunning) {
      logger.info("检测到活动配置更改，准备重启心跳服务");

      setTimeout(async () => {
        try {
          await heartbeatService.restart();
          logger.info("心跳服务重启成功，新配置已生效");
        } catch (error) {
          logger.error("心跳服务重启失败:", error);
        }
      }, 1000);
    }

    res.json({
      success: true,
      message: "配置激活成功",
      data: config,
    });
  } catch (error) {
    logger.error("激活配置失败:", error);
    res.status(500).json({
      success: false,
      message: "激活配置失败",
      error: error.message,
    });
  }
};

module.exports = {
  getAllConfigs,
  getActiveConfig,
  createConfig,
  updateConfig,
  deleteConfig,
  activateConfig,
};
