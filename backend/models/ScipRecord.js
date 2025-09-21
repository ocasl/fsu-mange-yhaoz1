const mongoose = require("mongoose");

/**
 * SCIP记录模型 - 记录注册成功后返回的采集机IP
 */
const scipRecordSchema = new mongoose.Schema(
  {
    // FSU ID
    fsuId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      comment: "FSU设备ID",
    },

    // 采集机IP (SCIP)
    scip: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          // 验证IP地址格式
          return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
            v
          );
        },
        message: "SCIP必须是有效的IP地址格式",
      },
      comment: "采集机IP地址",
    },

    // 权限级别
    rightLevel: {
      type: String,
      trim: true,
      comment: "权限级别",
    },

    // 注册时间
    registerTime: {
      type: Date,
      default: Date.now,
      comment: "注册时间",
    },

    // 原始响应数据
    rawResponse: {
      type: String,
      comment: "原始LOGIN_ACK响应报文",
    },

    // 响应状态码
    responseCode: {
      type: String,
      default: "102",
      comment: "响应状态码",
    },

    // 来源信息
    source: {
      type: String,
      enum: ["register", "online", "manual"],
      default: "register",
      comment: "SCIP来源：register-注册获取, online-上线获取, manual-手动录入",
    },

    // 是否有效
    isActive: {
      type: Boolean,
      default: true,
      comment: "是否为当前有效的SCIP",
    },

    // 创建时间
    createTime: {
      type: Date,
      default: Date.now,
      comment: "创建时间",
    },

    // 更新时间
    updateTime: {
      type: Date,
      default: Date.now,
      comment: "更新时间",
    },
  },
  {
    timestamps: { createdAt: "createTime", updatedAt: "updateTime" },
    versionKey: false,
  }
);

// 复合索引：按FSU ID和注册时间排序，方便查询最新记录
scipRecordSchema.index({ fsuId: 1, registerTime: -1 });

// 复合索引：按FSU ID和活跃状态查询（不使用唯一约束，因为没有事务保证）
scipRecordSchema.index({ fsuId: 1, isActive: 1 });

// 静态方法：获取指定FSU的最新SCIP
scipRecordSchema.statics.getLatestScip = function (fsuId) {
  return this.findOne({ fsuId, isActive: true }).sort({ registerTime: -1 });
};

// 静态方法：记录新的SCIP，自动将旧记录设为非活跃
scipRecordSchema.statics.recordScip = async function (
  fsuId,
  scip,
  rightLevel,
  rawResponse,
  source = "register"
) {
  try {
    // 1. 将该FSU的所有旧记录设为非活跃
    await this.updateMany(
      { fsuId, isActive: true },
      { isActive: false, updateTime: new Date() }
    );

    // 2. 创建新的活跃记录
    const newRecord = await this.create({
      fsuId,
      scip,
      rightLevel,
      rawResponse,
      source,
      isActive: true,
      registerTime: new Date(),
    });

    return newRecord;
  } catch (error) {
    throw error;
  }
};

// 静态方法：根据FSU ID获取SCIP历史记录
scipRecordSchema.statics.getScipHistory = function (fsuId, limit = 10) {
  return this.find({ fsuId })
    .sort({ registerTime: -1 })
    .limit(limit)
    .select("-rawResponse"); // 不返回原始响应数据以节省带宽
};

// 实例方法：标记为非活跃
scipRecordSchema.methods.deactivate = function () {
  this.isActive = false;
  this.updateTime = new Date();
  return this.save();
};

module.exports = mongoose.model("ScipRecord", scipRecordSchema);
