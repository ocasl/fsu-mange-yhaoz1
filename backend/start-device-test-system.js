/**
 * 设备测试系统启动脚本
 * 启动FSU WebService服务器，支持所有设备类型的数据响应
 */

const fsuWebServiceServer = require("./services/fsuWebServiceServer");
const logger = require("./utils/logger");
const deviceDataManager = require("./utils/deviceDataManager");
const { sendDirectLogin } = require("./services/scService");
const os = require("os");

class DeviceTestSystem {
  constructor() {
    this.fsuData = {
      fsuId: "61082143802203", // 使用真实的FSU ID
      fsuCode: "61082143802203",
      devices: ["power", "air", "battery"], // 默认设备列表
      networkType: "4G",
      softwareVersion: "1",
      internalIP: null, // 将自动检测
    };
    this.port = 8080;
    this.heartbeatEnabled = false; // 是否启用心跳保活
    this.heartbeatStats = {
      total: 0,
      successful: 0,
      failed: 0,
      lastSuccess: null,
      lastFailure: null,
    };
  }

  /**
   * 启动系统
   */
  async start() {
    try {
      logger.info("启动完整FSU系统");

      // 检测内网IP
      this.fsuData.internalIP = this.getMyInternalIP();

      console.log("\n🚀 FSU完整系统启动");
      console.log("=".repeat(60));
      console.log("包含心跳保活 + 设备数据响应的完整FSU系统");
      console.log("");

      console.log("📋 FSU设备信息:");
      console.log(`  - FSU ID: ${this.fsuData.fsuId}`);
      console.log(`  - FSU Code: ${this.fsuData.fsuCode}`);
      console.log(`  - 内网IP: ${this.fsuData.internalIP}`);
      console.log(`  - 网络类型: ${this.fsuData.networkType}`);
      console.log(`  - 软件版本: ${this.fsuData.softwareVersion}`);
      console.log("");

      // 显示支持的设备类型
      this.showSupportedDevices();

      // 监听心跳和数据请求事件
      this.setupEventListeners();

      // 1. 先启动FSU WebService服务器
      console.log("🌐 步骤1: 启动FSU WebService服务器...");
      await fsuWebServiceServer.start(
        this.fsuData,
        this.port,
        this.fsuData.internalIP
      );

      console.log("✅ WebService服务器启动成功！");
      console.log(
        `   - 监听地址: http://${this.fsuData.internalIP}:${this.port}`
      );
      console.log(
        `   - 心跳端点: http://${this.fsuData.internalIP}:${this.port}/invoke`
      );
      console.log(
        `   - 健康检查: http://${this.fsuData.internalIP}:${this.port}/health`
      );
      console.log("");

      // 2. 如果启用心跳保活，执行LOGIN注册
      if (this.heartbeatEnabled) {
        console.log("🔐 步骤2: 执行LOGIN注册（心跳保活）...");
        await this.performLogin();
      } else {
        console.log("⚠️  心跳保活未启用，仅提供设备数据响应服务");
        console.log("   如需启用心跳保活，请使用 --heartbeat 参数");
        console.log("");
      }

      logger.info("FSU系统启动成功", {
        fsuId: this.fsuData.fsuId,
        internalIP: this.fsuData.internalIP,
        port: this.port,
        heartbeatEnabled: this.heartbeatEnabled,
        webServiceUrl: `http://${this.fsuData.internalIP}:${this.port}`,
        healthCheckUrl: `http://${this.fsuData.internalIP}:${this.port}/health`,
      });

      console.log("🚀 [系统就绪] FSU系统已完全启动");
      console.log(`📍 FSU ID: ${this.fsuData.fsuId}`);
      console.log(
        `🌐 服务地址: http://${this.fsuData.internalIP}:${this.port}`
      );
      console.log(
        `💗 心跳保活: ${this.heartbeatEnabled ? "✅ 已启用" : "❌ 未启用"}`
      );
      console.log(`📡 等待SC服务器的请求...`);
      console.log("");

      this.showUsageInstructions();
    } catch (error) {
      logger.error("启动FSU系统失败", { error: error.message });
      process.exit(1);
    }
  }

  /**
   * 获取本机实际的内网IP
   */
  getMyInternalIP() {
    const interfaces = os.networkInterfaces();

    // 首先查找VPN接口（TIETA等）
    for (const name in interfaces) {
      if (name.includes("TIETA") || name.includes("PPP")) {
        for (const net of interfaces[name]) {
          if (net.family === "IPv4" && !net.internal) {
            console.log(`✅ 找到VPN接口: ${name} - ${net.address}`);
            return net.address;
          }
        }
      }
    }

    // 然后查找10.x.x.x内网IP
    for (const name in interfaces) {
      for (const net of interfaces[name]) {
        if (
          net.family === "IPv4" &&
          !net.internal &&
          net.address.startsWith("10.")
        ) {
          console.log(`✅ 找到10.x.x.x内网IP: ${name} - ${net.address}`);
          return net.address;
        }
      }
    }

    // 最后查找192.168.x.x内网IP
    for (const name in interfaces) {
      for (const net of interfaces[name]) {
        if (
          net.family === "IPv4" &&
          !net.internal &&
          net.address.startsWith("192.168.")
        ) {
          console.log(`✅ 找到192.168.x.x内网IP: ${name} - ${net.address}`);
          return net.address;
        }
      }
    }

    console.log("❌ 未找到合适的内网IP，使用默认值");
    return "192.168.2.162";
  }

  /**
   * 执行LOGIN注册
   */
  async performLogin() {
    try {
      const loginResult = await sendDirectLogin(this.fsuData);

      if (loginResult.success && loginResult.data?.loginStatus === "SUCCESS") {
        console.log("✅ LOGIN注册成功！");
        console.log(
          `   - SC现在知道我们的地址: ${this.fsuData.internalIP}:${this.port}`
        );
        console.log(`   - SC将向这个地址发送心跳请求`);
        console.log("");

        logger.info("LOGIN注册成功", {
          fsuId: this.fsuData.fsuId,
          responseType: loginResult.data.responseType,
        });

        // 启动心跳统计
        this.startHeartbeatMonitoring();

        return true;
      } else {
        console.log("❌ LOGIN注册失败!");
        console.log(`   - 错误信息: ${loginResult.message}`);
        console.log(`   - 将继续提供设备数据响应服务`);
        console.log("");

        logger.error("LOGIN注册失败", {
          fsuId: this.fsuData.fsuId,
          message: loginResult.message,
        });

        return false;
      }
    } catch (error) {
      console.log("❌ LOGIN注册异常!");
      console.log(`   - 异常信息: ${error.message}`);
      console.log(`   - 将继续提供设备数据响应服务`);
      console.log("");

      logger.error("LOGIN注册异常", {
        fsuId: this.fsuData.fsuId,
        error: error.message,
      });

      return false;
    }
  }

  /**
   * 启动心跳监控
   */
  startHeartbeatMonitoring() {
    // 每60秒显示心跳统计
    setInterval(() => {
      const now = new Date();
      const lastHeartbeatTime =
        this.heartbeatStats.lastSuccess || this.heartbeatStats.lastFailure;
      const timeSinceLastHeartbeat = lastHeartbeatTime
        ? Math.floor((now - lastHeartbeatTime) / 1000)
        : null;

      console.log(`\n📊 [${now.toLocaleTimeString()}] 心跳统计:`);
      console.log(`   💗 总心跳数: ${this.heartbeatStats.total}`);
      console.log(`   ✅ 成功: ${this.heartbeatStats.successful}`);
      console.log(`   ❌ 失败: ${this.heartbeatStats.failed}`);
      if (this.heartbeatStats.total > 0) {
        const successRate = (
          (this.heartbeatStats.successful / this.heartbeatStats.total) *
          100
        ).toFixed(1);
        console.log(`   📈 成功率: ${successRate}%`);
      }
      if (timeSinceLastHeartbeat !== null) {
        const minutes = Math.floor(timeSinceLastHeartbeat / 60);
        const seconds = timeSinceLastHeartbeat % 60;
        console.log(`   ⏱️  距离上次心跳: ${minutes}分${seconds}秒`);
      }
    }, 60000); // 每60秒显示一次
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听心跳事件
    fsuWebServiceServer.on("heartbeat", (data) => {
      // 更新心跳统计
      this.heartbeatStats.total++;
      if (data.success) {
        this.heartbeatStats.successful++;
        this.heartbeatStats.lastSuccess = data.timestamp;
      } else {
        this.heartbeatStats.failed++;
        this.heartbeatStats.lastFailure = data.timestamp;
      }

      logger.info("收到心跳请求", {
        timestamp: data.timestamp.toLocaleString(),
        success: data.success,
        fsuId: data.fsuId,
      });

      // 控制台友好显示
      console.log(`\n💓 [心跳] ${data.timestamp.toLocaleTimeString()}`);
      console.log(`   结果: ${data.success ? "✅ 成功" : "❌ 失败"}`);
      console.log(`   FSU ID: ${data.fsuId || "N/A"}`);
      if (!data.success && data.error) {
        console.log(`   错误: ${data.error}`);
      }
      console.log(
        `   统计: 总计${this.heartbeatStats.total}, 成功${this.heartbeatStats.successful}, 失败${this.heartbeatStats.failed}`
      );
    });

    // 监听数据请求事件
    fsuWebServiceServer.on("dataRequest", (data) => {
      logger.info("收到数据请求", {
        timestamp: data.timestamp.toLocaleString(),
        fsuId: data.fsuId,
        deviceId: data.deviceId,
        success: data.success,
      });

      // 控制台友好显示
      console.log(`\n🔔 [事件通知] 设备数据请求处理完成`);
      console.log(`   时间: ${data.timestamp.toLocaleString()}`);
      console.log(`   结果: ${data.success ? "✅ 成功" : "❌ 失败"}`);
      console.log(`   FSU ID: ${data.fsuId}`);
      console.log(`   设备ID: ${data.deviceId}`);
    });

    // 处理程序退出
    process.on("SIGINT", () => {
      logger.info("收到退出信号，正在关闭系统...");
      this.stop();
    });

    process.on("SIGTERM", () => {
      logger.info("收到终止信号，正在关闭系统...");
      this.stop();
    });
  }

  /**
   * 显示支持的设备类型
   */
  showSupportedDevices() {
    const devices = deviceDataManager.getSupportedDevices();

    console.log("\n========== 支持的设备类型 ==========");
    devices.forEach((device, index) => {
      console.log(`${index + 1}. ${device.type.toUpperCase()}`);
      console.log(`   FSU ID: ${device.fsuId}`);
      console.log(`   设备ID: ${device.deviceId}`);
      console.log(`   信号数量: ${device.signalCount}`);
      console.log("");
    });
    console.log("===================================\n");
  }

  /**
   * 显示使用说明
   */
  showUsageInstructions() {
    console.log("\n========== 使用说明 ==========");
    console.log(`FSU系统已启动，等待SC服务器的请求`);
    console.log("");
    console.log("🌐 服务地址:");
    console.log(
      `  WebService: http://${this.fsuData.internalIP}:${this.port}/services/FSUService`
    );
    console.log(
      `  健康检查: http://${this.fsuData.internalIP}:${this.port}/health`
    );
    console.log(`  服务状态: http://${this.fsuData.internalIP}:${this.port}/`);
    console.log("");

    if (this.heartbeatEnabled) {
      console.log("💗 心跳保活功能:");
      console.log("  - ✅ 已向SC注册，等待心跳请求");
      console.log("  - 📊 每60秒显示心跳统计");
      console.log("  - 💾 详细日志记录在 ./logs/ 目录");
      console.log("");
    }

    console.log("🔧 自测试命令:");
    console.log("  # 实时日志监控");
    console.log("  npm run logs");
    console.log("");
    console.log("  # 测试所有设备类型");
    console.log("  npm run test:devices");
    console.log("");
    console.log("  # 测试特定设备类型");
    console.log("  node test-device-messages.js device flooding");
    console.log("  node test-device-messages.js device temperature");
    console.log("  node test-device-messages.js device switchPower");
    console.log("");
    console.log("  # 显示支持的设备类型");
    console.log("  npm run test:list");
    console.log("");

    console.log("📡 SC服务器请求格式:");
    console.log("  1. 心跳请求: GET_FSUINFO (Code: 1701)");
    console.log("  2. 设备数据请求: GET_DATA (Code: 401)");
    console.log("");

    console.log("📊 监控信息:");
    if (this.heartbeatEnabled) {
      console.log("  - 💓 心跳统计会自动显示");
    }
    console.log("  - 🔵 设备数据请求会实时显示");
    console.log("  - 📝 完整日志保存在 ./logs/combined.log");
    console.log("");

    console.log("🔧 其他命令:");
    console.log("  # 完整FSU系统（含心跳）");
    console.log("  node start-device-test-system.js --heartbeat");
    console.log("");
    console.log("  # 自定义配置");
    console.log(
      "  node start-device-test-system.js --port 8090 --fsu-id 61089443800204"
    );
    console.log("");
    console.log("按 Ctrl+C 退出系统");
    console.log("===============================\n");
  }

  /**
   * 停止系统
   */
  async stop() {
    try {
      await fsuWebServiceServer.stop();
      logger.info("设备测试系统已停止");
      process.exit(0);
    } catch (error) {
      logger.error("停止系统时发生错误", { error: error.message });
      process.exit(1);
    }
  }

  /**
   * 获取系统状态
   */
  getStatus() {
    return {
      fsuId: this.fsuData.fsuId,
      port: this.port,
      webServiceStatus: fsuWebServiceServer.getStatus(),
      supportedDevices: deviceDataManager.getSupportedDevices().length,
      timestamp: new Date().toISOString(),
    };
  }
}

// 主程序
async function main() {
  const system = new DeviceTestSystem();

  // 检查命令行参数
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
FSU完整系统启动器

用法:
  node start-device-test-system.js [选项]

选项:
  --port <端口>      指定服务端口 (默认: 8080)
  --fsu-id <ID>      指定FSU ID (默认: 61082143802203)
  --heartbeat        启用心跳保活功能（主动向SC注册）
  --help, -h         显示此帮助信息

功能说明:
  默认模式: 仅启动设备数据响应服务，等待SC请求
  心跳模式: 完整的FSU系统，包含LOGIN注册和心跳保活

示例:
  # 仅设备数据响应
  node start-device-test-system.js
  
  # 完整FSU系统（包含心跳保活）
  node start-device-test-system.js --heartbeat
  
  # 自定义端口和FSU ID
  node start-device-test-system.js --port 8090 --fsu-id 61089443800204 --heartbeat

支持的设备类型:
  - 水浸传感器 (flooding)
  - 温湿度传感器 (temperature)  
  - 开关电源 (switchPower)
  - 蓄电池 (battery)
  - 烟雾传感器 (smoke)
  - 红外传感器 (infrared)
  - 非智能门禁 (doorAccess)
  - 梯次电池 (stepBattery)
  - 空调 (airConditioner)
    `);
    return;
  }

  // 解析命令行参数
  const portIndex = args.indexOf("--port");
  if (portIndex !== -1 && args[portIndex + 1]) {
    system.port = parseInt(args[portIndex + 1]);
  }

  const fsuIdIndex = args.indexOf("--fsu-id");
  if (fsuIdIndex !== -1 && args[fsuIdIndex + 1]) {
    system.fsuData.fsuId = args[fsuIdIndex + 1];
    system.fsuData.fsuCode = args[fsuIdIndex + 1];
  }

  // 检查是否启用心跳保活
  if (args.includes("--heartbeat")) {
    system.heartbeatEnabled = true;
  }

  await system.start();
}

// 运行主程序
if (require.main === module) {
  main().catch((error) => {
    logger.error("启动系统时发生错误", { error: error.message });
    console.error("❌ 启动失败:", error.message);
    process.exit(1);
  });
}

module.exports = DeviceTestSystem;
