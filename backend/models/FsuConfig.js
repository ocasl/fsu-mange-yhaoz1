const mongoose = require("mongoose");

/**
 * FSU配置模型
 * 存储LOGIN报文的所有可配置参数
 */
const fsuConfigSchema = new mongoose.Schema(
  {
    // 基本信息
    name: {
      type: String,
      required: true,
      unique: true,
      default: "default",
      description: "配置名称",
    },
    description: {
      type: String,
      default: "",
      description: "配置描述",
    },

    // LOGIN报文核心参数 - 这些参数直接影响报文内容
    fsuId: {
      type: String,
      required: true,
      default: "61082143802203",
      description: "FSU设备ID - 对应LOGIN报文中的FsuId字段",
    },
    fsuCode: {
      type: String,
      required: true,
      default: "61082143802203",
      description: "FSU设备编码 - 对应LOGIN报文中的FsuCode字段",
    },

    // 网络信息
    macId: {
      type: String,
      required: true,
      default: "869221025266666",
      description: "MAC地址 - 对应LOGIN报文中的MacId字段",
    },
    imsiId: {
      type: String,
      required: true,
      default: "460068161666666",
      description: "IMSI号码 - 对应LOGIN报文中的ImsiId字段",
    },
    networkType: {
      type: String,
      enum: ["4G", "5G", "LTE", "3G", "ETHERNET", "WIFI"],
      default: "4G",
      description: "网络类型 - 对应LOGIN报文中的NetworkType字段",
    },
    lockedNetworkType: {
      type: String,
      enum: ["LTE", "WCDMA", "GSM", "CDMA"],
      default: "LTE",
      description: "锁定网络类型 - 对应LOGIN报文中的LockedNetworkType字段",
    },
    carrier: {
      type: String,
      enum: ["CU", "CT", "CM"], // 联通、电信、移动
      default: "CU",
      description: "运营商 - 对应LOGIN报文中的Carrier字段",
    },

    // 厂商信息
    nmVendor: {
      type: String,
      default: "大唐",
      description: "网管厂商 - 对应LOGIN报文中的NMVendor字段",
    },
    nmType: {
      type: String,
      default: "DTM-W101T",
      description: "网管型号 - 对应LOGIN报文中的NMType字段",
    },
    fsuVendor: {
      type: String,
      default: "ZXLW",
      description: "FSU软件厂商 - 对应LOGIN报文中的FSUVendor字段",
    },
    fsuManufactor: {
      type: String,
      default: "ZXLW",
      description: "FSU硬件厂商 - 对应LOGIN报文中的FSUManufactor字段",
    },
    fsuType: {
      type: String,
      default: "ZNV EISUA X7",
      description: "FSU型号 - 对应LOGIN报文中的FSUType字段",
    },

    // 版本信息
    softwareVersion: {
      type: String,
      default: "25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002",
      description: "软件版本 - 对应LOGIN报文中的Version字段",
    },

    // 设备列表 - 直接影响LOGIN报文中的DeviceList
    devices: {
      type: [String],
      default: [
        "61082140601589", // 交流电源1
        "61082141820991", // 烟感设备01
        "61082140702618", // 普通阀控密封铅酸蓄电池1
        "61082140702619", // 普通阀控密封铅酸蓄电池2
        "61082141841251", // 水浸01
        "61082143802203", // FSU自身
        "61082141831306", // 温湿感01
      ],
      description: "设备ID列表 - 对应LOGIN报文中的DeviceList",
    },

    // VPN配置
    mainVPN: {
      type: String,
      default: "sn.toweraiot.cn,sn.toweraiot.cn",
      description: "主VPN地址 - 对应LOGIN报文中的MainVPN字段",
    },
    disasterRecovery: {
      type: String,
      default: "zb-sn.toweraiot.cn,zb-sn.toweraiot.cn",
      description: "灾备地址 - 对应LOGIN报文中的Disaster_Recovery_One字段",
    },

    // SC服务器配置
    scServerAddress: {
      type: String,
      default: "sn.toweraiot.cn",
      description: "SC服务器地址 - 用于发送LOGIN请求",
    },

    // 状态信息
    isActive: {
      type: Boolean,
      default: true,
      description: "是否为当前活动配置",
    },

    // 创建者信息
    creator: {
      type: String,
      default: "admin",
      description: "创建者",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 设备列表字符串转数组的中间件
fsuConfigSchema.pre("save", function (next) {
  // 如果 devices 是字符串，按行分割转为数组
  if (typeof this.devices === "string") {
    this.devices = this.devices
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  // 确保只有一个活动配置
  if (this.isActive) {
    this.constructor
      .updateMany({ _id: { $ne: this._id } }, { isActive: false })
      .exec();
  }

  next();
});

// 添加索引
fsuConfigSchema.index({ name: 1 });
fsuConfigSchema.index({ isActive: 1 });
fsuConfigSchema.index({ createdAt: -1 });

const FsuConfig = mongoose.model("FsuConfig", fsuConfigSchema);

module.exports = FsuConfig;
