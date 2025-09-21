const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  authenticateToken,
  requireAdmin,
  canManageUser,
} = require("../middleware/auth");
const { userLogger } = require("../middleware/operationLogger");

/**
 * 用户相关路由
 */

// 用户登录 - 公开接口
router.post("/login", userLogger, userController.login);

// 获取当前用户信息 - 需要认证
router.get("/me", authenticateToken, userController.getCurrentUser);

// 用户注册 - 需要管理员权限
router.post(
  "/register",
  authenticateToken,
  requireAdmin,
  userLogger,
  userController.register
);

// 获取用户列表 - 需要管理员权限
router.get(
  "/list",
  authenticateToken,
  requireAdmin,
  userController.getUserList
);

// 更新用户状态 - 需要管理员权限
router.patch(
  "/:userId/status",
  authenticateToken,
  requireAdmin,
  userLogger,
  userController.updateUserStatus
);

// 删除用户 - 需要管理员权限
router.delete(
  "/:userId",
  authenticateToken,
  requireAdmin,
  userLogger,
  userController.deleteUser
);

module.exports = router;
