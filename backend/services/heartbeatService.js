/**
 * FSU心跳保活服务
 * 可通过API控制的心跳系统
 */

const { sendDirectLogin } = require("./scService");
const fsuWebServiceServer = require("./fsuWebServiceServer");
const { getMyInternalIP } = require("../simplified-heartbeat");
const logger = require("../utils/logger");
const FsuConfig = require("../models/FsuConfig");

class HeartbeatService {
  constructor() {
    this.isRunning = false;
    this.currentConfig = null;
    this.heartbeatCount = 0;
    this.dataRequestCount = 0;
    this.startTime = null;
    this.webServiceServer = null;
  }

  /**
   * 获取活动的FSU配置
   */
  async getActiveConfig() {
    try {
      let config = await FsuConfig.findOne({ isActive: true });

      // 如果没有活动配置，创建默认配置
      if (!config) {
        config = new FsuConfig({
          name: "default",
          description: "默认FSU配置",
          isActive: true,
        });
        await config.save();
        logger.info("创建默认FSU配置");
      }

      return config;
    } catch (error) {
      logger.error("获取FSU配置失败:", error);
      throw error;
    }
  }

  /**
   * 启动心跳服务
   */
  async start() {
    if (this.isRunning) {
      throw new Error("心跳服务已在运行中");
    }

    try {
      // 1. 获取当前配置
      this.currentConfig = await this.getActiveConfig();
      logger.info("获取FSU配置成功", { configName: this.currentConfig.name });

      // 2. 获取VPN内网IP
      const myInternalIP = getMyInternalIP();
      logger.info(`检测到内网IP: ${myInternalIP}`);

      // 3. 构造FSU数据
      const fsuData = {
        fsuId: this.currentConfig.fsuId,
        fsuCode: this.currentConfig.fsuCode,
        internalIP: myInternalIP,
        macId: this.currentConfig.macId,
        imsiId: this.currentConfig.imsiId,
        networkType: this.currentConfig.networkType,
        lockedNetworkType: this.currentConfig.lockedNetworkType,
        carrier: this.currentConfig.carrier,
        nmVendor: this.currentConfig.nmVendor,
        nmType: this.currentConfig.nmType,
        fsuVendor: this.currentConfig.fsuVendor,
        fsuType: this.currentConfig.fsuType,
        softwareVersion: this.currentConfig.softwareVersion,
        devices: this.currentConfig.devices,
        mainVPN: this.currentConfig.mainVPN,
        disasterRecovery: this.currentConfig.disasterRecovery,
        scServerAddress: this.currentConfig.scServerAddress,
      };

      // 4. 启动WebService服务端
      const port = 8080;
      await fsuWebServiceServer.start(fsuData, port, myInternalIP);

      logger.info("🎯 FSU WebService服务器启动成功，等待SC心跳请求", {
        fsuid: fsuData.fsuId,
        port: port,
      });

      // 5. 执行LOGIN注册
      const loginResult = await sendDirectLogin(fsuData);

      if (!loginResult.success) {
        throw new Error(`LOGIN注册失败: ${loginResult.message}`);
      }

      logger.info("LOGIN注册成功", {
        fsuId: fsuData.fsuId,
        address: `${myInternalIP}:${port}`,
      });

      // 6. 设置事件监听
      this.setupEventListeners();

      // 7. 更新状态
      this.isRunning = true;
      this.startTime = new Date();
      this.heartbeatCount = 0;
      this.dataRequestCount = 0;

      logger.info("FSU心跳服务启动成功", {
        fsuId: fsuData.fsuId,
        config: this.currentConfig.name,
        address: `${myInternalIP}:${port}`,
      });

      return {
        success: true,
        message: "心跳服务启动成功",
        data: {
          fsuId: fsuData.fsuId,
          address: `${myInternalIP}:${port}`,
          config: this.currentConfig.name,
          startTime: this.startTime,
        },
      };
    } catch (error) {
      logger.error("心跳服务启动失败:", error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * 停止心跳服务
   */
  async stop() {
    if (!this.isRunning) {
      return { success: true, message: "心跳服务未在运行" };
    }

    try {
      await fsuWebServiceServer.stop();

      this.isRunning = false;
      const runDuration = this.startTime
        ? Date.now() - this.startTime.getTime()
        : 0;

      logger.info("FSU心跳服务已停止", {
        runDuration: `${Math.round(runDuration / 1000)}秒`,
        heartbeatCount: this.heartbeatCount,
        dataRequestCount: this.dataRequestCount,
      });

      return {
        success: true,
        message: "心跳服务已停止",
        data: {
          runDuration,
          heartbeatCount: this.heartbeatCount,
          dataRequestCount: this.dataRequestCount,
        },
      };
    } catch (error) {
      logger.error("停止心跳服务失败:", error);
      throw error;
    }
  }

  /**
   * 重启心跳服务（配置更新后）
   */
  async restart() {
    logger.info("重启心跳服务...");

    if (this.isRunning) {
      await this.stop();
      // 等待一秒确保完全停止
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return await this.start();
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      startTime: this.startTime,
      heartbeatCount: this.heartbeatCount,
      dataRequestCount: this.dataRequestCount,
      currentConfig: this.currentConfig
        ? {
            name: this.currentConfig.name,
            fsuId: this.currentConfig.fsuId,
            softwareVersion: this.currentConfig.softwareVersion,
          }
        : null,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
    };
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听心跳事件
    fsuWebServiceServer.on("heartbeat", (heartbeatData) => {
      this.heartbeatCount++;
      const time = new Date().toLocaleTimeString();

      if (heartbeatData.success) {
        logger.info(`收到第${this.heartbeatCount}次SC心跳`, {
          fsuId: heartbeatData.fsuId,
          time,
        });
      } else {
        logger.error(`心跳处理失败`, {
          error: heartbeatData.error,
          time,
        });
      }
    });

    // 监听数据请求事件
    fsuWebServiceServer.on("dataRequest", (dataRequestData) => {
      this.dataRequestCount++;
      const time = new Date().toLocaleTimeString();

      if (dataRequestData.success) {
        logger.info(`收到第${this.dataRequestCount}次SC数据请求`, {
          deviceId: dataRequestData.deviceId,
          time,
        });
      } else {
        logger.error(`数据请求处理失败`, {
          error: dataRequestData.error,
          time,
        });
      }
    });
  }
}

// 创建单例实例
const heartbeatService = new HeartbeatService();

module.exports = heartbeatService;
