const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * 用户模型
 * 支持总账号和子账号的管理
 */
const userSchema = new mongoose.Schema(
  {
    // 基本信息
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      description: "用户名",
    },
    password: {
      type: String,
      required: true,
      description: "密码（哈希存储）",
    },
    email: {
      type: String,
      trim: true,
      description: "邮箱",
    },
    realName: {
      type: String,
      trim: true,
      description: "真实姓名",
    },

    // 用户类型和权限
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      description: "用户角色：admin-总账号，user-子账号",
    },

    // 子账号的父账号关联
    parentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      description: "子账号所属的总账号ID",
    },

    // 账号状态
    status: {
      type: String,
      enum: ["active", "inactive", "locked"],
      default: "active",
      description: "账号状态",
    },

    // 最后登录信息
    lastLoginTime: {
      type: Date,
      description: "最后登录时间",
    },
    lastLoginIp: {
      type: String,
      description: "最后登录IP",
    },

    // 创建者信息
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      description: "创建者ID（总账号创建的子账号）",
    },

    // 额外信息
    description: {
      type: String,
      description: "用户描述",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 密码哈希中间件
userSchema.pre("save", async function (next) {
  // 只有在密码被修改时才进行哈希
  if (!this.isModified("password")) return next();

  try {
    // 生成盐并哈希密码
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 获取用户的子账号
userSchema.methods.getSubUsers = function () {
  return this.constructor.find({ parentUser: this._id });
};

// 检查是否为总账号
userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

// 添加索引
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ parentUser: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
