/**
 * 测试固定值配置
 * 验证 0406146001 和 0406147001 始终返回固定值 46
 */

const DeviceDataManager = require('./utils/deviceDataManager');

async function testFixedValues() {
  console.log("🧪 测试固定值配置...\n");

  const deviceManager = new DeviceDataManager();
  
  // 测试多次获取，确保值不变
  const testIds = ["0406146001", "0406147001"];
  
  for (const testId of testIds) {
    console.log(`📊 测试监控点: ${testId}`);
    console.log("-".repeat(40));
    
    const values = [];
    
    // 获取10次值，检查是否都是46
    for (let i = 0; i < 10; i++) {
      try {
        // 模拟获取设备数据
        const deviceData = await deviceManager.getDeviceData("61082141830776", "61082143800739");
        
        // 查找对应的信号
        const signal = deviceData.signals.find(s => s.id === testId);
        
        if (signal) {
          let value;
          if (typeof signal.getMeasuredVal === 'function') {
            value = signal.getMeasuredVal();
          } else {
            value = signal.measuredVal;
          }
          values.push(parseFloat(value));
          console.log(`  第${i+1}次: ${value}`);
        } else {
          console.log(`  第${i+1}次: 未找到信号 ${testId}`);
        }
        
        // 短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`  第${i+1}次: 错误 - ${error.message}`);
      }
    }
    
    // 分析结果
    if (values.length > 0) {
      const uniqueValues = [...new Set(values)];
      const allSame = uniqueValues.length === 1;
      const expectedValue = 46;
      const isCorrect = allSame && uniqueValues[0] === expectedValue;
      
      console.log(`\n📈 结果分析:`);
      console.log(`  获取次数: ${values.length}`);
      console.log(`  唯一值: ${uniqueValues.join(', ')}`);
      console.log(`  是否固定: ${allSame ? '✅ 是' : '❌ 否'}`);
      console.log(`  是否为46: ${isCorrect ? '✅ 是' : '❌ 否'}`);
      
      if (isCorrect) {
        console.log(`  🎉 ${testId} 配置正确！固定返回值 46`);
      } else {
        console.log(`  ⚠️  ${testId} 配置有问题！期望固定值 46`);
      }
    } else {
      console.log(`  ❌ 未能获取到 ${testId} 的任何值`);
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
  }
  
  console.log("✨ 固定值测试完成！");
}

// 运行测试
if (require.main === module) {
  testFixedValues()
    .then(() => {
      console.log("\n🎯 测试总结:");
      console.log("- 0406146001 应该固定返回 46");
      console.log("- 0406147001 应该固定返回 46");
      console.log("- 这些值不应该有任何变化！");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 测试失败:", error);
      process.exit(1);
    });
}

module.exports = { testFixedValues };
