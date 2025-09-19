/**
 * FSU厂商代码映射表
 * 根据铁塔B接口规范，将中文厂商名称映射为英文简称
 */

// FSU软件厂商映射
const FSU_SOFTWARE_VENDORS = {
  中国铁塔: "ZGTT",
  高新兴: "GXX",
  赛尔通信: "SAIERCOM",
  深圳力维: "ZXLW",
};

// FSU硬件厂商映射
const FSU_HARDWARE_VENDORS = {
  高新兴: "GXX",
  深圳力维: "ZXLW",
  赛尔通信: "SAIERCOM",
};

// 软件版本映射 - 根据用户提供的三个版本
const SOFTWARE_VERSIONS = {
  // 版本1: 高新兴版本
  VERSION_1: "25.1.HQ.FSU.TT.AA02.R_GX-1.1.0.002",

  // 版本2: 力维版本
  VERSION_2: "25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002",

  // 版本3: 赛尔版本
  VERSION_3: "24.1.BH.FSU.TT.AA06.R_SE-1.0.9.666",

  // 默认版本（使用版本2）
  DEFAULT: "25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002",
};

// 软件版本选项列表（用于前端下拉选择）
const SOFTWARE_VERSION_OPTIONS = [
  {
    value: "25.1.HQ.FSU.TT.AA02.R_GX-1.1.0.002",
    label: "25.1.HQ.FSU.TT.AA02.R_GX-1.1.0.002 (高新兴版本)",
  },
  {
    value: "25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002",
    label: "25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002 (力维版本)",
  },
  {
    value: "24.1.BH.FSU.TT.AA06.R_SE-1.0.9.666",
    label: "24.1.BH.FSU.TT.AA06.R_SE-1.0.9.666 (赛尔版本)",
  },
];

// 应用类型映射
const APPLICATION_TYPES = {
  标准一体式: "INTSTAN",
  标准分体式: "DISSTAN",
  I型高压室外式: "IHIEXTER",
  II型高压室外式: "IIHIEXTER",
  I型低压室外式: "ILOEXTER",
  II型低压室外式: "IILOEXTER",
};

/**
 * 获取FSU软件厂商英文代码
 */
function getFsuSoftwareVendorCode(chineseName) {
  return FSU_SOFTWARE_VENDORS[chineseName] || "ZXLW";
}

/**
 * 获取FSU硬件厂商英文代码
 */
function getFsuHardwareVendorCode(chineseName) {
  return FSU_HARDWARE_VENDORS[chineseName] || "ZXLW";
}

/**
 * 根据软硬件厂商组合获取对应的软件版本
 */
function getSoftwareVersion(softwareVendor, hardwareVendor) {
  const key = `${softwareVendor}_${hardwareVendor}`;
  return SOFTWARE_VERSIONS[key] || SOFTWARE_VERSIONS.DEFAULT;
}

/**
 * 获取应用类型英文代码
 */
function getApplicationTypeCode(chineseName) {
  return APPLICATION_TYPES[chineseName] || "INTSTAN";
}

/**
 * 根据厂商信息自动推荐配置
 */
function getRecommendedConfig(softwareVendorCN, hardwareVendorCN) {
  const softwareVendor = getFsuSoftwareVendorCode(softwareVendorCN);
  const hardwareVendor = getFsuHardwareVendorCode(hardwareVendorCN);
  const softwareVersion = getSoftwareVersion(softwareVendor, hardwareVendor);

  return {
    fsuVendor: softwareVendor, // FSU软件厂商
    fsuManufactor: hardwareVendor, // FSU硬件厂商
    softwareVersion: softwareVersion,
    fsuType: "ZNV EISUA X7", // 默认设备型号
    fsuClass: "INTSTAN", // 默认应用类型
  };
}

module.exports = {
  FSU_SOFTWARE_VENDORS,
  FSU_HARDWARE_VENDORS,
  SOFTWARE_VERSIONS,
  SOFTWARE_VERSION_OPTIONS,
  APPLICATION_TYPES,
  getFsuSoftwareVendorCode,
  getFsuHardwareVendorCode,
  getSoftwareVersion,
  getApplicationTypeCode,
  getRecommendedConfig,
};
