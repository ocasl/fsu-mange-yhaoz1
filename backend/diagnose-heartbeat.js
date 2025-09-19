#!/usr/bin/env node

/**
 * FSU心跳系统诊断工具
 * 帮助排查为什么没有收到SC的心跳请求
 */

require("dotenv").config({ path: "./config.env" });
const axios = require("axios");
const os = require("os");

console.log("🔍 FSU心跳系统诊断工具");
console.log("=".repeat(60));

/**
 * 获取本机网络接口信息
 */
function getNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const result = [];

  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        result.push({
          interface: name,
          address: net.address,
          netmask: net.netmask,
          mac: net.mac,
          isVPN: name.includes("TIETA") || name.includes("PPP"),
          isInternal:
            net.address.startsWith("10.") || net.address.startsWith("192.168."),
        });
      }
    }
  }

  return result;
}

/**
 * 诊断1：网络配置检查
 */
function diagnoseNetworkConfig() {
  console.log("\n📡 诊断1：网络配置检查");
  console.log("-".repeat(40));

  const interfaces = getNetworkInterfaces();

  if (interfaces.length === 0) {
    console.log("❌ 没有找到可用的IPv4网络接口");
    return false;
  }

  console.log("✅ 找到以下网络接口:");
  interfaces.forEach((iface, index) => {
    console.log(`  ${index + 1}. ${iface.interface}`);
    console.log(`     IP地址: ${iface.address}`);
    console.log(`     子网掩码: ${iface.netmask}`);
    console.log(`     MAC地址: ${iface.mac}`);
    console.log(`     VPN接口: ${iface.isVPN ? "是" : "否"}`);
    console.log(`     内网IP: ${iface.isInternal ? "是" : "否"}`);
    console.log("");
  });

  // 检查VPN连接
  const vpnInterfaces = interfaces.filter((iface) => iface.isVPN);
  if (vpnInterfaces.length > 0) {
    console.log("✅ 检测到VPN连接:");
    vpnInterfaces.forEach((iface) => {
      console.log(`   - ${iface.interface}: ${iface.address}`);
    });
  } else {
    console.log("⚠️  没有检测到VPN连接（TIETA/PPP接口）");
  }

  return true;
}

/**
 * 诊断2：SC服务器连接测试
 */
async function diagnoseScConnection() {
  console.log("\n🌐 诊断2：SC服务器连接测试");
  console.log("-".repeat(40));

  const scConfig = require("./config/sc");
  const scUrl = `${scConfig.protocol}://${scConfig.host}:${scConfig.port}`;

  console.log(`测试SC服务器地址: ${scUrl}`);

  try {
    // 测试基本连接
    console.log("正在测试基本连接...");
    const response = await axios.get(scUrl, {
      timeout: 5000,
      validateStatus: () => true,
    });

    console.log(`✅ SC服务器响应状态码: ${response.status}`);
    console.log(
      `   响应头: Content-Type = ${response.headers["content-type"]}`
    );

    // 测试WebService端点
    const serviceUrls = [
      `${scUrl}/services/SCService`,
      `${scUrl}/services/FSUWebService`,
      `${scUrl}/axis/services`,
      `${scUrl}/services`,
    ];

    console.log("\n测试WebService端点:");
    for (const url of serviceUrls) {
      try {
        const resp = await axios.get(url, {
          timeout: 3000,
          validateStatus: () => true,
        });
        console.log(
          `  ${url}: ${resp.status} ${resp.status < 400 ? "✅" : "❌"}`
        );
      } catch (error) {
        console.log(`  ${url}: 连接失败 ❌ (${error.message})`);
      }
    }

    return true;
  } catch (error) {
    console.log(`❌ SC服务器连接失败: ${error.message}`);

    if (error.code === "ENOTFOUND") {
      console.log("   原因: DNS解析失败，可能是域名不存在或网络问题");
    } else if (error.code === "ECONNREFUSED") {
      console.log("   原因: 连接被拒绝，可能是服务器未运行或端口未开放");
    } else if (error.code === "ETIMEDOUT") {
      console.log("   原因: 连接超时，可能是网络延迟或防火墙阻止");
    }

    return false;
  }
}

/**
 * 诊断3：LOGIN注册状态检查
 */
async function diagnoseLoginStatus() {
  console.log("\n🔐 诊断3：LOGIN注册状态检查");
  console.log("-".repeat(40));

  const { sendDirectLogin } = require("./services/scService");
  const { getMyInternalIP } = require("./simplified-heartbeat");

  try {
    const myIP = getMyInternalIP();
    console.log(`使用的内网IP: ${myIP}`);

    const fsuData = {
      fsuId: "6108214380203",
      fsuCode: "61082143802203",
      devices: ["power", "air"],
      networkType: "4G",
      softwareVersion: "1",
      internalIP: myIP,
    };

    console.log("正在执行LOGIN注册测试...");
    const loginResult = await sendDirectLogin(fsuData);

    if (loginResult.success) {
      console.log("✅ LOGIN注册成功");
      console.log(`   FSU ID: ${fsuData.fsuId}`);
      console.log(`   注册IP: ${fsuData.internalIP}`);
      console.log("   SC现在应该知道我们的地址了");
      return true;
    } else {
      console.log("❌ LOGIN注册失败");
      console.log(`   错误信息: ${loginResult.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ LOGIN注册异常: ${error.message}`);
    return false;
  }
}

/**
 * 诊断4：本地WebService服务检查
 */
async function diagnoseLocalWebService() {
  console.log("\n🌐 诊断4：本地WebService服务检查");
  console.log("-".repeat(40));

  const { getMyInternalIP } = require("./simplified-heartbeat");
  const myIP = getMyInternalIP();
  const port = 8080;
  const serviceUrl = `http://${myIP}:${port}`;

  console.log(`检查本地WebService: ${serviceUrl}`);

  try {
    // 测试健康检查端点
    const healthResponse = await axios.get(`${serviceUrl}/health`, {
      timeout: 2000,
    });

    console.log("✅ 本地WebService正在运行");
    console.log(`   健康状态: ${JSON.stringify(healthResponse.data)}`);

    // 测试主页
    try {
      const homeResponse = await axios.get(serviceUrl, { timeout: 2000 });
      console.log("✅ 主页访问正常");
    } catch (error) {
      console.log("⚠️  主页访问失败，但健康检查正常");
    }

    return true;
  } catch (error) {
    console.log("❌ 本地WebService未运行或无法访问");
    console.log(`   错误: ${error.message}`);
    console.log("   请确保simplified-heartbeat.js正在运行");
    return false;
  }
}

/**
 * 诊断5：端口监听状态检查
 */
function diagnosePortListening() {
  console.log("\n🔌 诊断5：端口监听状态检查");
  console.log("-".repeat(40));

  const { exec } = require("child_process");

  return new Promise((resolve) => {
    // Windows系统使用netstat检查端口
    exec("netstat -an | findstr :8080", (error, stdout, stderr) => {
      if (error) {
        console.log("⚠️  无法检查端口状态");
        resolve(false);
        return;
      }

      if (stdout.trim()) {
        console.log("✅ 端口8080监听状态:");
        stdout.split("\n").forEach((line) => {
          if (line.trim()) {
            console.log(`   ${line.trim()}`);
          }
        });
        resolve(true);
      } else {
        console.log("❌ 端口8080没有在监听");
        console.log("   请确保FSU WebService服务已启动");
        resolve(false);
      }
    });
  });
}

/**
 * 诊断6：防火墙和网络策略检查
 */
function diagnoseFirewallAndNetwork() {
  console.log("\n🛡️ 诊断6：防火墙和网络策略检查");
  console.log("-".repeat(40));

  console.log("需要检查的网络策略:");
  console.log("1. Windows防火墙是否允许端口8080入站连接");
  console.log("2. 路由器/网关是否阻止了相关端口");
  console.log("3. VPN网络策略是否允许SC服务器访问FSU");
  console.log("4. 企业网络是否有访问控制策略");

  console.log("\n建议检查命令:");
  console.log(
    "  netsh advfirewall firewall show rule name=all dir=in | findstr 8080"
  );
  console.log("  telnet <FSU_IP> 8080  (从SC服务器端测试)");

  return true;
}

/**
 * 生成诊断报告和建议
 */
function generateReport(results) {
  console.log("\n📋 诊断报告");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`总体状态: ${passed}/${total} 项检查通过`);
  console.log("");

  results.forEach((result, index) => {
    const status = result.passed ? "✅ 通过" : "❌ 失败";
    console.log(`${index + 1}. ${result.name}: ${status}`);
  });

  console.log("\n💡 可能的原因和解决方案:");

  if (!results[0].passed) {
    console.log("🔧 网络配置问题:");
    console.log("   - 检查VPN连接是否正常");
    console.log("   - 确认网络接口配置正确");
  }

  if (!results[1].passed) {
    console.log("🔧 SC服务器连接问题:");
    console.log("   - 检查SC服务器地址和端口配置");
    console.log("   - 确认网络连通性");
    console.log("   - 检查DNS解析");
  }

  if (!results[2].passed) {
    console.log("🔧 LOGIN注册问题:");
    console.log("   - 检查FSU ID和配置是否正确");
    console.log("   - 确认SC服务器接受注册请求");
    console.log("   - 检查SOAP消息格式");
  }

  if (!results[3].passed) {
    console.log("🔧 本地WebService问题:");
    console.log("   - 启动simplified-heartbeat.js");
    console.log("   - 检查端口8080是否被占用");
    console.log("   - 确认服务绑定到正确的IP地址");
  }

  if (!results[4].passed) {
    console.log("🔧 端口监听问题:");
    console.log("   - 重启FSU WebService服务");
    console.log("   - 检查其他程序是否占用端口8080");
  }

  console.log("\n🎯 推荐的排查步骤:");
  console.log("1. 确保VPN连接正常，获得正确的内网IP");
  console.log("2. 启动 node simplified-heartbeat.js");
  console.log("3. 确认LOGIN注册成功");
  console.log("4. 检查本地WebService服务是否监听8080端口");
  console.log("5. 等待SC服务器发送心跳（通常1-5分钟间隔）");
  console.log("6. 如果仍无心跳，检查防火墙和网络策略");

  console.log("\n🧪 手动测试心跳:");
  console.log("在另一个终端运行:");
  const { getMyInternalIP } = require("./simplified-heartbeat");
  const myIP = getMyInternalIP();
  console.log(
    `node test-sc-heartbeat.js http://${myIP}:8080/invoke 6108214380203`
  );
}

/**
 * 主诊断流程
 */
async function runDiagnosis() {
  const results = [];

  try {
    // 运行所有诊断
    results.push({
      name: "网络配置检查",
      passed: diagnoseNetworkConfig(),
    });

    results.push({
      name: "SC服务器连接测试",
      passed: await diagnoseScConnection(),
    });

    results.push({
      name: "LOGIN注册状态检查",
      passed: await diagnoseLoginStatus(),
    });

    results.push({
      name: "本地WebService服务检查",
      passed: await diagnoseLocalWebService(),
    });

    results.push({
      name: "端口监听状态检查",
      passed: await diagnosePortListening(),
    });

    results.push({
      name: "防火墙和网络策略检查",
      passed: diagnoseFirewallAndNetwork(),
    });

    // 生成报告
    generateReport(results);
  } catch (error) {
    console.error("❌ 诊断过程中发生错误:", error.message);
  }
}

// 运行诊断
if (require.main === module) {
  runDiagnosis().catch((error) => {
    console.error("诊断失败:", error.message);
    process.exit(1);
  });
}

module.exports = { runDiagnosis };
