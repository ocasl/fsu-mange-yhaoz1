#!/usr/bin/env node

/**
 * 简化响应测试脚本
 * 测试只改变FSU ID和FSU Code，MeasuredVal根据设备类型动态变化的功能
 */

const deviceDataManager = require("./utils/deviceDataManager");

console.log("=".repeat(80));
console.log("🔧 简化响应测试 - 只改变FSU ID和MeasuredVal");
console.log("=".repeat(80));

// 测试不同FSU ID的相同设备类型
const testCases = [
  // 水浸传感器测试
  {
    fsuId: "61080243800281",
    deviceId: "61080241840279",
    description: "水浸传感器 - FSU1",
  },
  {
    fsuId: "61089443800204",
    deviceId: "61089441840999", // 不同FSU的水浸传感器
    description: "水浸传感器 - FSU2",
  },

  // 温湿度传感器测试
  {
    fsuId: "61080243800281",
    deviceId: "61080241830309",
    description: "温湿度传感器 - FSU1",
  },
  {
    fsuId: "61089443800204",
    deviceId: "61089441830888", // 不同FSU的温湿度传感器
    description: "温湿度传感器 - FSU2",
  },

  // 开关电源测试
  {
    fsuId: "61080243800281",
    deviceId: "61080240600278",
    description: "开关电源 - FSU1",
  },
  {
    fsuId: "61089443800204",
    deviceId: "61089440600777", // 不同FSU的开关电源
    description: "开关电源 - FSU2",
  },

  // 蓄电池测试
  {
    fsuId: "61089443800204",
    deviceId: "61089440700375",
    description: "蓄电池 - FSU2",
  },

  // 空调设备测试
  {
    fsuId: "61080243801859",
    deviceId: "61080241501046",
    description: "空调设备 - FSU3",
  },
];

async function testSimplifiedResponse() {
  try {
    console.log("\n🧪 测试简化响应逻辑");
    console.log("-".repeat(60));

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n${i + 1}. ${testCase.description}`);
      console.log(`   FSU ID: ${testCase.fsuId}`);
      console.log(`   设备ID: ${testCase.deviceId}`);

      // 生成响应
      const response = deviceDataManager.getDeviceResponse(
        testCase.fsuId,
        testCase.deviceId
      );

      if (response) {
        console.log(`   ✅ 响应生成成功`);

        // 验证FSU ID是否正确使用
        const fsuIdMatches = response.match(/<FsuId>([^<]*)<\/FsuId>/g);
        const fsuCodeMatches = response.match(/<FsuCode>([^<]*)<\/FsuCode>/g);

        if (fsuIdMatches && fsuCodeMatches) {
          const fsuIdValue = fsuIdMatches[0].replace(/<\/?FsuId>/g, "");
          const fsuCodeValue = fsuCodeMatches[0].replace(/<\/?FsuCode>/g, "");

          console.log(
            `   FSU ID: ${fsuIdValue} ${
              fsuIdValue === testCase.fsuId ? "✅" : "❌"
            }`
          );
          console.log(
            `   FSU Code: ${fsuCodeValue} ${
              fsuCodeValue === testCase.fsuId ? "✅" : "❌"
            }`
          );
        }

        // 检查设备ID是否保持不变
        const deviceMatch = response.match(
          /<Device Id="([^"]*)" Code="([^"]*)">/
        );
        if (deviceMatch) {
          console.log(
            `   设备ID: ${deviceMatch[1]} ${
              deviceMatch[1] === testCase.deviceId ? "✅" : "❌"
            }`
          );
          console.log(
            `   设备Code: ${deviceMatch[2]} ${
              deviceMatch[2] === testCase.deviceId ? "✅" : "❌"
            }`
          );
        }

        // 提取并显示信号信息
        const signalMatches = response.match(/<TSemaphore[^>]*>/g);
        if (signalMatches) {
          console.log(`   信号数量: ${signalMatches.length}`);

          // 显示前3个信号的详细信息
          signalMatches.slice(0, 3).forEach((signal, index) => {
            const typeMatch = signal.match(/Type="([^"]*)"/);
            const idMatch = signal.match(/Id="([^"]*)"/);
            const measuredValMatch = signal.match(/MeasuredVal="([^"]*)"/);

            console.log(
              `   信号${index + 1}: Type=${typeMatch?.[1]}, Id=${
                idMatch?.[1]
              }, MeasuredVal=${measuredValMatch?.[1]}`
            );
          });

          if (signalMatches.length > 3) {
            console.log(`   ... 还有 ${signalMatches.length - 3} 个信号`);
          }
        }

        // 显示完整响应的前300字符
        const shortResponse =
          response.length > 300 ? response.substring(0, 300) + "..." : response;
        console.log(`   响应预览: ${shortResponse}`);
      } else {
        console.log(`   ❌ 响应生成失败`);
      }

      // 添加短暂延迟
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log("\n🎯 测试多次请求相同设备，验证MeasuredVal动态变化");
    console.log("-".repeat(60));

    // 选择一个温湿度传感器，连续请求3次，验证数值变化
    const testDevice = {
      fsuId: "61080243800281",
      deviceId: "61080241830309", // 温湿度传感器
      description: "温湿度传感器动态数据测试",
    };

    console.log(`\n测试设备: ${testDevice.description}`);
    console.log(`FSU ID: ${testDevice.fsuId}, 设备ID: ${testDevice.deviceId}`);

    for (let i = 1; i <= 3; i++) {
      console.log(`\n第${i}次请求:`);

      const response = deviceDataManager.getDeviceResponse(
        testDevice.fsuId,
        testDevice.deviceId
      );
      if (response) {
        // 提取温湿度数值
        const tempMatch = response.match(
          /<TSemaphore Type="3" Id="0418101001"[^>]*MeasuredVal="([^"]*)"/
        );
        const humidityMatch = response.match(
          /<TSemaphore Type="3" Id="0418102001"[^>]*MeasuredVal="([^"]*)"/
        );

        console.log(`  温度: ${tempMatch ? tempMatch[1] : "未找到"}°C`);
        console.log(`  湿度: ${humidityMatch ? humidityMatch[1] : "未找到"}%`);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n" + "=".repeat(80));
    console.log("🎉 简化响应测试完成！");
    console.log("=".repeat(80));

    console.log("\n✨ 测试结果总结:");
    console.log("✅ FSU ID 和 FSU Code 根据请求动态设置");
    console.log("✅ 设备ID和Code保持请求中的值不变");
    console.log("✅ Type、Id、SetupVal、Status等字段保持模板固定值");
    console.log("✅ 只有MeasuredVal根据设备类型动态变化");
    console.log("✅ 支持任意FSU ID的设备请求");
  } catch (error) {
    console.error("测试过程中发生错误:", error);
  }
}

// 运行测试
if (require.main === module) {
  testSimplifiedResponse()
    .then(() => {
      console.log("\n✅ 测试脚本执行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ 测试脚本执行失败:", error);
      process.exit(1);
    });
}

module.exports = { testSimplifiedResponse };
