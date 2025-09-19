/**
 * 日志查看工具
 * 实时显示请求和响应日志
 */

const fs = require("fs");
const path = require("path");

class LogViewer {
  constructor() {
    this.logFile = path.join(__dirname, "logs", "combined.log");
    this.lastPosition = 0;
    this.isWatching = false;
  }

  /**
   * 开始监控日志文件
   */
  startWatching() {
    if (this.isWatching) {
      console.log("日志监控已在运行...");
      return;
    }

    console.log("📊 启动FSU日志监控器");
    console.log("📂 日志文件:", this.logFile);
    console.log("🔍 监控模式: 实时显示请求/响应");
    console.log("─".repeat(80));

    // 检查日志文件是否存在
    if (!fs.existsSync(this.logFile)) {
      console.log("⚠️  日志文件不存在，等待创建...");
      // 创建日志目录
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } else {
      // 读取当前文件大小
      const stats = fs.statSync(this.logFile);
      this.lastPosition = stats.size;
      console.log(`📄 已存在日志文件 (${(stats.size / 1024).toFixed(1)} KB)`);
    }

    this.isWatching = true;
    this.watchLogFile();
  }

  /**
   * 监控日志文件变化
   */
  watchLogFile() {
    fs.watchFile(this.logFile, { interval: 500 }, (curr, prev) => {
      if (curr.size > this.lastPosition) {
        this.readNewLogEntries();
      }
    });

    console.log("👀 开始监控日志文件...\n");
  }

  /**
   * 读取新的日志条目
   */
  readNewLogEntries() {
    try {
      const stats = fs.statSync(this.logFile);
      const stream = fs.createReadStream(this.logFile, {
        start: this.lastPosition,
        end: stats.size,
      });

      let buffer = "";

      stream.on("data", (chunk) => {
        buffer += chunk.toString();
      });

      stream.on("end", () => {
        const lines = buffer.split("\n").filter((line) => line.trim());

        lines.forEach((line) => {
          this.processLogLine(line);
        });

        this.lastPosition = stats.size;
      });
    } catch (error) {
      console.error("读取日志文件错误:", error.message);
    }
  }

  /**
   * 处理单行日志
   */
  processLogLine(line) {
    try {
      // 解析JSON日志
      const logData = JSON.parse(line);

      // 只显示重要的FSU相关日志
      if (this.isImportantLog(logData)) {
        this.displayFormattedLog(logData);
      }
    } catch (error) {
      // 非JSON日志，检查是否包含关键信息
      if (
        line.includes("GET_DATA") ||
        line.includes("GET_FSUINFO") ||
        line.includes("心跳") ||
        line.includes("设备")
      ) {
        console.log("📝", line);
      }
    }
  }

  /**
   * 判断是否为重要日志
   */
  isImportantLog(logData) {
    if (!logData.message) return false;

    const importantKeywords = [
      "收到GET_DATA请求",
      "发送GET_DATA_ACK响应",
      "收到GET_FSUINFO心跳请求",
      "发送GET_FSUINFO_ACK响应",
      "处理GET_DATA设备数据请求",
      "生成设备响应数据",
      "收到SC的invoke请求",
    ];

    return importantKeywords.some((keyword) =>
      logData.message.includes(keyword)
    );
  }

  /**
   * 格式化显示日志
   */
  displayFormattedLog(logData) {
    const timestamp = new Date(logData.timestamp).toLocaleString();

    if (logData.message.includes("收到GET_DATA请求")) {
      console.log(`\n🔵 [${timestamp}] GET_DATA请求`);
      if (logData.requestFsuId) {
        console.log(`   FSU ID: ${logData.requestFsuId}`);
      }
      if (logData.devices) {
        console.log(`   设备: ${JSON.stringify(logData.devices)}`);
      }
    } else if (logData.message.includes("发送GET_DATA_ACK响应")) {
      console.log(`\n✅ [${timestamp}] GET_DATA_ACK响应`);
      if (logData.fsuId) {
        console.log(`   FSU ID: ${logData.fsuId}`);
      }
      if (logData.deviceId) {
        console.log(`   设备ID: ${logData.deviceId}`);
      }
      console.log(`   结果: ${logData.success ? "成功" : "失败"}`);
    } else if (logData.message.includes("收到GET_FSUINFO心跳请求")) {
      console.log(`\n💓 [${timestamp}] 心跳请求`);
      if (logData.requestFsuId) {
        console.log(`   请求FSU ID: ${logData.requestFsuId}`);
      }
      if (logData.myFsuId) {
        console.log(`   本地FSU ID: ${logData.myFsuId}`);
      }
    } else if (logData.message.includes("发送GET_FSUINFO_ACK响应")) {
      const success = logData.result === 1;
      console.log(`\n${success ? "💚" : "❤️"} [${timestamp}] 心跳响应`);
      console.log(`   结果: ${success ? "成功" : "失败"}`);
      if (logData.fsuId) {
        console.log(`   FSU ID: ${logData.fsuId}`);
      }
      if (logData.reason) {
        console.log(`   原因: ${logData.reason}`);
      }
    } else if (logData.message.includes("生成设备响应数据")) {
      console.log(`\n🔧 [${timestamp}] 生成设备数据`);
      if (logData.deviceType) {
        console.log(`   设备类型: ${logData.deviceType}`);
      }
      if (logData.signalCount) {
        console.log(`   信号数量: ${logData.signalCount}`);
      }
    } else {
      // 其他重要日志
      console.log(`\n📋 [${timestamp}] ${logData.message}`);
      if (logData.level === "error") {
        console.log(`   ❌ 错误: ${logData.error || "Unknown error"}`);
      }
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
FSU日志监控工具

用法:
  node log-viewer.js [命令]

命令:
  watch       实时监控日志 (默认)
  tail        显示最近的日志条目
  clear       清空日志文件
  help        显示帮助信息

示例:
  node log-viewer.js watch
  node log-viewer.js tail 50
  node log-viewer.js clear

说明:
  - 实时监控会显示所有新的请求和响应
  - 使用 Ctrl+C 停止监控
  - 日志文件位置: ./logs/combined.log
    `);
  }

  /**
   * 显示最近的日志条目
   */
  showRecentLogs(count = 20) {
    console.log(`📊 显示最近 ${count} 条重要日志`);
    console.log("─".repeat(80));

    if (!fs.existsSync(this.logFile)) {
      console.log("⚠️  日志文件不存在");
      return;
    }

    try {
      const content = fs.readFileSync(this.logFile, "utf8");
      const lines = content.split("\n").filter((line) => line.trim());
      const recentLines = lines.slice(-count * 3); // 取更多行来筛选

      let importantLogs = [];

      recentLines.forEach((line) => {
        try {
          const logData = JSON.parse(line);
          if (this.isImportantLog(logData)) {
            importantLogs.push(logData);
          }
        } catch (error) {
          // 忽略解析错误
        }
      });

      // 只显示最近的重要日志
      const logsToShow = importantLogs.slice(-count);

      if (logsToShow.length === 0) {
        console.log("没有找到重要的日志条目");
      } else {
        logsToShow.forEach((logData) => {
          this.displayFormattedLog(logData);
        });
      }
    } catch (error) {
      console.error("读取日志文件错误:", error.message);
    }
  }

  /**
   * 清空日志文件
   */
  clearLogs() {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.writeFileSync(this.logFile, "");
        console.log("✅ 日志文件已清空");
      } else {
        console.log("⚠️  日志文件不存在");
      }
    } catch (error) {
      console.error("清空日志文件错误:", error.message);
    }
  }

  /**
   * 停止监控
   */
  stopWatching() {
    if (this.isWatching) {
      fs.unwatchFile(this.logFile);
      this.isWatching = false;
      console.log("\n📊 日志监控已停止");
    }
  }
}

// 主程序
async function main() {
  const logViewer = new LogViewer();

  const args = process.argv.slice(2);
  const command = args[0] || "watch";
  const param = args[1];

  switch (command) {
    case "watch":
      logViewer.startWatching();

      // 处理 Ctrl+C
      process.on("SIGINT", () => {
        logViewer.stopWatching();
        console.log("\n👋 再见！");
        process.exit(0);
      });

      // 保持进程运行
      setInterval(() => {}, 1000);
      break;

    case "tail":
      const count = parseInt(param) || 20;
      logViewer.showRecentLogs(count);
      break;

    case "clear":
      logViewer.clearLogs();
      break;

    case "help":
    case "--help":
    case "-h":
      logViewer.showHelp();
      break;

    default:
      console.log(`未知命令: ${command}`);
      logViewer.showHelp();
  }
}

// 运行主程序
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ 日志监控器错误:", error.message);
    process.exit(1);
  });
}

module.exports = LogViewer;
