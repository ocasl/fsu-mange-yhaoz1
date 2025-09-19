const express = require("express");
const router = express.Router();
const fsuOnlineController = require("../controllers/fsuOnlineController");

// FSU上线管理路由
router.get("/list", fsuOnlineController.getFsuOnlineList);
router.post("/", fsuOnlineController.addFsuOnline);
router.put("/:id", fsuOnlineController.updateFsuOnline);
router.delete("/:id", fsuOnlineController.deleteFsuOnline);
router.post("/batch-delete", fsuOnlineController.batchDeleteFsuOnline);
router.get("/export", fsuOnlineController.exportFsuOnline);
router.get("/:id", fsuOnlineController.getFsuOnlineDetail);

module.exports = router;
