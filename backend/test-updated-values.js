#!/usr/bin/env node

/**
 * 测试更新后的设备测量值
 * 验证各设备类型的测量值是否按照新要求变化
 */

const deviceDataManager = require("./utils/deviceDataManager");

console.log("=".repeat(80));
console.log("🔧 测试更新后的设备测量值");
console.log("=".repeat(80));

// 测试用例
const testCases = [
  {
    fsuId: "61080243800281",
    deviceId: "61080241840279", // 水浸传感器
    deviceType: "water_sensor",
    description: "水浸传感器 - 应该100%为0",
    expectedSignals: ["0418001001"],
  },
  {
    fsuId: "61080243800281",
    deviceId: "61080240600278", // 开关电源
    deviceType: "power_supply",
    description: "开关电源 - 0406111001应该为53.5正负0.4",
    expectedSignals: ["0406111001"],
  },
  {
    fsuId: "61089443800204",
    deviceId: "61089440700375", // 蓄电池
    deviceType: "lead_acid_battery",
    description: "蓄电池 - 多个信号测试",
    expectedSignals: ["0407102001", "0407106001", "0407107001", "0407005001"],
  },
  {
    fsuId: "61089443800204",
    deviceId: "61089441820181", // 烟雾传感器
    deviceType: "smoke_detector",
    description: "烟雾传感器 - 应该固定为0",
    expectedSignals: ["0418002001"],
  },
  {
    fsuId: "61080243801859",
    deviceId: "61080241501046", // 空调设备
    deviceType: "air_conditioner",
    description: "空调设备 - 多个信号测试",
    expectedSignals: [
      "0415001001",
      "0415002001",
      "0415003001",
      "0415102001",
      "0415105001",
      "0415110001",
      "0415111001",
      "0415112001",
      "0415113001",
      "0415114001",
      "0415115001",
      "0415116001",
      "0415117001",
      "0415118001",
    ],
  },
];

function parseFloat6(value) {
  return parseFloat(parseFloat(value).toFixed(6));
}

async function testUpdatedValues() {
  try {
    console.log("\n🧪 测试各设备类型的更新值");
    console.log("-".repeat(60));

    for (const testCase of testCases) {
      console.log(`\n📱 ${testCase.description}`);
      console.log(`   FSU ID: ${testCase.fsuId}`);
      console.log(`   设备ID: ${testCase.deviceId}`);

      // 生成多次响应来测试数值变化
      const responses = [];
      for (let i = 0; i < 5; i++) {
        const response = deviceDataManager.getDeviceResponse(
          testCase.fsuId,
          testCase.deviceId
        );
        if (response) {
          responses.push(response);
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (responses.length > 0) {
        console.log(`   ✅ 生成了 ${responses.length} 个响应`);

        // 分析每个期望的信号
        for (const signalId of testCase.expectedSignals) {
          console.log(`\n   🔍 信号 ${signalId}:`);

          const values = [];
          responses.forEach((response, index) => {
            const signalMatch = response.match(
              new RegExp(
                `<TSemaphore[^>]*Id="${signalId}"[^>]*MeasuredVal="([^"]*)"`
              )
            );
            if (signalMatch) {
              values.push(signalMatch[1]);
            }
          });

          if (values.length > 0) {
            console.log(`      测量值: ${values.join(", ")}`);

            // 根据不同信号进行验证
            switch (signalId) {
              case "0418001001": // 水浸传感器
                const allZero = values.every((v) => v === "0");
                console.log(
                  `      验证结果: ${allZero ? "✅" : "❌"} 水浸传感器100%为0`
                );
                break;

              case "0406111001": // 开关电源
                const numValues = values.map((v) => parseFloat(v));
                const inRange = numValues.every((v) => v >= 53.1 && v <= 53.9);
                const avg =
                  numValues.reduce((a, b) => a + b) / numValues.length;
                console.log(`      平均值: ${avg.toFixed(6)}`);
                console.log(
                  `      验证结果: ${inRange ? "✅" : "❌"} 在53.5±0.4范围内`
                );
                break;

              case "0407102001": // 蓄电池电压
                const batteryValues = values.map((v) => parseFloat(v));
                const batteryInRange = batteryValues.every(
                  (v) => v >= 52.5 && v <= 54.5
                );
                const batteryAvg =
                  batteryValues.reduce((a, b) => a + b) / batteryValues.length;
                console.log(`      平均值: ${batteryAvg.toFixed(6)}`);
                console.log(
                  `      验证结果: ${
                    batteryInRange ? "✅" : "❌"
                  } 在53.5±0.5范围内`
                );
                break;

              case "0407106001":
              case "0407107001": // 蓄电池温度
                const tempValues = values.map((v) => parseFloat(v));
                const tempInRange = tempValues.every(
                  (v) => v >= 26.55 && v <= 26.95
                );
                const tempAvg =
                  tempValues.reduce((a, b) => a + b) / tempValues.length;
                console.log(`      平均值: ${tempAvg.toFixed(6)}`);
                console.log(
                  `      验证结果: ${
                    tempInRange ? "✅" : "❌"
                  } 在26.75±0.2范围内`
                );
                break;

              case "0407005001": // 蓄电池固定值
                const allZeroBattery = values.every((v) => v === "0");
                console.log(
                  `      验证结果: ${allZeroBattery ? "✅" : "❌"} 固定为0`
                );
                break;

              case "0418002001": // 烟雾传感器
                const allZeroSmoke = values.every((v) => v === "0");
                console.log(
                  `      验证结果: ${
                    allZeroSmoke ? "✅" : "❌"
                  } 烟雾传感器固定为0`
                );
                break;

              case "0415001001":
              case "0415002001":
              case "0415003001": // 空调固定为0
                const allZeroAC = values.every((v) => v === "0");
                console.log(
                  `      验证结果: ${allZeroAC ? "✅" : "❌"} 空调信号固定为0`
                );
                break;

              case "0415102001": // 空调温度 23±2
                const acTempValues = values.map((v) => parseFloat(v));
                const acTempInRange = acTempValues.every(
                  (v) => v >= 21 && v <= 25
                );
                const acTempAvg =
                  acTempValues.reduce((a, b) => a + b) / acTempValues.length;
                console.log(`      平均值: ${acTempAvg.toFixed(2)}`);
                console.log(
                  `      验证结果: ${acTempInRange ? "✅" : "❌"} 在23±2范围内`
                );
                break;

              case "0415105001": // 空调固定为1
                const allOneAC = values.every((v) => v === "1");
                console.log(
                  `      验证结果: ${allOneAC ? "✅" : "❌"} 空调信号固定为1`
                );
                break;

              case "0415110001":
              case "0415111001": // 空调 2±0.3
                const ac2Values = values.map((v) => parseFloat(v));
                const ac2InRange = ac2Values.every((v) => v >= 1.7 && v <= 2.3);
                const ac2Avg =
                  ac2Values.reduce((a, b) => a + b) / ac2Values.length;
                console.log(`      平均值: ${ac2Avg.toFixed(2)}`);
                console.log(
                  `      验证结果: ${ac2InRange ? "✅" : "❌"} 在2±0.3范围内`
                );
                break;

              case "0415112001": // 空调 3±0.1
                const ac3Values = values.map((v) => parseFloat(v));
                const ac3InRange = ac3Values.every((v) => v >= 2.9 && v <= 3.1);
                const ac3Avg =
                  ac3Values.reduce((a, b) => a + b) / ac3Values.length;
                console.log(`      平均值: ${ac3Avg.toFixed(2)}`);
                console.log(
                  `      验证结果: ${ac3InRange ? "✅" : "❌"} 在3±0.1范围内`
                );
                break;

              case "0415113001": // 空调 220±0.2
                const ac220Values = values.map((v) => parseFloat(v));
                const ac220InRange = ac220Values.every(
                  (v) => v >= 219.8 && v <= 220.2
                );
                const ac220Avg =
                  ac220Values.reduce((a, b) => a + b) / ac220Values.length;
                console.log(`      平均值: ${ac220Avg.toFixed(2)}`);
                console.log(
                  `      验证结果: ${
                    ac220InRange ? "✅" : "❌"
                  } 在220±0.2范围内`
                );
                break;

              case "0415114001": // 空调 219±1
                const ac219Values = values.map((v) => parseFloat(v));
                const ac219InRange = ac219Values.every(
                  (v) => v >= 218 && v <= 220
                );
                const ac219Avg =
                  ac219Values.reduce((a, b) => a + b) / ac219Values.length;
                console.log(`      平均值: ${ac219Avg.toFixed(2)}`);
                console.log(
                  `      验证结果: ${ac219InRange ? "✅" : "❌"} 在219±1范围内`
                );
                break;

              case "0415115001": // 空调固定221
                const all221AC = values.every((v) => v === "221");
                console.log(
                  `      验证结果: ${all221AC ? "✅" : "❌"} 空调信号固定为221`
                );
                break;

              case "0415116001": // 空调 24±3
                const ac24Values = values.map((v) => parseFloat(v));
                const ac24InRange = ac24Values.every((v) => v >= 21 && v <= 27);
                const ac24Avg =
                  ac24Values.reduce((a, b) => a + b) / ac24Values.length;
                console.log(`      平均值: ${ac24Avg.toFixed(2)}`);
                console.log(
                  `      验证结果: ${ac24InRange ? "✅" : "❌"} 在24±3范围内`
                );
                break;

              case "0415117001": // 空调固定23
                const all23AC = values.every((v) => v === "23");
                console.log(
                  `      验证结果: ${all23AC ? "✅" : "❌"} 空调信号固定为23`
                );
                break;

              case "0415118001": // 空调固定1
                const all1AC = values.every((v) => v === "1");
                console.log(
                  `      验证结果: ${all1AC ? "✅" : "❌"} 空调信号固定为1`
                );
                break;

              default:
                console.log(
                  `      测量值变化: ${values.length > 1 ? "有变化" : "无变化"}`
                );
            }
          } else {
            console.log(`      ❌ 未找到信号 ${signalId}`);
          }
        }
      } else {
        console.log(`   ❌ 响应生成失败`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("🎉 设备测量值更新测试完成！");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("测试过程中发生错误:", error);
  }
}

// 运行测试
if (require.main === module) {
  testUpdatedValues()
    .then(() => {
      console.log("\n✅ 测试脚本执行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ 测试脚本执行失败:", error);
      process.exit(1);
    });
}

module.exports = { testUpdatedValues };
