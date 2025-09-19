#!/usr/bin/env node

const NetworkDiagnostics = require("./utils/networkDiagnostics");
const FSULogAnalyzer = require("./utils/fsuLogAnalyzer");

/**
 * 针对您的具体情况进行网络诊断
 * 目标: 192.168.2.1 (您的默认网关)
 */
async function diagnoseYourNetwork() {
  console.log("🔍 FSU接口连接问题诊断工具");
  console.log("=".repeat(50));
  console.log("基于您提供的错误日志和网络环境进行诊断\n");

  // 您的网络环境信息
  console.log("📋 您的网络环境:");
  console.log("  - 目标服务器: 192.168.2.1");
  console.log("  - 本机WiFi IP: 192.168.2.162");
  console.log("  - VPN IP: 10.4.68.115 (TIETA)");
  console.log("  - 错误: SocketTimeoutException: connect timed out");
  console.log("  - 请求耗时: 15016ms\n");

  const networkDiag = new NetworkDiagnostics();
  const fsuLogAnalyzer = new FSULogAnalyzer();

  try {
    // 1. 执行网络诊断
    console.log("1. 执行网络诊断...");
    const report = await networkDiag.performFullDiagnosis("192.168.2.1", 8080);

    // 2. 模拟您的错误场景
    console.log("\n2. 模拟您的错误场景...");
    const logId = fsuLogAnalyzer.logRequestStart(
      "GET FSUINFO",
      "192.168.2.1",
      '<?xml version="1.0" encoding="UTF-8"?> <Request> <PK_Type> <Name>GET FSUINFO</Name> <Code> 1701 </Code> </PK_Type> <info> <Fsuld>6108214380203 </FSuld><FsuCode>61082143802203</FsuCode></Info></Request>'
    );

    // 创建与您日志相同的错误
    const error = new Error(
      "nested exception is:java.net.SocketTimeoutException: connect timed out"
    );
    error.code = "ECONNRESET";

    fsuLogAnalyzer.logRequestError(logId, error);

    // 3. 分析您的具体问题
    console.log("\n3. 针对您问题的具体分析:");

    if (!report.results.portConnectivity?.success) {
      console.log("❌ 端口连接失败分析:");
      console.log("  → 192.168.2.1:8080 无法连接");
      console.log("  → 这通常意味着:");
      console.log("    • 192.168.2.1 上没有运行Web服务");
      console.log("    • 服务运行在不同的端口");
      console.log("    • 防火墙阻止了连接");
      console.log("    • 路由器配置问题");
    }

    // 4. 提供解决建议
    console.log("\n4. 针对性解决建议:");
    console.log("📋 立即检查事项:");
    console.log("  1. 确认SC服务器配置:");
    console.log("     - SC服务器是否真的运行在192.168.2.1?");
    console.log("     - 端口是否为8080?");
    console.log("  ");
    console.log("  2. 测试基本连通性:");
    console.log("     - ping 192.168.2.1");
    console.log("     - telnet 192.168.2.1 8080");
    console.log("  ");
    console.log("  3. 检查路由器管理界面:");
    console.log("     - 访问 http://192.168.2.1 查看是否有Web界面");
    console.log("     - 确认是否有FSU相关服务配置");
    console.log("  ");
    console.log("  4. 确认SC服务器地址:");
    console.log("     - 可能SC服务器不在本地网关");
    console.log("     - 检查实际的SC服务器IP地址");

    // 5. 推荐的命令行测试
    console.log("\n🛠️  推荐的命令行测试:");
    console.log("  在命令行执行以下命令进行测试:");
    console.log("  ");
    console.log("  # 测试基本连通性");
    console.log("  ping 192.168.2.1");
    console.log("  ");
    console.log("  # 测试端口连通性");
    console.log("  telnet 192.168.2.1 8080");
    console.log("  ");
    console.log("  # 扫描开放端口");
    console.log("  nmap -p 1-9000 192.168.2.1");
    console.log("  ");
    console.log("  # 查看本机路由表");
    console.log("  route print");

    // 6. 配置文件建议
    console.log("\n⚙️  配置文件建议:");
    console.log("  检查 backend/config/sc.js 文件:");
    console.log("  - SC_HOST 应该设置为实际的SC服务器IP");
    console.log("  - SC_PORT 应该设置为正确的端口号");
    console.log("  - 如果SC服务器不在本地，请更新为正确的地址");

    // 7. 生成测试脚本
    console.log("\n📝 生成快速测试脚本...");
    await generateTestScript();
  } catch (error) {
    console.error("诊断过程发生异常:", error.message);
  }
}

/**
 * 生成快速测试脚本
 */
async function generateTestScript() {
  const testScript = `@echo off
echo 正在测试192.168.2.1的连通性...
echo.

echo 1. 测试基本连通性:
ping -n 4 192.168.2.1
echo.

echo 2. 测试Web服务:
curl -v --connect-timeout 5 http://192.168.2.1 2>&1
echo.

echo 3. 测试FSU端口:
curl -v --connect-timeout 5 http://192.168.2.1:8080 2>&1
echo.

echo 4. 显示路由信息:
route print | findstr "192.168.2"
echo.

echo 测试完成！请检查上述输出确定问题所在。
pause`;

  const fs = require("fs");
  fs.writeFileSync("network-test.bat", testScript);
  console.log("  ✅ 已生成 network-test.bat 测试脚本");
  console.log("  双击运行此脚本进行快速网络测试");
}

// 如果直接运行此文件
if (require.main === module) {
  diagnoseYourNetwork().catch(console.error);
}

module.exports = { diagnoseYourNetwork };
