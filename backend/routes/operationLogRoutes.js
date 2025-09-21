const express = require("express");
const router = express.Router();
const operationLogController = require("../controllers/operationLogController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

/**
 * 操作日志相关路由
 */

// 获取操作日志列表 - 需要认证（管理员可查看所有，普通用户只能查看自己的）
router.get("/", authenticateToken, operationLogController.getOperationLogs);

// 获取操作日志详情 - 需要认证
router.get(
  "/:logId",
  authenticateToken,
  operationLogController.getOperationLogDetail
);

// 获取操作统计信息 - 需要认证
router.get(
  "/stats/overview",
  authenticateToken,
  operationLogController.getOperationStats
);

// 清理旧的操作日志 - 需要管理员权限
router.delete(
  "/cleanup",
  authenticateToken,
  requireAdmin,
  operationLogController.cleanupOldLogs
);

module.exports = router;
