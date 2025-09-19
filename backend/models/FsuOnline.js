const mongoose = require("mongoose");

/**
 * FSU上线记录模型
 */
const FsuOnlineSchema = new mongoose.Schema(
  {
    fsuid: {
      type: String,
      required: [true, "FSU ID必填"],
      unique: true,
      trim: true,
    },
    siteName: {
      type: String,
      required: [true, "站点名称必填"],
      trim: true,
    },
    scServerAddress: {
      type: String,
      required: [true, "SC服务器地址必填"],
      trim: true,
      // 修改验证规则，同时接受IP地址和域名
      validate: {
        validator: function (v) {
          // 验证IP地址
          const ipPattern =
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          // 验证域名
          const domainPattern =
            /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
          return ipPattern.test(v) || domainPattern.test(v);
        },
        message: "请输入有效的IP地址或域名",
      },
    },
    mainVpn: {
      type: String,
      required: [true, "MainVPN必填"],
      trim: true,
    },
    softwareVendor: {
      type: String,
      required: [true, "软件厂家必填"],
      trim: true,
    },
    hardwareVendor: {
      type: String,
      required: [true, "硬件厂家必填"],
      trim: true,
    },
    fsuType: {
      type: String,
      required: [true, "FSU类别必填"],
      trim: true,
    },
    version: {
      type: String,
      required: [true, "版本必填"],
      trim: true,
    },

    // 设备关联信息 - 16个设备（4个锂电池 + 2个蓄电池 + 10个其他设备）
    powerId: {
      type: String,
      trim: true,
    },
    lithiumBatteryId1: {
      type: String,
      trim: true,
    },
    temperatureId: {
      type: String,
      trim: true,
    },
    lithiumBatteryId2: {
      type: String,
      trim: true,
    },
    airConditionerId: {
      type: String,
      trim: true,
    },
    lithiumBatteryId3: {
      type: String,
      trim: true,
    },
    smartAccessId: {
      type: String,
      trim: true,
    },
    lithiumBatteryId4: {
      type: String,
      trim: true,
    },
    waterLeakageId: {
      type: String,
      trim: true,
    },
    leadAcidBatteryId1: {
      type: String,
      trim: true,
    },
    infraredId: {
      type: String,
      trim: true,
    },
    smokeDetectorId: {
      type: String,
      trim: true,
    },
    leadAcidBatteryId2: {
      type: String,
      trim: true,
    },
    nonSmartAccessId: {
      type: String,
      trim: true,
    },
    // 预留其他设备字段
    deviceId13: {
      type: String,
      trim: true,
    },
    deviceId14: {
      type: String,
      trim: true,
    },
    deviceId15: {
      type: String,
      trim: true,
    },

    // 状态信息
    status: {
      type: String,
      enum: ["online", "offline", "connecting"],
      default: "connecting",
    },
    lastHeartbeatTime: {
      type: Date,
      default: null,
    },

    // 管理信息
    creator: {
      type: String,
      default: "system",
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "createTime",
      updatedAt: "updateTime",
    },
  }
);

// 创建索引
FsuOnlineSchema.index({ fsuid: 1 });
FsuOnlineSchema.index({ siteName: 1 });
FsuOnlineSchema.index({ status: 1 });
FsuOnlineSchema.index({ createTime: -1 });

module.exports = mongoose.model("FsuOnline", FsuOnlineSchema);
