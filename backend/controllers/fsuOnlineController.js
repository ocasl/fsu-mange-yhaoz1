const FsuOnline = require("../models/FsuOnline");
const logger = require("../utils/logger");
const { sendDirectLogin } = require("../services/scService");
const fsuWebServiceServer = require("../services/fsuWebServiceServer");
const heartbeatManager = require("../services/heartbeatManager");
const vpnService = require("../services/vpnService");
const deviceDataManager = require("../utils/deviceDataManager");

/**
 * 从FSU记录中提取设备ID列表
 */
function extractDeviceIdsFromRecord(fsuRecord) {
  const devices = [];

  // 定义设备字段映射
  const deviceFields = [
    "powerId",
    "lithiumBatteryId1",
    "temperatureId",
    "lithiumBatteryId2",
    "airConditionerId",
    "lithiumBatteryId3",
    "smartAccessId",
    "lithiumBatteryId4",
    "waterLeakageId",
    "leadAcidBatteryId1",
    "infraredId",
    "smokeDetectorId",
    "leadAcidBatteryId2",
    "nonSmartAccessId",
    "deviceId13",
    "deviceId14",
    "deviceId15",
  ];

  // 提取非空的设备ID
  deviceFields.forEach((field) => {
    if (fsuRecord[field] && fsuRecord[field].trim()) {
      devices.push(fsuRecord[field].trim());
    }
  });

  // 如果没有设备，至少包含FSU自身设备
  if (devices.length === 0) {
    devices.push(fsuRecord.fsuid); // FSU自身

    logger.info(`FSU设备 ${fsuRecord.fsuid} 未配置子设备，仅包含FSU自身`, {
      fsuid: fsuRecord.fsuid,
      deviceCount: devices.length,
    });
  } else {
    logger.info(`FSU设备 ${fsuRecord.fsuid} 已配置${devices.length}个子设备`, {
      fsuid: fsuRecord.fsuid,
      deviceCount: devices.length,
      devices: devices,
    });
  }

  return devices;
}

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

    // 权限控制：子账号只能看到自己创建的FSU记录
    if (req.user && !req.user.isAdmin()) {
      query.creator = req.user.username;
    }
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

    // 3. 创建FSU上线记录 - 添加创建者信息
    const fsuDataWithCreator = {
      ...fsuData,
      creator: req.user ? req.user.username : "anonymous",
    };
    const fsuOnline = await FsuOnline.create(fsuDataWithCreator);

    // 4. 启动或添加到WebService服务器和LOGIN注册
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

      // 提取所有子设备ID
      const allDeviceIds = extractDeviceIdsFromRecord(fsuData);

      // 添加关联设备到登录数据
      loginData.devices = allDeviceIds;

      // 注册FSU设备及其子设备到设备数据管理器
      const deviceRegistrationSuccess = deviceDataManager.registerFsuDevices(
        fsuData.fsuid,
        allDeviceIds,
        {
          siteName: fsuData.siteName,
          softwareVendor: fsuData.softwareVendor,
          hardwareVendor: fsuData.hardwareVendor,
          fsuType: fsuData.fsuType,
          version: fsuData.version,
          mainVpn: fsuData.mainVpn,
          scServerAddress: fsuData.scServerAddress,
        }
      );

      if (deviceRegistrationSuccess) {
        logger.info(`FSU设备及子设备注册成功: ${fsuData.fsuid}`, {
          fsuId: fsuData.fsuid,
          deviceCount: allDeviceIds.length,
          devices: allDeviceIds,
        });
      } else {
        logger.warn(`FSU设备注册失败: ${fsuData.fsuid}`, {
          fsuId: fsuData.fsuid,
        });
      }

      // 第一步：发送LOGIN注册到SC服务器
      logger.info("📡 第一步：向SC服务器发送LOGIN注册请求", {
        fsuid: fsuData.fsuid,
        scServerAddress: fsuData.scServerAddress,
        deviceCount: loginData.devices.length,
        step: "1/2"
      });

      const startTime = Date.now();
      let loginResult = null;
      let duration = 0;

      try {
        loginResult = await sendDirectLogin(loginData);
        duration = Date.now() - startTime;

        // 更新上线状态
        if (loginResult.success) {
          logger.info(`✅ LOGIN注册成功，耗时: ${duration}ms`, {
            fsuid: fsuData.fsuid,
            duration,
          });

          // 第二步：LOGIN成功后启动WebService服务器
          logger.info("🚀 第二步：启动FSU WebService服务器", {
            fsuid: fsuData.fsuid,
            internalIP: loginData.internalIP,
            step: "2/2"
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

            logger.info("✅ WebService服务器已准备就绪", {
              fsuid: fsuData.fsuid,
              step: "2/2"
            });

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

            logger.info("🎯 FSU设备上线成功，WebService服务器已就绪", {
              fsuid: fsuData.fsuid,
              port: 8080,
            });

            await FsuOnline.findByIdAndUpdate(fsuOnline._id, {
              status: "online",
              lastHeartbeatTime: new Date(),
            });

            logger.info(`FSU上线成功，耗时: ${duration}ms`, {
              fsuid: fsuData.fsuid,
              duration,
            });
        } catch (webServiceError) {
          logger.error("启动WebService服务器失败", {
            fsuid: fsuData.fsuid,
            error: webServiceError.message,
          });

          await FsuOnline.findByIdAndUpdate(fsuOnline._id, {
            status: "offline",
          });
        }
      } else {
        await FsuOnline.findByIdAndUpdate(fsuOnline._id, {
          status: "offline",
        });

        logger.warn(`FSU LOGIN失败，耗时: ${duration}ms`, {
          fsuid: fsuData.fsuid,
          duration,
          error: loginResult.message,
        });
      }
      } catch (loginError) {
        duration = Date.now() - startTime;
        logger.error("发送LOGIN请求失败", {
          fsuid: fsuData.fsuid,
          error: loginError.message,
        });

        await FsuOnline.findByIdAndUpdate(fsuOnline._id, {
          status: "offline",
        });

        loginResult = {
          success: false,
          message: loginError.message
        };
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
 * @desc    更新FSU上线状态（上线/下线切换）
 * @route   PATCH /api/fsu/online/:id/status
 * @access  Public
 */
exports.updateFsuOnlineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 验证状态值
    if (!["online", "offline", "connecting"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "无效的状态值，必须是 online、offline 或 connecting",
        error: "INVALID_STATUS",
      });
    }

    // 查找FSU记录
    const fsuOnline = await FsuOnline.findById(id);
    if (!fsuOnline) {
      return res.status(404).json({
        success: false,
        message: "未找到FSU上线记录",
        error: "NOT_FOUND",
      });
    }

    logger.info(`更新FSU设备状态`, {
      fsuid: fsuOnline.fsuid,
      oldStatus: fsuOnline.status,
      newStatus: status,
    });

    // 根据状态执行相应操作
    if (status === "online") {
      // 上线操作：添加到WebService服务器并执行LOGIN
      try {
        // 获取VPN分配的内网IP地址
        let internalIP;
        try {
          internalIP = await vpnService.getInternalIP();
          logger.info("✅ 获取到VPN内网IP", { internalIP });
        } catch (ipError) {
          logger.warn("⚠️ 无法获取VPN内网IP，使用默认IP", {
            error: ipError.message,
          });
          internalIP = "10.3.8.204"; // 使用已知的VPN IP
        }

        // 构建FSU数据对象
        const fsuData = {
          fsuId: fsuOnline.fsuid,
          fsuid: fsuOnline.fsuid,
          fsuCode: fsuOnline.fsuid,
          siteName: fsuOnline.siteName,
          scServerAddress: fsuOnline.scServerAddress,
          mainVpn: fsuOnline.mainVpn,
          softwareVendor: fsuOnline.softwareVendor,
          hardwareVendor: fsuOnline.hardwareVendor,
          fsuType: fsuOnline.fsuType,
          version: fsuOnline.version,
          internalIP: internalIP, // 添加内网IP

          // 提取设备ID列表
          devices: extractDeviceIdsFromRecord(fsuOnline),

          // 默认配置
          macId: "869221025266666",
          imsiId: "460068161666666",
          networkType: "4G",
          lockedNetworkType: "LTE",
          carrier: "CU",
          nmVendor: "大唐",
          nmType: "DTM-W101T",
          fsuVendor: "ZXLW",
          fsuManufactor: "ZXLW",
          softwareVersion: "25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002",
          disasterRecovery: "zb-sn.toweraiot.cn,zb-sn.toweraiot.cn",
        };

        // 第一步：向SC发送LOGIN注册请求
        logger.info("📡 第一步：向SC发送LOGIN注册请求", {
          fsuid: fsuOnline.fsuid,
          step: "1/2"
        });
        const loginResult = await sendDirectLogin(fsuData);

        if (loginResult.success) {
          logger.info("✅ LOGIN注册成功", {
            fsuid: fsuOnline.fsuid,
            step: "1/2"
          });

          // 第二步：LOGIN成功后启动WebService服务器
          logger.info("🚀 第二步：启动WebService服务器", {
            fsuid: fsuOnline.fsuid,
            internalIP: internalIP,
            step: "2/2"
          });

          try {
            // 启动WebService服务器监听心跳
            await fsuWebServiceServer.start(fsuData, 8080, internalIP);

            // 确保设备已添加到WebService服务器的设备列表中
            fsuWebServiceServer.addFsuDevice(fsuData);

            logger.info("✅ WebService服务器已准备就绪", {
              fsuid: fsuOnline.fsuid,
              step: "2/2"
            });

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

            logger.info("🎯 FSU设备上线成功，WebService服务器已就绪", {
              fsuid: fsuOnline.fsuid,
              port: 8080,
            });

            await FsuOnline.findByIdAndUpdate(id, {
              status: "online",
              lastHeartbeatTime: new Date(),
            });

            logger.info(`FSU上线成功`, {
              fsuid: fsuOnline.fsuid,
            });
          } catch (webServiceError) {
            logger.error("启动WebService服务器失败", {
              fsuid: fsuOnline.fsuid,
              error: webServiceError.message,
            });

            await FsuOnline.findByIdAndUpdate(id, {
              status: "offline",
            });
          }
        } else {
          await FsuOnline.findByIdAndUpdate(id, {
            status: "offline",
          });

          logger.warn(`FSU LOGIN失败`, {
            fsuid: fsuOnline.fsuid,
            error: loginResult.message,
          });
        }
      } catch (error) {
        logger.error(`FSU设备上线失败`, {
          fsuid: fsuOnline.fsuid,
          error: error.message,
        });
      }
    } else if (status === "offline") {
      // 下线操作：只从WebService服务器移除设备，记录保留
      try {
        logger.info(`🛑 FSU设备下线：从WebService服务器移除`, {
          fsuid: fsuOnline.fsuid,
        });

        // 从WebService服务器移除设备
        const removed = fsuWebServiceServer.removeFsuDevice(fsuOnline.fsuid);
        if (removed) {
          logger.info(`✅ FSU设备已从WebService服务器移除`, {
            fsuid: fsuOnline.fsuid,
            remainingDevices: fsuWebServiceServer.getDeviceCount(),
          });
        } else {
          logger.warn(`⚠️ FSU设备未在WebService服务器中找到`, {
            fsuid: fsuOnline.fsuid,
          });
        }

        logger.info(`✅ FSU设备下线完成，记录保留`, {
          fsuid: fsuOnline.fsuid,
        });
      } catch (error) {
        logger.error(`❌ FSU设备下线失败`, {
          fsuid: fsuOnline.fsuid,
          error: error.message,
        });
      }
    }

    // 更新数据库状态
    const updatedFsu = await FsuOnline.findByIdAndUpdate(
      id,
      {
        status: status,
        lastHeartbeatTime: status === "online" ? new Date() : null,
      },
      { new: true }
    );

    logger.info(`FSU设备状态更新成功`, {
      fsuid: updatedFsu.fsuid,
      status: updatedFsu.status,
    });

    res.json({
      success: true,
      data: updatedFsu,
      message: `FSU设备状态已更新为${status === "online" ? "在线" : "离线"}`,
    });
  } catch (error) {
    logger.error(`更新FSU设备状态失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "更新FSU设备状态失败",
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

    // 从WebService服务器移除FSU设备
    try {
      logger.info(`🛑 从WebService服务器移除FSU设备`, {
        fsuid: fsuOnline.fsuid,
      });

      const removed = fsuWebServiceServer.removeFsuDevice(fsuOnline.fsuid);

      if (removed) {
        logger.info(`✅ FSU设备已从WebService服务器移除`, {
          fsuid: fsuOnline.fsuid,
          remainingDevices: fsuWebServiceServer.getDeviceCount(),
        });
      } else {
        logger.warn(`⚠️ FSU设备未在WebService服务器中找到`, {
          fsuid: fsuOnline.fsuid,
        });
      }
    } catch (serviceError) {
      logger.warn(`移除FSU设备时发生错误`, {
        fsuid: fsuOnline.fsuid,
        error: serviceError.message,
      });
      // 即使移除失败，仍然继续删除记录
    }

    // 第二步：从设备数据管理器移除FSU设备映射
    try {
      logger.info(`🛑 从设备数据管理器移除FSU设备映射`, {
        fsuid: fsuOnline.fsuid,
      });

      const deviceRemoved = deviceDataManager.unregisterFsuDevices(
        fsuOnline.fsuid
      );
      if (deviceRemoved) {
        logger.info(`✅ FSU设备映射已从设备数据管理器移除`, {
          fsuid: fsuOnline.fsuid,
        });
      } else {
        logger.warn(`⚠️  FSU设备映射未在设备数据管理器中找到`, {
          fsuid: fsuOnline.fsuid,
        });
      }
    } catch (deviceError) {
      logger.warn(`移除FSU设备映射时发生错误`, {
        fsuid: fsuOnline.fsuid,
        error: deviceError.message,
      });
      // 即使移除设备映射失败，仍然继续删除记录
    }

    // 第三步：从数据库中删除记录
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
        offlineMethod: "从WebService服务器移除设备",
        remainingDevices: fsuWebServiceServer.getDeviceCount(),
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

    // 从WebService服务器移除设备
    const offlineResults = [];

    for (const fsu of fsuOnlineList) {
      try {
        logger.info(`🛑 从WebService服务器移除FSU设备`, { fsuid: fsu.fsuid });
        const removed = fsuWebServiceServer.removeFsuDevice(fsu.fsuid);

        if (removed) {
          offlineResults.push({
            fsuid: fsu.fsuid,
            success: true,
            message: "设备已从WebService服务器移除",
            webServiceRemoved: true,
          });

          logger.info(`✅ FSU设备已从WebService服务器移除`, {
            fsuid: fsu.fsuid,
            remainingDevices: fsuWebServiceServer.getDeviceCount(),
          });
        } else {
          offlineResults.push({
            fsuid: fsu.fsuid,
            success: false,
            message: "设备未在WebService服务器中找到",
            webServiceRemoved: false,
          });

          logger.warn(`⚠️ FSU设备未在WebService服务器中找到`, {
            fsuid: fsu.fsuid,
          });
        }
      } catch (serviceError) {
        logger.warn(`移除FSU设备时发生错误`, {
          fsuid: fsu.fsuid,
          error: serviceError.message,
        });

        offlineResults.push({
          fsuid: fsu.fsuid,
          success: false,
          error: serviceError.message,
          message: "移除设备失败",
        });
      }
    }

    // 检查是否还有设备在线
    if (!fsuWebServiceServer.hasOnlineDevices()) {
      logger.info("所有FSU设备已下线，WebService服务器保持运行等待新设备");
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
        offlineMethod: "从WebService服务器移除设备",
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

/**
 * @desc    获取设备映射状态
 * @route   GET /api/fsu/online/device-mappings
 * @access  Public
 */
exports.getDeviceMappings = async (req, res) => {
  try {
    // 获取所有已注册的FSU设备
    const registeredDevices = deviceDataManager.getAllRegisteredFsuDevices();

    logger.info("查询设备映射状态", {
      fsuCount: registeredDevices.length,
    });

    res.json({
      success: true,
      data: {
        fsuCount: registeredDevices.length,
        fsuDevices: registeredDevices,
        summary: registeredDevices.map((fsu) => ({
          fsuId: fsu.fsuId,
          deviceCount: fsu.deviceCount,
          registeredAt: fsu.registeredAt,
        })),
      },
      message: "设备映射状态查询成功",
    });
  } catch (error) {
    logger.error("查询设备映射状态失败", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "查询设备映射状态失败",
      error: error.message,
    });
  }
};
