/**
 * 显示完整的LOGIN注册请求报文
 * 用于检查报文格式和内容
 */

const { buildRegisterXml } = require("./utils/xmlBuilder");
const logger = require("./utils/logger");

console.log("📤 生成完整的LOGIN注册请求报文");
console.log("=".repeat(80));

// 使用您提供的标准XML请求中的参数
const testFsuData = {
  fsuId: "61082143802203",
  fsuCode: "61082143802203",
  internalIP: "10.4.15.173",
  macId: "869221025266666",
  imsiId: "460068161666666",
  networkType: "4G",
  lockedNetworkType: "LTE",
  carrier: "CU",
  nmVendor: "大唐",
  nmType: "DTM-W101T",
  fsuVendor: "ZXLW",
  fsuType: "ZNV EISUA X7",
  softwareVersion: "24.1.HQ.FSU.LW.4417.R",
  // 标准设备列表（按您提供的顺序）
  devices: [
    "61082140601589", // 交流电源1
    "61082141820991", // 烟感设备01
    "61082140702618", // 普通阀控密封铅酸蓄电池1
    "61082140702619", // 普通阀控密封铅酸蓄电池2
    "61082141841251", // 水浸01
    "61082143802203", // FSU自身
    "61082141831306", // 温湿感01
  ],
};

try {
  const loginXml = buildRegisterXml(testFsuData);

  console.log("\n📄 完整的LOGIN注册请求报文:");
  console.log("-".repeat(80));

  // 格式化显示XML，使其更易读
  const formattedXml = loginXml
    .replace(/></g, ">\n<") // 在标签之间添加换行
    .split("\n")
    .map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      // 计算缩进级别
      const openTags = (trimmed.match(/</g) || []).length;
      const closeTags = (trimmed.match(/\//g) || []).length;
      let indentLevel = 0;

      // 简单的缩进计算
      if (trimmed.startsWith("</")) {
        indentLevel = Math.max(0, index - closeTags);
      } else if (trimmed.includes("</")) {
        indentLevel = Math.max(0, index - openTags + 1);
      } else {
        indentLevel = Math.max(0, openTags - 1);
      }

      const indent = "  ".repeat(Math.min(indentLevel, 10)); // 限制最大缩进
      return `${indent}${trimmed}`;
    })
    .filter((line) => line.trim())
    .join("\n");

  console.log(formattedXml);

  console.log("-".repeat(80));

  // 显示关键信息摘要
  console.log("\n📋 关键信息摘要:");
  console.log(`FSU ID: ${testFsuData.fsuId}`);
  console.log(`FSU IP: ${testFsuData.internalIP}`);
  console.log(`Mac ID: ${testFsuData.macId}`);
  console.log(`IMSI ID: ${testFsuData.imsiId}`);
  console.log(`网络类型: ${testFsuData.networkType}`);
  console.log(`运营商: ${testFsuData.carrier}`);
  console.log(`FSU厂商: ${testFsuData.fsuVendor}`);
  console.log(`FSU型号: ${testFsuData.fsuType}`);
  console.log(`软件版本: ${testFsuData.softwareVersion}`);

  console.log("\n📱 设备列表:");
  testFsuData.devices.forEach((deviceId, index) => {
    let deviceName = "未知设备";
    switch (deviceId) {
      case "61082143802203":
        deviceName = "FSU自身";
        break;
      case "61082140601589":
        deviceName = "交流电源1";
        break;
      case "61082141820991":
        deviceName = "烟感设备01";
        break;
      case "61082140702618":
        deviceName = "普通阀控密封铅酸蓄电池1";
        break;
      case "61082140702619":
        deviceName = "普通阀控密封铅酸蓄电池2";
        break;
      case "61082141841251":
        deviceName = "水浸01";
        break;
      case "61082141831306":
        deviceName = "温湿感01";
        break;
      case "61082141901246":
        deviceName = "监控设备01";
        break;
      case "61082100004224":
        deviceName = "特殊网络设备";
        break;
    }
    console.log(`  ${index + 1}. ${deviceId} - ${deviceName}`);
  });

  // 检查XML是否包含所有设备
  console.log("\n🔍 设备包含检查:");
  testFsuData.devices.forEach((deviceId) => {
    if (loginXml.includes(`Id="${deviceId}"`)) {
      console.log(`✅ ${deviceId} - 已包含`);
    } else {
      console.log(`❌ ${deviceId} - 未包含`);
    }
  });

  // 显示XML长度信息
  console.log("\n📊 报文统计:");
  console.log(`总长度: ${loginXml.length} 字符`);
  console.log(`设备数量: ${testFsuData.devices.length} 个`);

  // 检查XML格式
  console.log("\n✅ XML格式检查:");
  if (loginXml.includes('<?xml version="1.0" encoding="utf-8"?>')) {
    console.log("✅ XML声明正确");
  } else {
    console.log("❌ XML声明缺失或错误");
  }

  if (loginXml.includes("<Request>") && loginXml.includes("</Request>")) {
    console.log("✅ Request根标签正确");
  } else {
    console.log("❌ Request根标签缺失或错误");
  }

  if (
    loginXml.includes("<Name>LOGIN</Name>") &&
    loginXml.includes("<Code>101</Code>")
  ) {
    console.log("✅ 报文类型正确 (LOGIN/101)");
  } else {
    console.log("❌ 报文类型错误");
  }

  if (loginXml.includes("<DeviceList>") && loginXml.includes("</DeviceList>")) {
    console.log("✅ 设备列表标签正确");
  } else {
    console.log("❌ 设备列表标签缺失或错误");
  }
} catch (error) {
  console.log(`❌ 生成LOGIN报文失败: ${error.message}`);
  console.log(`错误详情: ${error.stack}`);
}

console.log("\n✅ LOGIN报文生成完成！");
console.log("=".repeat(80));
