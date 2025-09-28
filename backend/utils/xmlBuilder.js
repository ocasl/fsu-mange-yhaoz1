// XML报文构造工具
const logger = require("./logger");
const {
  getFsuSoftwareVendorCode,
  getFsuHardwareVendorCode,
} = require("./vendorMapping");

/**
 * 构造FSU注册XML报文
 * @param {Object} fsuData - FSU设备数据（从数据库配置获取）
 * @returns {string} XML格式的注册报文
 */
const buildRegisterXml = (fsuData) => {
  try {
    // 从数据库配置中获取所有参数，如果没有则使用默认值
    const {
      fsuId = "61082143802203",
      fsuCode = "61082143802203",
      devices = [fsuId], // 默认只包含FSU自身
      networkType = "4G",
      softwareVersion = "25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002",
      internalIP = "10.4.135.247", // 默认VPN IP
      macId = "869221025266666",
      imsiId = "460068161666666",
      carrier = "CU",
      lockedNetworkType = "LTE",
      nmVendor = "大唐",
      nmType = "DTM-W101T",
      fsuVendor = "ZXLW", // FSU软件厂商（英文简称）
      fsuManufactor = "ZXLW", // FSU硬件厂商（英文简称）
      fsuType = "ZNV EISUA X7",
      mainVPN = "sn.toweraiot.cn,sn.toweraiot.cn",
      disasterRecovery = "zb-sn.toweraiot.cn,zb-sn.toweraiot.cn",
    } = fsuData;

    // 应用厂商映射 - 如果传入的是中文厂商名，转换为英文代码
    const mappedFsuVendor = getFsuSoftwareVendorCode(fsuVendor) || fsuVendor;
    const mappedFsuManufactor =
      getFsuHardwareVendorCode(fsuManufactor) || fsuManufactor;

    // 根据mainVPN动态生成灾备地址
    const generateDisasterRecovery = (mainVpnAddress) => {
      // 从mainVPN中提取地区代码 (如 gz.toweraiot.cn -> gz)
      const match = mainVpnAddress.match(/^([^.]+)\.toweraiot\.cn/);
      if (match && match[1]) {
        const regionCode = match[1];
        return `zb-${regionCode}.toweraiot.cn,zb-${regionCode}.toweraiot.cn`;
      }
      // 如果无法解析，使用默认值
      return "zb-sn.toweraiot.cn,zb-sn.toweraiot.cn";
    };

    // 生成动态灾备地址
    const dynamicDisasterRecovery = generateDisasterRecovery(mainVPN);

    logger.info("厂商映射结果:", {
      原始软件厂商: fsuVendor,
      映射后软件厂商: mappedFsuVendor,
      原始硬件厂商: fsuManufactor,
      映射后硬件厂商: mappedFsuManufactor,
    });

    logger.info("灾备地址生成:", {
      原始MainVPN: mainVPN,
      生成的灾备地址: dynamicDisasterRecovery,
    });

    // 构造设备列表XML（使用XML请求中的真实设备ID）
    const deviceListXml = devices
      .map((deviceId) => {
        // 根据设备ID确定设备类型（符合铁塔B接口规范）
        let deviceType = "101"; // 默认类型
        if (deviceId.includes("140601")) {
          deviceType = "406"; // 开关电源
        } else if (deviceId.includes("140702")) {
          deviceType = "407"; // 蓄电池设备
        } else if (deviceId.includes("141841")) {
          deviceType = "418"; // 水浸传感器
        } else if (deviceId.includes("141820")) {
          deviceType = "418"; // 烟感设备
        } else if (deviceId.includes("141831")) {
          deviceType = "418"; // 温湿度传感器
        } else if (deviceId.includes("141901")) {
          deviceType = "419"; // 监控设备
        } else if (deviceId.includes("100004")) {
          deviceType = "499"; // 网络设备
        } else if (deviceId === fsuId) {
          deviceType = "101"; // FSU自身
        }

        // 使用标准格式，只包含Id和Code属性
        return `<Device Id="${deviceId}" Code="${deviceId}"/>`;
      })
      .join("\n      "); // 添加适当的缩进

    // 严格按照您提供的标准格式构造LOGIN报文
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <PK_Type>
    <Name>LOGIN</Name>
    <Code>101</Code>
  </PK_Type>
  <Info>
    <UserName>1111</UserName>
    <PaSCword>1111</PaSCword>
    <FsuId>${fsuId}</FsuId>
    <FsuCode>${fsuCode}</FsuCode>
    <FsuIP>${internalIP}</FsuIP>
    <MacId>${macId}</MacId>
    <ImsiId>${imsiId}</ImsiId>
    <NetworkType>${networkType}</NetworkType>
    <LockedNetworkType>${lockedNetworkType}</LockedNetworkType>
    <Carrier>${carrier}</Carrier>
    <NMVendor>${nmVendor}</NMVendor>
    <NMType>${nmType}</NMType>
    <Internet_mode>wireless</Internet_mode>
    <Reg_Mode>2</Reg_Mode>
    <FSUVendor>${mappedFsuVendor}</FSUVendor>
    <FSUManufactor>${mappedFsuManufactor}</FSUManufactor>
    <FSUType>${fsuType}</FSUType>
    <FSUClass>INTSTAN</FSUClass>
    <Version>${softwareVersion}</Version>
    <DictVersion>1</DictVersion>
    <DeviceList>
      ${deviceListXml}
    </DeviceList>
    <MainVPN>${mainVPN}</MainVPN>
    <MainVPN_One>${mainVPN}</MainVPN_One>
    <MainVPN_Two>${mainVPN}</MainVPN_Two>
    <Disaster_Recovery_One>${dynamicDisasterRecovery}</Disaster_Recovery_One>
  </Info>
</Request>`;

    logger.info(`构造符合铁塔B接口规范的XML报文成功，FSU ID: ${fsuId}`);
    return xmlContent;
  } catch (error) {
    logger.error(`构造XML报文失败: ${error.message}`, { fsuData });
    throw new Error(`XML报文构造失败: ${error.message}`);
  }
};

/**
 * 生成唯一消息ID
 * @returns {string} 消息ID
 */
const generateMessageId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `MSG_${timestamp}_${random}`;
};

/**
 * 解析SC返回的XML响应
 * @param {string} xmlResponse - SC返回的XML响应
 * @returns {Object} 解析后的结果对象
 */
const parseScResponse = (xmlResponse) => {
  try {
    // 简单的XML解析（实际项目建议使用xml2js库）
    const resultMatch = xmlResponse.match(/<Result>(.*?)<\/Result>/);
    const messageMatch = xmlResponse.match(/<Message>(.*?)<\/Message>/);
    const codeMatch = xmlResponse.match(/<Code>(.*?)<\/Code>/);

    return {
      success: resultMatch && resultMatch[1].toLowerCase() === "success",
      code: codeMatch ? codeMatch[1] : "",
      message: messageMatch ? messageMatch[1] : "未知响应",
      rawResponse: xmlResponse,
    };
  } catch (error) {
    logger.error(`解析SC响应失败: ${error.message}`, { xmlResponse });
    return {
      success: false,
      code: "PARSE_ERROR",
      message: "解析SC响应失败",
      rawResponse: xmlResponse,
    };
  }
};

/**
 * 构造动态SOAP消息
 * @param {Object} fsuData - FSU设备数据
 * @param {string} serviceName - 服务名称
 * @returns {string} SOAP格式的XML报文
 */
const buildSoapMessage = (fsuData, serviceName) => {
  try {
    const {
      fsuId = "61082143802203",
      fsuCode = "61082143802203",
      devices = [fsuId], // 默认只包含FSU自身
      networkType = "4G",
      softwareVersion = "25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002",
      internalIP = "10.4.135.247",
      macId = "869221025266666",
      imsiId = "460068161666666",
      carrier = "CU",
      lockedNetworkType = "LTE",
      nmVendor = "大唐",
      nmType = "DTM-W101T",
      fsuVendor = "ZXLW", // FSU软件厂商（英文简称）
      fsuManufactor = "ZXLW", // FSU硬件厂商（英文简称）
      fsuType = "ZNV EISUA X7",
      mainVPN = "sn.toweraiot.cn,sn.toweraiot.cn",
      disasterRecovery = "zb-sn.toweraiot.cn,zb-sn.toweraiot.cn",
    } = fsuData;

    // 应用厂商映射 - 如果传入的是中文厂商名，转换为英文代码
    const mappedFsuVendor = getFsuSoftwareVendorCode(fsuVendor) || fsuVendor;
    const mappedFsuManufactor =
      getFsuHardwareVendorCode(fsuManufactor) || fsuManufactor;

    // 根据mainVPN动态生成灾备地址
    const generateDisasterRecovery = (mainVpnAddress) => {
      // 从mainVPN中提取地区代码 (如 gz.toweraiot.cn -> gz)
      const match = mainVpnAddress.match(/^([^.]+)\.toweraiot\.cn/);
      if (match && match[1]) {
        const regionCode = match[1];
        return `zb-${regionCode}.toweraiot.cn,zb-${regionCode}.toweraiot.cn`;
      }
      // 如果无法解析，使用默认值
      return "zb-sn.toweraiot.cn,zb-sn.toweraiot.cn";
    };

    // 生成动态灾备地址
    const dynamicDisasterRecovery = generateDisasterRecovery(mainVPN);

    // 构造设备列表XML（使用标准格式，只包含Id和Code）
    const deviceListXml = devices
      .map((deviceId) => {
        return `<Device Id="${deviceId}" Code="${deviceId}"/>`;
      })
      .join("\n                        ");

    // 构造标准的SOAP消息（内部使用标准LOGIN格式）
    const soapMessage = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Header/>
    <soapenv:Body>
        <ns1:invoke xmlns:ns1="http://webservice/">
            <ns1:xmlStr><![CDATA[<Request>
  <PK_Type>
    <Name>LOGIN</Name>
    <Code>101</Code>
  </PK_Type>
  <Info>
    <UserName>1111</UserName>
    <PaSCword>1111</PaSCword>
    <FsuId>${fsuId}</FsuId>
    <FsuCode>${fsuCode}</FsuCode>
    <FsuIP>${internalIP}</FsuIP>
    <MacId>${macId}</MacId>
    <ImsiId>${imsiId}</ImsiId>
    <NetworkType>${networkType}</NetworkType>
    <LockedNetworkType>${lockedNetworkType}</LockedNetworkType>
    <Carrier>${carrier}</Carrier>
    <NMVendor>${nmVendor}</NMVendor>
    <NMType>${nmType}</NMType>
    <Internet_mode>wireless</Internet_mode>
    <Reg_Mode>2</Reg_Mode>
    <FSUVendor>${mappedFsuVendor}</FSUVendor>
    <FSUManufactor>${mappedFsuManufactor}</FSUManufactor>
    <FSUType>${fsuType}</FSUType>
    <FSUClass>INTSTAN</FSUClass>
    <Version>${softwareVersion}</Version>
    <DictVersion>1</DictVersion>
    <DeviceList>
                        ${deviceListXml}
    </DeviceList>
    <MainVPN>${mainVPN}</MainVPN>
    <MainVPN_One>${mainVPN}</MainVPN_One>
    <MainVPN_Two>${mainVPN}</MainVPN_Two>
    <Disaster_Recovery_One>${dynamicDisasterRecovery}</Disaster_Recovery_One>
  </Info>
</Request>]]></ns1:xmlStr>
        </ns1:invoke>
    </soapenv:Body>
</soapenv:Envelope>`;

    return soapMessage;
  } catch (error) {
    throw new Error(`构造SOAP消息失败: ${error.message}`);
  }
};

/**
 * 构造FSU下线LOGOUT XML报文
 * @param {string} fsuId - FSU设备ID
 * @returns {string} XML格式的下线报文
 */
const buildLogoutXml = (fsuId) => {
  try {
    // 构造标准的LOGOUT报文，格式与LOGIN保持一致
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <PK_Type>
    <Name>LOGOUT</Name>
    <Code>103</Code>
  </PK_Type>
  <Info>
    <FsuId>${fsuId}</FsuId>
    <FsuCode>${fsuId}</FsuCode>
  </Info>
</Request>`;

    logger.info("构造LOGOUT报文成功:", {
      fsuId: fsuId,
      xmlLength: xmlContent.length,
    });

    return xmlContent;
  } catch (error) {
    logger.error("构造LOGOUT报文失败:", {
      fsuId: fsuId,
      error: error.message,
    });
    throw new Error(`构造LOGOUT报文失败: ${error.message}`);
  }
};

/**
 * 构造LOGOUT的SOAP消息
 * @param {string} fsuId - FSU设备ID
 * @param {string} serviceName - 服务名称
 * @returns {string} SOAP格式的LOGOUT消息
 */
const buildLogoutSoapMessage = (fsuId, serviceName = "SCService") => {
  try {
    // 构造LOGOUT的SOAP消息，格式与LOGIN保持一致
    const soapMessage = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Header/>
    <soapenv:Body>
        <ns1:invoke xmlns:ns1="http://webservice/">
            <ns1:xmlStr><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <PK_Type>
    <Name>LOGOUT</Name>
    <Code>103</Code>
  </PK_Type>
  <Info>
    <FsuId>${fsuId}</FsuId>
    <FsuCode>${fsuId}</FsuCode>
  </Info>
</Request>]]></ns1:xmlStr>
        </ns1:invoke>
    </soapenv:Body>
</soapenv:Envelope>`;

    return soapMessage;
  } catch (error) {
    throw new Error(`构造LOGOUT SOAP消息失败: ${error.message}`);
  }
};

/**
 * 构造标准官方规范的LOGOUT XML报文（空Info）
 * @param {string} fsuId - FSU设备ID
 * @returns {string} XML格式的下线报文
 */
const buildLogoutXmlEmpty = (fsuId) => {
  try {
    // 按照官方规范XML样例的格式，Info为空
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <PK_Type>
    <Name>LOGOUT</Name>
    <Code>103</Code>
  </PK_Type>
  <Info/>
</Request>`;

    logger.info("构造官方规范LOGOUT报文成功:", {
      fsuId: fsuId,
      xmlLength: xmlContent.length,
      format: "空Info格式"
    });

    return xmlContent;
  } catch (error) {
    logger.error("构造官方规范LOGOUT报文失败:", {
      fsuId: fsuId,
      error: error.message,
    });
    throw new Error(`构造官方规范LOGOUT报文失败: ${error.message}`);
  }
};

/**
 * 构造仅包含FsuId的LOGOUT XML报文
 * @param {string} fsuId - FSU设备ID
 * @returns {string} XML格式的下线报文
 */
const buildLogoutXmlOnlyFsuId = (fsuId) => {
  try {
    // 仅包含FsuId，不包含FsuCode
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <PK_Type>
    <Name>LOGOUT</Name>
    <Code>103</Code>
  </PK_Type>
  <Info>
    <FsuId>${fsuId}</FsuId>
  </Info>
</Request>`;

    logger.info("构造仅FsuId的LOGOUT报文成功:", {
      fsuId: fsuId,
      xmlLength: xmlContent.length,
      format: "仅FsuId格式"
    });

    return xmlContent;
  } catch (error) {
    logger.error("构造仅FsuId的LOGOUT报文失败:", {
      fsuId: fsuId,
      error: error.message,
    });
    throw new Error(`构造仅FsuId的LOGOUT报文失败: ${error.message}`);
  }
};

/**
 * 构造官方规范的LOGOUT SOAP消息（空Info）
 * @param {string} fsuId - FSU设备ID
 * @returns {string} SOAP格式的LOGOUT消息
 */
const buildLogoutSoapMessageEmpty = (fsuId) => {
  try {
    const soapMessage = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Header/>
    <soapenv:Body>
        <ns1:invoke xmlns:ns1="http://webservice/">
            <ns1:xmlStr><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <PK_Type>
    <Name>LOGOUT</Name>
    <Code>103</Code>
  </PK_Type>
  <Info/>
</Request>]]></ns1:xmlStr>
        </ns1:invoke>
    </soapenv:Body>
</soapenv:Envelope>`;

    return soapMessage;
  } catch (error) {
    throw new Error(`构造官方规范LOGOUT SOAP消息失败: ${error.message}`);
  }
};

/**
 * 构造仅FsuId的LOGOUT SOAP消息
 * @param {string} fsuId - FSU设备ID
 * @returns {string} SOAP格式的LOGOUT消息
 */
const buildLogoutSoapMessageOnlyFsuId = (fsuId) => {
  try {
    const soapMessage = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Header/>
    <soapenv:Body>
        <ns1:invoke xmlns:ns1="http://webservice/">
            <ns1:xmlStr><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <PK_Type>
    <Name>LOGOUT</Name>
    <Code>103</Code>
  </PK_Type>
  <Info>
    <FsuId>${fsuId}</FsuId>
  </Info>
</Request>]]></ns1:xmlStr>
        </ns1:invoke>
    </soapenv:Body>
</soapenv:Envelope>`;

    return soapMessage;
  } catch (error) {
    throw new Error(`构造仅FsuId的LOGOUT SOAP消息失败: ${error.message}`);
  }
};

module.exports = {
  buildRegisterXml,
  parseScResponse,
  generateMessageId,
  buildSoapMessage,
  buildLogoutXml,
  buildLogoutSoapMessage,
  buildLogoutXmlEmpty,
  buildLogoutXmlOnlyFsuId,
  buildLogoutSoapMessageEmpty,
  buildLogoutSoapMessageOnlyFsuId,
};
