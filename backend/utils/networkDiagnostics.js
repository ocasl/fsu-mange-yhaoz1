const os = require("os");
const { exec } = require("child_process");
const { promisify } = require("util");
const logger = require("./logger");

const execAsync = promisify(exec);

class NetworkDiagnostics {
  constructor() {
    this.proxyPort = 7890;
  }

  /**
   * 检测是否开启了代理
   */
  async detectProxy() {
    try {
      const results = {
        systemProxy: await this.checkSystemProxy(),
        processProxy: await this.checkProcessProxy(),
        portInUse: await this.checkPortInUse(this.proxyPort),
        recommendations: [],
      };

      // 生成建议
      if (
        results.systemProxy.enabled ||
        results.processProxy.detected ||
        results.portInUse
      ) {
        results.recommendations.push(
          "检测到代理可能影响WebService服务器接收SC心跳请求"
        );
        results.recommendations.push(
          "建议使用双网卡模式：代理用于出站，直连用于入站"
        );
      }

      return results;
    } catch (error) {
      logger.error("代理检测失败", { error: error.message });
      return { error: error.message };
    }
  }

  /**
   * 检查系统代理设置
   */
  async checkSystemProxy() {
    try {
      const platform = os.platform();
      let proxyInfo = { enabled: false, details: {} };

      if (platform === "win32") {
        // Windows: 检查注册表中的代理设置
        try {
          const { stdout } = await execAsync(
            'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable'
          );
          const proxyEnabled = stdout.includes("0x1");

          if (proxyEnabled) {
            const { stdout: proxyServer } = await execAsync(
              'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer'
            );
            proxyInfo = {
              enabled: true,
              details: { server: proxyServer.split("REG_SZ")[1]?.trim() },
            };
          }
        } catch (err) {
          // 忽略注册表查询错误
        }
      }

      // 检查环境变量
      const envProxy =
        process.env.HTTP_PROXY ||
        process.env.http_proxy ||
        process.env.HTTPS_PROXY ||
        process.env.https_proxy;
      if (envProxy) {
        proxyInfo.enabled = true;
        proxyInfo.details.env = envProxy;
      }

      return proxyInfo;
    } catch (error) {
      return { enabled: false, error: error.message };
    }
  }

  /**
   * 检查当前进程的代理配置
   */
  async checkProcessProxy() {
    const detected = !!(
      process.env.HTTP_PROXY ||
      process.env.HTTPS_PROXY ||
      process.env.http_proxy ||
      process.env.https_proxy
    );

    return {
      detected,
      env: {
        HTTP_PROXY: process.env.HTTP_PROXY,
        HTTPS_PROXY: process.env.HTTPS_PROXY,
        http_proxy: process.env.http_proxy,
        https_proxy: process.env.https_proxy,
        NO_PROXY: process.env.NO_PROXY || process.env.no_proxy,
      },
    };
  }

  /**
   * 检查指定端口是否被占用
   */
  async checkPortInUse(port) {
    try {
      const platform = os.platform();
      let cmd;

      if (platform === "win32") {
        cmd = `netstat -an | findstr :${port}`;
      } else {
        cmd = `netstat -an | grep :${port}`;
      }

      const { stdout } = await execAsync(cmd);
      return stdout.includes(`:${port}`);
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取所有网络接口信息
   */
  getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result = {};

    Object.keys(interfaces).forEach((name) => {
      const iface = interfaces[name];
      result[name] = iface
        .filter((addr) => !addr.internal)
        .map((addr) => ({
          address: addr.address,
          family: addr.family,
          netmask: addr.netmask,
          mac: addr.mac,
        }));
    });

    return result;
  }

  /**
   * 获取当前活动的网络连接
   */
  async getActiveConnections() {
    try {
      const platform = os.platform();
      let cmd;

      if (platform === "win32") {
        cmd = "netstat -an";
      } else {
        cmd = "netstat -an";
      }

      const { stdout } = await execAsync(cmd);
      return this.parseNetstatOutput(stdout);
    } catch (error) {
      logger.error("获取网络连接失败", { error: error.message });
      return [];
    }
  }

  /**
   * 解析netstat输出
   */
  parseNetstatOutput(output) {
    const lines = output.split("\n");
    const connections = [];

    lines.forEach((line) => {
      if (line.includes("LISTENING") || line.includes("ESTABLISHED")) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          connections.push({
            protocol: parts[0],
            localAddress: parts[1],
            foreignAddress: parts[2],
            state: parts[3],
          });
        }
      }
    });

    return connections;
  }

  /**
   * 综合网络诊断
   */
  async performComprehensiveDiagnostic() {
    console.log("\n🔍 [网络诊断] 开始综合网络诊断...");

    const results = {
      timestamp: new Date().toISOString(),
      proxy: await this.detectProxy(),
      interfaces: this.getNetworkInterfaces(),
      connections: await this.getActiveConnections(),
      webServicePorts: [],
      recommendations: [],
    };

    // 检查WebService相关端口
    const webServicePorts = [8080, 8081, 8082];
    for (const port of webServicePorts) {
      const inUse = await this.checkPortInUse(port);
      results.webServicePorts.push({ port, inUse });
    }

    // 生成诊断建议
    this.generateRecommendations(results);

    // 输出诊断结果
    this.printDiagnosticResults(results);

    return results;
  }

  /**
   * 生成诊断建议
   */
  generateRecommendations(results) {
    const recommendations = [];

    // 代理相关建议
    if (
      results.proxy.systemProxy?.enabled ||
      results.proxy.processProxy?.detected
    ) {
      recommendations.push("🔧 检测到代理配置，建议：");
      recommendations.push("   1. 为WebService服务器使用直连网络接口");
      recommendations.push("   2. 配置NO_PROXY环境变量排除本地网络");
      recommendations.push(
        "   3. 使用双网卡：一个用于代理出站，一个用于直连入站"
      );
    }

    // VPN相关建议
    const vpnInterfaces = Object.keys(results.interfaces).filter(
      (name) =>
        name.toLowerCase().includes("tap") ||
        name.toLowerCase().includes("tun") ||
        name.toLowerCase().includes("tieta")
    );

    if (vpnInterfaces.length > 0) {
      recommendations.push("🌐 检测到VPN接口，建议：");
      recommendations.push("   1. 确保WebService绑定到正确的VPN接口");
      recommendations.push("   2. 检查VPN路由表是否允许入站连接");
      recommendations.push(`   3. VPN接口: ${vpnInterfaces.join(", ")}`);
    }

    // 端口相关建议
    const webServiceInUse = results.webServicePorts.filter((p) => p.inUse);
    if (webServiceInUse.length === 0) {
      recommendations.push("⚠️  未检测到WebService端口监听，建议：");
      recommendations.push("   1. 确认WebService服务器已启动");
      recommendations.push("   2. 检查防火墙设置");
    }

    results.recommendations = recommendations;
  }

  /**
   * 打印诊断结果
   */
  printDiagnosticResults(results) {
    console.log("\n📊 [诊断结果] 网络环境分析:");
    console.log("=".repeat(60));

    // 代理状态
    console.log("\n🔗 代理状态:");
    if (results.proxy.systemProxy?.enabled) {
      console.log(
        `   系统代理: 已启用 - ${JSON.stringify(
          results.proxy.systemProxy.details
        )}`
      );
    } else {
      console.log("   系统代理: 未启用");
    }

    if (results.proxy.processProxy?.detected) {
      console.log("   进程代理: 已检测到环境变量");
      Object.entries(results.proxy.processProxy.env).forEach(([key, value]) => {
        if (value) console.log(`     ${key}: ${value}`);
      });
    } else {
      console.log("   进程代理: 未检测到");
    }

    // 网络接口
    console.log("\n🌐 网络接口:");
    Object.entries(results.interfaces).forEach(([name, addrs]) => {
      if (addrs.length > 0) {
        console.log(`   ${name}:`);
        addrs.forEach((addr) => {
          console.log(`     ${addr.family}: ${addr.address}`);
        });
      }
    });

    // WebService端口状态
    console.log("\n🔌 WebService端口状态:");
    results.webServicePorts.forEach((port) => {
      const status = port.inUse ? "✅ 正在监听" : "❌ 未监听";
      console.log(`   端口 ${port.port}: ${status}`);
    });

    // 建议
    if (results.recommendations.length > 0) {
      console.log("\n💡 建议措施:");
      results.recommendations.forEach((rec) => {
        console.log(`${rec}`);
      });
    }

    console.log("\n=".repeat(60));
  }

  /**
   * 创建无代理的网络环境
   */
  createProxyFreeEnvironment() {
    const originalEnv = { ...process.env };

    // 清除代理环境变量
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.http_proxy;
    delete process.env.https_proxy;

    // 设置NO_PROXY以确保本地连接不走代理
    process.env.NO_PROXY = "127.0.0.1,localhost,10.*,192.168.*,*.local";
    process.env.no_proxy = "127.0.0.1,localhost,10.*,192.168.*,*.local";

    console.log("🔧 已创建无代理网络环境");

    return {
      restore: () => {
        Object.keys(process.env).forEach((key) => {
          if (key.toLowerCase().includes("proxy")) {
            delete process.env[key];
          }
        });
        Object.assign(process.env, originalEnv);
        console.log("🔄 已恢复原始网络环境");
      },
    };
  }
}

module.exports = new NetworkDiagnostics();
