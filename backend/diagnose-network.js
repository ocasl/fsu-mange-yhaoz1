#!/usr/bin/env node

/**
 * 网络诊断工具
 * 检测代理设置、网络接口和端口状态
 */

const networkDiagnostics = require("./utils/networkDiagnostics");

async function main() {
  console.log("🌐 FSU WebService 网络诊断工具");
  console.log("=".repeat(50));

  try {
    // 执行综合诊断
    const results = await networkDiagnostics.performComprehensiveDiagnostic();

    // 特别检查WebService相关问题
    console.log("\n🎯 [WebService专项检查]");
    console.log("-".repeat(30));

    // 检查是否有8080端口监听
    const webServiceListening = results.webServicePorts.find(
      (p) => p.port === 8080 && p.inUse
    );
    if (webServiceListening) {
      console.log("✅ WebService端口8080正在监听");
    } else {
      console.log("❌ WebService端口8080未监听");
      console.log("   建议: 启动FSU WebService服务器");
    }

    // 检查VPN连接
    const vpnConnected = Object.keys(results.interfaces).some(
      (name) =>
        name.toLowerCase().includes("tieta") ||
        results.interfaces[name].some((addr) => addr.address.startsWith("10."))
    );

    if (vpnConnected) {
      console.log("✅ 检测到VPN连接");
      const vpnIPs = [];
      Object.entries(results.interfaces).forEach(([name, addrs]) => {
        addrs.forEach((addr) => {
          if (addr.address.startsWith("10.")) {
            vpnIPs.push(`${name}: ${addr.address}`);
          }
        });
      });
      console.log(`   VPN IP: ${vpnIPs.join(", ")}`);
    } else {
      console.log("⚠️  未检测到VPN连接");
      console.log("   建议: 确认VPN已连接");
    }

    // 代理问题分析
    if (
      results.proxy.systemProxy?.enabled ||
      results.proxy.processProxy?.detected
    ) {
      console.log("\n⚠️  [代理影响分析]");
      console.log("-".repeat(30));
      console.log("🔍 检测到代理配置，可能影响SC服务器连接到WebService");
      console.log("📝 解决方案:");
      console.log("   1. 临时关闭代理软件测试");
      console.log("   2. 配置代理软件允许本地8080端口直连");
      console.log("   3. 使用双网卡配置：");
      console.log("      - 主网卡用于代理上网");
      console.log("      - VPN网卡用于接收SC心跳");

      if (results.proxy.processProxy?.detected) {
        console.log("\n🔧 当前进程代理环境变量:");
        Object.entries(results.proxy.processProxy.env).forEach(
          ([key, value]) => {
            if (value) console.log(`   ${key}=${value}`);
          }
        );

        console.log("\n💡 可以临时清除代理环境变量:");
        console.log("   unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy");
      }
    }

    // 防火墙检查建议
    console.log("\n🛡️  [防火墙检查建议]");
    console.log("-".repeat(30));
    console.log("📋 请确认以下防火墙规则:");
    console.log("   1. 允许入站连接到端口8080");
    console.log("   2. 允许来自SC服务器的连接");
    console.log("   3. VPN网络的防火墙规则");

    // 测试建议
    console.log("\n🧪 [测试建议]");
    console.log("-".repeat(30));
    console.log("1. 本地测试WebService:");
    console.log("   curl http://localhost:8080/health");
    console.log("2. VPN网络测试:");
    const vpnIP = getVPNIP(results.interfaces);
    if (vpnIP) {
      console.log(`   curl http://${vpnIP}:8080/health`);
    }
    console.log("3. 外部测试 (需要从其他机器):");
    console.log("   telnet <VPN_IP> 8080");
  } catch (error) {
    console.error("❌ 诊断失败:", error.message);
    process.exit(1);
  }
}

function getVPNIP(interfaces) {
  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.address.startsWith("10.")) {
        return addr.address;
      }
    }
  }
  return null;
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
