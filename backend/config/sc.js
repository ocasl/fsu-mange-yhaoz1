// SC服务器配置
require("dotenv").config();

module.exports = {
  host: process.env.SC_HOST || "sn.toweraiot.cn", // 修改默认地址
  port: process.env.SC_PORT || 8080,
  registerPath: process.env.SC_REGISTER_PATH || "/api/register",
  timeout: parseInt(process.env.SC_TIMEOUT) || 5000,

  // 协议相关配置
  protocol: "http", // 或 https
  contentType: "text/xml",

  // 重试配置
  retryCount: 3,
  retryInterval: 30000, // 30秒
};
