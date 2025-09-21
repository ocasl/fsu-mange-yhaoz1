const FsuOnline = require("../models/FsuOnline");
const AlarmRecord = require("../models/AlarmRecord");
const OperationLog = require("../models/OperationLog");
const logger = require("../utils/logger");

/**
 * 创建示例FSU数据（用于演示操作记录功能）
 */
const createSampleFsuData = async (req, res) => {
  const startTime = Date.now();

  try {
    const currentUser = req.user || { _id: "demo", username: "demo" };

    // 生成随机FSU ID
    const timestamp = Date.now().toString().slice(-8);
    const sampleFsuid = `61080243${timestamp}`;

    const sampleData = {
      fsuid: sampleFsuid,
      siteName: `演示站点-${timestamp}`,
      scServerAddress: "demo.server.com",
      mainVpn: "demo-vpn.server.com",
      softwareVendor: "演示软件厂商",
      hardwareVendor: "演示硬件厂商",
      fsuType: "演示FSU型号",
      version: "v1.0.0-demo",
      status: "online",
      creator: currentUser.username,
    };

    // 创建FSU记录
    const fsuRecord = await FsuOnline.create(sampleData);

    // 记录操作日志
    await OperationLog.logOperation({
      userId: currentUser._id,
      username: currentUser.username,
      operation: "CREATE_FSU",
      module: "FSU",
      description: `创建演示FSU设备: ${sampleFsuid}`,
      method: req.method,
      url: req.originalUrl,
      requestData: { fsuid: sampleFsuid, siteName: sampleData.siteName },
      responseData: { fsuId: fsuRecord._id },
      success: true,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      duration: Date.now() - startTime,
    });

    logger.info(`创建演示FSU数据成功: ${sampleFsuid}`, {
      userId: currentUser._id,
      username: currentUser.username,
    });

    res.status(201).json({
      success: true,
      message: "演示FSU数据创建成功",
      data: fsuRecord,
    });
  } catch (error) {
    logger.error("创建演示FSU数据失败:", error);

    if (req.user) {
      await OperationLog.logOperation({
        userId: req.user._id,
        username: req.user.username,
        operation: "CREATE_FSU",
        module: "FSU",
        description: "创建演示FSU设备失败",
        method: req.method,
        url: req.originalUrl,
        requestData: req.body,
        success: false,
        errorMessage: error.message,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        duration: Date.now() - startTime,
      });
    }

    res.status(500).json({
      success: false,
      message: "创建演示FSU数据失败",
      error: error.message,
    });
  }
};

/**
 * 创建示例告警数据
 */
const createSampleAlarmData = async (req, res) => {
  const startTime = Date.now();

  try {
    const currentUser = req.user || { _id: "demo", username: "demo" };
    const timestamp = Date.now().toString().slice(-8);

    const sampleAlarm = {
      type: "report",
      fsuid: `61080243${timestamp}`,
      deviceId: `61080241${timestamp}`,
      signalId: "AI001",
      alarmDesc: "演示告警 - 温度超限",
      alarmType: "1", // 告警
      alarmLevel: "2", // 重要
      value: "45.5",
      unit: "℃",
      creator: currentUser.username,
      createTime: new Date(),
    };

    const alarmRecord = await AlarmRecord.create(sampleAlarm);

    // 记录操作日志
    await OperationLog.logOperation({
      userId: currentUser._id,
      username: currentUser.username,
      operation: "CREATE_ALARM",
      module: "ALARM",
      description: `创建演示告警: ${sampleAlarm.alarmDesc}`,
      method: req.method,
      url: req.originalUrl,
      requestData: {
        fsuid: sampleAlarm.fsuid,
        deviceId: sampleAlarm.deviceId,
        alarmDesc: sampleAlarm.alarmDesc,
      },
      responseData: { alarmId: alarmRecord._id },
      success: true,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      duration: Date.now() - startTime,
    });

    logger.info(`创建演示告警数据成功: ${sampleAlarm.fsuid}`, {
      userId: currentUser._id,
      username: currentUser.username,
    });

    res.status(201).json({
      success: true,
      message: "演示告警数据创建成功",
      data: alarmRecord,
    });
  } catch (error) {
    logger.error("创建演示告警数据失败:", error);

    if (req.user) {
      await OperationLog.logOperation({
        userId: req.user._id,
        username: req.user.username,
        operation: "CREATE_ALARM",
        module: "ALARM",
        description: "创建演示告警失败",
        method: req.method,
        url: req.originalUrl,
        requestData: req.body,
        success: false,
        errorMessage: error.message,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        duration: Date.now() - startTime,
      });
    }

    res.status(500).json({
      success: false,
      message: "创建演示告警数据失败",
      error: error.message,
    });
  }
};

/**
 * 获取操作统计信息
 */
const getOperationSummary = async (req, res) => {
  try {
    const currentUser = req.user;

    // 如果没有登录用户，返回空统计
    if (!currentUser) {
      return res.json({
        success: true,
        data: {
          summary: {
            totalOperations: 0,
            fsuOperations: 0,
            alarmOperations: 0,
            configOperations: 0,
            userOperations: 0,
          },
          recentOperations: [],
          userRole: "guest",
          canViewAllLogs: false,
        },
      });
    }

    // 根据用户角色获取不同的统计数据
    const query = currentUser.isAdmin() ? {} : { userId: currentUser._id };

    const [
      totalOperations,
      fsuOperations,
      alarmOperations,
      configOperations,
      userOperations,
      recentOperations,
    ] = await Promise.all([
      OperationLog.countDocuments(query),
      OperationLog.countDocuments({ ...query, module: "FSU" }),
      OperationLog.countDocuments({ ...query, module: "ALARM" }),
      OperationLog.countDocuments({ ...query, module: "CONFIG" }),
      OperationLog.countDocuments({ ...query, module: "USER" }),
      OperationLog.find(query)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "username realName role"),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalOperations,
          fsuOperations,
          alarmOperations,
          configOperations,
          userOperations,
        },
        recentOperations,
        userRole: currentUser.role,
        canViewAllLogs: currentUser.isAdmin(),
      },
    });
  } catch (error) {
    logger.error("获取操作统计信息失败:", error);
    res.status(500).json({
      success: false,
      message: "获取操作统计信息失败",
      error: error.message,
    });
  }
};

module.exports = {
  createSampleFsuData,
  createSampleAlarmData,
  getOperationSummary,
};
