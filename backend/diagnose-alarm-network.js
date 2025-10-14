/**
 * 告警发送网络诊断工具
 * 用于诊断告警发送失败的网络问题
 */

const smartAxios = require('./utils/smartAxios');
const proxyDetector = require('./utils/proxyDetector');
const logger = require('./utils/logger');

async function diagnoseAlarmNetwork(targetIp = "10.133.3.18") {
  console.log(`🔍 开始诊断告警发送网络问题...`);
  console.log(`📡 目标服务器: ${targetIp}:8080`);
  console.log("=".repeat(60));

  const results = {
    timestamp: new Date().toISOString(),
    targetIp,
    tests: [],
    recommendations: []
  };

  // 1. 检查代理状态
  console.log("\n🔧 步骤1: 检查代理状态");
  console.log("-".repeat(30));
  
  try {
    const proxyStatus = await proxyDetector.getProxyStatus();
    console.log("📊 代理状态:", {
      isAvailable: proxyStatus.isAvailable,
      host: proxyStatus.host,
      port: proxyStatus.port
    });
    results.proxyStatus = proxyStatus;
  } catch (error) {
    console.log("❌ 代理检测失败:", error.message);
    results.proxyError = error.message;
  }

  // 2. 测试基本连接
  const testUrls = [
    `http://${targetIp}:8080`,
    `http://${targetIp}:8080/services/SCService`,
    `http://${targetIp}:8080/api/register`,
    `https://${targetIp}:8080/services/SCService`
  ];

  for (const url of testUrls) {
    console.log(`\n🌐 测试连接: ${url}`);
    console.log("-".repeat(30));
    
    const testResult = {
      url,
      tests: []
    };

    // 测试不同超时时间
    const timeouts = [5000, 10000, 15000, 30000];
    
    for (const timeout of timeouts) {
      try {
        console.log(`   ⏱️  超时 ${timeout}ms...`, );
        const start = Date.now();
        
        const response = await smartAxios.get(url, {
          timeout,
          validateStatus: (status) => status < 600 // 接受所有响应
        });
        
        const duration = Date.now() - start;
        const result = {
          timeout,
          success: true,
          duration,
          status: response.status,
          error: null
        };
        
        testResult.tests.push(result);
        console.log(`   ✅ 成功! 状态: ${response.status}, 耗时: ${duration}ms`);
        break; // 成功后不需要测试更长超时
        
      } catch (error) {
        const result = {
          timeout,
          success: false,
          duration: null,
          status: null,
          error: error.message
        };
        
        testResult.tests.push(result);
        
        if (error.code === 'ECONNREFUSED') {
          console.log(`   ❌ 连接被拒绝 (服务器可能未启动)`);
        } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
          console.log(`   ⏰ 超时 ${timeout}ms`);
        } else if (error.code === 'ENOTFOUND') {
          console.log(`   🔍 域名解析失败`);
        } else {
          console.log(`   ❌ 失败: ${error.message}`);
        }
      }
    }
    
    results.tests.push(testResult);
  }

  // 3. 测试PING连通性
  console.log(`\n🏓 步骤3: 测试PING连通性`);
  console.log("-".repeat(30));
  
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    const pingCommand = process.platform === 'win32' 
      ? `ping -n 4 ${targetIp}` 
      : `ping -c 4 ${targetIp}`;
    
    console.log(`执行命令: ${pingCommand}`);
    const { stdout } = await execPromise(pingCommand);
    console.log("✅ PING成功:");
    console.log(stdout.split('\n').slice(0, 6).join('\n'));
    results.pingSuccess = true;
    
  } catch (error) {
    console.log("❌ PING失败:", error.message);
    results.pingSuccess = false;
    results.pingError = error.message;
  }

  // 4. 生成建议
  console.log(`\n💡 步骤4: 问题诊断和建议`);
  console.log("-".repeat(30));
  
  // 分析结果并给出建议
  const hasAnySuccess = results.tests.some(test => 
    test.tests.some(t => t.success)
  );
  
  if (!hasAnySuccess) {
    if (!results.pingSuccess) {
      console.log("🔴 问题: 目标服务器网络不可达");
      console.log("💡 建议:");
      console.log("   1. 检查服务器IP地址是否正确");
      console.log("   2. 检查网络连接和路由");
      console.log("   3. 检查是否需要VPN连接");
      console.log("   4. 联系网络管理员检查防火墙设置");
      results.recommendations.push("网络不可达 - 检查IP和网络连接");
    } else {
      console.log("🟡 问题: 网络可达但服务不可用");
      console.log("💡 建议:");
      console.log("   1. 检查目标服务器上的服务是否启动");
      console.log("   2. 检查端口8080是否开放");
      console.log("   3. 检查防火墙是否阻挡了8080端口");
      console.log("   4. 尝试其他端口或协议");
      results.recommendations.push("服务不可用 - 检查服务状态和端口");
    }
  } else {
    console.log("🟢 网络连接正常");
    
    // 检查哪个超时时间最合适
    const successfulTests = results.tests.flatMap(test => 
      test.tests.filter(t => t.success)
    );
    
    if (successfulTests.length > 0) {
      const avgDuration = successfulTests.reduce((sum, test) => sum + test.duration, 0) / successfulTests.length;
      const recommendedTimeout = Math.max(15000, Math.ceil(avgDuration * 3));
      
      console.log(`📊 平均响应时间: ${Math.round(avgDuration)}ms`);
      console.log(`⏰ 建议超时时间: ${recommendedTimeout}ms`);
      results.recommendations.push(`设置超时时间为 ${recommendedTimeout}ms`);
    }
  }

  // 5. 保存诊断结果
  const fs = require('fs');
  const reportFile = `alarm-network-diagnosis-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 诊断报告已保存: ${reportFile}`);

  console.log("\n✨ 诊断完成!");
  return results;
}

// 如果直接运行脚本
if (require.main === module) {
  const targetIp = process.argv[2] || "10.133.3.18";
  
  diagnoseAlarmNetwork(targetIp)
    .then((results) => {
      console.log("\n📋 诊断摘要:");
      console.log(`- 目标IP: ${results.targetIp}`);
      console.log(`- 测试数量: ${results.tests.length}`);
      console.log(`- 建议数量: ${results.recommendations.length}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 诊断过程出错:", error);
      process.exit(1);
    });
}

module.exports = { diagnoseAlarmNetwork };
