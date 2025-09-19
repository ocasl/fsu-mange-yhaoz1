const { sendDirectLogin } = require("./scService");
const fsuWebServiceServer = require("./fsuWebServiceServer");
const vpnService = require("./vpnService");
const FSULogAnalyzer = require("../utils/fsuLogAnalyzer");
const logger = require("../utils/logger");

/**
 * FSU心跳保活管理器
 *
 * 根据中国铁塔B接口规范实现心跳保活机制：
 * 1. LOGIN成功后启动FSU WebService服务器（FSU作为服务端）
 * 2. SC定期发送GET_FSUINFO心跳请求（SC作为客户端）
 * 3. FSU响应GET_FSUINFO_ACK确认心跳
 * 4. 监控心跳状态，异常时自动重连
 */
class HeartbeatManager {
  constructor() {
    this.isRunning = false;
    this.fsuData = null;
    this.webServicePort = 8080;
    this.heartbeatTimeout = 300000; // 5分钟超时
    this.lastHeartbeatTime = null;
    this.heartbeatCheckInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.logAnalyzer = new FSULogAnalyzer();

    // 心跳统计
    this.heartbeatStats = {
      total: 0,
      successful: 0,
      failed: 0,
      lastSuccess: null,
      lastFailure: null,
    };
  }

  /**
   * 启动心跳保活系统
   * @param {Object} fsuData - FSU设备数据
   */
  async start(fsuData) {
    if (this.isRunning) {
      logger.warn("心跳保活系统已在运行中");
      return { success: false, message: "系统已在运行中" };
    }

    this.fsuData = fsuData;

    try {
      logger.info("🔄 启动FSU心跳保活系统", { fsuId: fsuData.fsuId });

      // 1. 检查网络环境
      const networkStatus = await this.checkNetworkEnvironment();
      if (!networkStatus.success) {
        return networkStatus;
      }

      // 2. 执行LOGIN注册
      const loginResult = await this.performLogin();
      if (!loginResult.success) {
        return loginResult;
      }

      // 3. 启动FSU WebService服务器
      const webServiceResult = await this.startWebServiceServer();
      if (!webServiceResult.success) {
        return webServiceResult;
      }

      // 4. 启动心跳监控
      this.startHeartbeatMonitoring();

      this.isRunning = true;
      logger.info("✅ FSU心跳保活系统启动成功", {
        fsuId: fsuData.fsuId,
        port: this.webServicePort,
        internalIP: fsuData.internalIP,
      });

      return {
        success: true,
        message: "心跳保活系统启动成功",
        data: {
          fsuId: fsuData.fsuId,
          webServiceUrl: `http://${fsuData.internalIP}:${this.webServicePort}`,
          heartbeatTimeout: this.heartbeatTimeout / 1000,
        },
      };
    } catch (error) {
      logger.error("心跳保活系统启动失败", {
        error: error.message,
        fsuId: fsuData.fsuId,
      });

      await this.cleanup();

      return {
        success: false,
        message: `启动失败: ${error.message}`,
        error: error,
      };
    }
  }

  /**
   * 停止心跳保活系统
   */
  async stop() {
    if (!this.isRunning) {
      return { success: true, message: "系统未在运行" };
    }

    logger.info("🛑 停止FSU心跳保活系统", { fsuId: this.fsuData?.fsuId });

    await this.cleanup();
    this.isRunning = false;

    logger.info("✅ FSU心跳保活系统已停止");

    return { success: true, message: "系统已停止" };
  }

  /**
   * 检查网络环境
   */
  async checkNetworkEnvironment() {
    logger.info("🔍 检查网络环境...");

    try {
      // 由于您已经手动连接VPN，我们直接获取内网IP
      let internalIP = this.fsuData.internalIP;

      // 如果没有提供内网IP，尝试从VPN服务获取
      if (!internalIP) {
        try {
          internalIP = await vpnService.getInternalIP();
        } catch (vpnError) {
          logger.warn("无法自动获取内网IP，使用默认配置", {
            error: vpnError.message,
          });
          // 使用当前提供的IP或默认IP
          internalIP = this.fsuData.internalIP || "192.168.2.162";
        }
      }

      // 更新FSU数据中的内网IP
      if (this.fsuData && internalIP) {
        this.fsuData.internalIP = internalIP;
      }

      logger.info("✅ 网络环境检查通过", {
        vpnConnected: "手动连接",
        internalIP: internalIP,
      });

      return { success: true, internalIP };
    } catch (error) {
      logger.error("网络环境检查失败", { error: error.message });
      return {
        success: false,
        message: `网络检查失败: ${error.message}`,
      };
    }
  }

  /**
   * 执行LOGIN注册
   */
  async performLogin() {
    logger.info("🔐 执行LOGIN注册...", { fsuId: this.fsuData.fsuId });

    try {
      const loginResult = await sendDirectLogin(this.fsuData);

      if (loginResult.success && loginResult.data?.loginStatus === "SUCCESS") {
        logger.info("✅ LOGIN注册成功", {
          fsuId: this.fsuData.fsuId,
          responseType: loginResult.data.responseType,
        });

        return {
          success: true,
          message: "LOGIN注册成功",
          data: loginResult.data,
        };
      } else {
        logger.error("❌ LOGIN注册失败", {
          fsuId: this.fsuData.fsuId,
          message: loginResult.message,
        });

        return {
          success: false,
          message: `LOGIN失败: ${loginResult.message}`,
          data: loginResult,
        };
      }
    } catch (error) {
      logger.error("LOGIN注册异常", {
        fsuId: this.fsuData.fsuId,
        error: error.message,
      });

      return {
        success: false,
        message: `LOGIN异常: ${error.message}`,
      };
    }
  }

  /**
   * 启动FSU WebService服务器
   */
  async startWebServiceServer() {
    logger.info("🌐 启动FSU WebService服务器...", {
      port: this.webServicePort,
      fsuId: this.fsuData.fsuId,
    });

    try {
      // 绑定心跳事件处理器
      this.bindHeartbeatEventHandlers();

      // 启动WebService服务器，绑定到VPN内网IP
      await fsuWebServiceServer.start(
        this.fsuData,
        this.webServicePort,
        this.fsuData.internalIP
      );

      const status = fsuWebServiceServer.getStatus();

      logger.info("✅ FSU WebService服务器启动成功", {
        fsuId: status.fsuId,
        port: status.port,
        isRunning: status.isRunning,
      });

      return {
        success: true,
        message: "WebService服务器启动成功",
        data: status,
      };
    } catch (error) {
      logger.error("WebService服务器启动失败", {
        error: error.message,
        port: this.webServicePort,
      });

      return {
        success: false,
        message: `WebService启动失败: ${error.message}`,
      };
    }
  }

  /**
   * 绑定心跳事件处理器
   */
  bindHeartbeatEventHandlers() {
    // 监听心跳请求事件
    fsuWebServiceServer.on("heartbeat", (heartbeatData) => {
      this.handleHeartbeatReceived(heartbeatData);
    });

    // 监听错误事件
    fsuWebServiceServer.on("error", (error) => {
      this.handleWebServiceError(error);
    });
  }

  /**
   * 处理接收到的心跳
   */
  handleHeartbeatReceived(heartbeatData) {
    this.lastHeartbeatTime = new Date();
    this.heartbeatStats.total++;

    if (heartbeatData.success) {
      this.heartbeatStats.successful++;
      this.heartbeatStats.lastSuccess = this.lastHeartbeatTime;

      logger.info("💗 收到SC心跳请求", {
        fsuId: this.fsuData.fsuId,
        requestFsuId: heartbeatData.fsuId,
        timestamp: this.lastHeartbeatTime.toISOString(),
        totalHeartbeats: this.heartbeatStats.total,
      });

      // 重置重连尝试次数
      this.reconnectAttempts = 0;
    } else {
      this.heartbeatStats.failed++;
      this.heartbeatStats.lastFailure = this.lastHeartbeatTime;

      logger.warn("💔 心跳处理失败", {
        fsuId: this.fsuData.fsuId,
        error: heartbeatData.error,
        timestamp: this.lastHeartbeatTime.toISOString(),
      });
    }
  }

  /**
   * 处理WebService错误
   */
  handleWebServiceError(error) {
    logger.error("WebService服务器错误", {
      fsuId: this.fsuData?.fsuId,
      error: error.message,
    });

    // 可以在这里添加自动重启逻辑
    this.scheduleReconnect();
  }

  /**
   * 启动心跳监控
   */
  startHeartbeatMonitoring() {
    logger.info("👁️ 启动心跳监控", {
      timeoutSeconds: this.heartbeatTimeout / 1000,
      checkIntervalSeconds: 60,
    });

    // 每分钟检查一次心跳状态
    this.heartbeatCheckInterval = setInterval(() => {
      this.checkHeartbeatStatus();
    }, 60000);

    // 设置初始心跳时间
    this.lastHeartbeatTime = new Date();
  }

  /**
   * 检查心跳状态
   */
  checkHeartbeatStatus() {
    if (!this.isRunning || !this.lastHeartbeatTime) {
      return;
    }

    const now = new Date();
    const timeSinceLastHeartbeat = now - this.lastHeartbeatTime;

    if (timeSinceLastHeartbeat > this.heartbeatTimeout) {
      logger.warn("💀 心跳超时检测", {
        fsuId: this.fsuData.fsuId,
        lastHeartbeatTime: this.lastHeartbeatTime.toISOString(),
        timeoutMinutes: Math.round(timeSinceLastHeartbeat / 60000),
        maxTimeoutMinutes: this.heartbeatTimeout / 60000,
      });

      this.scheduleReconnect();
    } else {
      logger.debug("💗 心跳状态正常", {
        fsuId: this.fsuData.fsuId,
        minutesSinceLastHeartbeat: Math.round(timeSinceLastHeartbeat / 60000),
        stats: this.heartbeatStats,
      });
    }
  }

  /**
   * 安排重连
   */
  async scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error("❌ 达到最大重连次数，停止重连", {
        fsuId: this.fsuData?.fsuId,
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      });
      return;
    }

    this.reconnectAttempts++;
    const delaySeconds = Math.min(this.reconnectAttempts * 30, 300); // 最多延迟5分钟

    logger.info("🔄 安排重连", {
      fsuId: this.fsuData?.fsuId,
      attempt: this.reconnectAttempts,
      delaySeconds: delaySeconds,
    });

    setTimeout(async () => {
      await this.performReconnect();
    }, delaySeconds * 1000);
  }

  /**
   * 执行重连
   */
  async performReconnect() {
    logger.info("🔄 执行心跳重连", {
      fsuId: this.fsuData?.fsuId,
      attempt: this.reconnectAttempts,
    });

    try {
      // 停止当前服务
      await fsuWebServiceServer.stop();

      // 重新执行LOGIN
      const loginResult = await this.performLogin();
      if (!loginResult.success) {
        throw new Error(`LOGIN重连失败: ${loginResult.message}`);
      }

      // 重新启动WebService服务器
      const webServiceResult = await this.startWebServiceServer();
      if (!webServiceResult.success) {
        throw new Error(`WebService重连失败: ${webServiceResult.message}`);
      }

      logger.info("✅ 心跳重连成功", {
        fsuId: this.fsuData.fsuId,
        attempt: this.reconnectAttempts,
      });

      // 重置重连计数
      this.reconnectAttempts = 0;
    } catch (error) {
      logger.error("❌ 心跳重连失败", {
        fsuId: this.fsuData?.fsuId,
        attempt: this.reconnectAttempts,
        error: error.message,
      });

      // 继续尝试重连
      this.scheduleReconnect();
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    // 停止心跳监控
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = null;
    }

    // 停止WebService服务器
    try {
      await fsuWebServiceServer.stop();
    } catch (error) {
      logger.warn("停止WebService服务器时发生错误", { error: error.message });
    }

    // 重置状态
    this.lastHeartbeatTime = null;
    this.reconnectAttempts = 0;
  }

  /**
   * 获取心跳状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      fsuId: this.fsuData?.fsuId,
      webServicePort: this.webServicePort,
      lastHeartbeatTime: this.lastHeartbeatTime,
      heartbeatStats: { ...this.heartbeatStats },
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      webServiceStatus: fsuWebServiceServer.getStatus(),
    };
  }

  /**
   * 获取心跳统计
   */
  getHeartbeatStatistics() {
    const now = new Date();
    const stats = { ...this.heartbeatStats };

    if (this.lastHeartbeatTime) {
      stats.minutesSinceLastHeartbeat = Math.round(
        (now - this.lastHeartbeatTime) / 60000
      );
    }

    if (stats.total > 0) {
      stats.successRate = Math.round((stats.successful / stats.total) * 100);
    }

    return stats;
  }
}

// 创建全局实例
const heartbeatManager = new HeartbeatManager();

module.exports = heartbeatManager;
