#!/usr/bin/env node

/**
 * 多FSU设备自动识别测试脚本
 * 演示系统如何自动识别和处理多个FSU设备及其子设备的请求
 */

const deviceDataManager = require("./utils/deviceDataManager");
const logger = require("./utils/logger");

console.log("=".repeat(80));
console.log("🔧 多FSU设备自动识别测试");
console.log("=".repeat(80));

// 模拟多个FSU设备及其子设备数据
const testFsuDevices = [
  {
    fsuId: "61080243800281",
    siteName: "测试站点1",
    devices: [
      "61080243800281", // FSU自身
      "61080241840279", // 水浸传感器
      "61080241830309", // 温湿度传感器
      "61080240600278", // 开关电源
    ],
  },
  {
    fsuId: "61089443800204",
    siteName: "测试站点2",
    devices: [
      "61089443800204", // FSU自身
      "61089440700375", // 蓄电池
      "61089441820181", // 烟雾传感器
      "61089441810120", // 红外传感器
      "61089449900035", // 非智能门禁
      "61089444700207", // 梯次电池
    ],
  },
  {
    fsuId: "61080243801859",
    siteName: "测试站点3",
    devices: [
      "61080243801859", // FSU自身
      "61080241501046", // 空调设备
    ],
  },
];

async function testMultiFsuDeviceRecognition() {
  try {
    console.log("\n📋 第一步：注册多个FSU设备及其子设备");
    console.log("-".repeat(60));

    // 注册所有测试FSU设备
    for (const fsuDevice of testFsuDevices) {
      const success = deviceDataManager.registerFsuDevices(
        fsuDevice.fsuId,
        fsuDevice.devices,
        {
          siteName: fsuDevice.siteName,
          softwareVendor: "ZXLW",
          hardwareVendor: "ZXLW",
          fsuType: "ZNV EISUA X7",
        }
      );

      if (success) {
        console.log(
          `✅ FSU设备注册成功: ${fsuDevice.fsuId} (${fsuDevice.siteName})`
        );
        console.log(`   子设备数量: ${fsuDevice.devices.length}`);
        console.log(`   子设备列表: ${fsuDevice.devices.join(", ")}`);
      } else {
        console.log(`❌ FSU设备注册失败: ${fsuDevice.fsuId}`);
      }
    }

    console.log("\n📊 第二步：查看注册的设备映射状态");
    console.log("-".repeat(60));

    const registeredDevices = deviceDataManager.getAllRegisteredFsuDevices();
    console.log(`已注册FSU设备数量: ${registeredDevices.length}`);

    registeredDevices.forEach((fsu, index) => {
      console.log(`\n${index + 1}. FSU ID: ${fsu.fsuId}`);
      console.log(`   子设备数量: ${fsu.deviceCount}`);
      console.log(`   注册时间: ${fsu.registeredAt}`);
      console.log(`   子设备列表: ${fsu.devices.join(", ")}`);
    });

    console.log("\n🧪 第三步：模拟SC服务器请求，测试自动识别和响应");
    console.log("-".repeat(60));

    // 模拟各种设备请求
    const testRequests = [
      {
        fsuId: "61080243800281",
        deviceId: "61080241840279",
        description: "水浸传感器请求",
      },
      {
        fsuId: "61080243800281",
        deviceId: "61080241830309",
        description: "温湿度传感器请求",
      },
      {
        fsuId: "61080243800281",
        deviceId: "61080240600278",
        description: "开关电源请求",
      },
      {
        fsuId: "61089443800204",
        deviceId: "61089440700375",
        description: "蓄电池请求",
      },
      {
        fsuId: "61089443800204",
        deviceId: "61089441820181",
        description: "烟雾传感器请求",
      },
      {
        fsuId: "61080243801859",
        deviceId: "61080241501046",
        description: "空调设备请求",
      },
      {
        fsuId: "61080243800281",
        deviceId: "61080299999999",
        description: "未知设备请求（测试自动识别）",
      },
    ];

    for (let i = 0; i < testRequests.length; i++) {
      const request = testRequests[i];
      console.log(`\n${i + 1}. 测试请求: ${request.description}`);
      console.log(`   FSU ID: ${request.fsuId}`);
      console.log(`   设备ID: ${request.deviceId}`);

      const response = deviceDataManager.getDeviceResponse(
        request.fsuId,
        request.deviceId
      );

      if (response) {
        console.log(`   ✅ 响应生成成功`);

        // 解析响应XML获取基本信息
        const resultMatch = response.match(/<Result>(\d+)<\/Result>/);
        const deviceMatch = response.match(
          /<Device Id="([^"]*)" Code="([^"]*)">/
        );
        const signalMatches = response.match(/<TSemaphore[^>]*>/g);

        console.log(
          `   响应状态: ${
            resultMatch ? (resultMatch[1] === "1" ? "成功" : "失败") : "未知"
          }`
        );
        console.log(`   响应设备: ${deviceMatch ? deviceMatch[1] : "未知"}`);
        console.log(`   信号数量: ${signalMatches ? signalMatches.length : 0}`);

        // 显示部分响应内容（截取前200字符）
        const shortResponse =
          response.length > 200 ? response.substring(0, 200) + "..." : response;
        console.log(`   响应内容: ${shortResponse}`);
      } else {
        console.log(`   ❌ 响应生成失败 - 无法识别设备或FSU不匹配`);
      }

      // 添加短暂延迟，模拟真实请求间隔
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("\n🎯 第四步：测试设备类型自动识别");
    console.log("-".repeat(60));

    // 测试不同设备ID的自动识别
    const deviceIdTests = [
      {
        deviceId: "61080240600123",
        expectedType: "power_supply",
        description: "开关电源设备",
      },
      {
        deviceId: "61080241840456",
        expectedType: "water_sensor",
        description: "水浸传感器",
      },
      {
        deviceId: "61080241830789",
        expectedType: "temperature_humidity",
        description: "温湿度传感器",
      },
      {
        deviceId: "61080240700321",
        expectedType: "lead_acid_battery",
        description: "蓄电池设备",
      },
      {
        deviceId: "61080241820654",
        expectedType: "smoke_detector",
        description: "烟雾传感器",
      },
      {
        deviceId: "61080241810987",
        expectedType: "infrared_sensor",
        description: "红外传感器",
      },
      {
        deviceId: "61080249900111",
        expectedType: "non_smart_access",
        description: "非智能门禁",
      },
      {
        deviceId: "61080244700222",
        expectedType: "cascade_battery",
        description: "梯次电池",
      },
      {
        deviceId: "61080241501333",
        expectedType: "air_conditioner",
        description: "空调设备",
      },
      {
        deviceId: "61080299999999",
        expectedType: "generic_device",
        description: "未知设备类型",
      },
    ];

    for (const test of deviceIdTests) {
      const identifiedType = deviceDataManager.identifyDeviceType(
        test.deviceId,
        "61080243800281"
      );
      const isCorrect = identifiedType === test.expectedType;

      console.log(`${isCorrect ? "✅" : "❌"} 设备ID: ${test.deviceId}`);
      console.log(`   描述: ${test.description}`);
      console.log(`   期望类型: ${test.expectedType}`);
      console.log(`   识别类型: ${identifiedType}`);
      console.log(`   识别结果: ${isCorrect ? "正确" : "错误"}`);
      console.log("");
    }

    console.log("\n🧹 第五步：清理测试数据");
    console.log("-".repeat(60));

    // 移除测试FSU设备
    for (const fsuDevice of testFsuDevices) {
      const removed = deviceDataManager.unregisterFsuDevices(fsuDevice.fsuId);
      console.log(
        `${removed ? "✅" : "❌"} 移除FSU设备: ${fsuDevice.fsuId} (${
          fsuDevice.siteName
        })`
      );
    }

    const finalDeviceCount =
      deviceDataManager.getAllRegisteredFsuDevices().length;
    console.log(`\n最终注册设备数量: ${finalDeviceCount}`);

    console.log("\n" + "=".repeat(80));
    console.log("🎉 多FSU设备自动识别测试完成！");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("测试过程中发生错误:", error);
    logger.error("多FSU设备测试失败", { error: error.message });
  }
}

// 运行测试
if (require.main === module) {
  testMultiFsuDeviceRecognition()
    .then(() => {
      console.log("\n✅ 测试脚本执行完成");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ 测试脚本执行失败:", error);
      process.exit(1);
    });
}

module.exports = { testMultiFsuDeviceRecognition };
