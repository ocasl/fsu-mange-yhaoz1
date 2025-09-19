const express = require("express");
const router = express.Router();
const {
  registerFsu,
  testConnection,
  getSystemStatus,
  testLogin,
  getVpnStatus,
  connectVpn,
  disconnectVpn,
  getHeartbeatStatus,
  startHeartbeat,
  stopHeartbeat,
  startFsuWebService,
  stopFsuWebService,
  getFsuWebServiceStatus,
} = require("../controllers/fsuController");
const logger = require("../utils/logger");

// 中间件：请求日志记录
router.use((req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // 重写res.send以记录响应时间
  res.send = function (data) {
    const duration = Date.now() - startTime;
    logger.info(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`,
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
      }
    );

    originalSend.call(this, data);
  };

  next();
});

// FSU设备注册接口
router.post("/register", registerFsu);

// 直接测试LOGIN报文接口（POST和GET都支持）
router.post("/test-login", testLogin);
router.get("/test-login", testLogin);

// SC服务器连接测试接口
router.get("/test-connection", testConnection);

// 系统状态查询接口
router.get("/status", getSystemStatus);

// VPN管理接口
router.get("/vpn/status", getVpnStatus);
router.post("/vpn/detect", connectVpn); // 重命名为detect，更准确
router.post("/vpn/reset", disconnectVpn); // 重命名为reset，更准确

// 心跳管理接口（旧版本，即将废弃）
router.get("/heartbeat/status", getHeartbeatStatus);
router.post("/heartbeat/start", startHeartbeat);
router.post("/heartbeat/stop", stopHeartbeat);

// FSU WebService服务器管理接口（新架构）
router.get("/webservice/status", getFsuWebServiceStatus);
router.post("/webservice/start", startFsuWebService);
router.post("/webservice/stop", stopFsuWebService);

// 健康检查接口
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "FSU设备上线系统运行正常",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
