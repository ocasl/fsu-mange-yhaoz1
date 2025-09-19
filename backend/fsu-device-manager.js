#!/usr/bin/env node

/**
 * FSU设备管理工具
 * 用于管理WebService服务器中的多个FSU设备
 */

require("dotenv").config({ path: "./config.env" });

const fsuWebServiceServer = require("./services/fsuWebServiceServer");

function showHelp() {
  console.log("🔧 FSU设备管理工具");
  console.log("使用方法:");
  console.log(
    "  node fsu-device-manager.js list                    - 查看已注册的FSU设备"
  );
  console.log(
    "  node fsu-device-manager.js add <fsuId> <fsuCode>   - 添加FSU设备"
  );
  console.log(
    "  node fsu-device-manager.js remove <fsuId>          - 移除FSU设备"
  );
  console.log(
    "  node fsu-device-manager.js test <fsuId>            - 测试设备心跳响应"
  );
  console.log(
    "  node fsu-device-manager.js help                    - 显示帮助"
  );
  console.log("\n示例:");
  console.log("  node fsu-device-manager.js add 52010343800836 52010343800836");
  console.log("  node fsu-device-manager.js add 61082143802203 61082143802203");
  console.log("  node fsu-device-manager.js list");
  console.log("  node fsu-device-manager.js test 52010343800836");
}

function listDevices() {
  console.log("📋 已注册的FSU设备列表");
  console.log("=".repeat(50));

  const devices = fsuWebServiceServer.getAllFsuDevices();

  if (devices.length === 0) {
    console.log("❌ 暂无已注册的FSU设备");
    console.log("💡 使用 'add' 命令添加设备");
    return;
  }

  console.log(`📊 总设备数: ${devices.length}`);
  console.log("");

  devices.forEach((device, index) => {
    console.log(`${index + 1}. FSU设备信息:`);
    console.log(`   🆔 FSU ID: ${device.fsuId}`);
    console.log(`   🏷️  FSU Code: ${device.fsuCode || device.fsuId}`);
    console.log(`   🌐 内网IP: ${device.internalIP || "未设置"}`);
    console.log(`   📍 位置: ${device.siteName || "未设置"}`);
    console.log(`   🏭 厂商: ${device.fsuVendor || "未设置"}`);
    console.log(`   📱 型号: ${device.fsuType || "未设置"}`);
    console.log("");
  });
}

function addDevice(fsuId, fsuCode, options = {}) {
  if (!fsuId) {
    console.log("❌ 错误: 请提供FSU ID");
    console.log("💡 用法: node fsu-device-manager.js add <fsuId> <fsuCode>");
    return false;
  }

  if (!fsuCode) {
    fsuCode = fsuId; // 如果没有提供fsuCode，使用fsuId
  }

  console.log(`📥 添加FSU设备: ${fsuId}`);

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

  const deviceData = {
    fsuId,
    fsuCode,
    internalIP,
    siteName: options.siteName || `站点-${fsuId}`,
    fsuVendor: options.vendor || "ZXLW",
    fsuType: options.type || "DAM-2160I-RH",
    softwareVersion: options.version || "1.0.0",
    // 默认设备配置
    devices: options.devices || [],
    ...options,
  };

  const success = fsuWebServiceServer.addFsuDevice(deviceData);

  if (success) {
    console.log("✅ FSU设备添加成功");
    console.log(`   🆔 FSU ID: ${fsuId}`);
    console.log(`   🏷️  FSU Code: ${fsuCode}`);
    console.log(`   🌐 内网IP: ${internalIP}`);
    console.log(
      `   📊 总设备数: ${fsuWebServiceServer.getAllFsuDevices().length}`
    );
  } else {
    console.log("❌ FSU设备添加失败");
  }

  return success;
}

function removeDevice(fsuId) {
  if (!fsuId) {
    console.log("❌ 错误: 请提供FSU ID");
    console.log("💡 用法: node fsu-device-manager.js remove <fsuId>");
    return false;
  }

  console.log(`🗑️ 移除FSU设备: ${fsuId}`);

  const success = fsuWebServiceServer.removeFsuDevice(fsuId);

  if (success) {
    console.log("✅ FSU设备移除成功");
    console.log(
      `   📊 剩余设备数: ${fsuWebServiceServer.getAllFsuDevices().length}`
    );
  } else {
    console.log("❌ FSU设备移除失败 (设备不存在)");
  }

  return success;
}

function testDevice(fsuId) {
  if (!fsuId) {
    console.log("❌ 错误: 请提供FSU ID");
    console.log("💡 用法: node fsu-device-manager.js test <fsuId>");
    return false;
  }

  console.log(`🧪 测试FSU设备心跳响应: ${fsuId}`);
  console.log("=".repeat(40));

  const device = fsuWebServiceServer.getFsuDevice(fsuId);

  if (!device) {
    console.log("❌ 设备不存在");
    console.log("💡 使用 'list' 命令查看可用设备");
    return false;
  }

  console.log("📍 设备信息:");
  console.log(`   🆔 FSU ID: ${device.fsuId}`);
  console.log(`   🏷️  FSU Code: ${device.fsuCode || device.fsuId}`);
  console.log(`   🌐 内网IP: ${device.internalIP || "未设置"}`);

  // 模拟心跳请求
  const mockRequest = {
    requestType: "GET_FSUINFO",
    fsuId: fsuId,
    fsuCode: device.fsuCode || device.fsuId,
    xmlContent: `<?xml version="1.0" encoding="UTF-8"?><Request><PK_Type><Name>GET_FSUINFO</Name><Code>1701</Code></PK_Type><Info><FsuId>${fsuId}</FsuId><FsuCode>${
      device.fsuCode || device.fsuId
    }</FsuCode></Info></Request>`,
  };

  // 模拟响应对象
  const mockRes = {
    set: () => {},
    send: (data) => {
      console.log("\n📤 预期响应:");
      console.log("─".repeat(40));
      console.log(data);
      console.log("─".repeat(40));
    },
  };

  console.log("\n📥 模拟心跳请求:");
  console.log("─".repeat(40));
  console.log(mockRequest.xmlContent);
  console.log("─".repeat(40));

  try {
    // 调用心跳处理方法
    fsuWebServiceServer.handleGetFsuInfoRequest(mockRequest, mockRes);
    console.log("\n✅ 测试完成");
  } catch (error) {
    console.log("\n❌ 测试失败:", error.message);
  }

  return true;
}

async function main() {
  const command = process.argv[2] || "help";
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  switch (command.toLowerCase()) {
    case "list":
      listDevices();
      break;

    case "add":
      addDevice(arg1, arg2);
      break;

    case "remove":
      removeDevice(arg1);
      break;

    case "test":
      testDevice(arg1);
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
