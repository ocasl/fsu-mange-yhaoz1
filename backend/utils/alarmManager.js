/**
 * 告警管理器
 * 处理告警上报和清除功能
 */

const logger = require("./logger");
const smartAxios = require("./smartAxios");
const scConfig = require("../config/sc");

class AlarmManager {
  constructor() {
    // 随机初始化告警序号计数器（避免从1开始）
    this.alarmCounter = Math.floor(Math.random() * 1000000) + 100000; // 100000-1099999之间
    this.activeAlarms = new Map(); // 活跃告警列表
    this.scCollectorIP = null; // SC采集器IP
  }

  /**
   * 设置SC采集器IP
   * @param {string} ip - SC采集器IP地址
   */
  setCollectorIP(ip) {
    this.scCollectorIP = ip;
    logger.info(`设置SC采集器IP: ${ip}`);
  }

  /**
   * 手动设置采集器IP（带验证）
   * @param {string} ip - 采集器IP地址
   * @returns {Object} 设置结果
   */
  setCollectorIPManual(ip) {
    // 简单的IP格式验证
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return {
        success: false,
        message: "IP地址格式不正确，请输入正确的IPv4地址",
      };
    }

    const parts = ip.split(".");
    for (const part of parts) {
      const num = parseInt(part);
      if (num < 0 || num > 255) {
        return {
          success: false,
          message: "IP地址范围不正确，每部分应在0-255之间",
        };
      }
    }

    this.setCollectorIP(ip);
    return {
      success: true,
      message: `成功设置采集器IP: ${ip}`,
      ip: ip,
    };
  }

  /**
   * 获取当前SC采集器IP
   * @returns {string|null} SC采集器IP
   */
  getCollectorIP() {
    return this.scCollectorIP;
  }

  /**
   * 构建告警专用的SOAP消息
   * @param {string} alarmRequestXml - 告警请求XML
   * @returns {string} SOAP包装的告警消息
   */
  buildAlarmSoapMessage(alarmRequestXml) {
    const soapMessage = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    <ns1:invoke xmlns:ns1="http://webservice/">
      <ns1:xmlStr><![CDATA[${alarmRequestXml}]]></ns1:xmlStr>
    </ns1:invoke>
  </soapenv:Body>
</soapenv:Envelope>`;
    return soapMessage;
  }

  /**
   * 尝试从心跳日志中自动获取采集器IP
   * @returns {Promise<string|null>} 采集器IP
   */
  async tryGetCollectorIPFromLogs() {
    try {
      const fs = require("fs").promises;
      const path = require("path");

      // 查找最新的日志文件
      const logsDir = path.join(__dirname, "../logs");
      const files = await fs.readdir(logsDir);
      const logFiles = files
        .filter((f) => f.endsWith(".log"))
        .sort()
        .reverse();

      for (const logFile of logFiles) {
        const logPath = path.join(logsDir, logFile);
        const content = await fs.readFile(logPath, "utf8");

        // 查找LOGIN_ACK响应中的SCIP
        const scipMatch = content.match(/<SCIP>([^<]+)<\/SCIP>/);
        if (scipMatch) {
          const scip = scipMatch[1];
          logger.info(`从日志中找到采集器IP: ${scip}`, { logFile });
          this.setCollectorIP(scip);
          return scip;
        }
      }

      logger.warn("未在日志中找到采集器IP");
      return null;
    } catch (error) {
      logger.error("从日志获取采集器IP失败", { error: error.message });
      return null;
    }
  }

  /**
   * 生成告警序号
   * @returns {string} 10位告警序号
   */
  generateAlarmSerialNo() {
    const serialNo = this.alarmCounter.toString().padStart(10, "0");
    this.alarmCounter++;
    if (this.alarmCounter > 4294967295) {
      this.alarmCounter = 1; // 重置计数器
    }
    return serialNo;
  }

  /**
   * 获取当前时间戳（格式：YYYY-MM-DD hh:mm:ss）
   * @returns {string} 格式化的时间字符串
   */
  getCurrentTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");
    const second = now.getSeconds().toString().padStart(2, "0");

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  /**
   * 生成告警XML (单独的TAlarm格式，也使用英文格式)
   * @param {Object} alarmData - 告警数据
   * @returns {string} TAlarm XML格式字符串
   */
  generateAlarmXML(alarmData) {
    const {
      serialNo,
      deviceId,
      deviceCode = deviceId,
      alarmTime = this.getCurrentTimestamp(),
      fsuId,
      fsuCode = fsuId,
      monitorPointId,
      alarmLevel,
      alarmFlag,
      alarmDesc,
    } = alarmData;

    // 转换告警级别为数字（与SEND_ALARM保持一致）
    let numericAlarmLevel = "";
    if (alarmLevel) {
      // 如果已经是数字字符串，直接使用
      if (/^[1-4]$/.test(alarmLevel)) {
        numericAlarmLevel = alarmLevel;
      } else {
        // 如果是中文描述，进行转换
        const alarmLevelMap = {
          一级: "1",
          二级: "2",
          三级: "3",
          四级: "4",
        };
        numericAlarmLevel = alarmLevelMap[alarmLevel] || "2";
      }
    }

    // 转换告警标志为英文（与SEND_ALARM保持一致）
    const alarmFlagMap = {
      开始: "BEGIN",
      结束: "END",
    };
    const englishAlarmFlag = alarmFlagMap[alarmFlag] || "BEGIN";

    const alarmXml = `<TAlarm>
\t<SerialNo>${serialNo}</SerialNo>
\t<DeviceId>${deviceId}</DeviceId>
\t<DeviceCode>${deviceCode}</DeviceCode>
\t<AlarmTime>${alarmTime}</AlarmTime>
\t<FsuId>${fsuId}</FsuId>
\t<FsuCode>${fsuCode}</FsuCode>
\t<Id>${monitorPointId}</Id>
\t<AlarmLevel>${numericAlarmLevel || ""}</AlarmLevel>
\t<AlarmFlag>${englishAlarmFlag}</AlarmFlag>
\t<AlarmDesc>${alarmDesc}</AlarmDesc>
</TAlarm>`;

    return alarmXml;
  }

  /**
   * 生成完整的SEND_ALARM请求报文
   * @param {Object} alarmData - 告警数据
   * @returns {string} 完整的SEND_ALARM请求XML
   */
  generateSendAlarmRequest(alarmData) {
    const {
      serialNo,
      deviceId,
      deviceCode = deviceId,
      alarmTime = this.getCurrentTimestamp(),
      fsuId,
      fsuCode = fsuId,
      monitorPointId,
      alarmLevel,
      alarmFlag,
      alarmDesc,
    } = alarmData;

    // 转换告警级别为数字（如果提供了级别）
    let numericAlarmLevel = "";
    if (alarmLevel) {
      // 如果已经是数字字符串，直接使用
      if (/^[1-4]$/.test(alarmLevel)) {
        numericAlarmLevel = alarmLevel;
      } else {
        // 如果是中文描述，进行转换
        const alarmLevelMap = {
          一级: "1",
          二级: "2",
          三级: "3",
          四级: "4",
        };
        numericAlarmLevel = alarmLevelMap[alarmLevel] || alarmLevel;
      }
    }

    // 转换告警标志为英文
    const alarmFlagMap = {
      开始: "BEGIN",
      结束: "END",
    };
    const englishAlarmFlag = alarmFlagMap[alarmFlag] || "BEGIN";

    const requestXml = `<?xml version="1.0" encoding="utf-8"?>
<Request>
<PK_Type>
<Name>SEND_ALARM</Name>
<Code>501</Code>
</PK_Type>
<Info>
<Values>
<TAlarmList>
<TAlarm>
<SerialNo>${serialNo}</SerialNo>
<Id>${monitorPointId}</Id>
<FsuId>${fsuId}</FsuId>
<FsuCode>${fsuCode}</FsuCode>
<DeviceId>${deviceId}</DeviceId>
<DeviceCode>${deviceCode}</DeviceCode>
<AlarmTime>${alarmTime}</AlarmTime>
<AlarmLevel>${numericAlarmLevel || ""}</AlarmLevel>
<AlarmFlag>${englishAlarmFlag}</AlarmFlag>
<AlarmDesc>${alarmDesc}</AlarmDesc>
</TAlarm>
</TAlarmList>
</Values>
</Info>
</Request>`;

    return requestXml;
  }

  /**
   * 发送告警到SC服务器（支持多种发送方式）
   * @param {string} alarmRequestXml - 完整的SEND_ALARM请求XML
   * @param {string} method - 发送方式 (default|soap|raw|alt-endpoint)
   * @returns {Promise<Object>} 发送结果
   */
  async sendAlarmToSC(alarmRequestXml, method = "soap") {
    try {
      // 检查是否有采集器IP
      if (!this.scCollectorIP) {
        return {
          success: false,
          message: "未设置SC采集器IP，请先从LOGIN_ACK响应中获取SCIP",
          error: "No collector IP configured",
        };
      }

      // 根据方式构造不同的URL和请求配置
      let scUrl, headers, requestBody;

      switch (method) {
        case "soap":
          scUrl = `http://${this.scCollectorIP}:8080/services/SCService`;
          // 使用SOAP包装告警请求
          requestBody = this.buildAlarmSoapMessage(alarmRequestXml);
          headers = {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: '"invoke"',
            "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
          };
          break;

        case "soap-simple":
          scUrl = `http://${this.scCollectorIP}:8080/services/SCService`;
          // 简化的SOAP包装
          requestBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${alarmRequestXml}
  </soap:Body>
</soap:Envelope>`;
          headers = {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: '"SEND_ALARM"',
            "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
          };
          break;

        case "raw":
          scUrl = `http://${this.scCollectorIP}:8080/services/SCService`;
          requestBody = alarmRequestXml;
          headers = {
            "Content-Type": "application/xml; charset=utf-8",
            "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
          };
          break;

        case "direct-xml":
          scUrl = `http://${this.scCollectorIP}:8080/services/SCService`;
          requestBody = alarmRequestXml;
          headers = {
            "Content-Type": "text/xml; charset=utf-8",
            "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
          };
          break;

        case "alt-endpoint":
          scUrl = `http://${this.scCollectorIP}:8080/api/register`;
          requestBody = alarmRequestXml;
          headers = {
            "Content-Type": "text/xml; charset=utf-8",
            "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
          };
          break;

        default:
          scUrl = `http://${this.scCollectorIP}:8080/services/SCService`;
          requestBody = alarmRequestXml;
          headers = {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: '"invoke"',
            "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
          };
      }

      logger.info(`发送告警到SC采集器服务器 [${method}]: ${scUrl}`);
      logger.debug(`告警报文内容:`, { xml: requestBody });

      // 发送HTTP请求
      const response = await smartAxios.post(scUrl, requestBody, {
        headers,
        timeout: scConfig.timeout || 15000, // 使用更长的超时时间
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        },
      });

      logger.info(`SC服务器响应状态: ${response.status}`);
      logger.info(`SC服务器完整响应:`, {
        status: response.status,
        headers: response.headers,
        data: response.data,
      });

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: "告警发送成功",
          status: response.status,
          response: response.data,
          headers: response.headers,
          fullResponse: {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
          },
        };
      } else {
        return {
          success: false,
          message: `SC服务器返回错误状态: ${response.status}`,
          status: response.status,
          response: response.data,
          headers: response.headers,
          fullResponse: {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
          },
        };
      }
    } catch (error) {
      logger.error("发送告警到SC服务器失败", {
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        message: `发送失败: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * 尝试多种方式发送告警到SC服务器
   * @param {string} alarmRequestXml - 完整的SEND_ALARM请求XML
   * @returns {Promise<Object>} 发送结果
   */
  async sendAlarmMultipleMethods(alarmRequestXml) {
    const methods = [
      "default",
      "soap",
      "soap-simple",
      "raw",
      "direct-xml",
      "alt-endpoint",
    ];
    const results = [];

    for (const method of methods) {
      console.log(`\n🔄 尝试发送方式: ${method}`);
      try {
        const result = await this.sendAlarmToSC(alarmRequestXml, method);
        results.push({
          method,
          success: result.success,
          status: result.status,
          message: result.message,
          response: result.response,
        });

        console.log(
          `✅ 方式 [${method}] 结果: ${result.success ? "成功" : "失败"}`
        );
        if (result.success) {
          console.log(`   状态码: ${result.status}`);
          console.log(
            `   响应: ${
              result.response
                ? result.response.substring(0, 100) + "..."
                : "无响应内容"
            }`
          );
        } else {
          console.log(`   错误: ${result.message}`);
        }

        // 如果某种方式成功，可以选择停止尝试其他方式
        if (result.success) {
          console.log(`🎉 发送成功！使用方式: ${method}`);
          break;
        }
      } catch (error) {
        results.push({
          method,
          success: false,
          error: error.message,
        });
        console.log(`❌ 方式 [${method}] 异常: ${error.message}`);
      }

      // 等待一下再尝试下一种方式
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {
      success: results.some((r) => r.success),
      results,
      message: results.some((r) => r.success)
        ? "至少一种方式发送成功"
        : "所有发送方式都失败",
    };
  }

  /**
   * 上报告警
   * @param {Object} params - 告警参数
   * @param {boolean} sendToSC - 是否发送到SC服务器
   * @param {string} sendMethod - 发送方式 (default|soap|raw|alt-endpoint|all)
   * @returns {Object} 告警信息和XML
   */
  async reportAlarm(params, sendToSC = false, sendMethod = "soap") {
    const {
      deviceId,
      fsuId = "61082143802203",
      monitorPointId,
      alarmLevel,
      alarmDesc,
    } = params;

    // 生成唯一的告警序号
    const serialNo = this.generateAlarmSerialNo();

    // 构造告警数据
    const alarmData = {
      serialNo,
      deviceId,
      alarmTime: this.getCurrentTimestamp(),
      fsuId,
      monitorPointId,
      alarmLevel,
      alarmFlag: "开始",
      alarmDesc,
    };

    // 生成完整的SEND_ALARM请求报文
    const sendAlarmRequest = this.generateSendAlarmRequest(alarmData);

    // 也生成单独的TAlarm XML（用于显示）
    const alarmXml = this.generateAlarmXML(alarmData);

    // 保存到活跃告警列表（用于后续清除）
    const alarmKey = `${deviceId}_${monitorPointId}`;
    this.activeAlarms.set(alarmKey, {
      serialNo,
      deviceId,
      fsuId,
      monitorPointId,
      alarmDesc,
      startTime: alarmData.alarmTime,
    });

    logger.info("生成告警上报", {
      serialNo,
      deviceId,
      monitorPointId,
      alarmDesc,
    });

    const result = {
      success: true,
      alarmData,
      alarmXml, // 单独的TAlarm格式
      sendAlarmRequest, // 完整的SEND_ALARM请求报文
      message: `告警上报成功 - 序号: ${serialNo}`,
    };

    // 如果需要发送到SC服务器
    if (sendToSC) {
      logger.info("发送告警到SC服务器", {
        serialNo,
        deviceId,
        method: sendMethod,
      });

      let sendResult;
      if (sendMethod === "all") {
        // 尝试所有发送方式
        sendResult = await this.sendAlarmMultipleMethods(sendAlarmRequest);
      } else {
        // 使用指定的发送方式
        sendResult = await this.sendAlarmToSC(sendAlarmRequest, sendMethod);
      }

      result.sendResult = sendResult;
      if (sendResult.success) {
        result.message += " - 已发送到SC服务器";
        logger.info("告警发送到SC服务器成功", {
          serialNo,
          deviceId,
          method: sendMethod,
        });
      } else {
        result.message += ` - SC发送失败: ${sendResult.message}`;
        logger.warn("告警发送到SC服务器失败", {
          serialNo,
          deviceId,
          method: sendMethod,
          error: sendResult.message,
        });
      }
    }

    return result;
  }

  /**
   * 清除告警（独立操作，不依赖活跃告警状态）
   * @param {Object} params - 清除参数
   * @param {boolean} sendToSC - 是否发送到SC服务器
   * @returns {Object} 清除告警信息和XML
   */
  async clearAlarm(params, sendToSC = false, sendMethod = "soap") {
    const { 
      deviceId, 
      monitorPointId, 
      fsuId = "61082143802203", 
      alarmDesc = "告警清除",
      alarmLevel = "四级"
    } = params;

    // 生成新的告警序号（清除告警也需要唯一序号）
    const serialNo = this.generateAlarmSerialNo();

    // 构造清除告警数据
    const alarmData = {
      serialNo,
      deviceId,
      alarmTime: this.getCurrentTimestamp(),
      fsuId,
      monitorPointId,
      alarmLevel,
      alarmFlag: "结束", // 清除告警标志
      alarmDesc: alarmDesc.includes("(已清除)") ? alarmDesc : `${alarmDesc}(已清除)`,
    };

    // 生成完整的SEND_ALARM清除请求报文
    const sendAlarmRequest = this.generateSendAlarmRequest(alarmData);

    // 也生成单独的TAlarm XML（用于显示）
    const alarmXml = this.generateAlarmXML(alarmData);

    // 检查是否有对应的活跃告警，如果有则从列表中移除（但不强制要求）
    const alarmKey = `${deviceId}_${monitorPointId}`;
    if (this.activeAlarms.has(alarmKey)) {
      this.activeAlarms.delete(alarmKey);
      logger.info("从活跃告警列表中移除对应告警", { deviceId, monitorPointId });
    }

    logger.info("生成告警清除", {
      serialNo,
      deviceId,
      monitorPointId,
      alarmDesc: alarmData.alarmDesc,
    });

    const result = {
      success: true,
      alarmData,
      alarmXml, // 单独的TAlarm格式
      sendAlarmRequest, // 完整的SEND_ALARM请求报文
      message: `告警清除成功 - 序号: ${serialNo}`,
    };

    // 如果需要发送到SC服务器
    if (sendToSC) {
      logger.info("发送告警清除到SC服务器", {
        serialNo,
        deviceId,
        method: sendMethod,
      });

      let sendResult;
      if (sendMethod === "all") {
        // 尝试所有发送方式
        sendResult = await this.sendAlarmMultipleMethods(sendAlarmRequest);
      } else {
        // 使用指定的发送方式
        sendResult = await this.sendAlarmToSC(sendAlarmRequest, sendMethod);
      }

      result.sendResult = sendResult;
      result.responseCode = sendResult.responseCode;
      
      if (sendResult.success) {
        result.message += " - 已发送到SC服务器";
        logger.info("告警清除发送到SC服务器成功", {
          serialNo,
          deviceId,
          method: sendMethod,
        });
      } else {
        result.message += ` - SC发送失败: ${sendResult.message}`;
        logger.warn("告警清除发送到SC服务器失败", {
          serialNo,
          deviceId,
          method: sendMethod,
          error: sendResult.message,
        });
      }
    }

    return result;
  }

  /**
   * 从数据库记录清除告警（不依赖活跃告警列表）
   * @param {Object} alarmRecord - 数据库中的告警记录
   * @param {boolean} sendToSC - 是否发送到SC服务器
   * @param {string} sendMethod - 发送方式
   * @returns {Object} 清除告警信息和XML
   */
  async clearAlarmFromRecord(
    alarmRecord,
    sendToSC = false,
    sendMethod = "soap"
  ) {
    const { deviceId, fsuid, signalId, alarmDesc, serialNo } = alarmRecord;

    // 使用数据库记录中的序号，如果没有则生成新的
    const useSerialNo = serialNo || this.generateAlarmSerialNo();

    // 构造清除告警数据
    const alarmData = {
      serialNo: useSerialNo,
      deviceId,
      alarmTime: this.getCurrentTimestamp(),
      fsuId: fsuid,
      monitorPointId: signalId,
      alarmLevel: "4", // 清除时使用4级告警
      alarmFlag: "结束",
      alarmDesc: `${alarmDesc}(已清除)`,
    };

    // 生成完整的SEND_ALARM清除请求报文
    const sendAlarmRequest = this.generateSendAlarmRequest(alarmData);

    // 也生成单独的TAlarm XML（用于显示）
    const alarmXml = this.generateAlarmXML(alarmData);

    logger.info("生成告警清除（从数据库记录）", {
      serialNo: useSerialNo,
      deviceId,
      monitorPointId: signalId,
      originalDesc: alarmDesc,
    });

    const result = {
      success: true,
      alarmData,
      alarmXml, // 单独的TAlarm格式
      sendAlarmRequest, // 完整的SEND_ALARM请求报文
      message: `告警清除成功 - 序号: ${useSerialNo}`,
    };

    // 如果需要发送到SC服务器
    if (sendToSC) {
      logger.info("发送告警清除到SC服务器（从数据库记录）", {
        serialNo: useSerialNo,
        deviceId,
        method: sendMethod,
      });

      let sendResult;
      if (sendMethod === "all") {
        // 尝试所有发送方式
        sendResult = await this.sendAlarmMultipleMethods(sendAlarmRequest);
      } else {
        // 使用指定的发送方式
        sendResult = await this.sendAlarmToSC(sendAlarmRequest, sendMethod);
      }

      result.sendResult = sendResult;
      if (sendResult.success) {
        result.message += " - 已发送到SC服务器";
        logger.info("告警清除发送到SC服务器成功（从数据库记录）", {
          serialNo: useSerialNo,
          deviceId,
          method: sendMethod,
        });
      } else {
        result.message += ` - SC发送失败: ${sendResult.message}`;
        logger.warn("告警清除发送到SC服务器失败（从数据库记录）", {
          serialNo: useSerialNo,
          deviceId,
          method: sendMethod,
          error: sendResult.message,
        });
      }
    }

    return result;
  }

  /**
   * 获取活跃告警列表
   * @returns {Array} 活跃告警数组
   */
  getActiveAlarms() {
    return Array.from(this.activeAlarms.entries()).map(([key, alarm]) => ({
      key,
      ...alarm,
    }));
  }

  /**
   * 预定义的告警模板
   */
  getAlarmTemplates() {
    return {
      // 水浸告警
      waterFlooding: {
        deviceId: "61082141841251",
        monitorPointId: "0418001001",
        alarmLevel: "四级",
        alarmDesc: "水浸告警",
      },

      // 温度告警
      temperatureHigh: {
        deviceId: "61082141831306",
        monitorPointId: "0418101001",
        alarmLevel: "三级",
        alarmDesc: "温度过高告警",
      },

      // 烟感告警
      smokeDetection: {
        deviceId: "61082141820991",
        monitorPointId: "0418002001",
        alarmLevel: "二级",
        alarmDesc: "烟雾检测告警",
      },

      // 电源告警
      powerSupplyFault: {
        deviceId: "61082140601589",
        monitorPointId: "0406001001",
        alarmLevel: "一级",
        alarmDesc: "电源故障告警",
      },

      // 蓄电池告警
      batteryLowVoltage: {
        deviceId: "61082140702618",
        monitorPointId: "0407001001",
        alarmLevel: "三级",
        alarmDesc: "蓄电池欠压告警",
      },
    };
  }
}

module.exports = AlarmManager;
