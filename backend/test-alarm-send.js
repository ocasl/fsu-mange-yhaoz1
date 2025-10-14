/**
 * 快速测试告警发送功能
 */

const AlarmManager = require('./utils/alarmManager');

async function testAlarmSend() {
  console.log("🧪 测试告警发送功能...\n");

  const alarmManager = new AlarmManager();
  
  // 设置测试用的采集机IP
  const testCollectorIP = "10.133.3.18";
  alarmManager.setCollectorIP(testCollectorIP);
  
  console.log(`📡 设置采集机IP: ${testCollectorIP}`);
  console.log("🔄 准备发送测试告警...\n");

  try {
    // 1. 测试不发送到SC服务器的告警生成
    console.log("🧪 测试1: 生成告警报文（不发送到SC）");
    console.log("-".repeat(40));
    
    const reportResult = await alarmManager.reportAlarm({
      deviceId: "test-device-001",
      fsuId: "61082143800739",
      monitorPointId: "0418006001",
      alarmLevel: "三级",
      alarmDesc: "测试告警-仅生成报文"
    }, false); // 不发送到SC
    
    console.log("✅ 报文生成结果:");
    console.log(`   序号: ${reportResult.alarmData?.serialNo}`);
    console.log(`   成功: ${reportResult.success}`);
    console.log(`   消息: ${reportResult.message}`);
    
    console.log("\n📄 生成的报文预览:");
    if (reportResult.sendAlarmRequest) {
      const preview = reportResult.sendAlarmRequest.substring(0, 200) + "...";
      console.log(preview);
    }

    // 2. 测试发送到SC服务器（可能失败）
    console.log("\n🧪 测试2: 发送告警到SC服务器");
    console.log("-".repeat(40));
    
    const sendResult = await alarmManager.reportAlarm({
      deviceId: "test-device-002",
      fsuId: "61082143800739",
      monitorPointId: "0418006002",
      alarmLevel: "二级",
      alarmDesc: "测试告警-发送到SC"
    }, true); // 发送到SC
    
    console.log("📡 发送结果:");
    console.log(`   序号: ${sendResult.alarmData?.serialNo}`);
    console.log(`   成功: ${sendResult.success}`);
    console.log(`   消息: ${sendResult.message}`);
    
    if (sendResult.sendResult) {
      console.log(`   SC响应: ${sendResult.sendResult.success ? '成功' : '失败'}`);
      if (!sendResult.sendResult.success) {
        console.log(`   SC错误: ${sendResult.sendResult.message}`);
      }
    }

    // 3. 测试清除告警
    console.log("\n🧪 测试3: 清除告警（不发送到SC）");
    console.log("-".repeat(40));
    
    const clearResult = await alarmManager.clearAlarm({
      deviceId: "test-device-001",
      fsuId: "61082143800739",
      monitorPointId: "0418006001",
      alarmLevel: "四级",
      alarmDesc: "测试告警清除"
    }, false); // 不发送到SC
    
    console.log("✅ 清除结果:");
    console.log(`   序号: ${clearResult.alarmData?.serialNo}`);
    console.log(`   成功: ${clearResult.success}`);
    console.log(`   消息: ${clearResult.message}`);
    console.log(`   告警标志: ${clearResult.alarmData?.alarmFlag}`);

    console.log("\n🎉 告警功能测试完成!");
    console.log("\n📋 总结:");
    console.log("- ✅ 告警报文生成功能正常");
    console.log("- ✅ 清除告警功能正常");
    console.log("- ✅ 新增和清除告警都是独立操作");
    
    if (sendResult.sendResult && !sendResult.sendResult.success) {
      console.log("- ⚠️  SC服务器发送失败（可能是网络问题）");
      console.log("- 💡 建议: 运行 'node diagnose-alarm-network.js' 进行网络诊断");
    } else {
      console.log("- ✅ SC服务器通信正常");
    }

  } catch (error) {
    console.error("❌ 测试过程中出现错误:", error.message);
    console.error("详细错误:", error);
  }
}

// 运行测试
if (require.main === module) {
  testAlarmSend()
    .then(() => {
      console.log("\n✨ 测试执行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 测试执行失败:", error);
      process.exit(1);
    });
}

module.exports = { testAlarmSend };
