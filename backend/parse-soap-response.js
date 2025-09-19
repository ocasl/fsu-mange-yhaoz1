// 解析SOAP响应的完整内容
const axios = require("axios");
const { buildSoapMessage } = require("./utils/xmlBuilder");

async function parseSoapResponse() {
  console.log("=== 解析SOAP响应内容 ===\n");

  const testData = {
    fsuId: "61082143802203",
    fsuCode: "61082143802203",
    devices: ["power", "air"],
    networkType: "4G",
    softwareVersion: "1",
    internalIP: "10.5.12.22",
  };

  try {
    const soapXml = buildSoapMessage(testData, "SCService");

    const response = await axios.post(
      "http://sn-r.toweraiot.cn:8080/services/SCService",
      soapXml,
      {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: '"invoke"',
          "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
        },
        timeout: 10000,
        validateStatus: () => true,
      }
    );

    console.log("完整SOAP响应状态:", response.status);
    console.log("完整SOAP响应内容:");
    console.log("=".repeat(80));
    console.log(response.data);
    console.log("=".repeat(80));

    // 尝试解析XML响应
    if (response.data.includes("invokeReturn")) {
      console.log("\n✅ 找到invokeReturn节点");

      // 提取invokeReturn的内容
      const match = response.data.match(
        /<invokeReturn[^>]*>(.*?)<\/invokeReturn>/s
      );
      if (match) {
        let returnContent = match[1];

        // 解码HTML实体
        returnContent = returnContent
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&");

        console.log("\n解码后的返回内容:");
        console.log("-".repeat(60));
        console.log(returnContent);
        console.log("-".repeat(60));

        // 分析返回内容
        if (
          returnContent.includes("SUCCESS") ||
          returnContent.includes("success")
        ) {
          console.log("\n🎉 LOGIN请求成功！");
        } else if (
          returnContent.includes("ERROR") ||
          returnContent.includes("error")
        ) {
          console.log("\n❌ LOGIN请求失败");
        } else if (returnContent.includes("Response")) {
          console.log("\n📝 收到响应报文，需要进一步分析");
        }
      }
    }

    // 检查是否有错误信息
    if (response.data.includes("faultstring")) {
      const faultMatch = response.data.match(
        /<faultstring>(.*?)<\/faultstring>/
      );
      if (faultMatch) {
        console.log(`\n❌ SOAP错误: ${faultMatch[1]}`);
      }
    }
  } catch (error) {
    console.error("解析失败:", error.message);
  }
}

parseSoapResponse();
