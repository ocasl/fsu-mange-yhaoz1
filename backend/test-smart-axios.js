#!/usr/bin/env node

/**
 * 智能axios连接测试工具
 * 用于测试不同代理状态下的连接策略
 */

require("dotenv").config({ path: "./config.env" });

const smartAxios = require("./utils/smartAxios");
const proxyDetector = require("./utils/proxyDetector");
const scConfig = require("./config/sc");

async function main() {
  console.log("🔍 智能axios连接策略测试");
  console.log("=".repeat(50));

  // 1. 检测代理状态
  console.log("\n📡 步骤1: 检测代理状态");
  const proxyStatus = await proxyDetector.getProxyStatus();
  console.log(`代理地址: ${proxyStatus.proxyHost}:${proxyStatus.proxyPort}`);
  console.log(`代理状态: ${proxyStatus.isAvailable ? "✅ 可用" : "❌ 不可用"}`);
  console.log(`缓存时间: ${proxyStatus.cacheAge}ms 前`);

  // 2. 测试各种连接策略
  console.log("\n🌐 步骤2: 测试连接策略");

  const testUrls = [
    `${scConfig.protocol}://${scConfig.host}:${scConfig.port}`,
    "http://www.baidu.com",
    "https://www.google.com",
    "http://192.168.1.1", // 内网地址
    "http://10.3.15.236:8080", // VPN地址
  ];

  for (const url of testUrls) {
    console.log(`\n测试地址: ${url}`);
    console.log("-".repeat(30));

    try {
      const testResult = await smartAxios.testConnectionStrategy(url);

      console.log(
        `代理检测: ${testResult.proxyStatus.isAvailable ? "可用" : "不可用"}`
      );

      for (const test of testResult.tests) {
        const status = test.success ? "✅" : "❌";
        const duration = test.duration ? `${test.duration}ms` : "N/A";
        const error = test.error ? ` (${test.error})` : "";
        console.log(`  ${status} ${test.strategy}: ${duration}${error}`);
      }
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`);
    }
  }

  // 3. 测试SC服务器连接
  console.log("\n🎯 步骤3: 测试SC服务器连接");
  console.log("-".repeat(30));

  const scUrl = `${scConfig.protocol}://${scConfig.host}:${scConfig.port}`;

  try {
    console.log(`正在连接SC服务器: ${scUrl}`);
    const start = Date.now();

    const response = await smartAxios.get(scUrl, {
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });

    const duration = Date.now() - start;
    console.log(`✅ SC服务器连接成功!`);
    console.log(`   状态码: ${response.status}`);
    console.log(`   耗时: ${duration}ms`);
    console.log(
      `   响应大小: ${response.data ? response.data.length : 0} 字节`
    );
  } catch (error) {
    console.log(`❌ SC服务器连接失败: ${error.message}`);

    if (error.code === "ECONNREFUSED") {
      console.log(`💡 建议: 检查SC服务器是否启动，或者检查网络连接`);
    } else if (error.code === "ETIMEDOUT") {
      console.log(`💡 建议: 网络超时，可能需要使用代理或检查网络设置`);
    }
  }

  // 4. 显示推荐配置
  console.log("\n⚙️  步骤4: 推荐配置");
  console.log("-".repeat(30));

  const recommendedConfig = await proxyDetector.getRecommendedAxiosConfig(
    scUrl
  );
  console.log("SC服务器推荐配置:");
  console.log(JSON.stringify(recommendedConfig, null, 2));

  console.log("\n✨ 测试完成!");
  console.log("现在您的系统会根据代理状态自动选择最佳连接策略。");
}

// 运行测试
main().catch((error) => {
  console.error("测试过程中发生错误:", error);
  process.exit(1);
});
