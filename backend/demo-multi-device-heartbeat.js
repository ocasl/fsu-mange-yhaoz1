#!/usr/bin/env node

/**
 * 多设备心跳响应演示
 * 展示如何配置和测试多个FSU设备的心跳响应
 */

require("dotenv").config({ path: "./config.env" });

const fsuWebServiceServer = require("./services/fsuWebServiceServer");
const os = require("os");

// 获取VPN内网IP
function getVpnInternalIP() {
  const interfaces = os.networkInterfaces();

  // 查找VPN内网IP
  for (const name in interfaces) {
    if (name.includes("TIETA") || name.includes("PPP")) {
      for (const net of interfaces[name]) {
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
  }

  // 查找10.x.x.x网段IP
  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (
        net.family === "IPv4" &&
        !net.internal &&
        net.address.startsWith("10.")
      ) {
        return net.address;
      }
    }
  }

  return "192.168.2.162"; // 默认值
}

async function main() {
  console.log("🚀 多设备心跳响应演示");
  console.log("=".repeat(60));

  const internalIP = getVpnInternalIP();
  console.log(`🌐 检测到内网IP: ${internalIP}`);

  // 1. 准备多个FSU设备数据
  const devices = [
    {
      fsuId: "52010343800836",
      fsuCode: "52010343800836",
      internalIP,
      siteName: "北京站点A",
      fsuVendor: "ZXLW",
      fsuType: "DAM-2160I-RH",
      softwareVersion: "1.0.0",
    },
    {
      fsuId: "61082143802203",
      fsuCode: "61082143802203",
      internalIP,
      siteName: "上海站点B",
      fsuVendor: "ZXLW",
      fsuType: "DAM-2160I-RH",
      softwareVersion: "1.0.0",
    },
    {
      fsuId: "13800138001",
      fsuCode: "13800138001",
      internalIP,
      siteName: "深圳站点C",
      fsuVendor: "ZXLW",
      fsuType: "DAM-2160I-RH",
      softwareVersion: "1.0.0",
    },
  ];

  console.log("\n📥 步骤1: 启动FSU WebService服务器");
  console.log("-".repeat(40));

  try {
    // 启动WebService服务器（使用第一个设备作为主设备）
    await fsuWebServiceServer.start(devices[0], 8080, internalIP);
    console.log("✅ WebService服务器启动成功");
    console.log(`   监听地址: http://${internalIP}:8080`);
  } catch (error) {
    console.log("❌ WebService服务器启动失败:", error.message);
    return;
  }

  console.log("\n📋 步骤2: 注册多个FSU设备");
  console.log("-".repeat(40));

  // 添加所有设备到WebService服务器
  devices.forEach((device, index) => {
    const success = fsuWebServiceServer.addFsuDevice(device);
    const status = success ? "✅" : "❌";
    console.log(
      `${status} 设备 ${index + 1}: ${device.fsuId} (${device.siteName})`
    );
  });

  console.log(
    `\n📊 总共注册了 ${fsuWebServiceServer.getAllFsuDevices().length} 个设备`
  );

  console.log("\n🧪 步骤3: 模拟心跳请求测试");
  console.log("-".repeat(40));

  // 模拟不同设备的心跳请求
  const testRequests = [
    {
      fsuId: "52010343800836",
      description: "北京站点A - 应该成功响应",
    },
    {
      fsuId: "61082143802203",
      description: "上海站点B - 应该成功响应",
    },
    {
      fsuId: "99999999999",
      description: "未注册设备 - 应该失败响应",
    },
  ];

  for (const test of testRequests) {
    console.log(`\n🔍 测试设备: ${test.fsuId}`);
    console.log(`📝 描述: ${test.description}`);
    console.log("─".repeat(30));

    // 构造心跳请求
    const mockRequest = {
      requestType: "GET_FSUINFO",
      fsuId: test.fsuId,
      fsuCode: test.fsuId,
      xmlContent: `<?xml version="1.0" encoding="UTF-8"?><Request><PK_Type><Name>GET_FSUINFO</Name><Code>1701</Code></PK_Type><Info><FsuId>${test.fsuId}</FsuId><FsuCode>${test.fsuId}</FsuCode></Info></Request>`,
    };

    // 模拟响应对象
    let responseXml = "";
    const mockRes = {
      set: () => {},
      send: (data) => {
        responseXml = data;
      },
    };

    try {
      // 处理心跳请求
      fsuWebServiceServer.handleGetFsuInfoRequest(mockRequest, mockRes);

      // 解析响应结果
      const isSuccess = responseXml.includes("<Result>1</Result>");
      const status = isSuccess ? "✅ 成功" : "❌ 失败";
      console.log(`   结果: ${status}`);

      // 显示响应XML的关键部分
      const fsuIdMatch = responseXml.match(/<FsuId>(.*?)<\/FsuId>/);
      const resultMatch = responseXml.match(/<Result>(.*?)<\/Result>/);
      if (fsuIdMatch && resultMatch) {
        console.log(`   响应FSU ID: ${fsuIdMatch[1]}`);
        console.log(`   响应结果: ${resultMatch[1] === "1" ? "成功" : "失败"}`);
      }
    } catch (error) {
      console.log(`   ❌ 测试异常: ${error.message}`);
    }
  }

  console.log("\n📊 步骤4: 显示设备统计信息");
  console.log("-".repeat(40));

  const allDevices = fsuWebServiceServer.getAllFsuDevices();
  console.log(`📋 已注册设备数量: ${allDevices.length}`);
  console.log("📝 设备列表:");
  allDevices.forEach((device, index) => {
    console.log(`   ${index + 1}. ${device.fsuId} - ${device.siteName}`);
  });

  console.log("\n💡 使用说明:");
  console.log("-".repeat(40));
  console.log("1. 现在WebService服务器可以响应多个FSU设备的心跳请求");
  console.log(
    "2. SC服务器发送GET_FSUINFO请求时，系统会根据请求中的FsuId查找对应设备"
  );
  console.log(
    "3. 如果找到设备，返回1702成功响应；如果未找到，返回1702失败响应"
  );
  console.log("4. 可以使用 fsu-device-manager.js 工具管理设备");

  console.log("\n🎯 下一步:");
  console.log("   - 启动您的FSU系统");
  console.log("   - SC服务器会自动发送心跳请求");
  console.log("   - 系统会根据请求的FsuId智能响应");

  console.log("\n✨ 演示完成!");

  // 停止服务器
  setTimeout(() => {
    fsuWebServiceServer.stop();
    console.log("🛑 WebService服务器已停止");
    process.exit(0);
  }, 2000);
}

// 运行演示
main().catch((error) => {
  console.error("演示过程中发生错误:", error);
  process.exit(1);
});
