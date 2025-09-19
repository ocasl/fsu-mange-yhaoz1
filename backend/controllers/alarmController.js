const AlarmRecord = require("../models/AlarmRecord");
const logger = require("../utils/logger");
const { reportAlarm, clearAlarm } = require("../utils/alarmManager");

/**
 * @desc    获取告警记录列表
 * @route   GET /api/alarm/:type/list
 * @access  Public
 */
exports.getAlarmList = async (req, res) => {
  try {
    const { type } = req.params;
    const {
      page = 1,
      pageSize = 10,
      fsuid,
      signalId,
      alarmDesc,
      deviceId,
      creator,
    } = req.query;

    // 验证类型
    if (type !== "report" && type !== "clear") {
      return res.status(400).json({
        success: false,
        message: "无效的告警类型",
        error: "INVALID_TYPE",
      });
    }

    // 构建查询条件
    const query = { type };
    if (fsuid) query.fsuid = { $regex: fsuid, $options: "i" };
    if (signalId) query.signalId = { $regex: signalId, $options: "i" };
    if (alarmDesc) query.alarmDesc = { $regex: alarmDesc, $options: "i" };
    if (deviceId) query.deviceId = { $regex: deviceId, $options: "i" };
    if (creator) query.creator = { $regex: creator, $options: "i" };

    // 分页查询
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 执行查询
    const total = await AlarmRecord.countDocuments(query);
    const list = await AlarmRecord.find(query)
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(limit);

    // 返回结果
    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    logger.error(`获取告警记录列表失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "获取告警记录列表失败",
      error: error.message,
    });
  }
};

/**
 * @desc    上报告警
 * @route   POST /api/alarm/report
 * @access  Public
 */
exports.reportAlarmHandler = async (req, res) => {
  try {
    const alarmData = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    logger.info(`收到告警上报请求，客户端IP: ${clientIp}`, { alarmData });

    // 1. 参数校验
    if (
      !alarmData.fsuid ||
      !alarmData.signalId ||
      !alarmData.alarmDesc ||
      !alarmData.deviceId ||
      !alarmData.collectorIp
    ) {
      return res.status(400).json({
        success: false,
        message: "缺少必要参数",
        error: "VALIDATION_ERROR",
      });
    }

    // 2. 调用告警管理器上报告警
    const startTime = Date.now();
    const result = await reportAlarm(
      {
        deviceId: alarmData.deviceId,
        fsuId: alarmData.fsuid,
        monitorPointId: alarmData.signalId,
        alarmLevel: alarmData.alarmLevel || "",
        alarmDesc: alarmData.alarmDesc,
        collectorIp: alarmData.collectorIp,
      },
      true,
      "soap"
    );

    const duration = Date.now() - startTime;

    // 3. 创建告警记录
    const alarmRecord = await AlarmRecord.create({
      type: "report",
      fsuid: alarmData.fsuid,
      signalId: alarmData.signalId,
      alarmDesc: alarmData.alarmDesc,
      deviceId: alarmData.deviceId,
      collectorIp: alarmData.collectorIp,
      serialNo: result.alarmData?.serialNo,
      status: result.success ? "success" : "failed",
      responseCode: result.responseCode || "",
      responseMessage: result.message || "",
      creator: alarmData.creator || "system",
      reportTime: new Date(),
    });

    // 4. 返回结果
    res.status(201).json({
      success: result.success,
      data: alarmRecord,
      message: result.message,
      processTime: duration,
    });
  } catch (error) {
    logger.error(`上报告警失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "上报告警失败",
      error: error.message,
    });
  }
};

/**
 * @desc    清除告警
 * @route   POST /api/alarm/clear
 * @access  Public
 */
exports.clearAlarmHandler = async (req, res) => {
  try {
    const alarmData = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    logger.info(`收到告警清除请求，客户端IP: ${clientIp}`, { alarmData });

    // 1. 参数校验
    if (
      !alarmData.fsuid ||
      !alarmData.signalId ||
      !alarmData.alarmDesc ||
      !alarmData.deviceId ||
      !alarmData.collectorIp
    ) {
      return res.status(400).json({
        success: false,
        message: "缺少必要参数",
        error: "VALIDATION_ERROR",
      });
    }

    // 2. 调用告警管理器清除告警
    const startTime = Date.now();
    const result = await clearAlarm(
      {
        deviceId: alarmData.deviceId,
        fsuId: alarmData.fsuid,
        monitorPointId: alarmData.signalId,
        alarmDesc: alarmData.alarmDesc,
        collectorIp: alarmData.collectorIp,
      },
      true,
      "soap"
    );

    const duration = Date.now() - startTime;

    // 3. 创建告警记录
    const alarmRecord = await AlarmRecord.create({
      type: "clear",
      fsuid: alarmData.fsuid,
      signalId: alarmData.signalId,
      alarmDesc: alarmData.alarmDesc,
      deviceId: alarmData.deviceId,
      collectorIp: alarmData.collectorIp,
      serialNo: result.alarmData?.serialNo,
      status: result.success ? "success" : "failed",
      responseCode: result.responseCode || "",
      responseMessage: result.message || "",
      creator: alarmData.creator || "system",
      reportTime: new Date(),
    });

    // 4. 返回结果
    res.status(201).json({
      success: result.success,
      data: alarmRecord,
      message: result.message,
      processTime: duration,
    });
  } catch (error) {
    logger.error(`清除告警失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "清除告警失败",
      error: error.message,
    });
  }
};

/**
 * @desc    删除告警记录
 * @route   DELETE /api/alarm/:id
 * @access  Public
 */
exports.deleteAlarmRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // 查找并删除
    const alarmRecord = await AlarmRecord.findByIdAndDelete(id);

    // 检查是否存在
    if (!alarmRecord) {
      return res.status(404).json({
        success: false,
        message: "未找到告警记录",
        error: "NOT_FOUND",
      });
    }

    // 返回结果
    res.json({
      success: true,
      data: {},
      message: "删除告警记录成功",
    });
  } catch (error) {
    logger.error(`删除告警记录失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "删除告警记录失败",
      error: error.message,
    });
  }
};

/**
 * @desc    获取告警记录详情
 * @route   GET /api/alarm/:id
 * @access  Public
 */
exports.getAlarmDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 查找记录
    const alarmRecord = await AlarmRecord.findById(id);

    // 检查是否存在
    if (!alarmRecord) {
      return res.status(404).json({
        success: false,
        message: "未找到告警记录",
        error: "NOT_FOUND",
      });
    }

    // 返回结果
    res.json({
      success: true,
      data: alarmRecord,
    });
  } catch (error) {
    logger.error(`获取告警记录详情失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "获取告警记录详情失败",
      error: error.message,
    });
  }
};

/**
 * @desc    从日志中获取最新的SCIP
 * @route   GET /api/alarm/scip
 * @access  Public
 */
exports.getScipFromLogs = async (req, res) => {
  try {
    const fs = require("fs").promises;
    const path = require("path");

    logger.info("开始从日志中查找SCIP信息");

    // 查找最新的日志文件
    const logsDir = path.join(__dirname, "../logs");

    // 检查日志目录是否存在
    try {
      await fs.access(logsDir);
    } catch (error) {
      logger.warn("日志目录不存在", { logsDir });
      return res.json({
        success: false,
        message: "日志目录不存在，无法获取SCIP信息",
        data: { scip: null },
      });
    }

    const files = await fs.readdir(logsDir);
    const logFiles = files
      .filter((f) => f.endsWith(".log"))
      .sort()
      .reverse(); // 最新的文件在前

    if (logFiles.length === 0) {
      logger.warn("未找到日志文件");
      return res.json({
        success: false,
        message: "未找到日志文件，无法获取SCIP信息",
        data: { scip: null },
      });
    }

    let latestScip = null;
    let foundInFile = null;
    let foundTime = null;

    // 遍历日志文件查找最新的SCIP
    for (const logFile of logFiles) {
      try {
        const logPath = path.join(logsDir, logFile);
        const content = await fs.readFile(logPath, "utf8");

        // 查找所有LOGIN_ACK响应中的SCIP，按时间排序找最新的
        const lines = content.split("\n").reverse(); // 从最新的行开始

        for (const line of lines) {
          if (line.includes("LOGIN_ACK") && line.includes("<SCIP>")) {
            const scipMatch = line.match(/<SCIP>([^<]+)<\/SCIP>/);
            if (scipMatch && scipMatch[1] && scipMatch[1].trim() !== "") {
              latestScip = scipMatch[1].trim();
              foundInFile = logFile;

              // 尝试从日志行中提取时间戳
              const timestampMatch = line.match(/"timestamp":"([^"]+)"/);
              if (timestampMatch) {
                foundTime = timestampMatch[1];
              } else {
                // 如果没有找到timestamp字段，尝试其他格式
                const dateMatch = line.match(
                  /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
                );
                if (dateMatch) {
                  foundTime = dateMatch[1];
                }
              }

              logger.info(`从日志中找到SCIP: ${latestScip}`, {
                file: logFile,
                timestamp: foundTime,
              });

              // 找到第一个有效的SCIP就返回（因为是从最新开始查找）
              return res.json({
                success: true,
                message: "成功从注册报文中获取到SCIP",
                data: {
                  scip: latestScip,
                  source: `日志文件: ${foundInFile}`,
                  timestamp: foundTime,
                },
              });
            }
          }
        }
      } catch (error) {
        logger.warn(`读取日志文件失败: ${logFile}`, { error: error.message });
        continue; // 继续尝试下一个文件
      }
    }

    // 如果没有找到SCIP
    logger.warn("在所有日志文件中都未找到有效的SCIP信息");
    return res.json({
      success: false,
      message:
        "未在注册报文中找到SCIP信息，可能该设备未通过本软件注册，请手动填写或前往OMC系统查询",
      data: { scip: null },
    });
  } catch (error) {
    logger.error(`获取SCIP失败: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: "获取SCIP失败",
      error: error.message,
      data: { scip: null },
    });
  }
};
