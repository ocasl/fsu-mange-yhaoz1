#!/usr/bin/env node

/**
 * 代理管理工具
 * 用于管理和监控代理检测状态
 */

require("dotenv").config({ path: "./config.env" });

const proxyDetector = require("./utils/proxyDetector");

function showHelp() {
  console.log("🔧 代理管理工具");
  console.log("使用方法:");
  console.log("  node proxy-manager.js status    - 查看代理状态");
  console.log("  node proxy-manager.js check     - 强制检测代理");
  console.log("  node proxy-manager.js clear     - 清除缓存");
  console.log("  node proxy-manager.js monitor   - 持续监控代理状态");
  console.log("  node proxy-manager.js help      - 显示帮助");
}

async function showStatus() {
  console.log("📊 代理状态信息");
  console.log("=".repeat(30));

  const status = await proxyDetector.getProxyStatus();

  console.log(`代理地址: ${status.proxyHost}:${status.proxyPort}`);
  console.log(`当前状态: ${status.isAvailable ? "✅ 可用" : "❌ 不可用"}`);
  console.log(`上次检测: ${new Date(status.lastCheckTime).toLocaleString()}`);
  console.log(`缓存年龄: ${Math.round(status.cacheAge / 1000)}秒`);

  // 显示网络接口信息
  console.log("\n🌐 网络接口信息:");
  const os = require("os");
  const interfaces = os.networkInterfaces();

  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        const isVPN = name.includes("TIETA") || name.includes("PPP");
        const icon = isVPN ? "🔒" : "🌍";
        console.log(`  ${icon} ${name}: ${net.address}`);
      }
    }
  }
}

async function forceCheck() {
  console.log("🔍 强制检测代理状态...");

  // 清除缓存
  proxyDetector.clearCache();

  // 重新检测
  const isAvailable = await proxyDetector.isProxyAvailable();

  console.log(`检测结果: ${isAvailable ? "✅ 代理可用" : "❌ 代理不可用"}`);

  return isAvailable;
}

function clearCache() {
  console.log("🗑️  清除代理检测缓存...");
  proxyDetector.clearCache();
  console.log("✅ 缓存已清除");
}

async function monitor() {
  console.log("👁️  开始监控代理状态 (按 Ctrl+C 停止)");
  console.log("=".repeat(40));

  let lastStatus = null;

  const checkInterval = setInterval(async () => {
    try {
      const currentStatus = await proxyDetector.isProxyAvailable();
      const timestamp = new Date().toLocaleTimeString();

      if (lastStatus !== currentStatus) {
        const statusText = currentStatus ? "✅ 可用" : "❌ 不可用";
        const changeText =
          lastStatus === null
            ? "初始状态"
            : currentStatus
            ? "代理已启动"
            : "代理已关闭";

        console.log(`[${timestamp}] 代理状态: ${statusText} (${changeText})`);
        lastStatus = currentStatus;
      } else {
        // 每30秒显示一次状态（即使没有变化）
        if (Date.now() % 30000 < 5000) {
          const statusText = currentStatus ? "✅ 可用" : "❌ 不可用";
          console.log(`[${timestamp}] 代理状态: ${statusText}`);
        }
      }
    } catch (error) {
      console.error(
        `[${new Date().toLocaleTimeString()}] 检测错误:`,
        error.message
      );
    }
  }, 5000); // 每5秒检测一次

  // 处理退出信号
  process.on("SIGINT", () => {
    console.log("\n🛑 停止监控");
    clearInterval(checkInterval);
    process.exit(0);
  });
}

async function main() {
  const command = process.argv[2] || "help";

  switch (command.toLowerCase()) {
    case "status":
      await showStatus();
      break;

    case "check":
      await forceCheck();
      break;

    case "clear":
      clearCache();
      break;

    case "monitor":
      await monitor();
      break;

    case "help":
    default:
      showHelp();
      break;
  }
}

// 运行工具
main().catch((error) => {
  console.error("工具运行错误:", error);
  process.exit(1);
});
