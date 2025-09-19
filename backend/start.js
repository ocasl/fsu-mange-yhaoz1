/**
 * FSU管理系统API服务启动脚本
 */
const app = require("./app");
const logger = require("./utils/logger");

// 启动信息
logger.info("FSU管理系统API服务启动脚本执行");
logger.info(`Node环境: ${process.env.NODE_ENV || "development"}`);
logger.info(`Node版本: ${process.version}`);
logger.info(`平台: ${process.platform}`);

// 导出app实例（用于测试）
module.exports = app;
