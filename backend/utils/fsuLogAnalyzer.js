const winston = require("winston");
const path = require("path");
const fs = require("fs");

/**
 * FSU接口日志分析器
 * 专门用于分析FSU接口调用的详细日志和错误诊断
 */
class FSULogAnalyzer {
  constructor() {
    this.setupLogger();
    this.logEntries = [];
  }

  /**
   * 设置专门的FSU接口日志记录器
   */
  setupLogger() {
    const logDir = path.join(__dirname, "../logs");

    // 确保日志目录存在
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: "debug",
      format: winston.format.combine(
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: "fsu-interface" },
      transports: [
        // FSU接口专用日志文件
        new winston.transports.File({
          filename: path.join(logDir, "fsu-interface.log"),
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        }),
        // 错误日志
        new winston.transports.File({
          filename: path.join(logDir, "fsu-errors.log"),
          level: "error",
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // 控制台输出
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} [${level}] ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
              }`;
            })
          ),
        }),
      ],
    });
  }

  /**
   * 记录FSU接口调用开始
   */
  logRequestStart(interfaceName, url, requestData = {}) {
    const startTime = new Date();
    const logEntry = {
      id: this.generateLogId(),
      interfaceName,
      url,
      startTime,
      requestData: this.sanitizeRequestData(requestData),
      status: "STARTED",
    };

    this.logEntries.push(logEntry);

    this.logger.info("FSU接口调用开始", {
      interfaceName,
      url,
      startTime: startTime.toISOString(),
      requestPreview: this.getRequestPreview(requestData),
    });

    return logEntry.id;
  }

  /**
   * 记录FSU接口调用成功
   */
  logRequestSuccess(logId, responseData = {}, statusCode = 200) {
    const endTime = new Date();
    const logEntry = this.findLogEntry(logId);

    if (logEntry) {
      logEntry.endTime = endTime;
      logEntry.duration = endTime - logEntry.startTime;
      logEntry.status = "SUCCESS";
      logEntry.statusCode = statusCode;
      logEntry.responseData = this.sanitizeResponseData(responseData);

      this.logger.info("FSU接口调用成功", {
        interfaceName: logEntry.interfaceName,
        url: logEntry.url,
        duration: logEntry.duration,
        statusCode,
        responsePreview: this.getResponsePreview(responseData),
      });

      this.printLogSummary(logEntry);
    }
  }

  /**
   * 记录FSU接口调用失败
   */
  logRequestError(logId, error, statusCode = null) {
    const endTime = new Date();
    const logEntry = this.findLogEntry(logId);

    if (logEntry) {
      logEntry.endTime = endTime;
      logEntry.duration = endTime - logEntry.startTime;
      logEntry.status = "ERROR";
      logEntry.statusCode = statusCode;
      logEntry.error = {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack,
      };

      // 分析错误类型
      const errorAnalysis = this.analyzeError(error);

      this.logger.error("FSU接口调用失败", {
        interfaceName: logEntry.interfaceName,
        url: logEntry.url,
        duration: logEntry.duration,
        statusCode,
        error: logEntry.error,
        analysis: errorAnalysis,
      });

      this.printErrorAnalysis(logEntry, errorAnalysis);
    }
  }

  /**
   * 分析错误类型和可能的解决方案
   */
  analyzeError(error) {
    const analysis = {
      type: "UNKNOWN",
      category: "其他错误",
      possibleCauses: [],
      solutions: [],
    };

    const errorMessage = error.message?.toLowerCase() || "";
    const errorCode = error.code;

    // 连接超时错误
    if (errorMessage.includes("timeout") || errorCode === "ECONNRESET") {
      analysis.type = "TIMEOUT";
      analysis.category = "连接超时";
      analysis.possibleCauses = [
        "网络连接不稳定",
        "目标服务器响应慢",
        "VPN连接问题",
        "防火墙阻挡",
        "服务器负载过高",
      ];
      analysis.solutions = [
        "检查网络连接状态",
        "确认VPN连接正常",
        "增加请求超时时间",
        "检查目标服务器状态",
        "使用网络诊断工具测试连通性",
      ];
    }
    // 连接拒绝错误
    else if (
      errorMessage.includes("connect refused") ||
      errorCode === "ECONNREFUSED"
    ) {
      analysis.type = "CONNECTION_REFUSED";
      analysis.category = "连接被拒绝";
      analysis.possibleCauses = [
        "目标服务器未启动",
        "端口配置错误",
        "IP地址配置错误",
        "防火墙阻挡连接",
      ];
      analysis.solutions = [
        "确认目标服务器IP和端口",
        "检查服务器是否正常运行",
        "验证防火墙设置",
        "测试网络连通性",
      ];
    }
    // DNS解析错误
    else if (
      errorMessage.includes("getaddrinfo") ||
      errorCode === "ENOTFOUND"
    ) {
      analysis.type = "DNS_ERROR";
      analysis.category = "DNS解析失败";
      analysis.possibleCauses = [
        "域名配置错误",
        "DNS服务器问题",
        "网络连接问题",
      ];
      analysis.solutions = [
        "检查域名拼写",
        "确认DNS服务器配置",
        "尝试使用IP地址替代域名",
      ];
    }
    // SSL/TLS错误
    else if (
      errorMessage.includes("ssl") ||
      errorMessage.includes("certificate")
    ) {
      analysis.type = "SSL_ERROR";
      analysis.category = "SSL/TLS错误";
      analysis.possibleCauses = [
        "SSL证书过期或无效",
        "协议版本不匹配",
        "证书链问题",
      ];
      analysis.solutions = [
        "检查SSL证书有效性",
        "确认协议版本支持",
        "尝试忽略SSL验证（仅测试用）",
      ];
    }

    return analysis;
  }

  /**
   * 打印日志摘要（标准格式）
   */
  printLogSummary(logEntry) {
    console.log("\n" + "=".repeat(80));
    console.log("标准FSU接口日志明细");
    console.log("=".repeat(80));
    console.log(`接口名称: ${logEntry.interfaceName}`);
    console.log(`URL: ${logEntry.url}`);
    console.log(`开始时间: ${this.formatDateTime(logEntry.startTime)}`);
    console.log(`结束时间: ${this.formatDateTime(logEntry.endTime)}`);
    console.log(`请求耗时: ${logEntry.duration}ms`);
    console.log(`结果: ${logEntry.status === "SUCCESS" ? "成功" : "失败"}`);
    console.log(`状态码: ${logEntry.statusCode || "N/A"}`);

    if (logEntry.requestData?.xml) {
      console.log("\n请求报文:");
      console.log(this.formatXml(logEntry.requestData.xml));
    }

    if (logEntry.responseData?.xml) {
      console.log("\n响应报文:");
      console.log(this.formatXml(logEntry.responseData.xml));
    }

    console.log("=".repeat(80) + "\n");
  }

  /**
   * 打印错误分析
   */
  printErrorAnalysis(logEntry, analysis) {
    console.log("\n" + "=".repeat(80));
    console.log("标准FSU接口日志明细");
    console.log("=".repeat(80));
    console.log(`接口名称: ${logEntry.interfaceName}`);
    console.log(`URL: ${logEntry.url}`);
    console.log(`开始时间: ${this.formatDateTime(logEntry.startTime)}`);
    console.log(`结束时间: ${this.formatDateTime(logEntry.endTime)}`);
    console.log(`请求耗时: ${logEntry.duration}ms`);
    console.log(`错误原因: ${logEntry.error?.message || "未知错误"}`);
    console.log(`结果: null`);

    if (logEntry.requestData?.xml) {
      console.log("\n请求报文:");
      console.log(this.formatXml(logEntry.requestData.xml));
    }

    console.log("\n响应报文: null");

    console.log("\n🔍 错误分析:");
    console.log(`类型: ${analysis.category}`);
    console.log("\n可能原因:");
    analysis.possibleCauses.forEach((cause, index) => {
      console.log(`  ${index + 1}. ${cause}`);
    });

    console.log("\n建议解决方案:");
    analysis.solutions.forEach((solution, index) => {
      console.log(`  ${index + 1}. ${solution}`);
    });

    console.log("=".repeat(80) + "\n");
  }

  /**
   * 网络诊断
   */
  async performNetworkDiagnostics(targetUrl) {
    console.log("\n🔍 开始网络诊断...\n");

    const diagnostics = {
      timestamp: new Date().toISOString(),
      targetUrl,
      results: {},
    };

    try {
      // 解析URL
      const url = new URL(targetUrl);
      const hostname = url.hostname;
      const port = url.port || (url.protocol === "https:" ? 443 : 80);

      // 1. 本地网络接口检查
      console.log("1. 检查本地网络接口...");
      const networkInterfaces = require("os").networkInterfaces();
      const activeInterfaces = [];

      Object.keys(networkInterfaces).forEach((name) => {
        networkInterfaces[name].forEach((net) => {
          if (!net.internal && net.family === "IPv4") {
            activeInterfaces.push({ name, address: net.address });
            console.log(`   ✓ ${name}: ${net.address}`);
          }
        });
      });

      diagnostics.results.localInterfaces = activeInterfaces;

      // 2. DNS解析测试
      console.log("\n2. DNS解析测试...");
      try {
        const dns = require("dns").promises;
        const addresses = await dns.lookup(hostname, { all: true });
        console.log(`   ✓ DNS解析成功: ${hostname}`);
        addresses.forEach((addr) => {
          console.log(`     - ${addr.address} (${addr.family})`);
        });
        diagnostics.results.dnsResolution = { success: true, addresses };
      } catch (dnsError) {
        console.log(`   ❌ DNS解析失败: ${dnsError.message}`);
        diagnostics.results.dnsResolution = {
          success: false,
          error: dnsError.message,
        };
      }

      // 3. TCP连接测试
      console.log("\n3. TCP连接测试...");
      try {
        const net = require("net");
        const tcpTest = await new Promise((resolve, reject) => {
          const socket = new net.Socket();
          const timeout = setTimeout(() => {
            socket.destroy();
            reject(new Error("连接超时"));
          }, 5000);

          socket.connect(port, hostname, () => {
            clearTimeout(timeout);
            socket.destroy();
            resolve(true);
          });

          socket.on("error", (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });

        console.log(`   ✓ TCP连接成功: ${hostname}:${port}`);
        diagnostics.results.tcpConnection = { success: true };
      } catch (tcpError) {
        console.log(`   ❌ TCP连接失败: ${tcpError.message}`);
        diagnostics.results.tcpConnection = {
          success: false,
          error: tcpError.message,
        };
      }

      // 4. HTTP连接测试
      console.log("\n4. HTTP连接测试...");
      try {
        const axios = require("axios");
        const httpResponse = await axios.get(targetUrl, {
          timeout: 5000,
          validateStatus: () => true,
        });

        console.log(`   ✓ HTTP连接成功，状态码: ${httpResponse.status}`);
        diagnostics.results.httpConnection = {
          success: true,
          statusCode: httpResponse.status,
          headers: httpResponse.headers,
        };
      } catch (httpError) {
        console.log(`   ❌ HTTP连接失败: ${httpError.message}`);
        diagnostics.results.httpConnection = {
          success: false,
          error: httpError.message,
        };
      }
    } catch (error) {
      console.log(`❌ 网络诊断异常: ${error.message}`);
      diagnostics.results.error = error.message;
    }

    console.log("\n📊 网络诊断完成\n");
    return diagnostics;
  }

  /**
   * 工具方法
   */
  generateLogId() {
    return `fsu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  findLogEntry(logId) {
    return this.logEntries.find((entry) => entry.id === logId);
  }

  sanitizeRequestData(data) {
    if (typeof data === "string") {
      return { xml: data };
    }
    return data;
  }

  sanitizeResponseData(data) {
    if (typeof data === "string") {
      return { xml: data };
    }
    return data;
  }

  getRequestPreview(data) {
    if (typeof data === "string") {
      return data.substring(0, 200) + (data.length > 200 ? "..." : "");
    }
    return JSON.stringify(data).substring(0, 200);
  }

  getResponsePreview(data) {
    if (typeof data === "string") {
      return data.substring(0, 200) + (data.length > 200 ? "..." : "");
    }
    return JSON.stringify(data).substring(0, 200);
  }

  formatDateTime(date) {
    if (!date) return "N/A";
    return date
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");
  }

  formatXml(xml) {
    if (!xml) return "N/A";
    // 简单的XML格式化
    return xml.replace(/></g, ">\n<").replace(/^\s*$/gm, "").trim();
  }

  /**
   * 获取统计信息
   */
  getStatistics(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentEntries = this.logEntries.filter(
      (entry) => entry.startTime >= cutoffTime
    );

    const stats = {
      total: recentEntries.length,
      successful: recentEntries.filter((entry) => entry.status === "SUCCESS")
        .length,
      failed: recentEntries.filter((entry) => entry.status === "ERROR").length,
      avgDuration: 0,
      interfaces: {},
      errorTypes: {},
    };

    if (recentEntries.length > 0) {
      stats.avgDuration =
        recentEntries
          .filter((entry) => entry.duration)
          .reduce((sum, entry) => sum + entry.duration, 0) /
        recentEntries.length;

      // 按接口统计
      recentEntries.forEach((entry) => {
        if (!stats.interfaces[entry.interfaceName]) {
          stats.interfaces[entry.interfaceName] = {
            total: 0,
            success: 0,
            failed: 0,
          };
        }
        stats.interfaces[entry.interfaceName].total++;
        if (entry.status === "SUCCESS") {
          stats.interfaces[entry.interfaceName].success++;
        } else {
          stats.interfaces[entry.interfaceName].failed++;
        }
      });

      // 按错误类型统计
      recentEntries
        .filter((entry) => entry.status === "ERROR")
        .forEach((entry) => {
          const errorType = entry.error?.name || "Unknown";
          stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + 1;
        });
    }

    return stats;
  }
}

module.exports = FSULogAnalyzer;
