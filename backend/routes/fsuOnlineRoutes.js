const express = require("express");
const router = express.Router();
const fsuOnlineController = require("../controllers/fsuOnlineController");
const { optionalAuth } = require("../middleware/auth");
const { fsuLogger } = require("../middleware/operationLogger");

// 上线管理路由 - 添加操作日志记录
router.get("/list", optionalAuth, fsuOnlineController.getFsuOnlineList);
router.post("/", optionalAuth, fsuLogger, fsuOnlineController.addFsuOnline);
router.put(
  "/:id",
  optionalAuth,
  fsuLogger,
  fsuOnlineController.updateFsuOnline
);
router.patch(
  "/:id/status",
  optionalAuth,
  fsuLogger,
  fsuOnlineController.updateFsuOnlineStatus
);
router.delete(
  "/:id",
  optionalAuth,
  fsuLogger,
  fsuOnlineController.deleteFsuOnline
);
router.post(
  "/batch-delete",
  optionalAuth,
  fsuLogger,
  fsuOnlineController.batchDeleteFsuOnline
);
router.get("/export", optionalAuth, fsuOnlineController.exportFsuOnline);
router.get(
  "/device-mappings",
  optionalAuth,
  fsuOnlineController.getDeviceMappings
);
router.get("/:id", optionalAuth, fsuOnlineController.getFsuOnlineDetail);

module.exports = router;
