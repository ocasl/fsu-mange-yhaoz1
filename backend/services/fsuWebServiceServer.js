/**
 * FSU WebService 服务端
 * 根据铁塔B接口规范，FSU应该作为WebService服务端
 * 等待SC主动发送GET_FSUINFO等心跳请求
 */

const express = require("express");
const bodyParser = require("body-parser");
const { EventEmitter } = require("events");
const logger = require("../utils/logger");
const deviceDataManager = require("../utils/deviceDataManager");
const networkDiagnostics = require("../utils/networkDiagnostics");

class FSUWebServiceServer extends EventEmitter {
  constructor() {
    super();
    this.app = express();
    this.server = null;
    this.isRunning = false;
    this.fsuData = null;
    this.fsuDevices = new Map(); // 存储多个FSU设备信息
    this.serverStartTime = null;
    // 心跳响应模式配置
    this.heartbeatMode = "strict"; // 'strict' 或 'compatible'
    this.setupMiddleware();
    this.setupRoutes();

    // 启动设备数据刷新定时器
    deviceDataManager.startDataRefreshTimer(30000); // 30秒刷新一次
  }

  /**
   * 设置中间件
   */
  setupMiddleware() {
    // 解析XML内容
    this.app.use(bodyParser.text({ type: "text/xml" }));
    this.app.use(bodyParser.text({ type: "application/soap+xml" }));
    this.app.use(bodyParser.raw({ type: "text/xml" }));

    // 详细的请求日志中间件
    this.app.use((req, res, next) => {
      console.log("\n" + "🌐".repeat(50));
      console.log(`🔵 [HTTP请求] ${new Date().toLocaleString()}`);
      console.log("🌐".repeat(50));
      console.log("📍 基本信息:");
      console.log(`   方法: ${req.method}`);
      console.log(`   路径: ${req.url}`);
      console.log(`   IP: ${req.ip || req.connection.remoteAddress}`);
      console.log(`   协议: ${req.protocol.toUpperCase()}`);

      console.log("\n📋 请求头:");
      Object.keys(req.headers).forEach((key) => {
        console.log(`   ${key}: ${req.headers[key]}`);
      });

      if (req.body && req.body.length > 0) {
        console.log("\n📄 请求体预览:");
        console.log(`   长度: ${req.body.length} 字节`);
        console.log(`   类型: ${typeof req.body}`);
        const bodyPreview = Buffer.isBuffer(req.body)
          ? req.body.toString()
          : req.body;
        console.log(
          `   内容: ${bodyPreview.substring(0, 200)}${
            bodyPreview.length > 200 ? "..." : ""
          }`
        );
      }
      console.log("🌐".repeat(50));

      logger.info("收到请求", {
        method: req.method,
        url: req.url,
        headers: req.headers,
        contentType: req.get("Content-Type"),
        contentLength: req.get("Content-Length"),
        bodyLength: req.body?.length || 0,
      });
      next();
    });
  }

  /**
   * 设置路由
   */
  setupRoutes() {
    // 主要的WebService端点 - 处理SC的SOAP请求
    this.app.post("/invoke", (req, res) => {
      this.handleInvokeRequest(req, res);
    });

    // SC实际请求的路径 - FSUService
    this.app.post("/services/FSUService", (req, res) => {
      this.handleInvokeRequest(req, res);
    });

    // 兼容其他可能的路径
    this.app.post("/services/FSUWebService", (req, res) => {
      this.handleInvokeRequest(req, res);
    });

    // 根路径 - 显示服务信息
    this.app.get("/", (req, res) => {
      res.send(`
        <html>
          <head><title>FSU WebService Server</title></head>
          <body>
            <h2>FSU WebService Server</h2>
            <p>FSU ID: ${this.fsuData?.fsuId || "Not Set"}</p>
            <p>Status: ${this.isRunning ? "Running" : "Stopped"}</p>
            <p>Time: ${new Date().toLocaleString()}</p>
            <p>Supported Endpoints:</p>
            <ul>
              <li>POST /invoke</li>
              <li>POST /services/FSUService</li>
              <li>POST /services/FSUWebService</li>
            </ul>
          </body>
        </html>
      `);
    });

    // 健康检查
    this.app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        fsuId: this.fsuData?.fsuId,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * 处理SC发送的invoke请求（包括GET_FSUINFO心跳和GET_DATA数据请求）
   */
  handleInvokeRequest(req, res) {
    try {
      const soapBody = req.body;

      // 详细显示所有接收到的请求
      console.log("\n" + "=".repeat(100));
      console.log(`🔵 [FSU收到请求] ${new Date().toLocaleString()}`);
      console.log("=".repeat(100));
      console.log("📍 请求头信息:");
      console.log(`   Content-Type: ${req.get("Content-Type")}`);
      console.log(`   Content-Length: ${req.get("Content-Length")}`);
      console.log(`   User-Agent: ${req.get("User-Agent") || "未知"}`);
      console.log(`   Host: ${req.get("Host")}`);
      console.log(`   请求路径: ${req.path}`);
      console.log(`   请求方法: ${req.method}`);

      console.log("\n📄 完整SOAP请求报文:");
      console.log("─".repeat(80));
      if (soapBody) {
        console.log(this.formatXmlForConsole(soapBody));
      } else {
        console.log("❌ 请求体为空");
      }
      console.log("─".repeat(80));

      logger.debug("收到SC的invoke请求 - 详细日志", {
        contentType: req.get("Content-Type"),
        bodyLength: soapBody?.length || 0,
        path: req.path,
        method: req.method,
        userAgent: req.get("User-Agent"),
        remoteAddress: req.ip || req.connection.remoteAddress,
        headers: req.headers,
        body: soapBody,
        timestamp: new Date().toISOString(),
      });

      // 解析SOAP请求
      const result = this.parseSoapRequest(soapBody);

      if (!result.success) {
        logger.warn("SOAP请求解析失败", { error: result.error });
        return this.sendErrorResponse(res, "Invalid SOAP request");
      }

      // 根据请求类型处理
      switch (result.requestType) {
        case "GET_FSUINFO":
          this.handleGetFsuInfoRequest(result, res);
          break;
        case "GET_DATA":
          this.handleGetDataRequest(result, res);
          break;
        case "SET_FSUREBOOT":
          this.handleSetFsuRebootRequest(result, res);
          break;
        case "LOGIN":
          this.handleLoginRequest(result, res);
          break;
        case "HEARTBEAT":
          this.handleHeartbeatRequest(result, res);
          break;
        case "GET_FTP":
          // FTP配置请求，返回默认配置
          logger.info("收到FTP配置请求", { requestType: result.requestType });
          this.sendFtpConfigResponse(res, result);
          break;
        case "TIME_CHECK":
          // 时间校准请求，返回当前时间
          logger.info("收到时间校准请求", { requestType: result.requestType });
          this.sendTimeCheckResponse(res, result);
          break;
        default:
          logger.info("收到未实现的请求类型", {
            requestType: result.requestType,
          });
          this.sendErrorResponse(
            res,
            `Request type ${result.requestType} is not implemented yet`
          );
      }
    } catch (error) {
      logger.error("处理invoke请求时发生异常", { error: error.message });
      this.sendErrorResponse(res, "Internal server error");
    }
  }

  /**
   * 解析SOAP请求
   */
  parseSoapRequest(soapBody) {
    try {
      let xmlContent = null;

      logger.debug("收到SOAP请求体", { body: soapBody });

      // 详细显示SOAP解析过程
      console.log("\n🔍 [SOAP解析] 开始解析请求");
      console.log("📄 SOAP请求体长度:", soapBody?.length || 0);
      console.log(
        "📄 SOAP请求体预览:",
        soapBody?.substring(0, 300) + (soapBody?.length > 300 ? "..." : "")
      );

      // 方法1：查找xmlStr内容（CDATA格式）- 支持不同的命名空间
      const xmlStrMatch = soapBody.match(
        /<(?:ns1:|)xmlStr><!\[CDATA\[(.*?)\]\]><\/(?:ns1:|)xmlStr>/s
      );
      if (xmlStrMatch) {
        xmlContent = xmlStrMatch[1];
        logger.debug("使用xmlStr格式解析");
        console.log("✅ 使用xmlStr格式成功解析");
      } else {
        console.log("❌ xmlStr格式解析失败");
        // 方法2：查找xmlData内容（SC实际使用的格式）
        const xmlDataMatch = soapBody.match(/<xmlData>(.*?)<\/xmlData>/s);
        if (xmlDataMatch) {
          xmlContent = xmlDataMatch[1]
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, "&");
          logger.debug("使用xmlData格式解析");
          console.log("✅ 使用xmlData格式成功解析");
        } else {
          console.log("❌ xmlData格式解析失败");
          // 方法3：查找arg0内容（备用格式）
          const arg0Match = soapBody.match(/<arg0>(.*?)<\/arg0>/s);
          if (arg0Match) {
            xmlContent = arg0Match[1]
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, "&");
            logger.debug("使用arg0格式解析");
          } else {
            // 方法4：查找直接的XML内容（可能在不同的标签中）
            const invokeMatch = soapBody.match(/<invoke[^>]*>(.*?)<\/invoke>/s);
            if (invokeMatch) {
              const innerContent = invokeMatch[1];
              // 查找任何包含Request的XML
              const requestMatch = innerContent.match(
                /(<Request>.*?<\/Request>)/s
              );
              if (requestMatch) {
                xmlContent = requestMatch[1]
                  .replace(/&lt;/g, "<")
                  .replace(/&gt;/g, ">")
                  .replace(/&quot;/g, '"')
                  .replace(/&amp;/g, "&");
                logger.debug("使用直接Request格式解析");
              }
            }
          }
        }
      }

      if (!xmlContent) {
        logger.error("无法解析SOAP请求", { soapBody });
        console.log("❌ [SOAP解析失败] 所有解析方法都失败了");
        console.log("📄 完整SOAP请求体:");
        console.log(soapBody);
        return {
          success: false,
          error: "No valid XML content found in SOAP body",
        };
      }

      logger.debug("提取的XML内容", { xml: xmlContent });
      console.log("✅ [SOAP解析成功] 提取的XML内容:");
      console.log(xmlContent);

      // 解析请求类型
      const nameMatch = xmlContent.match(/<Name>(.*?)<\/Name>/);
      const codeMatch = xmlContent.match(/<Code>(\d+)<\/Code>/);
      const fsuIdMatch = xmlContent.match(/<FsuId>(.*?)<\/FsuId>/);

      console.log("🔍 [请求类型识别]");
      console.log("   Name:", nameMatch ? nameMatch[1] : "未找到");
      console.log("   Code:", codeMatch ? codeMatch[1] : "未找到");
      console.log("   FsuId:", fsuIdMatch ? fsuIdMatch[1] : "未找到");

      // 解析设备信息（用于GET_DATA请求）
      const deviceMatches = xmlContent.match(
        /<Device[^>]*Id="([^"]*)"[^>]*Code="([^"]*)"[^>]*>/g
      );
      let devices = [];
      if (deviceMatches) {
        devices = deviceMatches.map((deviceStr) => {
          const idMatch = deviceStr.match(/Id="([^"]*)"/);
          const codeMatch = deviceStr.match(/Code="([^"]*)"/);
          return {
            id: idMatch ? idMatch[1] : null,
            code: codeMatch ? codeMatch[1] : null,
          };
        });
      }

      if (!nameMatch || !codeMatch) {
        return { success: false, error: "Invalid XML format" };
      }

      return {
        success: true,
        requestType: nameMatch[1],
        requestCode: parseInt(codeMatch[1]),
        fsuId: fsuIdMatch ? fsuIdMatch[1] : null,
        devices: devices,
        xmlContent: xmlContent,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 处理GET_FSUINFO心跳请求
   */
  handleGetFsuInfoRequest(requestData, res) {
    // 详细记录心跳请求
    logger.info("=== 收到GET_FSUINFO心跳请求 ===", {
      timestamp: new Date().toLocaleString(),
      requestType: "GET_FSUINFO",
      requestCode: "1701",
      requestFsuId: requestData.fsuId,
      myFsuId: this.fsuData?.fsuId,
      rawXml: requestData.xmlContent,
    });

    console.log("\n💓 [心跳请求] " + new Date().toLocaleString());
    console.log("📍 请求FSU ID:", requestData.fsuId);
    console.log("📍 已注册设备数量:", this.fsuDevices.size);
    console.log("📋 可用设备列表:", Array.from(this.fsuDevices.keys()));
    console.log("📄 原始XML请求:");
    console.log(this.formatXmlForConsole(requestData.xmlContent));

    const heartbeatData = {
      timestamp: new Date(),
      requestFsuId: requestData.fsuId,
      success: false,
      error: null,
    };

    // 查找请求的FSU设备
    const targetFsuData = this.getFsuDevice(requestData.fsuId);

    if (!targetFsuData) {
      logger.warn("未找到请求的FSU设备", {
        requestFsuId: requestData.fsuId,
        availableDevices: Array.from(this.fsuDevices.keys()),
      });

      console.log("❌ 未找到请求的FSU设备");
      console.log("💡 设备已下线，不响应心跳请求");

      heartbeatData.success = false;
      heartbeatData.error = "未找到FSU设备";

      // 发出心跳事件
      this.emit("heartbeat", heartbeatData);

      // 根据心跳模式决定响应方式
      if (this.heartbeatMode === "strict") {
        // 严格模式：设备下线就不响应
        logger.info("=== 严格模式：设备未找到，不响应心跳请求 ===", {
          timestamp: new Date().toLocaleString(),
          requestFsuId: requestData.fsuId,
          reason: "设备已下线或未注册",
          action: "返回404不响应",
          mode: "strict",
        });

        console.log("\n🚫 [严格模式-不响应] " + new Date().toLocaleString());
        console.log("📍 请求的FSU ID:", requestData.fsuId);
        console.log("📋 当前在线设备:", Array.from(this.fsuDevices.keys()));
        console.log("💡 逻辑: 设备下线就不应该响应心跳");
        console.log("🔧 模式: 严格模式 (FSU_HEARTBEAT_MODE=strict)");
        console.log("─".repeat(80));

        // 返回404表示设备不存在/已下线
        res.status(404).json({
          error: "FSU设备未找到或已下线",
          requestFsuId: requestData.fsuId,
          availableDevices: Array.from(this.fsuDevices.keys()),
          timestamp: new Date().toISOString(),
        });
        return;
      } else {
        // 兼容模式：返回失败响应
        const responseXml = this.buildGetFsuInfoResponse(requestData.fsuId, 0);

        logger.warn("=== 兼容模式：发送GET_FSUINFO_ACK响应(设备未找到) ===", {
          timestamp: new Date().toLocaleString(),
          responseType: "GET_FSUINFO_ACK",
          responseCode: "1702",
          result: 0,
          reason: "FSU设备未找到",
          requestFsuId: requestData.fsuId,
          responseXml: responseXml,
          mode: "compatible",
        });

        console.log(
          "\n⚠️ [兼容模式-返回失败响应] " + new Date().toLocaleString()
        );
        console.log("📍 请求的FSU ID:", requestData.fsuId);
        console.log("📋 当前在线设备:", Array.from(this.fsuDevices.keys()));
        console.log("🔧 模式: 兼容模式 (FSU_HEARTBEAT_MODE=compatible)");
        console.log("📄 响应XML:");
        console.log(this.formatXmlForConsole(responseXml));
        console.log("─".repeat(80));

        this.sendSoapResponse(res, responseXml);
        return;
      }
    }

    // 找到对应的FSU设备，返回成功响应
    logger.info("找到对应FSU设备，返回心跳成功响应", {
      fsuId: targetFsuData.fsuId,
      fsuCode: targetFsuData.fsuCode,
    });
    console.log("✅ 找到对应FSU设备");
    console.log("📍 设备信息:", {
      fsuId: targetFsuData.fsuId,
      fsuCode: targetFsuData.fsuCode,
      internalIP: targetFsuData.internalIP,
    });

    heartbeatData.success = true;
    heartbeatData.fsuId = targetFsuData.fsuId;
    heartbeatData.targetDevice = targetFsuData;

    // 发出心跳事件
    this.emit("heartbeat", heartbeatData);

    // 使用找到的设备数据构建响应
    const responseXml = this.buildGetFsuInfoResponse(
      targetFsuData.fsuId,
      1,
      targetFsuData
    );

    logger.info("=== 发送GET_FSUINFO_ACK响应(成功) ===", {
      timestamp: new Date().toLocaleString(),
      responseType: "GET_FSUINFO_ACK",
      responseCode: "1702",
      result: 1,
      fsuId: targetFsuData.fsuId,
      fsuCode: targetFsuData.fsuCode,
      responseXml: responseXml,
    });

    console.log("\n💚 [心跳响应-成功] " + new Date().toLocaleString());
    console.log("📍 响应FSU ID:", targetFsuData.fsuId);
    console.log("📍 响应FSU Code:", targetFsuData.fsuCode);
    console.log("📄 响应XML:");
    console.log(this.formatXmlForConsole(responseXml));
    console.log("─".repeat(80));

    this.sendSoapResponse(res, responseXml);
  }

  /**
   * 构造GET_FSUINFO_ACK响应（按照用户指定的格式）
   */
  buildGetFsuInfoResponse(fsuId, result, deviceData = null) {
    // 如果有设备数据，使用设备数据中的fsuCode，否则使用fsuId
    const fsuCode = deviceData?.fsuCode || deviceData?.fsuId || fsuId;

    // 使用用户指定的简化格式
    const xml = `<?xml version="1.0" encoding="utf-8"?><Response><PK_Type><Name>GET_FSUINFO_ACK</Name><Code>1702</Code></PK_Type><Info><FsuId>${fsuId}</FsuId><FsuCode>${fsuCode}</FsuCode><Result>${result}</Result></Info></Response>`;

    logger.debug("构造GET_FSUINFO_ACK响应", {
      fsuId,
      fsuCode,
      result,
      hasDeviceData: !!deviceData,
      xmlLength: xml.length,
    });

    return xml;
  }

  /**
   * 获取系统状态信息
   */
  getSystemStatus() {
    const os = require("os");

    try {
      // 计算CPU使用率（简化版本）
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach((cpu) => {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const cpuUsage = (((total - idle) / total) * 100).toFixed(1);

      // 计算内存使用率
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memUsage = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);

      return {
        cpuUsage: parseFloat(cpuUsage),
        memUsage: parseFloat(memUsage),
      };
    } catch (error) {
      logger.warn("获取系统状态失败，使用默认值", { error: error.message });
      // 返回默认值
      return {
        cpuUsage: 25.0,
        memUsage: 45.0,
      };
    }
  }

  /**
   * 处理GET_DATA设备数据请求
   */
  handleGetDataRequest(requestData, res) {
    try {
      // 详细记录接收到的请求
      logger.info("=== 收到GET_DATA请求 ===", {
        timestamp: new Date().toLocaleString(),
        requestType: "GET_DATA",
        requestCode: "401",
        requestFsuId: requestData.fsuId,
        myFsuId: this.fsuData?.fsuId,
        devices: requestData.devices,
        rawXml: requestData.xmlContent,
      });

      console.log("\n🔵 [GET_DATA请求] " + new Date().toLocaleString());
      console.log("📍 FSU ID:", requestData.fsuId);
      console.log("📱 设备列表:", requestData.devices);
      console.log("📄 原始XML请求:");
      console.log(this.formatXmlForConsole(requestData.xmlContent));

      const fsuId = requestData.fsuId;

      // 如果没有设备列表，返回错误
      if (!requestData.devices || requestData.devices.length === 0) {
        logger.warn("GET_DATA请求中没有设备信息");
        console.log("❌ 错误: 请求中没有设备信息");

        const errorResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><PK_Type><Name>GET_DATA_ACK</Name><Code>402</Code></PK_Type><Info><FsuId>${fsuId}</FsuId><FsuCode>${fsuId}</FsuCode><Result>0</Result></Info></Response>`;
        this.sendSoapResponse(res, errorResponse);
        return;
      }

      // 处理第一个设备（通常SC每次只请求一个设备）
      const device = requestData.devices[0];
      const deviceId = device.id;

      logger.info("查询设备数据", { fsuId, deviceId });
      console.log("🔍 查询设备:", deviceId);

      // 使用设备数据管理器获取响应
      const responseXml = deviceDataManager.getDeviceResponse(fsuId, deviceId);

      if (!responseXml) {
        logger.warn("未找到匹配的设备数据", { fsuId, deviceId });
        console.log("❌ 错误: 未找到匹配的设备数据");

        // 返回失败响应
        const errorResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><PK_Type><Name>GET_DATA_ACK</Name><Code>402</Code></PK_Type><Info><FsuId>${fsuId}</FsuId><FsuCode>${fsuId}</FsuCode><Result>0</Result></Info></Response>`;
        this.sendSoapResponse(res, errorResponse);
        return;
      }

      // 详细记录响应数据
      logger.info("=== 发送GET_DATA_ACK响应 ===", {
        timestamp: new Date().toLocaleString(),
        responseType: "GET_DATA_ACK",
        responseCode: "402",
        fsuId: fsuId,
        deviceId: deviceId,
        success: true,
        responseXml: responseXml,
      });

      console.log("\n✅ [GET_DATA_ACK响应] " + new Date().toLocaleString());
      console.log("📍 FSU ID:", fsuId);
      console.log("📱 设备ID:", deviceId);
      console.log("📄 响应XML:");
      console.log(this.formatXmlForConsole(responseXml));
      console.log("─".repeat(80));

      // 发出数据请求事件
      this.emit("dataRequest", {
        timestamp: new Date(),
        fsuId: fsuId,
        deviceId: deviceId,
        success: true,
      });

      // 返回设备数据响应
      this.sendSoapResponse(res, responseXml);

      logger.info("GET_DATA响应已发送", { fsuId, deviceId });
    } catch (error) {
      logger.error("处理GET_DATA请求时发生异常", {
        error: error.message,
        requestData,
      });

      console.log("❌ [错误] " + new Date().toLocaleString());
      console.log("错误信息:", error.message);

      const fsuId = requestData.fsuId || this.fsuData?.fsuId;
      const errorResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><PK_Type><Name>GET_DATA_ACK</Name><Code>402</Code></PK_Type><Info><FsuId>${fsuId}</FsuId><FsuCode>${fsuId}</FsuCode><Result>0</Result></Info></Response>`;
      this.sendSoapResponse(res, errorResponse);
    }
  }

  /**
   * 处理SET_FSUREBOOT重启请求
   */
  handleSetFsuRebootRequest(requestData, res) {
    logger.info("收到FSU重启请求", { fsuId: requestData.fsuId });

    // 构造重启响应
    const responseXml = `<?xml version="1.0" encoding="UTF-8"?><Response><PK_Type><Name>SET_FSUREBOOT_ACK</Name><Code>1802</Code></PK_Type><Info><FsuId>${this.fsuData?.fsuId}</FsuId><FsuCode>${this.fsuData?.fsuId}</FsuCode><Result>1</Result></Info></Response>`;

    this.sendSoapResponse(res, responseXml);
  }

  /**
   * 发送SOAP响应
   */
  sendSoapResponse(res, xmlContent) {
    const soapResponse = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <soapenv:Body>
        <ns1:invokeResponse soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:ns1="http://webservice/">
            <invokeReturn xsi:type="soapenc:string" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">${this.escapeXml(
              xmlContent
            )}</invokeReturn>
        </ns1:invokeResponse>
    </soapenv:Body>
</soapenv:Envelope>`;

    res.set({
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: '"invokeResponse"',
    });

    // 详细显示发送的响应
    console.log("\n" + "=".repeat(100));
    console.log(`✅ [FSU发送响应] ${new Date().toLocaleString()}`);
    console.log("=".repeat(100));
    console.log("📍 响应头信息:");
    console.log(`   Content-Type: text/xml; charset=utf-8`);
    console.log(`   Content-Length: ${soapResponse.length}`);
    console.log(`   SOAPAction: "invokeResponse"`);
    console.log(`   Status: 200 OK`);

    console.log("\n📄 完整SOAP响应报文:");
    console.log("─".repeat(80));
    console.log(this.formatXmlForConsole(soapResponse));
    console.log("─".repeat(80));

    console.log("\n📋 解析后的XML内容:");
    console.log("─".repeat(80));
    console.log(this.formatXmlForConsole(xmlContent));
    console.log("─".repeat(80));
    console.log("=".repeat(100));

    logger.info("发送SOAP响应", {
      responseLength: soapResponse.length,
      xmlContent: xmlContent,
      fullSoapResponse: soapResponse,
    });

    res.send(soapResponse);
  }

  /**
   * 发送FTP配置响应
   */
  sendFtpConfigResponse(res, requestData) {
    const ftpXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <PK_Type>
    <Name>GET_FTP_ACK</Name>
    <Code>1602</Code>
  </PK_Type>
  <Info>
    <FsuId>${requestData.fsuId || this.fsuData?.fsuId}</FsuId>
    <FsuCode>${requestData.fsuId || this.fsuData?.fsuId}</FsuCode>
    <Result>1</Result>
    <FtpIP>127.0.0.1</FtpIP>
    <FtpPort>21</FtpPort>
    <FtpUser>fsu</FtpUser>
    <FtpPassword>fsu123</FtpPassword>
  </Info>
</Response>`;
    this.sendSoapResponse(res, ftpXml);
  }

  /**
   * 发送时间校准响应
   */
  sendTimeCheckResponse(res, requestData) {
    const now = new Date();
    const timeXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <PK_Type>
    <Name>TIME_CHECK_ACK</Name>
    <Code>1302</Code>
  </PK_Type>
  <Info>
    <Result>1</Result>
    <Time>
      <Years>${now.getFullYear()}</Years>
      <Month>${String(now.getMonth() + 1).padStart(2, "0")}</Month>
      <Day>${String(now.getDate()).padStart(2, "0")}</Day>
      <Hour>${String(now.getHours()).padStart(2, "0")}</Hour>
      <Minute>${String(now.getMinutes()).padStart(2, "0")}</Minute>
      <Second>${String(now.getSeconds()).padStart(2, "0")}</Second>
    </Time>
  </Info>
</Response>`;
    this.sendSoapResponse(res, timeXml);
  }

  /**
   * 发送错误响应
   */
  sendErrorResponse(res, errorMessage) {
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?><Request><PK_Type><Name>ERROR</Name><Code>0</Code></PK_Type><Info><Message>${errorMessage}</Message></Info></Request>`;
    this.sendSoapResponse(res, errorXml);
  }

  /**
   * XML转义
   */
  escapeXml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * 格式化XML用于控制台显示
   */
  formatXmlForConsole(xml) {
    if (!xml) return "N/A";

    try {
      // 简单的XML格式化，添加缩进
      let formatted = xml
        .replace(/></g, ">\n<")
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return "";

          // 计算缩进级别
          const depth =
            (xml.substring(0, xml.indexOf(trimmed)).match(/</g) || []).length -
            (xml.substring(0, xml.indexOf(trimmed)).match(/</g) || []).length;

          // 简单缩进
          if (
            trimmed.includes("<PK_Type>") ||
            trimmed.includes("<Info>") ||
            trimmed.includes("<Values>")
          ) {
            return "  " + trimmed;
          } else if (
            trimmed.includes("<DeviceList>") ||
            trimmed.includes("<Device")
          ) {
            return "    " + trimmed;
          } else if (trimmed.includes("<TSemaphore")) {
            return "      " + trimmed;
          } else if (trimmed.includes("</")) {
            return "  " + trimmed;
          }

          return trimmed;
        })
        .filter((line) => line.trim())
        .join("\n");

      return formatted;
    } catch (error) {
      // 如果格式化失败，返回原始XML的前500个字符
      return xml.substring(0, 500) + (xml.length > 500 ? "..." : "");
    }
  }

  /**
   * 添加或更新FSU设备信息
   * @param {Object} fsuData - FSU设备数据
   */
  addFsuDevice(fsuData) {
    if (!fsuData || !fsuData.fsuId) {
      logger.warn("无效的FSU设备数据", { fsuData });
      return false;
    }

    // 标准化fsuData，确保同时有fsuid和fsuId
    const normalizedData = { ...fsuData };
    if (normalizedData.fsuid && !normalizedData.fsuId) {
      normalizedData.fsuId = normalizedData.fsuid;
    } else if (normalizedData.fsuId && !normalizedData.fsuid) {
      normalizedData.fsuid = normalizedData.fsuId;
    }

    this.fsuDevices.set(normalizedData.fsuId, normalizedData);
    logger.info(`添加FSU设备: ${normalizedData.fsuId}`, {
      fsuId: normalizedData.fsuId,
      totalDevices: this.fsuDevices.size,
    });

    return true;
  }

  /**
   * 获取FSU设备信息
   * @param {string} fsuId - FSU设备ID
   * @returns {Object|null} FSU设备数据
   */
  getFsuDevice(fsuId) {
    return this.fsuDevices.get(fsuId) || null;
  }

  /**
   * 移除FSU设备
   * @param {string} fsuId - FSU设备ID
   */
  removeFsuDevice(fsuId) {
    const removed = this.fsuDevices.delete(fsuId);
    if (removed) {
      logger.info(`移除FSU设备: ${fsuId}`, {
        remainingDevices: this.fsuDevices.size,
      });
    }
    return removed;
  }

  /**
   * 获取所有FSU设备列表
   */
  getAllFsuDevices() {
    return Array.from(this.fsuDevices.values());
  }

  /**
   * 启动WebService服务器 - 改进版本，支持多FSU设备管理
   */
  async start(fsuData = null, port = 8080, bindAddress = null) {
    if (this.isRunning) {
      logger.info("FSU WebService服务器已在运行，添加FSU设备到现有服务器");
      if (fsuData) {
        this.addFsuDevice(fsuData);
      }
      return Promise.resolve(true);
    }

    // 执行网络诊断
    console.log("\n🔍 [启动诊断] 检查网络环境...");
    const diagnostic =
      await networkDiagnostics.performComprehensiveDiagnostic();

    // 如果检测到代理，创建无代理环境用于WebService
    let proxyFreeEnv = null;
    if (
      diagnostic.proxy.systemProxy?.enabled ||
      diagnostic.proxy.processProxy?.detected
    ) {
      console.log("🔧 [代理检测] 为WebService创建无代理环境...");
      proxyFreeEnv = networkDiagnostics.createProxyFreeEnvironment();
    }

    // 如果提供了fsuData，添加到设备列表
    if (fsuData) {
      // 标准化fsuData，确保同时有fsuid和fsuId
      this.fsuData = fsuData;
      if (fsuData.fsuid && !fsuData.fsuId) {
        this.fsuData.fsuId = fsuData.fsuid;
      } else if (fsuData.fsuId && !fsuData.fsuid) {
        this.fsuData.fsuid = fsuData.fsuId;
      }

      // 添加到设备列表中
      this.addFsuDevice(this.fsuData);
    }

    // 确定绑定地址：优先使用传入的bindAddress，其次使用fsuData中的internalIP，最后使用0.0.0.0
    const finalBindAddress = bindAddress || fsuData?.internalIP || "0.0.0.0";

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, finalBindAddress, (err) => {
        if (err) {
          logger.error("启动FSU WebService服务器失败", {
            error: err.message,
            port,
            bindAddress: finalBindAddress,
          });
          reject(err);
          return;
        }

        this.isRunning = true;
        this.serverStartTime = new Date();

        logger.info("FSU WebService服务器已启动", {
          port: port,
          address: `http://${finalBindAddress}:${port}`,
          bindAddress: finalBindAddress,
          registeredDevices: this.fsuDevices.size,
          deviceList: Array.from(this.fsuDevices.keys()),
          heartbeatMode: this.heartbeatMode,
        });

        console.log(
          `\n🎯 [心跳模式] ${
            this.heartbeatMode === "strict" ? "严格模式" : "兼容模式"
          }`
        );
        if (this.heartbeatMode === "strict") {
          console.log("💡 严格模式: 未注册设备的心跳请求将返回404");
        } else {
          console.log("💡 兼容模式: 未注册设备的心跳请求将返回失败响应");
        }
        console.log(
          "🔧 切换模式: 设置环境变量 FSU_HEARTBEAT_MODE=strict|compatible"
        );

        resolve(true);
      });
    });
  }

  /**
   * 停止WebService服务器 - 只有在没有FSU设备时才真正停止
   */
  stop(forceStop = false) {
    if (!this.isRunning || !this.server) {
      return Promise.resolve();
    }

    // 如果还有FSU设备在线且不是强制停止，则不停止服务器
    if (!forceStop && this.fsuDevices.size > 0) {
      logger.info("WebService服务器保持运行，仍有FSU设备在线", {
        deviceCount: this.fsuDevices.size,
        devices: Array.from(this.fsuDevices.keys()),
      });
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        this.server = null;
        this.serverStartTime = null;
        logger.info("FSU WebService服务器已停止", {
          reason: forceStop ? "强制停止" : "无设备在线",
        });
        resolve();
      });
    });
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.server?.address()?.port,
      serverStartTime: this.serverStartTime,
      registeredDevices: this.fsuDevices.size,
      deviceList: Array.from(this.fsuDevices.keys()),
      uptime: this.serverStartTime
        ? Date.now() - this.serverStartTime.getTime()
        : 0,
    };
  }

  /**
   * 强制停止WebService服务器（用于系统关闭）
   */
  forceStop() {
    return this.stop(true);
  }

  /**
   * 检查是否有设备在线
   */
  hasOnlineDevices() {
    return this.fsuDevices.size > 0;
  }

  /**
   * 获取设备数量
   */
  getDeviceCount() {
    return this.fsuDevices.size;
  }
}

module.exports = new FSUWebServiceServer();
