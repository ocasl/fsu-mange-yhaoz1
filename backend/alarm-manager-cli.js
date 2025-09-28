#!/usr/bin/env node

/**
 * 告警管理CLI工具
 * 用于手动上报和清除告警
 */

const AlarmManager = require("./utils/alarmManager");
const logger = require("./utils/logger");
const readline = require("readline");

const alarmManager = new AlarmManager();

console.log("🚨 FSU告警监控管理系统");
console.log("=".repeat(60));

/**
 * 显示使用说明
 */
function showUsage() {
  console.log("\n📋 使用说明:");
  console.log("  1. report - 上报告警");
  console.log("  2. clear - 清除告警");
  console.log("  3. list - 查看活跃告警");
  console.log("  4. templates - 查看告警模板");
  console.log("  5. collector - 设置采集器IP");
  console.log("  6. test - 多方式发送测试");
  console.log("  7. exit - 退出");
}

/**
 * 显示告警模板
 */
function showTemplates() {
  console.log("\n📝 预定义告警模板:");
  const templates = alarmManager.getAlarmTemplates();

  Object.entries(templates).forEach(([key, template], index) => {
    console.log(`  ${index + 1}. ${key}:`);
    console.log(`     设备ID: ${template.deviceId}`);
    console.log(`     监控点ID: ${template.monitorPointId}`);
    console.log(`     告警级别: ${template.alarmLevel}`);
    console.log(`     告警描述: ${template.alarmDesc}`);
    console.log();
  });
}

/**
 * 上报告警示例（您要求的水浸告警）
 */
async function reportWaterFloodingAlarm() {
  console.log("\n🚨 上报水浸告警示例:");

  const result = await alarmManager.reportAlarm(
    {
      deviceId: "61082141841251",
      fsuId: "61082143802203",
      monitorPointId: "0418001001",
      alarmLevel: "四级",
      alarmDesc: "水浸告警",
    },
    true,
    "soap"
  ); // 第二个参数为true，表示发送到SC服务器

  if (result.success) {
    console.log("✅", result.message);
    console.log("\n📄 生成的SEND_ALARM请求报文:");
    console.log(result.sendAlarmRequest);

    console.log("\n📄 单独的TAlarm XML:");
    console.log(result.alarmXml);

    // 显示发送结果
    if (result.sendResult) {
      console.log("\n🌐 SC服务器响应:");
      if (result.sendResult.success) {
        console.log("✅ 发送成功");
        console.log(`   状态码: ${result.sendResult.status}`);
        console.log(
          `   状态文本: ${result.sendResult.fullResponse?.statusText || "OK"}`
        );
        console.log("\n📋 响应头信息:");
        if (result.sendResult.headers) {
          Object.entries(result.sendResult.headers).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
          });
        }
        console.log("\n📄 完整响应内容:");
        console.log(result.sendResult.response);
      } else {
        console.log("❌ 发送失败");
        console.log(`   错误: ${result.sendResult.message}`);
        if (result.sendResult.fullResponse) {
          console.log(`   状态码: ${result.sendResult.status}`);
          console.log(
            `   状态文本: ${result.sendResult.fullResponse.statusText}`
          );
          console.log("\n📄 错误响应内容:");
          console.log(result.sendResult.response);
        }
      }
    }

    // 记录到日志
    logger.info("水浸告警上报", {
      serialNo: result.alarmData.serialNo,
      deviceId: result.alarmData.deviceId,
      time: result.alarmData.alarmTime,
    });
  } else {
    console.log("❌", result.message);
  }
}

/**
 * 清除告警示例
 */
async function clearWaterFloodingAlarm() {
  console.log("\n🔧 清除水浸告警示例:");

  const result = await alarmManager.clearAlarm(
    {
      deviceId: "61082141841251",
      monitorPointId: "0418001001",
      fsuId: "61082143802203",
    },
    true,
    "soap"
  ); // 第二个参数为true，表示发送到SC服务器，第三个参数指定使用soap方式

  if (result.success) {
    console.log("✅", result.message);
    console.log("\n📄 生成的SEND_ALARM清除请求报文:");
    console.log(result.sendAlarmRequest);

    console.log("\n📄 单独的TAlarm清除XML:");
    console.log(result.alarmXml);

    // 显示发送结果
    if (result.sendResult) {
      console.log("\n🌐 SC服务器响应:");
      if (result.sendResult.success) {
        console.log("✅ 发送成功");
        console.log(`   状态码: ${result.sendResult.status}`);
        console.log(
          `   状态文本: ${result.sendResult.fullResponse?.statusText || "OK"}`
        );
        console.log("\n📋 响应头信息:");
        if (result.sendResult.headers) {
          Object.entries(result.sendResult.headers).forEach(([key, value]) => {
            console.log(`   ${key}: ${value}`);
          });
        }
        console.log("\n📄 完整响应内容:");
        console.log(result.sendResult.response);
      } else {
        console.log("❌ 发送失败");
        console.log(`   错误: ${result.sendResult.message}`);
        if (result.sendResult.fullResponse) {
          console.log(`   状态码: ${result.sendResult.status}`);
          console.log(
            `   状态文本: ${result.sendResult.fullResponse.statusText}`
          );
          console.log("\n📄 错误响应内容:");
          console.log(result.sendResult.response);
        }
      }
    }

    // 记录到日志
    logger.info("水浸告警清除", {
      serialNo: result.alarmData.serialNo,
      deviceId: result.alarmData.deviceId,
      time: result.alarmData.alarmTime,
    });
  } else {
    console.log("❌", result.message);
  }
}

/**
 * 显示活跃告警
 */
function showActiveAlarms() {
  console.log("\n📋 当前活跃告警:");
  const activeAlarms = alarmManager.getActiveAlarms();

  if (activeAlarms.length === 0) {
    console.log("  暂无活跃告警");
    return;
  }

  activeAlarms.forEach((alarm, index) => {
    console.log(`  ${index + 1}. 序号: ${alarm.serialNo}`);
    console.log(`     设备ID: ${alarm.deviceId}`);
    console.log(`     监控点ID: ${alarm.monitorPointId}`);
    console.log(`     告警描述: ${alarm.alarmDesc}`);
    console.log(`     开始时间: ${alarm.startTime}`);
    console.log();
  });
}

/**
 * 设置采集器IP
 */
async function setCollectorIP(rl) {
  console.log("\n🌐 设置SC采集器IP:");
  console.log("1. 从日志自动获取");
  console.log("2. 手动输入IP地址");
  console.log("3. 查看当前IP");

  const choice = await new Promise((resolve) => {
    rl.question("\n请选择 (1-3): ", resolve);
  });

  switch (choice.trim()) {
    case "1":
      console.log("🔍 正在从日志文件中查找采集器IP...");
      const autoIP = await alarmManager.tryGetCollectorIPFromLogs();
      if (autoIP) {
        console.log(`✅ 从日志中找到采集器IP: ${autoIP}`);
        alarmManager.setCollectorIP(autoIP);
        console.log(`📡 当前采集器IP已设置为: ${autoIP}`);
      } else {
        console.log("⚠️  未能从日志中自动获取采集器IP");
        console.log("💡 请先运行enhanced-heartbeat.js进行LOGIN注册");
      }
      break;

    case "2":
      const manualIP = await new Promise((resolve) => {
        rl.question("请输入采集器IP地址: ", resolve);
      });
      const result = alarmManager.setCollectorIPManual(manualIP.trim());
      if (result.success) {
        console.log(`✅ ${result.message}`);
      } else {
        console.log(`❌ ${result.message}`);
      }
      break;

    case "3":
      const currentIP = alarmManager.getCollectorIP();
      if (currentIP) {
        console.log(`📡 当前采集器IP: ${currentIP}`);
      } else {
        console.log("⚠️  未设置采集器IP");
      }
      break;

    default:
      console.log("❌ 无效选择");
  }
}

/**
 * 测试多种发送方式
 */
async function testMultipleSendMethods() {
  console.log("\n🧪 多方式发送测试:");

  if (!alarmManager.getCollectorIP()) {
    console.log("❌ 请先设置采集器IP地址");
    return;
  }

  console.log("🚨 生成测试告警...");
  const testResult = await alarmManager.reportAlarm(
    {
      deviceId: "61082141841251",
      fsuId: "61082143802203",
      monitorPointId: "0418001001",
      alarmLevel: "", // 不设置级别
      alarmDesc: "水浸告警(测试多种发送方式)",
    },
    true,
    "all"
  ); // 使用'all'尝试所有发送方式

  console.log("\n📊 测试结果:");
  if (testResult.sendResult && testResult.sendResult.results) {
    testResult.sendResult.results.forEach((result, index) => {
      console.log(`\n${index + 1}. 方式: ${result.method}`);
      console.log(`   状态: ${result.success ? "✅ 成功" : "❌ 失败"}`);
      if (result.success) {
        console.log(`   HTTP状态: ${result.status}`);
        console.log(`   状态文本: ${result.fullResponse?.statusText || "OK"}`);
        if (result.headers) {
          console.log("   主要响应头:");
          Object.entries(result.headers)
            .slice(0, 3)
            .forEach(([key, value]) => {
              console.log(`     ${key}: ${value}`);
            });
        }
        console.log(`   响应内容: ${result.response || "无响应内容"}`);
      } else {
        console.log(`   错误: ${result.message || result.error}`);
        if (result.fullResponse && result.fullResponse.data) {
          console.log(`   错误详情: ${result.fullResponse.data}`);
        }
      }
    });
  }

  console.log(
    `\n🎯 总体结果: ${
      testResult.sendResult?.success
        ? "✅ 至少一种方式成功"
        : "❌ 所有方式都失败"
    }`
  );
}

/**
 * 自定义告警上报
 */
function customAlarmReport() {
  console.log("\n🎯 自定义告警上报:");
  console.log("使用示例参数...");

  const result = alarmManager.reportAlarm({
    deviceId: "61082140601589", // 电源设备
    fsuId: "61082143802203",
    monitorPointId: "0406001001", // 电源告警点
    alarmLevel: "二级",
    alarmDesc: "电源故障告警",
  });

  if (result.success) {
    console.log("✅", result.message);
    console.log("\n📄 生成的告警XML:");
    console.log(result.alarmXml);
  }
}

/**
 * 主菜单循环
 */
async function mainMenu() {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    showUsage();

    const choice = await new Promise((resolve) => {
      rl.question("\n请选择操作 (1-7): ", resolve);
    });

    console.log();

    switch (choice.trim()) {
      case "1":
      case "report":
        await reportWaterFloodingAlarm();
        break;

      case "2":
      case "clear":
        await clearWaterFloodingAlarm();
        break;

      case "3":
      case "list":
        showActiveAlarms();
        break;

      case "4":
      case "templates":
        showTemplates();
        break;

      case "5":
      case "collector":
        await setCollectorIP(rl);
        break;

      case "6":
      case "test":
        await testMultipleSendMethods();
        break;

      case "7":
      case "exit":
        console.log("👋 再见！");
        rl.close();
        process.exit(0);
        break;

      default:
        console.log("❌ 无效选择，请重新输入");
    }

    // 等待用户按回车继续
    await new Promise((resolve) => {
      rl.question("\n按回车键继续...", resolve);
    });
    console.clear();
  }
}

// 快速演示模式
if (process.argv.includes("--demo")) {
  (async () => {
    console.log("🎬 演示模式 - 自动执行告警操作");
    console.log();

    // 1. 上报水浸告警
    await reportWaterFloodingAlarm();

    console.log("\n" + "=".repeat(60));

    // 2. 显示活跃告警
    showActiveAlarms();

    console.log("=".repeat(60));

    // 3. 清除告警
    await clearWaterFloodingAlarm();

    console.log("\n" + "=".repeat(60));

    // 4. 再次显示活跃告警
    showActiveAlarms();

    console.log("✅ 演示完成！");
  })().catch(console.error);
} else if (process.argv.includes("--water-alarm")) {
  // 直接上报水浸告警
  reportWaterFloodingAlarm().catch(console.error);
} else {
  // 交互式菜单
  mainMenu().catch(console.error);
}

console.log("\n💡 提示:");
console.log("  - 使用 --demo 参数运行演示模式");
console.log("  - 使用 --water-alarm 参数直接上报水浸告警");
console.log("  - 采集器IP需要从LOGIN_ACK响应的SCIP字段获取");
