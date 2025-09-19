#!/usr/bin/env node

/**
 * FSU心跳保活系统启动工具
 * 一键启动完整的FSU心跳保活流程
 */

require("dotenv").config({ path: "./config.env" });
const heartbeatManager = require("./services/heartbeatManager");
const logger = require("./utils/logger");

/**
 * 启动心跳保活系统
 */
async function startHeartbeatSystem() {
  console.log("🚀 FSU心跳保活系统");
  console.log("=".repeat(50));
  console.log("根据中国铁塔B接口规范实现的完整心跳保活机制\n");

  const fsuData = {
    fsuId: "6108214380203",
    fsuCode: "61082143802203",
    devices: ["power", "air"],
    networkType: "4G",
    softwareVersion: "1",
    internalIP: "192.168.2.162", // 这个会在检查网络环境时自动更新
  };

  try {
    console.log("📋 FSU设备信息:");
    console.log(`  - FSU ID: ${fsuData.fsuId}`);
    console.log(`  - FSU Code: ${fsuData.fsuCode}`);
    console.log(`  - 网络类型: ${fsuData.networkType}`);
    console.log(`  - 设备版本: ${fsuData.softwareVersion}`);
    console.log();

    // 启动心跳保活系统
    console.log("🔄 启动心跳保活系统...");
    const result = await heartbeatManager.start(fsuData);

    if (result.success) {
      console.log("✅ 心跳保活系统启动成功！");
      console.log(`   FSU ID: ${result.data.fsuId}`);
      console.log(`   WebService URL: ${result.data.webServiceUrl}`);
      console.log(`   心跳超时: ${result.data.heartbeatTimeout}秒`);
      console.log();

      // 显示系统说明
      printSystemInfo(result.data);

      // 显示实时状态
      startStatusMonitoring();

      // 设置优雅退出
      setupGracefulShutdown();

      console.log("💗 系统正在运行，等待SC心跳请求...");
      console.log("按 Ctrl+C 停止系统\n");
    } else {
      console.error("❌ 心跳保活系统启动失败:");
      console.error(`   ${result.message}`);

      if (result.error) {
        logger.error("启动失败详细信息", { error: result.error });
      }

      process.exit(1);
    }
  } catch (error) {
    console.error("❌ 启动过程发生异常:", error.message);
    logger.error("启动异常", { error: error.stack });
    process.exit(1);
  }
}

/**
 * 显示系统说明
 */
function printSystemInfo(data) {
  console.log("📋 系统架构说明:");
  console.log("  1. ✅ LOGIN注册 - FSU向SC注册并获得认证");
  console.log("  2. 🌐 启动WebService - FSU作为服务端等待SC请求");
  console.log("  3. 💗 被动接收心跳 - SC主动发送GET_FSUINFO请求");
  console.log("  4. ✅ 响应心跳 - FSU返回GET_FSUINFO_ACK确认");
  console.log("  5. 🔄 监控重连 - 检测心跳超时并自动重连");
  console.log();

  console.log("🔗 连接信息:");
  console.log(`   WebService端点: ${data.webServiceUrl}/invoke`);
  console.log(`   健康检查: ${data.webServiceUrl}/health`);
  console.log(`   心跳超时: ${data.heartbeatTimeout}秒`);
  console.log();

  console.log("🧪 测试方法:");
  console.log("   1. SC系统会自动发送心跳请求");
  console.log("   2. 手动测试心跳：");
  console.log(`      curl -X POST ${data.webServiceUrl}/invoke \\`);
  console.log(`        -H "Content-Type: text/xml; charset=utf-8" \\`);
  console.log(`        -H "SOAPAction: invoke" \\`);
  console.log(
    `        -d '<?xml version="1.0" encoding="UTF-8"?><Request><PK_Type><Name>GET_FSUINFO</Name><Code>1701</Code></PK_Type><Info><FsuId>${data.fsuId}</FsuId><FsuCode>${data.fsuId}</FsuCode></Info></Request>'`
  );
  console.log();
}

/**
 * 启动状态监控
 */
function startStatusMonitoring() {
  // 每60秒显示一次状态
  const statusInterval = setInterval(() => {
    displayCurrentStatus();
  }, 60000);

  // 每10分钟显示一次详细统计
  const statsInterval = setInterval(() => {
    displayDetailedStats();
  }, 600000);

  // 保存interval ID以便清理
  global.statusInterval = statusInterval;
  global.statsInterval = statsInterval;
}

/**
 * 显示当前状态
 */
function displayCurrentStatus() {
  const status = heartbeatManager.getStatus();
  const stats = heartbeatManager.getHeartbeatStatistics();

  console.log(`📊 [${new Date().toLocaleTimeString()}] 系统状态:`);
  console.log(`   🔄 运行状态: ${status.isRunning ? "正常运行" : "已停止"}`);
  console.log(
    `   💗 心跳统计: 总计${stats.total}, 成功${stats.successful}, 失败${stats.failed}`
  );

  if (stats.successRate !== undefined) {
    console.log(`   📈 成功率: ${stats.successRate}%`);
  }

  if (stats.minutesSinceLastHeartbeat !== undefined) {
    console.log(`   ⏱️  距离上次心跳: ${stats.minutesSinceLastHeartbeat}分钟`);
  }

  if (status.reconnectAttempts > 0) {
    console.log(
      `   🔄 重连尝试: ${status.reconnectAttempts}/${status.maxReconnectAttempts}`
    );
  }

  console.log();
}

/**
 * 显示详细统计
 */
function displayDetailedStats() {
  const status = heartbeatManager.getStatus();
  const stats = heartbeatManager.getHeartbeatStatistics();

  console.log("📈 详细统计报告:");
  console.log("=".repeat(40));
  console.log(`FSU ID: ${status.fsuId}`);
  console.log(`运行时间: ${getUptime()}`);
  console.log(`WebService端口: ${status.webServicePort}`);
  console.log(
    `WebService状态: ${
      status.webServiceStatus?.isRunning ? "运行中" : "已停止"
    }`
  );
  console.log();

  console.log("心跳统计:");
  console.log(`  总心跳数: ${stats.total}`);
  console.log(`  成功心跳: ${stats.successful}`);
  console.log(`  失败心跳: ${stats.failed}`);

  if (stats.successRate !== undefined) {
    console.log(`  成功率: ${stats.successRate}%`);
  }

  if (stats.lastSuccess) {
    console.log(`  最后成功: ${new Date(stats.lastSuccess).toLocaleString()}`);
  }

  if (stats.lastFailure) {
    console.log(`  最后失败: ${new Date(stats.lastFailure).toLocaleString()}`);
  }

  console.log("=".repeat(40));
  console.log();
}

/**
 * 获取运行时间
 */
function getUptime() {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  return `${hours}小时${minutes}分钟${seconds}秒`;
}

/**
 * 设置优雅退出
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`\n\n收到${signal}信号，正在优雅停止系统...`);

    // 清理定时器
    if (global.statusInterval) {
      clearInterval(global.statusInterval);
    }
    if (global.statsInterval) {
      clearInterval(global.statsInterval);
    }

    try {
      // 显示最终统计
      console.log("\n📊 最终统计:");
      displayDetailedStats();

      // 停止心跳系统
      console.log("🛑 停止心跳保活系统...");
      const result = await heartbeatManager.stop();

      if (result.success) {
        console.log("✅ 系统已安全停止");
      } else {
        console.log("⚠️ 系统停止时出现警告:", result.message);
      }
    } catch (error) {
      console.error("❌ 停止系统时发生错误:", error.message);
    }

    console.log("👋 再见！");
    process.exit(0);
  };

  // 监听退出信号
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // 监听未捕获的异常
  process.on("uncaughtException", (error) => {
    console.error("❌ 未捕获的异常:", error);
    logger.error("Uncaught Exception", { error: error.stack });
    shutdown("UNCAUGHT_EXCEPTION");
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ 未处理的Promise拒绝:", reason);
    logger.error("Unhandled Rejection", { reason, promise });
    shutdown("UNHANDLED_REJECTION");
  });
}

// 如果直接运行此文件
if (require.main === module) {
  startHeartbeatSystem().catch((error) => {
    console.error("❌ 启动失败:", error.message);
    process.exit(1);
  });
}

module.exports = { startHeartbeatSystem };
