const dotenv = require("dotenv");
const path = require("path");

// 加载环境变量
dotenv.config();

/**
 * 系统配置
 */
module.exports = {
  // 服务器配置
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB配置
  mongoUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/fsu_management",

  // SC服务器配置
  scServer: {
    ip: process.env.SC_SERVER_IP || "192.168.1.100",
    port: process.env.SC_SERVER_PORT || 8080,
  },

  // 日志配置
  logger: {
    level: process.env.LOG_LEVEL || "info",
    dir: process.env.LOG_DIR || "./logs",
  },

  // FSU WebService配置
  fsuWebService: {
    port: process.env.FSU_WEBSERVICE_PORT || 8080,
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || "fsu_management_secret_key",
    expire: process.env.JWT_EXPIRE || "30d",
  },

  // 跨域配置
  cors: {
    origin: [
      "http://localhost:3000", // 本地开发
      "http://49.233.218.18:3000", // 公网部署
      "http://103.236.91.181:3000", // 新的公网部署地址
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
  },
};
