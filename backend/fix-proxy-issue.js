#!/usr/bin/env node

/**
 * 代理问题修复工具
 * 提供多种解决方案处理7890代理对WebService的影响
 */

const { spawn, exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

class ProxyFixer {
  constructor() {
    this.proxyPort = 7890;
  }

  async showSolutions() {
    console.log("🔧 FSU WebService 代理问题解决方案");
    console.log("=".repeat(50));

    console.log("\n📋 可选解决方案:");
    console.log("1. 临时禁用系统代理 (推荐测试)");
    console.log("2. 配置代理软件绕过本地连接");
    console.log("3. 重启WebService使用无代理环境");
    console.log("4. 查看详细网络配置");
    console.log("5. 测试WebService连通性");
    console.log("0. 退出");

    const choice = await this.getUserInput("\n请选择解决方案 (0-5): ");

    switch (choice.trim()) {
      case "1":
        await this.temporaryDisableProxy();
        break;
      case "2":
        await this.configureProxyBypass();
        break;
      case "3":
        await this.restartWithoutProxy();
        break;
      case "4":
        await this.showDetailedConfig();
        break;
      case "5":
        await this.testConnectivity();
        break;
      case "0":
        console.log("👋 退出工具");
        process.exit(0);
        break;
      default:
        console.log("❌ 无效选择");
        await this.showSolutions();
    }
  }

  async temporaryDisableProxy() {
    console.log("\n🔧 [方案1] 临时禁用系统代理");
    console.log("-".repeat(30));

    console.log("💡 请手动执行以下步骤:");
    console.log("1. 关闭代理软件 (Clash/V2Ray等)");
    console.log("2. 或在Windows设置中禁用代理:");
    console.log('   设置 > 网络和Internet > 代理 > 关闭"使用代理服务器"');
    console.log("3. 测试WebService是否能接收到SC心跳");

    const confirmed = await this.getUserInput("\n是否已完成上述步骤? (y/n): ");
    if (confirmed.toLowerCase() === "y") {
      await this.testConnectivity();
    }
  }

  async configureProxyBypass() {
    console.log("\n🔧 [方案2] 配置代理软件绕过");
    console.log("-".repeat(30));

    console.log("💡 配置代理软件 (如Clash/V2Ray) 绕过规则:");
    console.log("添加以下规则到代理配置:");
    console.log("");
    console.log("# Clash配置示例:");
    console.log("rules:");
    console.log("  - DST-PORT,8080,DIRECT");
    console.log("  - IP-CIDR,10.3.17.187/32,DIRECT");
    console.log("  - DOMAIN-SUFFIX,toweraiot.cn,DIRECT");
    console.log("");
    console.log("# V2Ray配置示例:");
    console.log("routing:");
    console.log("  rules:");
    console.log("    - type: field");
    console.log('      port: "8080"');
    console.log('      outboundTag: "direct"');
    console.log("    - type: field");
    console.log('      ip: ["10.3.17.187/32"]');
    console.log('      outboundTag: "direct"');

    console.log("\n⚠️  配置后需要重启代理软件");
  }

  async restartWithoutProxy() {
    console.log("\n🔧 [方案3] 无代理环境重启WebService");
    console.log("-".repeat(30));

    console.log("🔄 正在准备无代理环境...");

    // 创建一个启动脚本，清除代理环境变量
    const script = `
@echo off
echo 🔧 启动无代理FSU WebService...
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=
set NO_PROXY=127.0.0.1,localhost,10.*,192.168.*,*.local
set no_proxy=127.0.0.1,localhost,10.*,192.168.*,*.local

echo ✅ 已清除代理环境变量
echo 🚀 启动后端服务...
node app.js
`;

    require("fs").writeFileSync("start-no-proxy.bat", script);

    console.log("✅ 已创建 start-no-proxy.bat 启动脚本");
    console.log("💡 使用方法:");
    console.log("1. 关闭当前后端进程");
    console.log("2. 运行: start-no-proxy.bat");
    console.log("3. 这将在无代理环境下启动后端");
  }

  async showDetailedConfig() {
    console.log("\n📋 [详细网络配置]");
    console.log("-".repeat(30));

    try {
      // 显示代理配置
      console.log("🔗 代理配置:");
      const { stdout: proxyReg } = await execAsync(
        'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer'
      );
      console.log(
        "   注册表代理:",
        proxyReg.split("REG_SZ")[1]?.trim() || "未设置"
      );

      // 显示端口监听状态
      console.log("\n🔌 端口监听状态:");
      const { stdout: netstat } = await execAsync(
        "netstat -an | findstr :8080"
      );
      console.log(netstat || "   端口8080未监听");

      // 显示路由表
      console.log("\n🛣️  路由表 (VPN相关):");
      const { stdout: route } = await execAsync(
        'route print | findstr "10.3.17"'
      );
      console.log(route || "   未找到VPN路由");
    } catch (error) {
      console.log("❌ 获取配置失败:", error.message);
    }
  }

  async testConnectivity() {
    console.log("\n🧪 [连通性测试]");
    console.log("-".repeat(30));

    const tests = [
      { name: "本地回环", url: "http://127.0.0.1:8080/health" },
      { name: "localhost", url: "http://localhost:8080/health" },
      { name: "VPN IP", url: "http://10.3.17.187:8080/health" },
    ];

    for (const test of tests) {
      try {
        console.log(`🔍 测试 ${test.name}: ${test.url}`);

        const { stdout } = await execAsync(`curl -s -m 5 "${test.url}"`);
        if (stdout.includes("status") || stdout.includes("ok")) {
          console.log(`   ✅ ${test.name}: 连接成功`);
        } else {
          console.log(`   ❌ ${test.name}: 连接失败 - ${stdout}`);
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: 连接失败 - ${error.message}`);
      }
    }

    console.log("\n💡 如果VPN IP测试成功，说明WebService正常运行");
    console.log("💡 如果SC服务器仍无法连接，可能是防火墙或代理问题");
  }

  getUserInput(prompt) {
    return new Promise((resolve) => {
      process.stdout.write(prompt);
      process.stdin.once("data", (data) => {
        resolve(data.toString().trim());
      });
    });
  }
}

async function main() {
  const fixer = new ProxyFixer();

  // 启用标准输入
  process.stdin.setRawMode(false);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  try {
    await fixer.showSolutions();
  } catch (error) {
    console.error("❌ 执行失败:", error.message);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = ProxyFixer;
