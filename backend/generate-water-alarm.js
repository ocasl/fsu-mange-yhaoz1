#!/usr/bin/env node

/**
 * 生成水浸告警XML示例
 * 按照您的要求格式生成
 */

const AlarmManager = require("./utils/alarmManager");

console.log("🚨 生成水浸告警XML");
console.log("=".repeat(50));

const alarmManager = new AlarmManager();

async function generateWaterAlarm() {
  // 生成您要求的水浸告警
  const result = await alarmManager.reportAlarm(
    {
      deviceId: "61082141841251",
      fsuId: "61082143802203",
      monitorPointId: "0418001001",
      alarmLevel: "四级",
      alarmDesc: "水浸告警",
    },
    false
  ); // 不发送到SC，只生成XML

  return result;
}

// 执行生成告警的函数
generateWaterAlarm()
  .then((result) => {
    console.log("📄 生成的SEND_ALARM请求报文:");
    console.log();
    console.log(result.sendAlarmRequest);
    console.log();

    console.log("📄 单独的TAlarm XML:");
    console.log();
    console.log(result.alarmXml);
    console.log();

    console.log("📋 告警详情:");
    console.log(`  告警序号: ${result.alarmData.serialNo}`);
    console.log(`  设备ID: ${result.alarmData.deviceId}`);
    console.log(`  FSU ID: ${result.alarmData.fsuId}`);
    console.log(`  监控点ID: ${result.alarmData.monitorPointId}`);
    console.log(`  告警时间: ${result.alarmData.alarmTime} (实时生成)`);
    console.log(`  告警级别: ${result.alarmData.alarmLevel}`);
    console.log(`  告警标志: ${result.alarmData.alarmFlag}`);
    console.log(`  告警描述: ${result.alarmData.alarmDesc}`);

    console.log("\n✅ XML生成完成！");
  })
  .catch((error) => {
    console.error("❌ 生成告警失败:", error.message);
  });

// 如果需要清除告警，运行以下代码：
if (process.argv.includes("--with-clear")) {
  console.log("\n" + "=".repeat(50));
  console.log("🔧 生成对应的清除告警XML:");

  // 等待1秒，确保时间不同
  setTimeout(async () => {
    try {
      const clearResult = await alarmManager.clearAlarm(
        {
          deviceId: "61082141841251",
          monitorPointId: "0418001001",
          fsuId: "61082143802203",
        },
        false
      ); // 不发送到SC，只生成XML

      if (clearResult.success) {
        console.log();
        console.log(clearResult.alarmXml);
        console.log();
        console.log(
          `📋 清除时间: ${clearResult.alarmData.alarmTime} (实时生成)`
        );
        console.log(`📋 使用相同序号: ${clearResult.alarmData.serialNo}`);
      }
    } catch (error) {
      console.error("❌ 生成清除告警失败:", error.message);
    }
  }, 1000);
}
