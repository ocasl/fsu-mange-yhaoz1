#!/usr/bin/env node

/**
 * 简化的FSU心跳保活系统
 *
 * 流程：
 * 1. LOGIN注册（告诉SC我们的正确IP地址）
 * 2. 启动WebService服务端（等待SC心跳）
 * 3. 响应SC的GET_FSUINFO请求
 */

require("dotenv").config({ path: "./config.env" });
const { sendDirectLogin } = require("./services/scService");
const fsuWebServiceServer = require("./services/fsuWebServiceServer");
const os = require("os");

/**
 * 获取本机实际的内网IP
 * 优先获取VPN分配的IP地址（如10.4.135.247）
 */
function getMyInternalIP() {
  const interfaces = os.networkInterfaces();

  console.log("🔍 开始查找VPN内网IP...");

  // 显示所有可用的网络接口（用于调试）
  console.log("📋 检测到的网络接口:");
  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        console.log(`  ${name}: ${net.address}`);
      }
    }
  }

  // 第一优先级：查找10.x.x.x网段的IP（VPN通常分配此网段，如10.4.135.247）
  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (
        net.family === "IPv4" &&
        !net.internal &&
        net.address.startsWith("10.")
      ) {
        console.log(`✅ 找到VPN内网IP (10.x.x.x): ${name} - ${net.address}`);
        return net.address;
      }
    }
  }

  // 第二优先级：查找明确的VPN接口名称（如PPP适配器）
  const vpnInterfaceNames = [
    "PPP", // PPP适配器 (如您的dddd接口)
    "TIETA", // 铁塔VPN
    "TAP",
    "TUN",
    "VPN",
    "OpenVPN",
    "L2TP",
    "PPTP",
    "WireGuard",
  ];

  for (const name in interfaces) {
    const upperName = name.toUpperCase();
    const isVpnInterface = vpnInterfaceNames.some((vpnName) =>
      upperName.includes(vpnName)
    );

    if (isVpnInterface) {
      for (const net of interfaces[name]) {
        if (net.family === "IPv4" && !net.internal) {
          console.log(`✅ 找到VPN接口: ${name} - ${net.address}`);
          return net.address;
        }
      }
    }
  }

  // 第三优先级：查找172.16.x.x - 172.31.x.x网段（某些VPN使用此网段）
  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (
        net.family === "IPv4" &&
        !net.internal &&
        net.address.startsWith("172.")
      ) {
        const secondOctet = parseInt(net.address.split(".")[1]);
        if (secondOctet >= 16 && secondOctet <= 31) {
          console.log(`✅ 找到VPN内网IP (172.x.x.x): ${name} - ${net.address}`);
          return net.address;
        }
      }
    }
  }

  // 最后才查找192.168.x.x内网IP（通常是本地网络，不是VPN）
  console.log("⚠️ 未找到VPN IP，回退到本地网络IP");
  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (
        net.family === "IPv4" &&
        !net.internal &&
        net.address.startsWith("192.168.")
      ) {
        console.log(
          `⚠️ 使用本地内网IP (192.168.x.x): ${name} - ${net.address}`
        );
        console.log(`⚠️ 警告：这不是VPN IP，请确认VPN已正确连接`);
        console.log(`💡 期望的VPN IP应该是10.x.x.x网段（如10.4.135.247）`);
        return net.address;
      }
    }
  }

  console.log("❌ 未找到任何可用IP，使用默认值");
  return "192.168.2.162";
}

/**
 * 启动简化的心跳系统
 */
async function startSimplifiedHeartbeat() {
  console.log("🫀 FSU简化心跳保活系统");
  console.log("=".repeat(50));

  try {
    // 1. 获取正确的内网IP
    const myInternalIP = getMyInternalIP();
    console.log(`📍 我的内网IP: ${myInternalIP}`);

    // 2. 构造FSU数据
    const fsuData = {
      fsuId: "61082143802203",
      fsuCode: "61082143802203",
      devices: ["power", "air"],
      networkType: "4G",
      softwareVersion: "1",
      internalIP: myInternalIP, // 使用正确的内网IP
    };

    console.log("📋 FSU设备信息:");
    console.log(`  - FSU ID: ${fsuData.fsuId}`);
    console.log(`  - FSU内网IP: ${fsuData.internalIP}`);
    console.log(`  - 设备类型: ${fsuData.devices.join(", ")}`);
    console.log();

    // 3. 执行LOGIN注册
    console.log("🔐 步骤1: 执行LOGIN注册...");
    const loginResult = await sendDirectLogin(fsuData);

    if (!loginResult.success) {
      console.error("❌ LOGIN注册失败:", loginResult.message);
      process.exit(1);
    }

    console.log("✅ LOGIN注册成功！");
    console.log(`   - SC现在知道我们的地址: ${fsuData.internalIP}`);
    console.log(`   - SC将向这个地址发送心跳请求`);
    console.log();

    // 4. 启动WebService服务端
    console.log("🌐 步骤2: 启动FSU WebService服务端...");
    const port = 8080;

    await fsuWebServiceServer.start(fsuData, port, myInternalIP);

    console.log(`✅ WebService服务端启动成功: http://${myInternalIP}:${port}`);
    console.log(`   - 监听地址: http://${fsuData.internalIP}:${port}`);
    console.log(`   - 心跳端点: http://${fsuData.internalIP}:${port}/invoke`);
    console.log(`   - 健康检查: http://${fsuData.internalIP}:${port}/health`);
    console.log();

    // 5. 显示系统状态
    console.log("💗 步骤3: 心跳系统已就绪");
    console.log("=".repeat(50));
    console.log("✅ 系统状态: 运行中");
    console.log(`✅ FSU地址: ${fsuData.internalIP}:${port}`);
    console.log("✅ 等待SC发送GET_FSUINFO心跳请求...");
    console.log();

    console.log("📋 工作原理:");
    console.log("  1. ✅ LOGIN时我们告诉了SC我们的IP地址");
    console.log("  2. 🫀 SC会定期向我们发送GET_FSUINFO请求");
    console.log("  3. 💬 我们收到后回复GET_FSUINFO_ACK响应");
    console.log("  4. 🔄 这样就保持了长期连接");
    console.log();

    console.log("🧪 测试方法:");
    console.log("  # 手动模拟SC发送心跳（另开一个终端）:");
    console.log(
      `  node test-sc-heartbeat.js http://${fsuData.internalIP}:${port}/invoke ${fsuData.fsuId}`
    );
    console.log();
    console.log("  # 连续心跳测试:");
    console.log(
      `  node test-sc-heartbeat.js http://${fsuData.internalIP}:${port}/invoke ${fsuData.fsuId} --continuous --interval 60`
    );
    console.log();

    // 6. 监控心跳事件
    let heartbeatCount = 0;
    fsuWebServiceServer.on("heartbeat", (heartbeatData) => {
      heartbeatCount++;
      const time = new Date().toLocaleTimeString();

      if (heartbeatData.success) {
        console.log(
          `💗 [${time}] 收到第${heartbeatCount}次SC心跳 - FSU ID: ${heartbeatData.fsuId} ✅`
        );
      } else {
        console.log(`💔 [${time}] 心跳处理失败 - 错误: ${heartbeatData.error}`);
      }
    });

    // 7. 定期显示状态
    setInterval(() => {
      const time = new Date().toLocaleTimeString();
      console.log(`📊 [${time}] 系统运行中 - 已处理${heartbeatCount}次心跳`);
    }, 300000); // 每5分钟显示一次

    // 8. 优雅退出
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
      console.log(`  - FSU地址: ${fsuData.internalIP}:${port}`);
      console.log("👋 系统已关闭");
      process.exit(0);
    });

    console.log("💡 提示: 按 Ctrl+C 停止系统");
    console.log("💡 提示: 如果SC系统正常，应该每1-5分钟收到一次心跳");
  } catch (error) {
    console.error("❌ 系统启动失败:", error.message);
    console.error("详细错误:", error.stack);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  startSimplifiedHeartbeat().catch((error) => {
    console.error("❌ 启动失败:", error.message);
    process.exit(1);
  });
}

module.exports = { startSimplifiedHeartbeat, getMyInternalIP };
