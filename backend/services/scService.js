const smartAxios = require("../utils/smartAxios");
const scConfig = require("../config/sc");
const {
  buildRegisterXml,
  parseScResponse,
  buildSoapMessage,
  buildLogoutXml,
  buildLogoutSoapMessage,
  buildLogoutXmlEmpty,
  buildLogoutXmlOnlyFsuId,
  buildLogoutSoapMessageEmpty,
  buildLogoutSoapMessageOnlyFsuId,
} = require("../utils/xmlBuilder");
const logger = require("../utils/logger");
const FSULogAnalyzer = require("../utils/fsuLogAnalyzer");
const ScipRecord = require("../models/ScipRecord");

// 创建全局日志分析器实例
const fsuLogAnalyzer = new FSULogAnalyzer();

/**
 * 发送FSU注册请求到SC服务器
 * @param {Object} fsuData - FSU设备数据
 * @returns {Promise<Object>} 注册结果
 */
const sendRegisterToSC = async (fsuData) => {
  let retryCount = 0;
  const maxRetries = scConfig.retryCount;

  while (retryCount < maxRetries) {
    try {
      logger.info(
        `开始向SC发送FSU注册请求，FSU ID: ${fsuData.fsuId}，尝试次数: ${
          retryCount + 1
        }`
      );

      // 1. 构造XML报文
      const xmlBody = buildRegisterXml(fsuData);
      logger.debug(`构造的XML报文:`, { xml: xmlBody });

      // 2. 构造请求URL
      const serverHost = fsuData.scServerAddress || scConfig.host;
      const scUrl = `${scConfig.protocol}://${serverHost}:${scConfig.port}${scConfig.registerPath}`;
      logger.info(`SC服务器地址: ${scUrl}`);

      // 3. 发送HTTP请求（使用智能axios，自动检测代理）
      const response = await smartAxios.post(scUrl, xmlBody, {
        headers: {
          "Content-Type": scConfig.contentType,
          "User-Agent": "FSU-Register-System/1.0",
        },
        timeout: scConfig.timeout,
        validateStatus: function (status) {
          // 接受200-299和400-499的状态码（SC可能返回业务错误）
          return status >= 200 && status < 500;
        },
      });

      logger.info(`SC服务器响应状态: ${response.status}`);
      logger.debug(`SC服务器响应内容:`, { data: response.data });

      // 4. 解析SC响应
      const result = parseScResponse(response.data);

      if (result.success) {
        logger.info(`FSU注册成功，FSU ID: ${fsuData.fsuId}`, { result });
        return {
          success: true,
          message: result.message || "FSU设备注册成功",
          data: {
            fsuId: fsuData.fsuId,
            registerTime: new Date().toISOString(),
            scResponse: result,
          },
        };
      } else {
        logger.warn(`FSU注册失败，FSU ID: ${fsuData.fsuId}`, { result });
        return {
          success: false,
          message: result.message || "FSU设备注册失败",
          error: {
            code: result.code,
            details: result.message,
          },
        };
      }
    } catch (error) {
      retryCount++;
      logger.error(
        `与SC通信失败，FSU ID: ${fsuData.fsuId}，尝试次数: ${retryCount}`,
        {
          error: error.message,
          stack: error.stack,
          config: {
            url: error.config?.url,
            timeout: error.config?.timeout,
          },
        }
      );

      // 如果是最后一次重试，返回失败结果
      if (retryCount >= maxRetries) {
        return {
          success: false,
          message: `与SC服务器通信失败，已重试${maxRetries}次`,
          error: {
            code: "NETWORK_ERROR",
            details: error.message,
            retries: retryCount,
          },
        };
      }

      // 等待后重试
      logger.info(`等待${scConfig.retryInterval / 1000}秒后重试...`);
      await new Promise((resolve) =>
        setTimeout(resolve, scConfig.retryInterval)
      );
    }
  }
};

/**
 * 测试与SC服务器的连接
 * @returns {Promise<Object>} 连接测试结果
 */
const testScConnection = async () => {
  try {
    const scUrl = `${scConfig.protocol}://${scConfig.host}:${scConfig.port}`;
    logger.info(`测试SC服务器连接: ${scUrl}`);

    const response = await smartAxios.get(scUrl, {
      timeout: 3000,
      validateStatus: function (status) {
        return status < 500; // 只要不是服务器错误就算连接成功
      },
    });

    logger.info(`SC服务器连接测试成功，状态码: ${response.status}`);
    return {
      success: true,
      message: "SC服务器连接正常",
      status: response.status,
    };
  } catch (error) {
    logger.error(`SC服务器连接测试失败: ${error.message}`);
    return {
      success: false,
      message: "SC服务器连接失败",
      error: error.message,
    };
  }
};

/**
 * 直接发送LOGIN报文到SC服务器（使用真实报文格式）
 * @param {Object} fsuData - FSU设备数据
 * @returns {Promise<Object>} 登录结果
 */
const sendDirectLogin = async (fsuData) => {
  const interfaceName = "GET FSUINFO";
  let logId = null;

  try {
    logger.info(`开始向SC发送直接LOGIN请求，FSU ID: ${fsuData.fsuId}`);

    // 1. 构造真实的XML报文
    const xmlBody = buildRegisterXml(fsuData);
    logger.info(`构造的LOGIN报文:`, { xml: xmlBody });

    // 2. 尝试多个可能的WebService路径和请求格式
    const possibleConfigs = [
      // 优先使用发现的真实服务SCService
      { path: "/services/SCService", type: "soap", service: "SCService" },
      { path: "/services/SCService", type: "raw", service: "SCService" },
      // 备用的其他服务
      {
        path: "/services/FSUWebService",
        type: "soap",
        service: "FSUWebService",
      },
      // 调试用：获取服务列表和WSDL文档
      { path: "/axis/services", type: "get", service: null },
      { path: "/services", type: "get", service: null },
      { path: "/axis", type: "get", service: null },
      { path: "/", type: "get", service: null },
    ];

    let response = null;
    let successConfig = null;

    // 逐个尝试不同的路径和服务配置
    for (const config of possibleConfigs) {
      try {
        // 使用前端传递的SC服务器地址，如果没有则使用配置文件默认值
        const serverHost = fsuData.scServerAddress || scConfig.host;
        const scUrl = `${scConfig.protocol}://${serverHost}:${scConfig.port}${config.path}`;

        // 开始记录接口调用日志
        logId = fsuLogAnalyzer.logRequestStart(interfaceName, scUrl, xmlBody);

        logger.info(
          `尝试SC服务器地址: ${scUrl}，类型: ${config.type}，服务名: ${config.service}`
        );

        // 根据规范使用原始XML报文（不使用SOAP包装）
        const requestBody =
          config.type === "raw"
            ? xmlBody
            : buildSoapMessage(fsuData, config.service);

        const headers =
          config.type === "raw"
            ? {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction: '"invoke"',
                "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
              }
            : {
                "Content-Type": "text/xml; charset=utf-8",
                SOAPAction: '"invoke"',
                "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
              };

        if (config.type === "get") {
          logger.info(`发送GET请求获取服务信息`);
          response = await smartAxios.get(scUrl, {
            headers: {
              "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
            },
            timeout: scConfig.timeout,
            validateStatus: function (status) {
              return status >= 200 && status < 600;
            },
          });
        } else {
          logger.info(`请求头部:`, headers);
          logger.info(`请求体预览:`, {
            body: requestBody.substring(0, 200) + "...",
          });

          response = await smartAxios.post(scUrl, requestBody, {
            headers: headers,
            timeout: scConfig.timeout,
            validateStatus: function (status) {
              // 接受所有状态码以便分析响应
              return status >= 200 && status < 600;
            },
          });
        }

        // 检查是否是SOAP成功响应
        if (response.status === 200 && config.type === "soap") {
          // 解析SOAP响应中的实际内容
          if (response.data.includes("invokeReturn")) {
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

              // 检查是否是LOGIN_ACK响应
              if (
                returnContent.includes("LOGIN_ACK") ||
                returnContent.includes("Code>102<")
              ) {
                logger.info(
                  `✅ LOGIN请求成功: ${config.path} (${config.service})，状态码: ${response.status}`
                );
                logger.info(`SC服务器响应内容:`, {
                  decodedResponse: returnContent,
                  headers: response.headers,
                });

                // 异步提取并保存SCIP信息（不阻塞主流程）
                setImmediate(() => {
                  try {
                    const scipMatch = returnContent.match(
                      /<SCIP>([^<]+)<\/SCIP>/
                    );
                    const rightLevelMatch = returnContent.match(
                      /<RightLevel>([^<]+)<\/RightLevel>/
                    );

                    if (
                      scipMatch &&
                      scipMatch[1] &&
                      scipMatch[1].trim() !== ""
                    ) {
                      const scip = scipMatch[1].trim();
                      const rightLevel = rightLevelMatch
                        ? rightLevelMatch[1].trim()
                        : "";

                      logger.info(`🎯 从LOGIN_ACK响应中提取到SCIP: ${scip}`, {
                        fsuId: fsuData.fsuId,
                        scip,
                        rightLevel,
                      });

                      // 异步存储SCIP记录
                      ScipRecord.recordScip(
                        fsuData.fsuId,
                        scip,
                        rightLevel,
                        returnContent,
                        "register"
                      )
                        .then((scipRecord) => {
                          logger.info(`✅ SCIP记录保存成功`, {
                            fsuId: fsuData.fsuId,
                            scip,
                            recordId: scipRecord._id,
                          });
                        })
                        .catch((error) => {
                          logger.error(
                            `❌ SCIP记录保存失败: ${error.message}`,
                            {
                              fsuId: fsuData.fsuId,
                              scip,
                              error: error.message,
                            }
                          );
                        });
                    }
                  } catch (scipError) {
                    logger.error(
                      `❌ 提取SCIP信息时发生错误: ${scipError.message}`,
                      {
                        fsuId: fsuData.fsuId,
                        error: scipError.message,
                      }
                    );
                  }
                });

                // 记录成功日志
                fsuLogAnalyzer.logRequestSuccess(
                  logId,
                  response.data,
                  response.status
                );

                // 直接返回成功结果
                return {
                  success: true,
                  message: "LOGIN请求成功，FSU设备已上线",
                  data: {
                    fsuId: fsuData.fsuId,
                    status: response.status,
                    response: returnContent,
                    rawResponse: response.data,
                    headers: response.headers,
                    loginStatus: "SUCCESS",
                    responseType: "LOGIN_ACK",
                  },
                };
              }
            }
          }
        }

        // 如果不是404或500服务未找到错误，说明找到了正确的路径
        if (
          response.status !== 404 &&
          !response.data.includes("could not find a target service")
        ) {
          successConfig = config;
          logger.info(
            `找到有效配置: ${config.path} (${config.service})，状态码: ${response.status}`
          );
          break;
        } else {
          logger.warn(
            `配置 ${config.path} (${config.service}) 无效，尝试下一个`
          );
        }
      } catch (error) {
        logger.warn(
          `配置 ${config.path} (${config.service}) 请求失败: ${error.message}`
        );

        // 记录错误日志
        if (logId) {
          fsuLogAnalyzer.logRequestError(logId, error);
          logId = null; // 重置logId以便下次尝试
        }

        continue;
      }
    }

    if (!response) {
      throw new Error("所有路径都尝试失败");
    }

    logger.info(`SC服务器响应状态: ${response.status}`);
    logger.info(`SC服务器响应内容:`, {
      data: response.data,
      headers: response.headers,
    });

    // 4. 分析响应结果
    if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        message: "LOGIN请求发送成功",
        data: {
          fsuId: fsuData.fsuId,
          status: response.status,
          response: response.data,
          headers: response.headers,
        },
      };
    } else {
      return {
        success: false,
        message: `LOGIN请求失败，状态码: ${response.status}`,
        data: {
          status: response.status,
          response: response.data,
        },
      };
    }
  } catch (error) {
    logger.error(`LOGIN请求异常: ${error.message}`, {
      stack: error.stack,
      config: error.config,
    });

    // 记录错误日志
    if (logId) {
      fsuLogAnalyzer.logRequestError(logId, error);
    }

    // 执行网络诊断（仅对超时错误）
    let diagnostics = null;
    if (error.message?.includes("timeout") || error.code === "ECONNRESET") {
      try {
        diagnostics = await fsuLogAnalyzer.performNetworkDiagnostics(
          `${scConfig.protocol}://${scConfig.host}:${scConfig.port}`
        );
      } catch (diagError) {
        logger.warn("网络诊断失败:", diagError.message);
      }
    }

    return {
      success: false,
      message: `LOGIN请求失败: ${error.message}`,
      error: {
        code: "LOGIN_ERROR",
        details: error.message,
      },
      diagnostics,
    };
  }
};

/**
 * 发送FSU下线LOGOUT请求到SC服务器
 * @param {Object} fsuData - FSU设备数据，包含fsuId和scServerAddress
 * @returns {Promise<Object>} 下线结果
 */
const sendLogoutToSC = async (fsuData) => {
  const interfaceName = "LOGOUT";
  let logId = null;

  try {
    const { fsuId, scServerAddress } = fsuData;

    if (!fsuId) {
      throw new Error("FSU ID不能为空");
    }

    logger.info(`开始向SC发送FSU下线LOGOUT请求，FSU ID: ${fsuId}`);

    // 1. 构造LOGOUT XML报文
    const xmlBody = buildLogoutXml(fsuId);
    logger.debug(`构造的LOGOUT报文:`, { xml: xmlBody });

    // 2. 构造请求URL
    const serverHost = scServerAddress || scConfig.host;
    const scUrl = `${scConfig.protocol}://${serverHost}:${scConfig.port}/services/SCService`;
    logger.info(`SC服务器地址: ${scUrl}`);

    // 开始记录接口调用日志
    logId = fsuLogAnalyzer.logRequestStart(interfaceName, scUrl, xmlBody);

    // 3. 尝试多种请求方式和报文格式
    const requestMethods = [
      {
        name: "SOAP包装-带FsuId和FsuCode",
        body: buildLogoutSoapMessage(fsuId),
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: '"invoke"',
          "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
        },
      },
      {
        name: "SOAP包装-官方规范格式(空Info)",
        body: buildLogoutSoapMessageEmpty(fsuId),
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: '"invoke"',
          "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
        },
      },
      {
        name: "SOAP包装-仅FsuId在Info内",
        body: buildLogoutSoapMessageOnlyFsuId(fsuId),
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: '"invoke"',
          "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
        },
      },
      {
        name: "直接XML-带FsuId和FsuCode",
        body: xmlBody,
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
        },
      },
      {
        name: "直接XML-官方规范格式(空Info)",
        body: buildLogoutXmlEmpty(fsuId),
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
        },
      },
      {
        name: "直接XML-仅FsuId在Info内",
        body: buildLogoutXmlOnlyFsuId(fsuId),
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "User-Agent": "FSU-ZXLW/DAM-2160I-RH",
        },
      },
    ];

    let lastError = null;

    for (const method of requestMethods) {
      try {
        logger.info(`尝试发送LOGOUT请求 - 方式: ${method.name}`);

        // 发送HTTP请求
        const response = await smartAxios.post(scUrl, method.body, {
          headers: method.headers,
          timeout: scConfig.timeout,
          validateStatus: function (status) {
            // 接受200-299和400-499的状态码
            return status >= 200 && status < 500;
          },
        });

        logger.info(`SC服务器响应状态: ${response.status}`);
        logger.debug(`SC服务器响应内容:`, { data: response.data });

        // 记录成功的接口调用日志
        if (logId) {
          fsuLogAnalyzer.logRequestSuccess(
            logId,
            response.data,
            response.status
          );
        }

        // 解析响应
        if (response.status >= 200 && response.status < 300) {
          // 检查是否是LOGOUT_ACK响应
          if (
            response.data &&
            (response.data.includes("LOGOUT_ACK") ||
              response.data.includes("<Code>104</Code>"))
          ) {
            logger.info(`✅ FSU设备下线成功`, {
              fsuId: fsuId,
              method: method.name,
              response: response.data,
            });

            return {
              success: true,
              message: "FSU设备下线成功",
              data: {
                fsuId: fsuId,
                method: method.name,
                response: response.data,
              },
            };
          } else {
            logger.warn(`收到非预期的响应格式:`, {
              fsuId: fsuId,
              response: response.data,
            });
          }
        }

        // 如果状态码不是2xx，继续尝试下一种方法
        lastError = new Error(
          `HTTP ${response.status}: ${response.data || "未知错误"}`
        );
      } catch (error) {
        logger.warn(`${method.name}方式发送LOGOUT失败:`, {
          fsuId: fsuId,
          error: error.message,
        });
        lastError = error;
        continue;
      }
    }

    // 所有方法都失败了
    if (logId) {
      fsuLogAnalyzer.logRequestError(
        logId,
        lastError || new Error("所有请求方法都失败")
      );
    }

    logger.error(`FSU设备下线失败，所有请求方法都失败`, {
      fsuId: fsuId,
      lastError: lastError?.message,
    });

    return {
      success: false,
      message: `FSU设备下线失败: ${lastError?.message || "未知错误"}`,
      error: {
        code: "LOGOUT_ERROR",
        details: lastError?.message,
      },
    };
  } catch (error) {
    // 记录失败的接口调用日志
    if (logId) {
      fsuLogAnalyzer.logRequestError(logId, error);
    }

    logger.error(`发送LOGOUT请求异常:`, {
      fsuId: fsuData.fsuId,
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      message: `LOGOUT请求失败: ${error.message}`,
      error: {
        code: "LOGOUT_ERROR",
        details: error.message,
      },
    };
  }
};

module.exports = {
  sendRegisterToSC,
  testScConnection,
  sendDirectLogin,
  sendLogoutToSC,
};
