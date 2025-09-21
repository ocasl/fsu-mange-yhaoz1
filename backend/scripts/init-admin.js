const mongoose = require("mongoose");
const User = require("../models/User");
const config = require("../config/config");
const logger = require("../utils/logger");

/**
 * 初始化默认管理员账号
 */
async function initAdminUser() {
  try {
    // 连接数据库
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("数据库连接成功");

    // 检查是否已存在管理员账号
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("管理员账号已存在:", existingAdmin.username);
      return;
    }

    // 创建默认管理员账号
    const adminUser = new User({
      username: "admin",
      password: "123456", // 密码会被自动哈希
      email: "admin@fsu.com",
      realName: "系统管理员",
      role: "admin",
      description: "系统默认管理员账号",
    });

    await adminUser.save();

    console.log("默认管理员账号创建成功!");
    console.log("用户名: admin");
    console.log("密码: 123456");
    console.log("请登录后及时修改密码！");
  } catch (error) {
    console.error("初始化管理员账号失败:", error);
    logger.error("初始化管理员账号失败:", error);
  } finally {
    await mongoose.disconnect();
    console.log("数据库连接已关闭");
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initAdminUser()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("脚本执行失败:", error);
      process.exit(1);
    });
}

module.exports = initAdminUser;
