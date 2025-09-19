#!/usr/bin/env node

/**
 * 增强版FSU心跳保活系统
 * 解决连接超时问题，完整实现铁塔B接口规范
 */

require("dotenv").config({ path: "./config.env" });
const { sendDirectLogin } = require("./services/scService");
const fsuWebServiceServer = require("./services/fsuWebServiceServer");
const { getMyInternalIP } = require("./simplified-heartbeat");

console.log("🫀 增强版FSU心跳保活系统");
console.log("=".repeat(60));

/**
 * 启动增强版心跳系统
 */
async function startEnhancedHeartbeat() {
  try {
    // 1. 获取正确的内网IP
    const myInternalIP = getMyInternalIP();
    console.log(`📍 我的内网IP: ${myInternalIP}`);

    // 2. 构造FSU数据（使用标准LOGIN报文格式的参数）
    const fsuData = {
      fsuId: "61082143802203",
      fsuCode: "61082143802203",
      internalIP: myInternalIP,
      macId: "869221025266666",
      imsiId: "460068161666666",
      networkType: "4G",
      lockedNetworkType: "LTE",
      carrier: "CU",
      nmVendor: "大唐",
      nmType: "DTM-W101T",
      fsuVendor: "ZXLW",
      fsuType: "ZNV EISUA X7",
      softwareVersion: "24.1.HQ.FSU.LW.4417.R",
      // 按正确报文顺序的设备列表
      devices: [
        "61082140601589", // 交流电源1 (第1个)
        "61082141820991", // 烟感设备01 (第2个)
        "61082140702618", // 普通阀控密封铅酸蓄电池1 (第3个)
        "61082140702619", // 普通阀控密封铅酸蓄电池2 (第4个)
        "61082141841251", // 水浸01 (第5个)
        "61082143802203", // FSU自身 (第6个)
        "61082141831306", // 温湿感01 (第7个)
      ],
    };

    console.log("📋 FSU设备信息:");
    console.log(`  - FSU ID: ${fsuData.fsuId}`);
    console.log(`  - FSU Code: ${fsuData.fsuCode}`);
    console.log(`  - FSU内网IP: ${fsuData.internalIP}`);
    console.log(`  - Mac ID: ${fsuData.macId}`);
    console.log(`  - IMSI ID: ${fsuData.imsiId}`);
    console.log(`  - 运营商: ${fsuData.carrier}`);
    console.log(`  - FSU厂商: ${fsuData.fsuVendor}`);
    console.log(`  - FSU型号: ${fsuData.fsuType}`);
    console.log(`  - 软件版本: ${fsuData.softwareVersion}`);
    console.log(`  - 设备数量: ${fsuData.devices.length} 个`);
    console.log();

    // 3. 先启动WebService服务端（解决连接超时问题）
    console.log("🌐 步骤1: 启动FSU WebService服务端...");
    const port = 8080;

    await fsuWebServiceServer.start(fsuData, port, myInternalIP);

    console.log("✅ WebService服务端启动成功！");
    console.log(`   - 监听地址: http://${fsuData.internalIP}:${port}`);
    console.log(`   - 心跳端点: http://${fsuData.internalIP}:${port}/invoke`);
    console.log(`   - 健康检查: http://${fsuData.internalIP}:${port}/health`);
    console.log();

    // 4. 等待服务完全启动
    console.log("⏳ 等待WebService服务完全启动...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 5. 执行LOGIN注册
    console.log("🔐 步骤2: 执行LOGIN注册...");
    const loginResult = await sendDirectLogin(fsuData);

    if (!loginResult.success) {
      console.error("❌ LOGIN注册失败:", loginResult.message);
      process.exit(1);
    }

    console.log("✅ LOGIN注册成功！");
    console.log(`   - SC现在知道我们的地址: ${fsuData.internalIP}:${port}`);
    console.log(`   - SC将向这个地址发送心跳请求`);
    console.log();

    // 6. 系统就绪
    console.log("💗 步骤3: 心跳系统已就绪");
    console.log("=".repeat(60));
    console.log("✅ 系统状态: 运行中");
    console.log(`✅ FSU地址: ${fsuData.internalIP}:${port}`);
    console.log(`✅ FSU ID: ${fsuData.fsuId}`);
    console.log("✅ 等待SC发送GET_FSUINFO心跳请求...");
    console.log();

    console.log("📱 支持的设备列表:");
    const deviceDataManager = require("./utils/deviceDataManager");
    const supportedDevices = deviceDataManager.getSupportedDevices();
    supportedDevices.forEach((device, index) => {
      console.log(`  ${index + 1}. 设备类型: ${device.type}`);
      console.log(`     FSU ID: ${device.fsuId}`);
      console.log(`     设备ID: ${device.deviceId}`);
      console.log(`     信号数: ${device.signalCount}`);
    });
    console.log();

    console.log("📋 工作原理:");
    console.log("  1. ✅ WebService服务端已启动并监听端口");
    console.log("  2. ✅ LOGIN注册告诉SC我们的准确地址");
    console.log("  3. 🫀 SC会定期向我们发送GET_FSUINFO请求");
    console.log("  4. 💬 我们收到后回复包含系统状态的GET_FSUINFO_ACK响应");
    console.log("  5. 📊 SC也会发送GET_DATA请求查询设备数据");
    console.log("  6. 🔄 这样保持长期心跳连接和数据交换");
    console.log();

    // 7. 监控心跳和数据请求事件
    let heartbeatCount = 0;
    let dataRequestCount = 0;

    fsuWebServiceServer.on("heartbeat", (heartbeatData) => {
      heartbeatCount++;
      const time = new Date().toLocaleTimeString();

      if (heartbeatData.success) {
        console.log(
          `💗 [${time}] 收到第${heartbeatCount}次SC心跳 - FSU ID: ${heartbeatData.fsuId} ✅`
        );
        console.log(`   响应包含: CPU使用率、内存使用率等系统状态`);
      } else {
        console.log(`💔 [${time}] 心跳处理失败 - 错误: ${heartbeatData.error}`);
      }
    });

    fsuWebServiceServer.on("dataRequest", (dataRequestData) => {
      dataRequestCount++;
      const time = new Date().toLocaleTimeString();

      if (dataRequestData.success) {
        console.log(
          `📊 [${time}] 收到第${dataRequestCount}次SC数据请求 - 设备ID: ${dataRequestData.deviceId} ✅`
        );
        console.log(`   响应包含: 水浸传感器状态数据`);
      } else {
        console.log(
          `❌ [${time}] 数据请求处理失败 - 错误: ${dataRequestData.error}`
        );
      }
    });

    // 8. 定期显示状态
    setInterval(() => {
      const time = new Date().toLocaleTimeString();
      console.log(
        `📊 [${time}] 系统运行中 - 已处理${heartbeatCount}次心跳，${dataRequestCount}次数据请求`
      );

      if (heartbeatCount === 0) {
        console.log(`💡 提示: 如果长时间无心跳，请检查:`);
        console.log(`   - SC是否能访问 http://${fsuData.internalIP}:${port}`);
        console.log(`   - 防火墙是否允许端口${port}入站连接`);
        console.log(`   - VPN网络是否稳定`);
      }

      if (dataRequestCount > 0) {
        console.log(`💡 数据请求状态: 水浸传感器数据正常响应`);
      }
    }, 300000); // 每5分钟显示一次

    // 9. 优雅退出
    process.on("SIGINT", async () => {
      console.log("\n\n🛑 收到停止信号，正在关闭系统...");

      try {
        await fsuWebServiceServer.stop();
        console.log("✅ WebService服务端已停止");
      } catch (error) {
        console.error("❌ 停止服务时发生错误:", error.message);
      }

      console.log("📊 最终统计:");
      console.log(`  - 总共处理心跳: ${heartbeatCount}次`);
      console.log(`  - 总共处理数据请求: ${dataRequestCount}次`);
      console.log(`  - FSU地址: ${fsuData.internalIP}:${port}`);
      console.log(`  - FSU ID: ${fsuData.fsuId}`);
      console.log("👋 系统已关闭");
      process.exit(0);
    });

    console.log("💡 提示: 按 Ctrl+C 停止系统");
    console.log("💡 提示: SC应该会在几分钟内发送心跳请求");
    console.log("💡 提示: 新的响应格式包含完整的系统状态信息");
  } catch (error) {
    console.error("❌ 系统启动失败:", error.message);
    console.error("详细错误:", error.stack);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  startEnhancedHeartbeat().catch((error) => {
    console.error("❌ 启动失败:", error.message);
    process.exit(1);
  });
}

module.exports = { startEnhancedHeartbeat };
