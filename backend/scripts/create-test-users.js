const mongoose = require("mongoose");
const User = require("../models/User");
const config = require("../config/config");
const logger = require("../utils/logger");

/**
 * 创建测试用户
 */
async function createTestUsers() {
  try {
    // 连接数据库
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("数据库连接成功");

    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ username: "admin" });
    if (!existingAdmin) {
      console.log("创建默认管理员账号...");
      const adminUser = new User({
        username: "admin",
        password: "123456",
        email: "admin@fsu.com",
        realName: "系统管理员",
        role: "admin",
        description: "系统默认管理员账号",
      });
      await adminUser.save();
      console.log("✅ 管理员账号创建成功: admin / 123456");
    } else {
      console.log("✅ 管理员账号已存在: admin");
    }

    // 创建测试子账号
    const testUsers = [
      {
        username: "user1",
        password: "123456",
        email: "user1@fsu.com",
        realName: "测试用户1",
        role: "user",
        description: "第一个测试子账号",
      },
      {
        username: "user2",
        password: "123456",
        email: "user2@fsu.com",
        realName: "测试用户2",
        role: "user",
        description: "第二个测试子账号",
      },
    ];

    // 获取管理员ID作为创建者
    const admin = await User.findOne({ username: "admin" });

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ username: userData.username });

      if (!existingUser) {
        const newUser = new User({
          ...userData,
          createdBy: admin._id,
          parentUser: admin._id,
        });
        await newUser.save();
        console.log(
          `✅ 子账号创建成功: ${userData.username} / ${userData.password} (${userData.realName})`
        );
      } else {
        console.log(`✅ 子账号已存在: ${userData.username}`);
      }
    }

    console.log("\n🎉 测试用户创建完成！");
    console.log("\n📋 账号列表:");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│  账号类型  │   用户名   │   密码   │      说明        │");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log("│  总账号    │   admin    │  123456  │  系统管理员      │");
    console.log("│  子账号    │   user1    │  123456  │  测试用户1       │");
    console.log("│  子账号    │   user2    │  123456  │  测试用户2       │");
    console.log("└─────────────────────────────────────────────────────────┘");
    console.log("\n💡 权限说明:");
    console.log("• 总账号(admin): 可以查看所有用户的FSU上线和告警记录");
    console.log("• 子账号(user1/user2): 只能查看自己创建的FSU上线和告警记录");
    console.log("\n🧪 测试建议:");
    console.log("1. 用 admin 登录，创建一些FSU和告警记录");
    console.log("2. 用 user1 登录，创建一些FSU和告警记录");
    console.log("3. 用 user2 登录，创建一些FSU和告警记录");
    console.log("4. 再用 admin 登录，查看是否能看到所有记录");
    console.log("5. 用 user1/user2 登录，确认只能看到自己的记录");
  } catch (error) {
    console.error("创建测试用户失败:", error);
    logger.error("创建测试用户失败:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n数据库连接已关闭");
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createTestUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("脚本执行失败:", error);
      process.exit(1);
    });
}

module.exports = createTestUsers;
