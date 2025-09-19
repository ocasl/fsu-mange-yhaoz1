const mongoose = require("mongoose");

/**
 * 告警记录模型
 */
const AlarmRecordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["report", "clear"],
      required: [true, "告警类型必填"],
    },
    fsuid: {
      type: String,
      required: [true, "FSU ID必填"],
      trim: true,
    },
    signalId: {
      type: String,
      required: [true, "信号量ID必填"],
      trim: true,
    },
    alarmDesc: {
      type: String,
      required: [true, "告警描述必填"],
      trim: true,
    },
    deviceId: {
      type: String,
      required: [true, "设备ID必填"],
      trim: true,
    },
    collectorIp: {
      type: String,
      required: [true, "采集机IP必填"],
      trim: true,
      match: [
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        "请输入有效的IP地址",
      ],
    },
    serialNo: {
      type: String,
      trim: true,
    },

    // 状态信息
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "pending",
    },
    responseCode: {
      type: String,
      trim: true,
    },
    responseMessage: {
      type: String,
      trim: true,
    },

    // 管理信息
    creator: {
      type: String,
      default: "system",
      trim: true,
    },
    reportTime: {
      type: Date,
      default: Date.now,
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
AlarmRecordSchema.index({ type: 1 });
AlarmRecordSchema.index({ fsuid: 1 });
AlarmRecordSchema.index({ deviceId: 1 });
AlarmRecordSchema.index({ signalId: 1 });
AlarmRecordSchema.index({ status: 1 });
AlarmRecordSchema.index({ createTime: -1 });

module.exports = mongoose.model("AlarmRecord", AlarmRecordSchema);
