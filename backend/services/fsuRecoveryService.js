/**
 * FSU设备恢复服务
 *
 * 负责在系统启动时自动恢复数据库中的FSU设备上线状态
 * 重新启动WebService服务器并恢复心跳连接
 */

const FsuOnline = require("../models/FsuOnline");
const fsuWebServiceServer = require("./fsuWebServiceServer");
const { sendDirectLogin } = require("./scService");
const vpnService = require("./vpnService");
const logger = require("../utils/logger");

class FsuRecoveryService {
  constructor() {
    this.isRecovering = false;
    this.recoveryResults = [];
  }

  /**
   * 启动FSU设备恢复流程
   */
  async startRecovery() {
    if (this.isRecovering) {
      logger.warn("FSU恢复流程已在进行中");
      return { success: false, message: "恢复流程已在进行中" };
    }

    this.isRecovering = true;
    this.recoveryResults = [];

    try {
      logger.info("🔄 开始FSU设备恢复流程");

      // 1. 从数据库获取所有上线状态的FSU设备
      const onlineFsuDevices = await this.getOnlineFsuDevices();

      if (onlineFsuDevices.length === 0) {
        logger.info("✅ 没有需要恢复的FSU设备");
        return {
          success: true,
          message: "没有需要恢复的FSU设备",
          data: { recoveredCount: 0, totalCount: 0 },
        };
      }

      logger.info(`📋 找到${onlineFsuDevices.length}个需要恢复的FSU设备`, {
        devices: onlineFsuDevices.map((fsu) => ({
          fsuid: fsu.fsuid,
          siteName: fsu.siteName,
          status: fsu.status,
        })),
      });

      // 2. 启动WebService服务器（如果还未启动）
      await this.ensureWebServiceRunning();

      // 3. 逐个恢复FSU设备
      for (const fsuDevice of onlineFsuDevices) {
        await this.recoverSingleFsu(fsuDevice);
      }

      // 4. 统计恢复结果
      const successCount = this.recoveryResults.filter((r) => r.success).length;
      const failureCount = this.recoveryResults.filter(
        (r) => !r.success
      ).length;

      logger.info(`✅ FSU设备恢复完成`, {
        total: onlineFsuDevices.length,
        success: successCount,
        failure: failureCount,
        details: this.recoveryResults,
      });

      return {
        success: true,
        message: `成功恢复${successCount}个FSU设备，${failureCount}个失败`,
        data: {
          totalCount: onlineFsuDevices.length,
          recoveredCount: successCount,
          failureCount: failureCount,
          results: this.recoveryResults,
        },
      };
    } catch (error) {
      logger.error("FSU设备恢复流程失败", { error: error.message });
      return {
        success: false,
        message: `恢复流程失败: ${error.message}`,
        error: error,
      };
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * 从数据库获取所有上线状态的FSU设备
   */
  async getOnlineFsuDevices() {
    try {
      // 获取状态为online或connecting的FSU设备
      const fsuDevices = await FsuOnline.find({
        status: { $in: ["online", "connecting"] },
      }).sort({ createTime: -1 });

      return fsuDevices;
    } catch (error) {
      logger.error("获取在线FSU设备失败", { error: error.message });
      throw error;
    }
  }

  /**
   * 确保WebService服务器正在运行
   */
  async ensureWebServiceRunning() {
    try {
      const status = fsuWebServiceServer.getStatus();

      if (status.isRunning) {
        logger.info("✅ WebService服务器已在运行", {
          port: status.port,
          uptime: status.uptime,
          registeredDevices: status.registeredDevices,
        });
        return true;
      }

      logger.info("🌐 启动WebService服务器...");

      // 获取VPN内网IP
      let internalIP = "0.0.0.0";
      try {
        internalIP = await vpnService.getInternalIP();
        logger.info(`📡 获取到内网IP: ${internalIP}`);
      } catch (vpnError) {
        logger.warn("无法获取VPN内网IP，使用默认绑定地址", {
          error: vpnError.message,
        });
      }

      // 启动WebService服务器，不指定特定FSU数据
      await fsuWebServiceServer.start(null, 8080, internalIP);

      logger.info("✅ WebService服务器启动成功");
      return true;
    } catch (error) {
      logger.error("启动WebService服务器失败", { error: error.message });
      throw error;
    }
  }

  /**
   * 恢复单个FSU设备
   */
  async recoverSingleFsu(fsuDevice) {
    const startTime = Date.now();

    try {
      logger.info(`🔄 开始恢复FSU设备: ${fsuDevice.fsuid}`, {
        siteName: fsuDevice.siteName,
        status: fsuDevice.status,
      });

      // 1. 构建FSU数据对象
      const fsuData = this.buildFsuDataFromRecord(fsuDevice);

      // 2. 添加到WebService服务器
      const addResult = fsuWebServiceServer.addFsuDevice(fsuData);
      if (!addResult) {
        throw new Error("添加到WebService服务器失败");
      }

      // 3. 执行LOGIN注册
      const loginResult = await sendDirectLogin(fsuData);
      if (!loginResult.success) {
        throw new Error(`LOGIN注册失败: ${loginResult.message}`);
      }

      // 4. 更新数据库状态
      await FsuOnline.findByIdAndUpdate(fsuDevice._id, {
        status: "online",
        lastHeartbeatTime: new Date(),
      });

      const duration = Date.now() - startTime;

      this.recoveryResults.push({
        fsuid: fsuDevice.fsuid,
        siteName: fsuDevice.siteName,
        success: true,
        duration: duration,
        message: "恢复成功",
      });

      logger.info(`✅ FSU设备恢复成功: ${fsuDevice.fsuid}`, {
        duration: `${duration}ms`,
        loginStatus: loginResult.data?.loginStatus,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      this.recoveryResults.push({
        fsuid: fsuDevice.fsuid,
        siteName: fsuDevice.siteName,
        success: false,
        duration: duration,
        error: error.message,
      });

      logger.error(`❌ FSU设备恢复失败: ${fsuDevice.fsuid}`, {
        error: error.message,
        duration: `${duration}ms`,
      });

      // 更新数据库状态为离线
      try {
        await FsuOnline.findByIdAndUpdate(fsuDevice._id, {
          status: "offline",
        });
      } catch (updateError) {
        logger.warn("更新FSU设备状态失败", {
          fsuid: fsuDevice.fsuid,
          error: updateError.message,
        });
      }
    }
  }

  /**
   * 从数据库记录构建FSU数据对象
   */
  buildFsuDataFromRecord(fsuRecord) {
    return {
      fsuId: fsuRecord.fsuid,
      fsuid: fsuRecord.fsuid,
      fsuCode: fsuRecord.fsuid,
      siteName: fsuRecord.siteName,
      scServerAddress: fsuRecord.scServerAddress,
      mainVpn: fsuRecord.mainVpn,
      softwareVendor: fsuRecord.softwareVendor,
      hardwareVendor: fsuRecord.hardwareVendor,
      fsuType: fsuRecord.fsuType,
      version: fsuRecord.version,

      // 设备ID映射
      devices: this.extractDeviceIds(fsuRecord),

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
  }

  /**
   * 从FSU记录中提取设备ID列表
   */
  extractDeviceIds(fsuRecord) {
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
      // 只添加FSU自身作为基础设备
      devices.push(fsuRecord.fsuid); // FSU自身

      logger.info(`FSU设备 ${fsuRecord.fsuid} 未配置子设备，仅包含FSU自身`, {
        fsuid: fsuRecord.fsuid,
        deviceCount: devices.length,
      });
    } else {
      logger.info(
        `FSU设备 ${fsuRecord.fsuid} 已配置${devices.length}个子设备`,
        {
          fsuid: fsuRecord.fsuid,
          deviceCount: devices.length,
          devices: devices,
        }
      );
    }

    return devices;
  }

  /**
   * 获取恢复状态
   */
  getRecoveryStatus() {
    return {
      isRecovering: this.isRecovering,
      lastRecoveryResults: this.recoveryResults,
      webServiceStatus: fsuWebServiceServer.getStatus(),
    };
  }

  /**
   * 手动触发单个FSU设备恢复
   */
  async recoverSpecificFsu(fsuid) {
    try {
      const fsuDevice = await FsuOnline.findOne({ fsuid: fsuid });
      if (!fsuDevice) {
        throw new Error(`未找到FSU设备: ${fsuid}`);
      }

      await this.ensureWebServiceRunning();
      await this.recoverSingleFsu(fsuDevice);

      const result = this.recoveryResults.find((r) => r.fsuid === fsuid);
      return {
        success: result?.success || false,
        message: result?.success
          ? "设备恢复成功"
          : `设备恢复失败: ${result?.error}`,
        data: result,
      };
    } catch (error) {
      logger.error(`手动恢复FSU设备失败: ${fsuid}`, { error: error.message });
      return {
        success: false,
        message: `恢复失败: ${error.message}`,
        error: error,
      };
    }
  }
}

// 创建单例实例
const fsuRecoveryService = new FsuRecoveryService();

module.exports = fsuRecoveryService;
