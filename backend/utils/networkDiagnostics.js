const { exec } = require("child_process");
const { promisify } = require("util");
const net = require("net");
const axios = require("axios");
const logger = require("./logger");

const execAsync = promisify(exec);

/**
 * 网络诊断工具
 * 专门用于诊断FSU接口连接问题
 */
class NetworkDiagnostics {
  constructor() {
    this.isWindows = process.platform === "win32";
  }

  /**
   * 完整的网络诊断
   */
  async performFullDiagnosis(targetHost, targetPort = 8080) {
    console.log(`\n🔍 开始网络诊断 - 目标: ${targetHost}:${targetPort}\n`);

    const report = {
      timestamp: new Date().toISOString(),
      target: { host: targetHost, port: targetPort },
      results: {},
      summary: { issues: [], recommendations: [] },
    };

    try {
      // 1. 本地网络接口检查
      report.results.localInterfaces = await this.checkLocalInterfaces();

      // 2. DNS解析检查
      report.results.dnsResolution = await this.checkDNSResolution(targetHost);

      // 3. 路由检查
      report.results.routing = await this.checkRouting(targetHost);

      // 4. 端口连通性检查
      report.results.portConnectivity = await this.checkPortConnectivity(
        targetHost,
        targetPort
      );

      // 5. HTTP服务检查
      report.results.httpService = await this.checkHttpService(
        targetHost,
        targetPort
      );

      // 6. 防火墙检查
      report.results.firewall = await this.checkFirewallRules(
        targetHost,
        targetPort
      );

      // 7. 生成诊断摘要
      this.generateDiagnosisSummary(report);

      // 8. 打印诊断报告
      this.printDiagnosisReport(report);

      return report;
    } catch (error) {
      logger.error("网络诊断过程发生异常", { error: error.message });
      report.error = error.message;
      return report;
    }
  }

  /**
   * 检查本地网络接口
   */
  async checkLocalInterfaces() {
    console.log("1. 检查本地网络接口...");

    const os = require("os");
    const interfaces = os.networkInterfaces();
    const activeInterfaces = [];

    Object.keys(interfaces).forEach((name) => {
      interfaces[name].forEach((net) => {
        if (!net.internal) {
          activeInterfaces.push({
            name,
            family: net.family,
            address: net.address,
            netmask: net.netmask,
            mac: net.mac,
          });

          const status = net.family === "IPv4" ? "✓" : "○";
          console.log(`   ${status} ${name}: ${net.address} (${net.family})`);
        }
      });
    });

    return {
      success: true,
      interfaces: activeInterfaces,
      count: activeInterfaces.length,
    };
  }

  /**
   * 检查DNS解析
   */
  async checkDNSResolution(hostname) {
    console.log("\n2. DNS解析检查...");

    try {
      // 如果是IP地址，跳过DNS解析
      if (this.isIPAddress(hostname)) {
        console.log(`   ✓ 目标是IP地址，跳过DNS解析: ${hostname}`);
        return { success: true, isIP: true, address: hostname };
      }

      const dns = require("dns").promises;
      const addresses = await dns.lookup(hostname, { all: true });

      console.log(`   ✓ DNS解析成功: ${hostname}`);
      addresses.forEach((addr) => {
        console.log(`     → ${addr.address} (${addr.family})`);
      });

      return { success: true, isIP: false, addresses };
    } catch (error) {
      console.log(`   ❌ DNS解析失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查路由
   */
  async checkRouting(targetHost) {
    console.log("\n3. 路由检查...");

    try {
      const command = this.isWindows
        ? `tracert -h 5 ${targetHost}`
        : `traceroute -m 5 ${targetHost}`;

      console.log(`   执行: ${command}`);

      const { stdout, stderr } = await execAsync(command, { timeout: 10000 });

      if (stderr && !stderr.includes("Unable to resolve")) {
        console.log(`   ⚠️  路由检查有警告: ${stderr.trim()}`);
      }

      const hops = this.parseTraceRoute(stdout);
      console.log(`   ✓ 路由检查完成，发现 ${hops.length} 跳`);

      hops.slice(0, 3).forEach((hop, index) => {
        console.log(`     ${index + 1}. ${hop}`);
      });

      return { success: true, hops, rawOutput: stdout };
    } catch (error) {
      console.log(`   ❌ 路由检查失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查端口连通性
   */
  async checkPortConnectivity(host, port) {
    console.log(`\n4. 端口连通性检查 (${host}:${port})...`);

    try {
      const isConnectable = await this.testTCPConnection(host, port, 5000);

      if (isConnectable) {
        console.log(`   ✓ TCP连接成功: ${host}:${port}`);
        return { success: true, connectable: true };
      } else {
        console.log(`   ❌ TCP连接失败: ${host}:${port}`);
        return {
          success: false,
          connectable: false,
          error: "连接被拒绝或超时",
        };
      }
    } catch (error) {
      console.log(`   ❌ 端口连通性检查异常: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查HTTP服务
   */
  async checkHttpService(host, port) {
    console.log(`\n5. HTTP服务检查...`);

    const urls = [
      `http://${host}:${port}`,
      `http://${host}:${port}/`,
      `http://${host}:${port}/invoke`,
      `http://${host}:${port}/services`,
      `http://${host}:${port}/axis`,
    ];

    const results = [];

    for (const url of urls) {
      try {
        console.log(`   测试: ${url}`);

        const response = await axios.get(url, {
          timeout: 3000,
          validateStatus: () => true, // 接受所有状态码
          maxRedirects: 0, // 禁用重定向
        });

        console.log(`     ✓ 响应: ${response.status} ${response.statusText}`);

        results.push({
          url,
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          hasContent: response.data && response.data.length > 0,
        });

        // 如果找到了可用的服务，不需要继续测试其他URL
        if (response.status === 200) {
          break;
        }
      } catch (error) {
        console.log(`     ❌ 失败: ${error.message}`);
        results.push({
          url,
          success: false,
          error: error.message,
        });
      }
    }

    const successfulRequests = results.filter((r) => r.success);
    return {
      success: successfulRequests.length > 0,
      results,
      workingUrls: successfulRequests.map((r) => r.url),
    };
  }

  /**
   * 检查防火墙规则
   */
  async checkFirewallRules(host, port) {
    console.log(`\n6. 防火墙检查...`);

    try {
      if (this.isWindows) {
        // Windows防火墙检查
        const { stdout } = await execAsync(
          `netsh advfirewall firewall show rule name=all | findstr "${port}"`
        );

        if (stdout.trim()) {
          console.log(`   ✓ 发现端口 ${port} 的防火墙规则`);
          return { success: true, hasRules: true, details: stdout.trim() };
        } else {
          console.log(`   ⚠️  未发现端口 ${port} 的特定防火墙规则`);
          return { success: true, hasRules: false };
        }
      } else {
        // Linux iptables检查
        try {
          const { stdout } = await execAsync("iptables -L -n");
          console.log(`   ✓ 防火墙规则检查完成`);
          return { success: true, rules: stdout };
        } catch {
          console.log(`   ⚠️  无法检查iptables（可能权限不足）`);
          return { success: false, error: "权限不足" };
        }
      }
    } catch (error) {
      console.log(`   ❌ 防火墙检查失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 生成诊断摘要
   */
  generateDiagnosisSummary(report) {
    const { results, summary } = report;

    // 检查各种问题
    if (!results.dnsResolution?.success && !results.dnsResolution?.isIP) {
      summary.issues.push("DNS解析失败");
      summary.recommendations.push("检查域名拼写和DNS服务器配置");
    }

    if (!results.portConnectivity?.success) {
      summary.issues.push("目标端口无法连接");
      summary.recommendations.push("确认目标服务器是否运行，检查IP和端口配置");
    }

    if (!results.httpService?.success) {
      summary.issues.push("HTTP服务不可用");
      summary.recommendations.push("确认Web服务是否正常运行");
    }

    if (results.localInterfaces?.count === 0) {
      summary.issues.push("没有可用的网络接口");
      summary.recommendations.push("检查网络连接和网卡驱动");
    }

    // 特定场景的建议
    if (summary.issues.length === 0) {
      summary.recommendations.push("网络连接正常，请检查应用层协议和服务配置");
    }
  }

  /**
   * 打印诊断报告
   */
  printDiagnosisReport(report) {
    console.log("\n" + "=".repeat(80));
    console.log("网络诊断报告");
    console.log("=".repeat(80));
    console.log(`目标: ${report.target.host}:${report.target.port}`);
    console.log(`时间: ${new Date(report.timestamp).toLocaleString()}`);

    if (report.summary.issues.length > 0) {
      console.log("\n❌ 发现的问题:");
      report.summary.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    } else {
      console.log("\n✅ 网络连接正常");
    }

    console.log("\n💡 建议:");
    report.summary.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    console.log("=".repeat(80) + "\n");
  }

  /**
   * 工具方法
   */
  isIPAddress(str) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(str) || ipv6Regex.test(str);
  }

  async testTCPConnection(host, port, timeout = 5000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let connected = false;

      const timer = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, timeout);

      socket.connect(port, host, () => {
        connected = true;
        clearTimeout(timer);
        socket.destroy();
        resolve(true);
      });

      socket.on("error", () => {
        clearTimeout(timer);
        resolve(false);
      });
    });
  }

  parseTraceRoute(output) {
    const lines = output.split("\n");
    const hops = [];

    lines.forEach((line) => {
      line = line.trim();
      if (
        line &&
        !line.includes("Tracing route") &&
        !line.includes("Trace complete")
      ) {
        // 提取IP地址或主机名
        const match = line.match(/(\d+\.\d+\.\d+\.\d+|\w+\.\w+)/);
        if (match) {
          hops.push(match[1]);
        }
      }
    });

    return hops;
  }
}

module.exports = NetworkDiagnostics;
