const express = require("express");
const router = express.Router();
const alarmController = require("../controllers/alarmController");

// 告警管理路由
router.get("/:type/list", alarmController.getAlarmList);
router.post("/report", alarmController.reportAlarmHandler);
router.post("/clear", alarmController.clearAlarmHandler);
router.delete("/:id", alarmController.deleteAlarmRecord);
router.get("/scip", alarmController.getScipFromLogs);
router.get("/:id", alarmController.getAlarmDetail);

module.exports = router;
