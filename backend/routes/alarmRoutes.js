const express = require("express");
const router = express.Router();
const alarmController = require("../controllers/alarmController");
const { optionalAuth } = require("../middleware/auth");
const { alarmLogger } = require("../middleware/operationLogger");

// 告警管理路由 - 添加操作日志记录
router.get("/report/list", optionalAuth, alarmController.getAlarmList);
router.post(
  "/report",
  optionalAuth,
  alarmLogger,
  alarmController.reportAlarmHandler
);
router.post(
  "/clear",
  optionalAuth,
  alarmLogger,
  alarmController.clearAlarmHandler
);
router.delete(
  "/:id",
  optionalAuth,
  alarmLogger,
  alarmController.deleteAlarmRecord
);
router.get("/scip", optionalAuth, alarmController.getScipFromLogs);
router.get("/:id", optionalAuth, alarmController.getAlarmDetail);

module.exports = router;
