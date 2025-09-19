#!/usr/bin/env node

/**
 * SC心跳监控工具
 * 分析为什么SC停止发送心跳指令
 */

require("dotenv").config({ path: "./config.env" });
const axios = require("axios");
const { getMyInternalIP } = require("./simplified-heartbeat");

console.log("🔍 SC心跳监控分析工具");
console.log("=".repeat(60));

/**
 * 分析SC心跳发送模式
 */
function analyzeHeartbeatPattern() {
  console.log("\n📊 SC心跳发送模式分析");
  console.log("-".repeat(40));

  console.log("根据铁塔B接口规范，SC心跳发送的可能情况：");
  console.log();
  console.log("✅ 正常情况：");
  console.log("   - SC每1-5分钟发送一次GET_FSUINFO心跳");
  console.log("   - FSU回复GET_FSUINFO_ACK with Result=1");
  console.log("   - SC收到成功响应后继续定期发送");
  console.log();
  console.log("❌ 异常情况（SC可能停止发送心跳）：");
  console.log("   1. FSU响应格式不正确");
  console.log("   2. FSU响应Result=0（失败）");
  console.log("   3. FSU响应超时或无响应");
  console.log("   4. SC认为FSU离线");
  console.log("   5. 网络连接问题");
}

/**
 * 检查上次心跳响应的问题
 */
async function analyzeLastHeartbeatResponse() {
  console.log("\n🔍 分析上次心跳响应");
  console.log("-".repeat(40));

  const myIP = getMyInternalIP();
  const testUrl = `http://${myIP}:8080/invoke`;

  console.log(`模拟SC发送心跳到: ${testUrl}`);

  // 构造标准的SC心跳请求
  const heartbeatXml = `<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <PK_Type>
    <Name>GET_FSUINFO</Name>
    <Code>1701</Code>
  </PK_Type>
  <Info>
    <FsuId>6108214380203</FsuId>
    <FsuCode>6108214380203</FsuCode>
  </Info>
</Request>`;

  // SC实际发送的SOAP格式
  const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    <ns1:invoke xmlns:ns1="http://webservice/">
      <arg0>${heartbeatXml
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")}</arg0>
    </ns1:invoke>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    console.log("📤 发送模拟心跳请求...");

    const response = await axios.post(testUrl, soapRequest, {
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: '"invoke"',
        "User-Agent": "SC-System/1.0",
      },
      timeout: 5000,
    });

    console.log("✅ 收到FSU响应:");
    console.log(`   状态码: ${response.status}`);
    console.log(`   内容类型: ${response.headers["content-type"]}`);

    // 解析响应内容
    const responseData = response.data;
    console.log("\n📄 完整SOAP响应:");
    console.log(responseData);

    // 提取实际的XML响应
    const invokeReturnMatch = responseData.match(
      /<invokeReturn[^>]*>(.*?)<\/invokeReturn>/s
    );
    if (invokeReturnMatch) {
      let xmlResponse = invokeReturnMatch[1];
      // 解码HTML实体
      xmlResponse = xmlResponse
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&");

      console.log("\n📋 解析后的FSU响应报文:");
      console.log(xmlResponse);

      // 分析响应内容
      if (xmlResponse.includes("GET_FSUINFO_ACK")) {
        const resultMatch = xmlResponse.match(/<Result>(\d+)<\/Result>/);
        const result = resultMatch ? parseInt(resultMatch[1]) : null;

        if (result === 1) {
          console.log("\n✅ FSU响应正常 - Result=1 (成功)");
          console.log("   SC应该会继续发送心跳");
        } else if (result === 0) {
          console.log("\n❌ FSU响应失败 - Result=0");
          console.log("   这可能是SC停止发送心跳的原因！");
        } else {
          console.log(`\n⚠️  FSU响应异常 - Result=${result}`);
        }
      } else if (xmlResponse.includes("ERROR")) {
        console.log("\n❌ FSU返回错误响应");
        console.log("   这就是SC停止发送心跳的原因！");
      } else {
        console.log("\n❓ 未知的响应格式");
      }
    }

    return true;
  } catch (error) {
    console.log(`❌ 心跳测试失败: ${error.message}`);

    if (error.code === "ECONNREFUSED") {
      console.log("   原因: FSU WebService服务未运行");
      console.log("   解决: 启动 node simplified-heartbeat.js");
    } else if (error.code === "ETIMEDOUT") {
      console.log("   原因: FSU响应超时");
      console.log("   这可能导致SC认为FSU离线");
    }

    return false;
  }
}

/**
 * 检查SC服务器状态
 */
async function checkScServerStatus() {
  console.log("\n🌐 检查SC服务器状态");
  console.log("-".repeat(40));

  const scConfig = require("./config/sc");
  const scUrl = `${scConfig.protocol}://${scConfig.host}:${scConfig.port}/services/SCService`;

  try {
    // 发送一个简单的请求检查SC服务器
    const response = await axios.get(scUrl, {
      timeout: 5000,
      validateStatus: () => true,
    });

    console.log(`✅ SC服务器响应状态: ${response.status}`);

    if (response.status === 200) {
      console.log("   SC服务器运行正常");
    } else {
      console.log("   SC服务器可能有问题");
    }

    return true;
  } catch (error) {
    console.log(`❌ SC服务器连接失败: ${error.message}`);
    console.log("   如果SC服务器离线，就不会发送心跳");
    return false;
  }
}

/**
 * 分析可能的原因
 */
function analyzePossibleReasons() {
  console.log("\n💡 SC停止发送心跳的可能原因");
  console.log("=".repeat(60));

  console.log("🔍 根据观察到的现象分析：");
  console.log();
  console.log("1. ❌ FSU响应格式问题");
  console.log("   - SC发送了一次心跳，但FSU返回了ERROR响应");
  console.log("   - SC收到错误响应后可能标记FSU为离线状态");
  console.log("   - 解决：修复SOAP解析器（已修复）");
  console.log();
  console.log("2. ⏱️ SC心跳间隔较长");
  console.log("   - SC可能每5-10分钟才发送一次心跳");
  console.log("   - 需要耐心等待更长时间");
  console.log("   - 解决：等待更长时间观察");
  console.log();
  console.log("3. 🔄 SC需要重新LOGIN");
  console.log("   - SC收到错误响应后可能要求FSU重新登录");
  console.log("   - FSU需要重新执行LOGIN流程");
  console.log("   - 解决：重新启动simplified-heartbeat.js");
  console.log();
  console.log("4. 🛡️ 网络策略限制");
  console.log("   - VPN网络可能有连接限制");
  console.log("   - 防火墙可能阻止了持续连接");
  console.log("   - 解决：检查网络策略和防火墙设置");
  console.log();
  console.log("5. 📋 SC业务逻辑");
  console.log("   - SC可能有特定的心跳发送逻辑");
  console.log("   - 可能需要满足某些条件才持续发送");
  console.log("   - 解决：查看SC系统文档或联系技术支持");
}

/**
 * 提供解决建议
 */
function provideSolutions() {
  console.log("\n🎯 建议的解决步骤");
  console.log("=".repeat(60));

  const myIP = getMyInternalIP();

  console.log("📋 立即执行的步骤：");
  console.log();
  console.log("1. 🔄 重新启动心跳系统");
  console.log("   cd backend");
  console.log("   node simplified-heartbeat.js");
  console.log();
  console.log("2. 🧪 持续监控心跳");
  console.log("   # 在另一个终端每分钟测试一次");
  console.log(
    `   node test-sc-heartbeat.js http://${myIP}:8080/invoke 6108214380203`
  );
  console.log();
  console.log("3. ⏰ 耐心等待");
  console.log("   - 等待10-15分钟观察SC是否重新发送心跳");
  console.log("   - SC可能需要时间重新识别FSU在线状态");
  console.log();
  console.log("📊 长期监控策略：");
  console.log();
  console.log("1. 启用详细日志记录");
  console.log("2. 记录每次心跳的时间和响应");
  console.log("3. 分析SC的心跳发送模式");
  console.log("4. 如果24小时内仍无心跳，联系SC系统管理员");
}

/**
 * 主监控流程
 */
async function runMonitoring() {
  try {
    // 分析心跳模式
    analyzeHeartbeatPattern();

    // 检查上次心跳响应
    console.log("\n" + "=".repeat(60));
    await analyzeLastHeartbeatResponse();

    // 检查SC服务器状态
    console.log("\n" + "=".repeat(60));
    await checkScServerStatus();

    // 分析可能原因
    console.log("\n" + "=".repeat(60));
    analyzePossibleReasons();

    // 提供解决方案
    console.log("\n" + "=".repeat(60));
    provideSolutions();
  } catch (error) {
    console.error("❌ 监控过程中发生错误:", error.message);
  }
}

// 运行监控
if (require.main === module) {
  runMonitoring().catch((error) => {
    console.error("监控失败:", error.message);
    process.exit(1);
  });
}

module.exports = { runMonitoring };
