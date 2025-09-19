const FsuOnline = require("../models/FsuOnline");
const logger = require("../utils/logger");
const { sendDirectLogin } = require("../services/scService");
const fsuWebServiceServer = require("../services/fsuWebServiceServer");
const heartbeatManager = require("../services/heartbeatManager");
const vpnService = require("../services/vpnService");

/**
 * @desc    获取FSU上线列表
 * @route   GET /api/fsu/online/list
 * @access  Public
 */
exports.getFsuOnlineList = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      fsuid,
      siteName,
      softwareVendor,
      hardwareVendor,
      fsuType,
      scServerAddress,
      creator,
      // 新增的17个设备字段搜索支持（4个锂电池 + 2个蓄电池 + 烟感）
      powerId,
      lithiumBatteryId1,
      temperatureId,
      lithiumBatteryId2,
      airConditionerId,
      lithiumBatteryId3,
      smartAccessId,
      lithiumBatteryId4,
      waterLeakageId,
      leadAcidBatteryId1,
      infraredId,
      smokeDetectorId,
      leadAcidBatteryId2,
      nonSmartAccessId,
      deviceId13,
      deviceId14,
      deviceId15,
    } = req.query;

    // 构建查询条件
    const query = {};
    if (fsuid) query.fsuid = { $regex: fsuid, $options: "i" };
    if (siteName) query.siteName = { $regex: siteName, $options: "i" };
    if (softwareVendor)
      query.softwareVendor = { $regex: softwareVendor, $options: "i" };
    if (hardwareVendor)
      query.hardwareVendor = { $regex: hardwareVendor, $options: "i" };
    if (fsuType) query.fsuType = { $regex: fsuType, $options: "i" };
    if (scServerAddress)
      query.scServerAddress = { $regex: scServerAddress, $options: "i" };
    if (creator) query.creator = { $regex: creator, $options: "i" };

    // 新增的16个设备字段查询条件（4个锂电池 + 2个蓄电池）
    if (powerId) query.powerId = { $regex: powerId, $options: "i" };
    if (lithiumBatteryId1)
      query.lithiumBatteryId1 = { $regex: lithiumBatteryId1, $options: "i" };
    if (temperatureId)
      query.temperatureId = { $regex: temperatureId, $options: "i" };
    if (lithiumBatteryId2)
      query.lithiumBatteryId2 = { $regex: lithiumBatteryId2, $options: "i" };
    if (airConditionerId)
      query.airConditionerId = { $regex: airConditionerId, $options: "i" };
    if (lithiumBatteryId3)
      query.lithiumBatteryId3 = { $regex: lithiumBatteryId3, $options: "i" };
    if (smartAccessId)
      query.smartAccessId = { $regex: smartAccessId, $options: "i" };
    if (lithiumBatteryId4)
      query.lithiumBatteryId4 = { $regex: lithiumBatteryId4, $options: "i" };
    if (waterLeakageId)
      query.waterLeakageId = { $regex: waterLeakageId, $options: "i" };
    if (leadAcidBatteryId1)
      query.leadAcidBatteryId1 = { $regex: leadAcidBatteryId1, $options: "i" };
    if (infraredId) query.infraredId = { $regex: infraredId, $options: "i" };
    if (smokeDetectorId)
      query.smokeDetectorId = { $regex: smokeDetectorId, $options: "i" };
    if (leadAcidBatteryId2)
      query.leadAcidBatteryId2 = { $regex: leadAcidBatteryId2, $options: "i" };
    if (nonSmartAccessId)
      query.nonSmartAccessId = { $regex: nonSmartAccessId, $options: "i" };
    if (deviceId13) query.deviceId13 = { $regex: deviceId13, $options: "i" };
    if (deviceId14) query.deviceId14 = { $regex: deviceId14, $options: "i" };
    if (deviceId15) query.deviceId15 = { $regex: deviceId15, $options: "i" };

    // 分页查询
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 执行查询
    const total = await FsuOnline.countDocuments(query);
    const list = await FsuOnline.find(query)
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(limit);

    // 返回结果
    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    logger.error(`获取FSU上线列表失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "获取FSU上线列表失败",
      error: error.message,
    });
  }
};

/**
 * @desc    添加FSU上线记录
 * @route   POST /api/fsu/online
 * @access  Public
 */
exports.addFsuOnline = async (req, res) => {
  try {
    const fsuData = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    logger.info(`收到FSU上线请求，客户端IP: ${clientIp}`, { fsuData });

    // 1. 参数校验
    if (
      !fsuData.fsuid ||
      !fsuData.siteName ||
      !fsuData.scServerAddress ||
      !fsuData.mainVpn
    ) {
      return res.status(400).json({
        success: false,
        message: "缺少必要参数",
        error: "VALIDATION_ERROR",
      });
    }

    // 2. 检查是否已存在
    const existingFsu = await FsuOnline.findOne({ fsuid: fsuData.fsuid });
    if (existingFsu) {
      return res.status(400).json({
        success: false,
        message: `FSU ID ${fsuData.fsuid} 已存在`,
        error: "DUPLICATE_ERROR",
      });
    }

    // 3. 创建FSU上线记录
    const fsuOnline = await FsuOnline.create(fsuData);

    // 4. 启动WebService服务器和LOGIN注册
    try {
      // 获取VPN分配的内网IP地址，而不是使用前端参数
      let internalIP;
      try {
        internalIP = await vpnService.getInternalIP();
        logger.info("✅ 获取到VPN内网IP", { internalIP });
      } catch (ipError) {
        logger.warn("⚠️ 无法获取VPN内网IP，使用默认IP", {
          error: ipError.message,
        });
        internalIP = "192.168.2.162"; // 使用默认内网IP
      }

      // 准备LOGIN数据 - 使用VPN获取的内网IP
      const loginData = {
        fsuId: fsuData.fsuid,
        fsuCode: fsuData.fsuid,
        internalIP: internalIP, // 使用VPN分配的内网IP
        networkType: "4G",
        softwareVendor: fsuData.softwareVendor,
        fsuType: fsuData.fsuType,
        softwareVersion: fsuData.version,
        mainVPN: fsuData.mainVpn, // 使用前端传递的MainVPN
        disasterRecovery: "zb-sn.toweraiot.cn,zb-sn.toweraiot.cn", // 默认灾备地址
        siteName: fsuData.siteName, // 站点名称
        scServerAddress: fsuData.scServerAddress, // SC服务器地址单独记录
        // 添加LOGIN报文必需的字段
        macId: "869221025266666",
        imsiId: "460068161666666",
        carrier: "CU",
        lockedNetworkType: "LTE",
        nmVendor: "大唐",
        nmType: "DTM-W101T",
        fsuVendor: fsuData.softwareVendor, // FSU软件厂商（从前端传递）
        fsuManufactor: fsuData.hardwareVendor, // FSU硬件厂商（从前端传递）
        devices: [
          fsuData.fsuid, // FSU自身
        ],
      };

      // 添加关联设备 - 16个设备字段（4个锂电池 + 2个蓄电池 + 10个其他设备）
      if (fsuData.powerId) loginData.devices.push(fsuData.powerId);
      if (fsuData.lithiumBatteryId1)
        loginData.devices.push(fsuData.lithiumBatteryId1);
      if (fsuData.temperatureId) loginData.devices.push(fsuData.temperatureId);
      if (fsuData.lithiumBatteryId2)
        loginData.devices.push(fsuData.lithiumBatteryId2);
      if (fsuData.airConditionerId)
        loginData.devices.push(fsuData.airConditionerId);
      if (fsuData.lithiumBatteryId3)
        loginData.devices.push(fsuData.lithiumBatteryId3);
      if (fsuData.smartAccessId) loginData.devices.push(fsuData.smartAccessId);
      if (fsuData.lithiumBatteryId4)
        loginData.devices.push(fsuData.lithiumBatteryId4);
      if (fsuData.waterLeakageId)
        loginData.devices.push(fsuData.waterLeakageId);
      if (fsuData.leadAcidBatteryId1)
        loginData.devices.push(fsuData.leadAcidBatteryId1);
      if (fsuData.infraredId) loginData.devices.push(fsuData.infraredId);
      if (fsuData.smokeDetectorId)
        loginData.devices.push(fsuData.smokeDetectorId);
      if (fsuData.leadAcidBatteryId2)
        loginData.devices.push(fsuData.leadAcidBatteryId2);
      if (fsuData.nonSmartAccessId)
        loginData.devices.push(fsuData.nonSmartAccessId);
      if (fsuData.deviceId13) loginData.devices.push(fsuData.deviceId13);
      if (fsuData.deviceId14) loginData.devices.push(fsuData.deviceId14);
      if (fsuData.deviceId15) loginData.devices.push(fsuData.deviceId15);

      // 第一步：发送LOGIN注册到SC服务器
      logger.info("🚀 第一步：向SC服务器发送LOGIN注册请求", {
        fsuid: fsuData.fsuid,
        scServerAddress: fsuData.scServerAddress,
        deviceCount: loginData.devices.length,
      });

      const startTime = Date.now();
      const loginResult = await sendDirectLogin(loginData);
      const duration = Date.now() - startTime;

      // 更新上线状态
      if (loginResult.success) {
        logger.info(`✅ LOGIN注册成功，耗时: ${duration}ms`, {
          fsuid: fsuData.fsuid,
          duration,
        });

        // 第二步：LOGIN成功后启动WebService服务器等待心跳
        logger.info("🌐 第二步：启动FSU WebService服务器等待SC心跳请求", {
          fsuid: fsuData.fsuid,
        });

        try {
          // 启动WebService服务器监听心跳
          await fsuWebServiceServer.start(
            loginData,
            8080,
            loginData.internalIP
          );

          // 确保设备已添加到WebService服务器的设备列表中
          fsuWebServiceServer.addFsuDevice(loginData);

          // 监听心跳事件并更新数据库
          fsuWebServiceServer.removeAllListeners("heartbeat"); // 移除之前的监听器
          fsuWebServiceServer.on("heartbeat", async (heartbeatData) => {
            try {
              const time = new Date().toLocaleTimeString();
              logger.info(
                `💗 [${time}] 收到SC心跳 - FSU ID: ${heartbeatData.fsuId} ${
                  heartbeatData.success ? "✅" : "❌"
                }`
              );

              // 更新数据库中的心跳时间
              if (heartbeatData.success) {
                await FsuOnline.findOneAndUpdate(
                  { fsuid: heartbeatData.fsuId },
                  {
                    status: "online",
                    lastHeartbeatTime: new Date(),
                  },
                  { new: true }
                );

                logger.info("FSU心跳状态已更新", {
                  fsuid: heartbeatData.fsuId,
                  status: "online",
                  lastHeartbeatTime: new Date(),
                });
              }
            } catch (error) {
              logger.error("处理心跳事件时发生错误", { error: error.message });
            }
          });

          logger.info("🎯 FSU WebService服务器启动成功，等待SC心跳请求", {
            fsuid: fsuData.fsuid,
            port: 8080,
          });
        } catch (webServiceError) {
          logger.error("启动WebService服务器失败", {
            fsuid: fsuData.fsuid,
            error: webServiceError.message,
          });
        }

        await FsuOnline.findByIdAndUpdate(fsuOnline._id, {
          status: "online",
          lastHeartbeatTime: new Date(),
        });

        logger.info(`FSU上线成功，耗时: ${duration}ms`, {
          fsuid: fsuData.fsuid,
          duration,
        });
      } else {
        await FsuOnline.findByIdAndUpdate(fsuOnline._id, {
          status: "offline",
        });

        logger.warn(`FSU上线失败，耗时: ${duration}ms`, {
          fsuid: fsuData.fsuid,
          duration,
          error: loginResult.message,
        });
      }

      // 返回结果
      res.status(201).json({
        success: true,
        data: fsuOnline,
        loginResult,
        processTime: duration,
      });
    } catch (error) {
      // 更新上线状态为离线
      await FsuOnline.findByIdAndUpdate(fsuOnline._id, {
        status: "offline",
      });

      logger.error(`FSU上线过程异常: ${error.message}`, {
        fsuid: fsuData.fsuid,
        error,
      });

      res.status(500).json({
        success: false,
        message: `FSU上线过程异常: ${error.message}`,
        error: "PROCESS_ERROR",
      });
    }
  } catch (error) {
    logger.error(`添加FSU上线记录失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "添加FSU上线记录失败",
      error: error.message,
    });
  }
};

/**
 * @desc    更新FSU上线记录
 * @route   PUT /api/fsu/online/:id
 * @access  Public
 */
exports.updateFsuOnline = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 查找并更新
    const fsuOnline = await FsuOnline.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // 检查是否存在
    if (!fsuOnline) {
      return res.status(404).json({
        success: false,
        message: "未找到FSU上线记录",
        error: "NOT_FOUND",
      });
    }

    // 返回结果
    res.json({
      success: true,
      data: fsuOnline,
    });
  } catch (error) {
    logger.error(`更新FSU上线记录失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "更新FSU上线记录失败",
      error: error.message,
    });
  }
};

/**
 * @desc    删除FSU上线记录
 * @route   DELETE /api/fsu/online/:id
 * @access  Public
 */
exports.deleteFsuOnline = async (req, res) => {
  try {
    const { id } = req.params;

    // 先查找要删除的记录，获取FSU信息
    const fsuOnline = await FsuOnline.findById(id);

    // 检查是否存在
    if (!fsuOnline) {
      return res.status(404).json({
        success: false,
        message: "未找到FSU上线记录",
        error: "NOT_FOUND",
      });
    }

    logger.info(`准备删除FSU上线记录并下线设备`, {
      fsuid: fsuOnline.fsuid,
      siteName: fsuOnline.siteName,
      status: fsuOnline.status,
    });

    // 第一步：停止该FSU的心跳服务和WebService服务器，让设备下线
    try {
      logger.info(`🛑 停止FSU设备的心跳服务`, { fsuid: fsuOnline.fsuid });

      // 停止FSU WebService服务器 - 这样SC服务器就无法发送心跳请求
      await fsuWebServiceServer.stop();

      // 停止心跳管理器
      await heartbeatManager.stop();

      logger.info(`✅ FSU设备已下线`, {
        fsuid: fsuOnline.fsuid,
        message:
          "已停止WebService服务器和心跳服务，设备将无法响应SC服务器的心跳请求",
      });
    } catch (serviceError) {
      logger.warn(`停止FSU服务时发生错误`, {
        fsuid: fsuOnline.fsuid,
        error: serviceError.message,
      });
      // 即使停止服务失败，仍然继续删除记录
    }

    // 第二步：从数据库中删除记录
    await FsuOnline.findByIdAndDelete(id);

    logger.info(`✅ FSU上线记录删除成功`, {
      fsuid: fsuOnline.fsuid,
      message: "记录已删除，设备已下线",
    });

    // 返回结果
    res.json({
      success: true,
      data: {
        fsuid: fsuOnline.fsuid,
        siteName: fsuOnline.siteName,
        offlineMethod: "停止心跳服务和WebService服务器",
      },
      message: `FSU设备 ${fsuOnline.fsuid} 已下线，记录删除成功`,
    });
  } catch (error) {
    logger.error(`删除FSU上线记录失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "删除FSU上线记录失败",
      error: error.message,
    });
  }
};

/**
 * @desc    批量删除FSU上线记录
 * @route   POST /api/fsu/online/batch-delete
 * @access  Public
 */
exports.batchDeleteFsuOnline = async (req, res) => {
  try {
    const { ids } = req.body;

    // 检查参数
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "缺少有效的ID列表",
        error: "VALIDATION_ERROR",
      });
    }

    // 先查找要删除的记录，获取FSU信息
    const fsuOnlineList = await FsuOnline.find({ _id: { $in: ids } });

    if (fsuOnlineList.length === 0) {
      return res.status(404).json({
        success: false,
        message: "未找到要删除的FSU上线记录",
        error: "NOT_FOUND",
      });
    }

    logger.info(`准备批量删除${fsuOnlineList.length}个FSU上线记录并下线设备`, {
      fsuids: fsuOnlineList.map((fsu) => fsu.fsuid),
    });

    // 第一步：停止所有FSU的心跳服务和WebService服务器，让设备下线
    const offlineResults = [];

    for (const fsu of fsuOnlineList) {
      try {
        logger.info(`🛑 停止FSU设备的心跳服务`, { fsuid: fsu.fsuid });

        // 对于批量删除，我们需要停止所有相关的服务
        // 注意：实际情况中可能需要更精细的控制，这里简化处理
        await fsuWebServiceServer.stop();
        await heartbeatManager.stop();

        offlineResults.push({
          fsuid: fsu.fsuid,
          success: true,
          message: "设备已下线",
        });

        logger.info(`✅ FSU设备已下线`, {
          fsuid: fsu.fsuid,
          message: "已停止WebService服务器和心跳服务",
        });
      } catch (serviceError) {
        logger.warn(`停止FSU服务时发生错误`, {
          fsuid: fsu.fsuid,
          error: serviceError.message,
        });

        offlineResults.push({
          fsuid: fsu.fsuid,
          success: false,
          error: serviceError.message,
        });
      }
    }

    // 第二步：从数据库中批量删除记录
    const result = await FsuOnline.deleteMany({ _id: { $in: ids } });

    logger.info(`✅ 批量删除FSU上线记录成功`, {
      requestedCount: ids.length,
      deletedCount: result.deletedCount,
      fsuids: fsuOnlineList.map((fsu) => fsu.fsuid),
    });

    // 返回结果
    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        requestedCount: ids.length,
        offlineResults: offlineResults,
        offlineMethod: "停止心跳服务和WebService服务器",
      },
      message: `成功让${
        offlineResults.filter((r) => r.success).length
      }个FSU设备下线，删除了${result.deletedCount}条记录`,
    });
  } catch (error) {
    logger.error(`批量删除FSU上线记录失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "批量删除FSU上线记录失败",
      error: error.message,
    });
  }
};

/**
 * @desc    获取FSU上线详情
 * @route   GET /api/fsu/online/:id
 * @access  Public
 */
exports.getFsuOnlineDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 查找记录
    const fsuOnline = await FsuOnline.findById(id);

    // 检查是否存在
    if (!fsuOnline) {
      return res.status(404).json({
        success: false,
        message: "未找到FSU上线记录",
        error: "NOT_FOUND",
      });
    }

    // 返回结果
    res.json({
      success: true,
      data: fsuOnline,
    });
  } catch (error) {
    logger.error(`获取FSU上线详情失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "获取FSU上线详情失败",
      error: error.message,
    });
  }
};

/**
 * @desc    导出FSU上线数据
 * @route   GET /api/fsu/online/export
 * @access  Public
 */
exports.exportFsuOnline = async (req, res) => {
  try {
    // 查询所有记录
    const fsuOnlineList = await FsuOnline.find().sort({ createTime: -1 });

    // 设置响应头
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=fsu_online_export.json"
    );

    // 返回结果
    res.json(fsuOnlineList);
  } catch (error) {
    logger.error(`导出FSU上线数据失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "导出FSU上线数据失败",
      error: error.message,
    });
  }
};
