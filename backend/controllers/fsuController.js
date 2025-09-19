const {
  sendRegisterToSC,
  testScConnection,
  sendDirectLogin,
} = require("../services/scService");
const vpnService = require("../services/vpnService");
const heartbeatService = require("../services/heartbeatService");
const fsuWebServiceServer = require("../services/fsuWebServiceServer");
const logger = require("../utils/logger");

/**
 * 处理FSU设备注册请求
 */
const registerFsu = async (req, res) => {
  try {
    const fsuData = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    logger.info(`收到FSU注册请求，客户端IP: ${clientIp}`, { fsuData });

    // 1. 参数校验
    const validation = validateFsuData(fsuData);
    if (!validation.valid) {
      logger.warn(`FSU注册参数校验失败: ${validation.message}`, { fsuData });
      return res.status(400).json({
        success: false,
        message: validation.message,
        error: "VALIDATION_ERROR",
      });
    }

    // 2. 调用服务层发送到SC
    const startTime = Date.now();
    const scResult = await sendRegisterToSC(fsuData);
    const duration = Date.now() - startTime;

    // 3. 记录处理结果
    logger.info(`FSU注册处理完成，耗时: ${duration}ms`, {
      fsuId: fsuData.fsuId,
      success: scResult.success,
      duration,
    });

    // 4. 返回结果给前端
    const responseStatus = scResult.success ? 200 : 400;
    res.status(responseStatus).json({
      ...scResult,
      processTime: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`处理FSU注册请求异常: ${error.message}`, {
      stack: error.stack,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      message: "服务器内部错误，请稍后重试",
      error: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 直接测试LOGIN报文
 */
const testLogin = async (req, res) => {
  try {
    logger.info("收到直接LOGIN测试请求");

    // 1. 建立FSU客户端的网络隧道连接
    if (!vpnService.isVpnConnected()) {
      logger.info("开始建立FSU客户端网络隧道连接");
      const vpnConnected = await vpnService.connect();

      if (!vpnConnected) {
        return res.status(500).json({
          success: false,
          message: "FSU客户端网络隧道连接失败，无法连接到SC服务器",
          error: "TUNNEL_CONNECTION_FAILED",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 2. 获取FSU客户端的内网IP
    const internalIP = await vpnService.getInternalIP();
    logger.info("FSU客户端网络隧道连接成功", { internalIP });

    // 3. 使用FSU客户端内网IP发送LOGIN请求
    const testData = {
      fsuId: "61082143802203",
      fsuCode: "61082143802203",
      devices: ["power", "air"],
      networkType: "4G",
      softwareVersion: "1",
      internalIP: internalIP,
    };

    const result = await sendDirectLogin(testData);

    // 如果LOGIN成功，启动FSU WebService服务器
    if (result.success && result.data?.loginStatus === "SUCCESS") {
      logger.info("LOGIN成功，启动FSU WebService服务器", {
        fsuId: testData.fsuId,
      });

      try {
        // 启动FSU WebService服务器，监听SC的心跳请求
        await fsuWebServiceServer.start(testData, 8080, testData.internalIP);
        logger.info("FSU WebService服务器启动成功，等待SC心跳请求");
      } catch (error) {
        logger.error("启动FSU WebService服务器失败", { error: error.message });
      }
    }

    const responseStatus = result.success ? 200 : 400;
    res.status(responseStatus).json({
      ...result,
      heartbeatStatus: heartbeatService.getStatus(),
      webServiceStatus: fsuWebServiceServer.getStatus(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`直接LOGIN测试异常: ${error.message}`, { stack: error.stack });

    res.status(500).json({
      success: false,
      message: "LOGIN测试失败",
      error: "LOGIN_TEST_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 测试SC服务器连接
 */
const testConnection = async (req, res) => {
  try {
    logger.info("收到SC连接测试请求");

    const result = await testScConnection();

    const responseStatus = result.success ? 200 : 503;
    res.status(responseStatus).json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`SC连接测试异常: ${error.message}`, { stack: error.stack });

    res.status(500).json({
      success: false,
      message: "连接测试失败",
      error: "TEST_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 获取系统状态信息
 */
const getSystemStatus = async (req, res) => {
  try {
    const vpnStatus = vpnService.getSystemStatus();

    const status = {
      system: "FSU设备上线系统",
      version: "1.0.0",
      status: "running",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      vpn: vpnStatus,
    };

    logger.info("返回系统状态信息");
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error(`获取系统状态异常: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "获取系统状态失败",
      error: "STATUS_ERROR",
    });
  }
};

/**
 * 获取VPN连接状态和网络信息
 */
const getVpnStatus = async (req, res) => {
  try {
    const vpnStatus = vpnService.getSystemStatus();

    logger.info("返回VPN状态信息");
    res.json({
      success: true,
      data: vpnStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`获取VPN状态异常: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "获取VPN状态失败",
      error: "VPN_STATUS_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 检测VPN环境
 */
const connectVpn = async (req, res) => {
  try {
    logger.info("收到VPN环境检测请求");

    const connected = await vpnService.connect();

    const vpnStatus = await vpnService.getVpnStatusSummary();

    const responseStatus = connected ? 200 : 200; // 总是返回200，因为这是检测而不是连接
    res.status(responseStatus).json({
      success: true,
      message: connected ? "检测到VPN环境" : "未检测到VPN环境，使用模拟模式",
      data: vpnStatus,
      guidance: connected
        ? null
        : {
            message: "请手动连接VPN后重新检测",
            steps: [
              "1. 使用系统VPN设置或第三方VPN客户端连接到VPN",
              "2. 确保VPN连接成功后，重新调用此接口",
              "3. 或者继续使用模拟模式进行测试",
            ],
          },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`VPN环境检测异常: ${error.message}`, { stack: error.stack });

    res.status(500).json({
      success: false,
      message: "VPN环境检测失败",
      error: "VPN_DETECT_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 断开VPN连接
 */
const disconnectVpn = async (req, res) => {
  try {
    logger.info("收到VPN断开请求");

    await vpnService.disconnect();

    res.json({
      success: true,
      message: "VPN连接已断开",
      data: {
        isConnected: false,
        internalIP: null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`VPN断开异常: ${error.message}`, { stack: error.stack });

    res.status(500).json({
      success: false,
      message: "VPN断开失败",
      error: "VPN_DISCONNECT_ERROR",
      timestamp: new Date().toISOString(),
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
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`获取心跳状态异常: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "获取心跳状态失败",
      error: "HEARTBEAT_STATUS_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 启动心跳服务
 */
const startHeartbeat = async (req, res) => {
  try {
    const { fsuId, fsuCode, internalIP } = req.body;

    if (!fsuId || !fsuCode) {
      return res.status(400).json({
        success: false,
        message: "fsuId和fsuCode为必填项",
        error: "MISSING_REQUIRED_FIELDS",
        timestamp: new Date().toISOString(),
      });
    }

    const fsuData = {
      fsuId,
      fsuCode,
      internalIP: internalIP || (await vpnService.getInternalIP()),
    };

    heartbeatService.start(fsuData);

    res.json({
      success: true,
      message: "心跳服务已启动",
      data: heartbeatService.getStatus(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`启动心跳服务异常: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "启动心跳服务失败",
      error: "HEARTBEAT_START_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 停止心跳服务
 */
const stopHeartbeat = async (req, res) => {
  try {
    heartbeatService.stop();

    res.json({
      success: true,
      message: "心跳服务已停止",
      data: heartbeatService.getStatus(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`停止心跳服务异常: ${error.message}`);

    res.status(500).json({
      success: false,
      message: "停止心跳服务失败",
      error: "HEARTBEAT_STOP_ERROR",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 校验FSU数据格式
 * @param {Object} fsuData - FSU数据
 * @returns {Object} 校验结果
 */
const validateFsuData = (fsuData) => {
  // 必填字段检查
  if (!fsuData.fsuId) {
    return { valid: false, message: "FSU ID为必填项" };
  }

  if (!fsuData.fsuCode) {
    return { valid: false, message: "FSU编码为必填项" };
  }

  if (
    !fsuData.devices ||
    !Array.isArray(fsuData.devices) ||
    fsuData.devices.length === 0
  ) {
    return { valid: false, message: "设备列表为必填项，至少选择一个设备" };
  }

  // 格式校验
  if (!/^\d{10,20}$/.test(fsuData.fsuId)) {
    return { valid: false, message: "FSU ID必须为10-20位数字" };
  }

  if (fsuData.fsuCode.length !== 14) {
    return { valid: false, message: "FSU编码必须为14位字符" };
  }

  // 设备类型校验
  const validDevices = ["power", "air", "battery"];
  const invalidDevices = fsuData.devices.filter(
    (device) => !validDevices.includes(device)
  );
  if (invalidDevices.length > 0) {
    return {
      valid: false,
      message: `无效的设备类型: ${invalidDevices.join(
        ", "
      )}，支持的设备类型: ${validDevices.join(", ")}`,
    };
  }

  return { valid: true, message: "参数校验通过" };
};

/**
 * 启动FSU WebService服务器
 */
const startFsuWebService = async (req, res) => {
  try {
    const { fsuId, fsuCode, port = 8080 } = req.body;

    if (!fsuId || !fsuCode) {
      return res.status(400).json({
        success: false,
        message: "缺少必要参数: fsuId, fsuCode",
      });
    }

    // 获取VPN内网IP
    const os = require("os");
    const interfaces = os.networkInterfaces();
    let internalIP = "192.168.2.162"; // 默认值

    // 查找VPN内网IP
    for (const name in interfaces) {
      if (name.includes("TIETA") || name.includes("PPP")) {
        for (const net of interfaces[name]) {
          if (net.family === "IPv4" && !net.internal) {
            internalIP = net.address;
            break;
          }
        }
      }
    }

    const fsuData = { fsuId, fsuCode, internalIP };
    await fsuWebServiceServer.start(fsuData, port, internalIP);

    const status = fsuWebServiceServer.getStatus();

    res.json({
      success: true,
      message: "FSU WebService服务器已启动",
      data: status,
    });
  } catch (error) {
    logger.error("启动FSU WebService服务器失败", { error: error.message });
    res.status(500).json({
      success: false,
      message: "启动FSU WebService服务器失败",
      error: error.message,
    });
  }
};

/**
 * 停止FSU WebService服务器
 */
const stopFsuWebService = async (req, res) => {
  try {
    await fsuWebServiceServer.stop();

    res.json({
      success: true,
      message: "FSU WebService服务器已停止",
    });
  } catch (error) {
    logger.error("停止FSU WebService服务器失败", { error: error.message });
    res.status(500).json({
      success: false,
      message: "停止FSU WebService服务器失败",
      error: error.message,
    });
  }
};

/**
 * 获取FSU WebService服务器状态
 */
const getFsuWebServiceStatus = (req, res) => {
  try {
    const status = fsuWebServiceServer.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error("获取FSU WebService服务器状态失败", { error: error.message });
    res.status(500).json({
      success: false,
      message: "获取FSU WebService服务器状态失败",
      error: error.message,
    });
  }
};

module.exports = {
  registerFsu,
  testLogin,
  testConnection,
  getSystemStatus,
  getVpnStatus,
  connectVpn,
  disconnectVpn,
  getHeartbeatStatus,
  startHeartbeat,
  stopHeartbeat,
  startFsuWebService,
  stopFsuWebService,
  getFsuWebServiceStatus,
};
