/**
 * 设备数据管理器
 * 管理各种设备类型的虚拟数据和响应模板
 */
const logger = require("./logger");

class DeviceDataManager {
  constructor() {
    this.deviceTemplates = this.initializeDeviceTemplates();
    this.virtualData = this.initializeVirtualData();
  }

  /**
   * 初始化设备模板 - 基于您提供的真实报文
   */
  initializeDeviceTemplates() {
    return {
      // 水浸传感器 - 机房/基站环境设备 (来自XML请求中的设备列表)
      flooding: {
        fsuId: "61082143802203",
        deviceId: "61082141841251",
        signals: [
          {
            type: "2", // 遥信信号(DI)
            id: "0418001001", // 用户提供的信号ID（与SC系统期望一致）
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => ({
              ...signal,
              measuredVal: "0", // 根据用户要求，水浸传感器固定为0（无水浸）
            })),
          };
        },
      },

      // 新增：专用FSU设备 61082543800903 (主要用于登录和心跳保活)
      mainFsu61082543800903: {
        fsuId: "61082543800903",
        deviceId: "61082543800903", // 使用FSU ID作为设备ID
        signals: [
          {
            type: "2", // 遥信信号
            id: "0101001001", // FSU状态信号
            setupVal: "0",
            status: "0",
            measuredVal: "1", // 1表示FSU在线
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => ({
              ...signal,
              measuredVal: "1", // FSU始终在线
            })),
          };
        },
      },

      // 新增：专用水浸传感器 61082541840888
      waterSensor61082541840888: {
        fsuId: "61082541840888",
        deviceId: "61082541840888",
        signals: [
          {
            type: "2", // 遥信信号(DI)
            id: "0418001001", // 水浸检测信号ID
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示无水浸
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => ({
              ...signal,
              measuredVal: "0", // 水浸传感器固定为0（无水浸）
            })),
          };
        },
      },

      // 开关电源设备 (来自XML请求中的设备列表: 61082140601589)
      powerSupply: {
        fsuId: "61082143802203",
        deviceId: "61082140601589",
        signals: [
          // 遥信信号 (Type="2") - 开关状态信号
          {
            type: "2",
            id: "0406001001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406001002",
            setupVal: "",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406005001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406007001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406007002",
            setupVal: "",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406008001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406009001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406014001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406015001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406016001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406017001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406022001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406024001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406024002",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406024003",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406024004",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406028001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406028002",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406028003",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406028004",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406030001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406031001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },

          // 遥测信号 (Type="3") - 模拟量测量值
          {
            type: "3",
            id: "0406101001",
            setupVal: "0",
            status: "0",
            measuredVal: "219.000000",
          }, // 电压
          {
            type: "3",
            id: "0406102001",
            setupVal: "0",
            status: "0",
            measuredVal: "219.000000",
          },
          {
            type: "3",
            id: "0406103001",
            setupVal: "0",
            status: "0",
            measuredVal: "219.000000",
          },
          {
            type: "3",
            id: "0406110001",
            setupVal: "0",
            status: "0",
            measuredVal: "50.000000",
          }, // 频率
          {
            type: "3",
            id: "0406111001",
            setupVal: "0",
            status: "0",
            measuredVal: "53.900000",
          }, // 电池电压
          {
            type: "3",
            id: "0406112001",
            setupVal: "0",
            status: "0",
            measuredVal: "27.000000",
          }, // 电流
          {
            type: "3",
            id: "0406113001",
            setupVal: "0",
            status: "0",
            measuredVal: "6.800000",
          }, // 模块电流
          {
            type: "3",
            id: "0406113002",
            setupVal: "0",
            status: "0",
            measuredVal: "6.800000",
          },
          {
            type: "3",
            id: "0406113003",
            setupVal: "0",
            status: "0",
            measuredVal: "6.800000",
          },
          {
            type: "3",
            id: "0406113004",
            setupVal: "0",
            status: "0",
            measuredVal: "6.800000",
          },
          {
            type: "3",
            id: "0406115001",
            setupVal: "0",
            status: "0",
            measuredVal: "0.000000",
          },
          {
            type: "3",
            id: "0406123001",
            setupVal: "0",
            status: "0",
            measuredVal: "4.000000",
          },
          {
            type: "3",
            id: "0406126001",
            setupVal: "0",
            status: "0",
            measuredVal: "1.000000",
          },
          {
            type: "3",
            id: "0406143001",
            setupVal: "0",
            status: "0",
            measuredVal: "56.000000",
          }, // 温度
          {
            type: "3",
            id: "0406144001",
            setupVal: "0",
            status: "0",
            measuredVal: "54.000000",
          },
          {
            type: "3",
            id: "0406146001",
            setupVal: "0",
            status: "0",
            measuredVal: "47.000000",
          },
          {
            type: "3",
            id: "0406147001",
            setupVal: "0",
            status: "0",
            measuredVal: "45.000000",
          },
          // 新增字符串信号 (Type="6")
          {
            type: "6",
            id: "0406173001",
            setupVal: "",
            status: "0",
            measuredVal: "SMU02B-XN",
          },
          {
            type: "6",
            id: "0406175001",
            setupVal: "",
            status: "0",
            measuredVal: "HUAWEI",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              const newSignal = { ...signal };

              if (signal.type === "2") {
                // 遥信信号：根据XML配置，所有遥信信号都固定为0（正常状态）
                newSignal.measuredVal = "0";
              } else if (signal.type === "3") {
                // 遥测信号：根据XML配置的SetValue和Range生成动态值
                let setValue, range;

                // 根据信号ID匹配XML配置中的参数
                switch (signal.id) {
                  case "0406101001": // 交流输入1#A相电压
                  case "0406102001": // 交流输入1#B相电压
                  case "0406103001": // 交流输入1#C相电压
                    setValue = 220;
                    range = 5;
                    break;
                  case "0406110001": // 交流输入1#频率
                    setValue = 50;
                    range = 0;
                    break;
                  case "0406111001": // 直流电压
                    setValue = 54;
                    range = 0.5;
                    break;
                  case "0406112001": // 直流负载总电流
                    setValue = 28;
                    range = 1;
                    break;
                  case "0406113001": // 模块1#电流
                  case "0406113002": // 模块2#电流
                  case "0406113003": // 模块3#电流
                  case "0406113004": // 模块4#电流
                    setValue = 7;
                    range = 0.2;
                    break;
                  case "0406115001": // 电池组1#电流
                    setValue = 0.1;
                    range = 0.1;
                    break;
                  case "0406123001": // 配置模块数量
                    setValue = 4;
                    range = 0;
                    break;
                  case "0406126001": // 蓄电池组数
                    setValue = 1;
                    range = 0;
                    break;
                  case "0406143001": // 均充电压设定值
                    setValue = 56;
                    range = 0;
                    break;
                  case "0406144001": // 浮充电压设定值
                    setValue = 53.5;
                    range = 0;
                    break;
                  case "0406146001": // 一级低压脱离设定值
                    setValue = 46;
                    range = 0;
                    break;
                  case "0406147001": // 二级低压脱离设定值
                    setValue = 44;
                    range = 0;
                    break;
                  default:
                    // 如果没有匹配的配置，使用原始值
                    setValue = parseFloat(signal.measuredVal);
                    range = setValue * 0.05; // 默认5%波动
                }

                // 生成在 [SetValue - Range, SetValue + Range] 范围内的随机值
                let variation = 0;
                if (range > 0) {
                  variation = (Math.random() - 0.5) * 2 * range; // ±Range波动
                }

                const newVal = Math.max(0, setValue + variation); // 确保不小于0
                newSignal.measuredVal = newVal.toFixed(6);
              } else if (signal.type === "6") {
                // 字符串信号保持原值
                newSignal.measuredVal = signal.measuredVal;
              }

              return newSignal;
            }),
          };
        },
      },

      // 温湿度传感器
      temperature: {
        fsuId: "61080243800281",
        deviceId: "61080241830309",
        signals: [
          {
            type: "2",
            id: "0418004001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0418005001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0418006001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0418007001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0418008001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "3",
            id: "0418101001",
            setupVal: "0",
            status: "0",
            measuredVal: "28.184357",
          },
          {
            type: "3",
            id: "0418102001",
            setupVal: "0",
            status: "0",
            measuredVal: "53.863525",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              if (signal.type === "3") {
                if (signal.id === "0418101001") {
                  // 温度 15-35度
                  const temp = (15 + Math.random() * 20).toFixed(6);
                  return { ...signal, measuredVal: temp };
                } else if (signal.id === "0418102001") {
                  // 湿度 30-80%
                  const humidity = (30 + Math.random() * 50).toFixed(6);
                  return { ...signal, measuredVal: humidity };
                }
              }
              return signal;
            }),
          };
        },
      },

      // 开关电源
      switchPower: {
        fsuId: "61080243800281",
        deviceId: "61080240600278",
        signals: [
          // 告警信号 (Type="2")
          {
            type: "2",
            id: "0406001001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406005001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406007001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406008001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406009001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406014001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406015001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406016001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406017001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406022001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406024001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406024002",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406024003",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406024004",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406028001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406028002",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406028003",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406028004",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406030001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406031001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          // 新增告警信号
          {
            type: "2",
            id: "0406001002",
            setupVal: "",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0406007002",
            setupVal: "",
            status: "0",
            measuredVal: "0",
          },
          // 模拟量信号 (Type="3")
          {
            type: "3",
            id: "0406101001",
            setupVal: "0",
            status: "0",
            measuredVal: "219.000000",
          },
          {
            type: "3",
            id: "0406102001",
            setupVal: "0",
            status: "0",
            measuredVal: "219.000000",
          },
          {
            type: "3",
            id: "0406103001",
            setupVal: "0",
            status: "0",
            measuredVal: "219.000000",
          },
          {
            type: "3",
            id: "0406110001",
            setupVal: "0",
            status: "0",
            measuredVal: "50.000000",
          },
          {
            type: "3",
            id: "0406111001",
            setupVal: "0",
            status: "0",
            measuredVal: "53.900000",
          },
          {
            type: "3",
            id: "0406112001",
            setupVal: "0",
            status: "0",
            measuredVal: "27.000000",
          },
          {
            type: "3",
            id: "0406113001",
            setupVal: "0",
            status: "0",
            measuredVal: "6.800000",
          },
          {
            type: "3",
            id: "0406113002",
            setupVal: "0",
            status: "0",
            measuredVal: "6.800000",
          },
          {
            type: "3",
            id: "0406113003",
            setupVal: "0",
            status: "0",
            measuredVal: "6.800000",
          },
          {
            type: "3",
            id: "0406113004",
            setupVal: "0",
            status: "0",
            measuredVal: "6.800000",
          },
          {
            type: "3",
            id: "0406115001",
            setupVal: "0",
            status: "0",
            measuredVal: "0.000000",
          },
          {
            type: "3",
            id: "0406123001",
            setupVal: "0",
            status: "0",
            measuredVal: "4.000000",
          },
          {
            type: "3",
            id: "0406126001",
            setupVal: "0",
            status: "0",
            measuredVal: "1.000000",
          },
          {
            type: "3",
            id: "0406143001",
            setupVal: "0",
            status: "0",
            measuredVal: "56.000000",
          },
          {
            type: "3",
            id: "0406144001",
            setupVal: "0",
            status: "0",
            measuredVal: "54.000000",
          },
          {
            type: "3",
            id: "0406146001",
            setupVal: "0",
            status: "0",
            measuredVal: "47.000000",
          },
          {
            type: "3",
            id: "0406147001",
            setupVal: "0",
            status: "0",
            measuredVal: "45.000000",
          },
          // 新增字符串信号 (Type="6")
          {
            type: "6",
            id: "0406173001",
            setupVal: "",
            status: "0",
            measuredVal: "SMU02B-XN",
          },
          {
            type: "6",
            id: "0406175001",
            setupVal: "",
            status: "0",
            measuredVal: "HUAWEI",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              if (signal.type === "3") {
                // 为模拟量信号生成随机波动数据
                const baseVal = parseFloat(signal.measuredVal);
                if (signal.id.startsWith("040610")) {
                  // 电压类信号 (210-230V)
                  const voltage = (210 + Math.random() * 20).toFixed(6);
                  return { ...signal, measuredVal: voltage };
                } else if (signal.id.startsWith("040611")) {
                  // 频率类信号 (49-51Hz)
                  const frequency = (49 + Math.random() * 2).toFixed(6);
                  return { ...signal, measuredVal: frequency };
                } else {
                  // 其他信号保持基准值附近波动
                  const variation = baseVal * 0.1; // 10%波动
                  const newVal = (
                    baseVal +
                    (Math.random() - 0.5) * variation
                  ).toFixed(6);
                  return { ...signal, measuredVal: newVal };
                }
              } else if (signal.type === "6") {
                // 字符串信号保持原值
                return signal;
              }
              return signal;
            }),
          };
        },
      },

      // 蓄电池
      battery: {
        fsuId: "61089443800204",
        deviceId: "61089440700375",
        signals: [
          {
            type: "2",
            id: "0407001001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0407002001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "3",
            id: "0407102001",
            setupVal: "0",
            status: "0",
            measuredVal: "54.075000",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              if (signal.type === "3" && signal.id === "0407102001") {
                // 电池电压 48-56V
                const voltage = (48 + Math.random() * 8).toFixed(6);
                return { ...signal, measuredVal: voltage };
              }
              return signal;
            }),
          };
        },
      },

      // 烟雾传感器
      smoke: {
        fsuId: "61089443800204",
        deviceId: "61089441820181",
        signals: [
          {
            type: "2",
            id: "0418002001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => ({
              ...signal,
              measuredVal: Math.random() > 0.95 ? "1" : "0", // 5%概率检测到烟雾
            })),
          };
        },
      },

      // 红外传感器
      infrared: {
        fsuId: "61089443800204",
        deviceId: "61089441810120",
        signals: [
          {
            type: "2",
            id: "0418003001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => ({
              ...signal,
              measuredVal: Math.random() > 0.8 ? "1" : "0", // 20%概率检测到入侵
            })),
          };
        },
      },

      // 非智能门禁
      doorAccess: {
        fsuId: "61089443800204",
        deviceId: "61089449900035",
        signals: [
          {
            type: "2",
            id: "0499001001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0499002001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0499005001",
            setupVal: "0",
            status: "0",
            measuredVal: "1",
          },
          {
            type: "2",
            id: "0499006001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              if (signal.id === "0499005001") {
                // 门状态：随机开关
                return {
                  ...signal,
                  measuredVal: Math.random() > 0.7 ? "1" : "0",
                };
              }
              return signal;
            }),
          };
        },
      },

      // 梯次电池
      stepBattery: {
        fsuId: "61089443800204",
        deviceId: "61089444700207",
        signals: [
          // 告警信号
          {
            type: "2",
            id: "0447001001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447002001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447003001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447004001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447005001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447006001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447007001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447008001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447009001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447010001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447011001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447012001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447013001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447014001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447017001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447018001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447019001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447020001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447021001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447022001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447023001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447024001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447025001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447026001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447027001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447028001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447029001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447030001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447031001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0447032001",
            setupVal: "0",
            status: "0",
            measuredVal: "0",
          },
          // 模拟量信号
          {
            type: "3",
            id: "0447102001",
            setupVal: "0",
            status: "0",
            measuredVal: "21.000000",
          },
          {
            type: "3",
            id: "0447102002",
            setupVal: "0",
            status: "0",
            measuredVal: "22.000000",
          },
          {
            type: "3",
            id: "0447102003",
            setupVal: "0",
            status: "0",
            measuredVal: "22.000000",
          },
          {
            type: "3",
            id: "0447102004",
            setupVal: "0",
            status: "0",
            measuredVal: "21.000000",
          },
          {
            type: "3",
            id: "0447103001",
            setupVal: "0",
            status: "0",
            measuredVal: "50.820000",
          },
          {
            type: "3",
            id: "0447104001",
            setupVal: "0",
            status: "0",
            measuredVal: "3.397000",
          },
          {
            type: "3",
            id: "0447104002",
            setupVal: "0",
            status: "0",
            measuredVal: "3.396000",
          },
          {
            type: "3",
            id: "0447104003",
            setupVal: "0",
            status: "0",
            measuredVal: "3.395000",
          },
          {
            type: "3",
            id: "0447104004",
            setupVal: "0",
            status: "0",
            measuredVal: "3.378000",
          },
          {
            type: "3",
            id: "0447104005",
            setupVal: "0",
            status: "0",
            measuredVal: "3.395000",
          },
          {
            type: "3",
            id: "0447104006",
            setupVal: "0",
            status: "0",
            measuredVal: "3.395000",
          },
          {
            type: "3",
            id: "0447104007",
            setupVal: "0",
            status: "0",
            measuredVal: "3.394000",
          },
          {
            type: "3",
            id: "0447104008",
            setupVal: "0",
            status: "0",
            measuredVal: "3.394000",
          },
          {
            type: "3",
            id: "0447104009",
            setupVal: "0",
            status: "0",
            measuredVal: "3.361000",
          },
          {
            type: "3",
            id: "0447104010",
            setupVal: "0",
            status: "0",
            measuredVal: "3.394000",
          },
          {
            type: "3",
            id: "0447104011",
            setupVal: "0",
            status: "0",
            measuredVal: "3.395000",
          },
          {
            type: "3",
            id: "0447104012",
            setupVal: "0",
            status: "0",
            measuredVal: "3.396000",
          },
          {
            type: "3",
            id: "0447104013",
            setupVal: "0",
            status: "0",
            measuredVal: "3.395000",
          },
          {
            type: "3",
            id: "0447104014",
            setupVal: "0",
            status: "0",
            measuredVal: "3.397000",
          },
          {
            type: "3",
            id: "0447104015",
            setupVal: "0",
            status: "0",
            measuredVal: "3.395000",
          },
          {
            type: "3",
            id: "0447104016",
            setupVal: "0",
            status: "0",
            measuredVal: "0.000000",
          },
          {
            type: "3",
            id: "0447105001",
            setupVal: "0",
            status: "0",
            measuredVal: "96.720000",
          },
          {
            type: "3",
            id: "0447106001",
            setupVal: "0",
            status: "0",
            measuredVal: "0.000000",
          },
          {
            type: "3",
            id: "0447107001",
            setupVal: "0",
            status: "0",
            measuredVal: "4.000000",
          },
          {
            type: "3",
            id: "0447113001",
            setupVal: "0",
            status: "0",
            measuredVal: "33.000000",
          },
          {
            type: "6",
            id: "0447117001",
            setupVal: "0",
            status: "0",
            measuredVal: "100.000000",
          },
          {
            type: "6",
            id: "0447120001",
            setupVal: "0",
            status: "0",
            measuredVal: "100.000000",
          },
          {
            type: "6",
            id: "0447121001",
            setupVal: "0",
            status: "0",
            measuredVal: "256.000000",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              if (signal.type === "3") {
                const baseVal = parseFloat(signal.measuredVal);
                if (signal.id.startsWith("044710")) {
                  // 温度相关信号
                  const temp = (18 + Math.random() * 10).toFixed(6);
                  return { ...signal, measuredVal: temp };
                } else if (signal.id.startsWith("044710400")) {
                  // 单体电压 3.2-3.4V
                  const voltage = (3.2 + Math.random() * 0.2).toFixed(6);
                  return { ...signal, measuredVal: voltage };
                } else {
                  // 其他信号保持基准值附近小幅波动
                  const variation = baseVal * 0.05;
                  const newVal = Math.max(
                    0,
                    baseVal + (Math.random() - 0.5) * variation
                  ).toFixed(6);
                  return { ...signal, measuredVal: newVal };
                }
              }
              return signal;
            }),
          };
        },
      },

      // 新增设备: 61082140702618 (普通阀控密封铅酸蓄电池1)
      device61082140702618: {
        fsuId: "61082143802203",
        deviceId: "61082140702618",
        signals: [
          {
            type: "2", // 遥信信号
            id: "0407001001", // 蓄电池告警信号
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示正常
          },
          {
            type: "2", // 遥信信号
            id: "0407002001", // 蓄电池告警信号2
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示正常
          },
          {
            type: "3", // 遥测信号 - 蓄电池总电压
            id: "0407102001",
            setupVal: "53.5",
            status: "0",
            measuredVal: "53.500000",
          },
          {
            type: "3", // 遥测信号 - 蓄电池前半组电压
            id: "0407106001",
            setupVal: "26.75",
            status: "0",
            measuredVal: "26.750000",
          },
          {
            type: "3", // 遥测信号 - 蓄电池后半组电压
            id: "0407107001",
            setupVal: "26.75",
            status: "0",
            measuredVal: "26.750000",
          },
          {
            type: "3", // 遥测信号 - 蓄电池中间点差值
            id: "0407005001",
            setupVal: "0",
            status: "0",
            measuredVal: "0.000000",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              const newSignal = { ...signal };
              if (signal.type === "2") {
                newSignal.measuredVal = "0"; // 遥信信号保持正常
              } else if (signal.type === "3") {
                // 根据配置中的SetValue和Range生成数据
                let setValue, range;
                switch (signal.id) {
                  case "0407102001": // 蓄电池总电压
                    setValue = 53.5;
                    range = 1.0;
                    break;
                  case "0407106001": // 蓄电池前半组电压
                  case "0407107001": // 蓄电池后半组电压
                    setValue = 26.75;
                    range = 0.5;
                    break;
                  case "0407005001": // 蓄电池中间点差值
                    setValue = 0;
                    range = 0.1;
                    break;
                  default:
                    setValue = parseFloat(
                      signal.setupVal || signal.measuredVal
                    );
                    range = setValue * 0.02; // 默认2%波动
                }

                const variation = (Math.random() - 0.5) * 2 * range; // ±Range波动
                const newVal = Math.max(0, setValue + variation);
                newSignal.measuredVal = newVal.toFixed(6);
              }
              return newSignal;
            }),
          };
        },
      },

      // 新增设备: 61082141820991 (烟感设备01)
      device61082141820991: {
        fsuId: "61082143802203",
        deviceId: "61082141820991",
        signals: [
          {
            type: "2", // 遥信信号
            id: "0418002001", // 烟感告警信号
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示正常，1表示检测到烟雾
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              const newSignal = { ...signal };
              if (signal.type === "2" && signal.id === "0418002001") {
                // 烟感告警：95%概率正常，5%概率检测到烟雾
                newSignal.measuredVal = Math.random() > 0.95 ? "1" : "0";
              } else {
                newSignal.measuredVal = signal.measuredVal; // 保持原值
              }
              return newSignal;
            }),
          };
        },
      },

      // FSU自身设备: 61082143802203 (与FSU ID相同)
      fsuSelf61082143802203: {
        fsuId: "61082143802203",
        deviceId: "61082143802203",
        signals: [
          {
            type: "2", // 遥信信号
            id: "0101001001", // FSU状态信号
            setupVal: "0",
            status: "0",
            measuredVal: "1", // 1表示FSU在线
          },
          {
            type: "3", // 遥测信号
            id: "0101101001", // FSU工作时间
            setupVal: "0",
            status: "0",
            measuredVal: "3600.000000", // 运行时间（秒）
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              const newSignal = { ...signal };
              if (signal.type === "2") {
                newSignal.measuredVal = "1"; // FSU始终在线
              } else if (signal.type === "3") {
                // 工作时间递增
                const currentTime = parseFloat(signal.measuredVal) + 60; // 每次增加60秒
                newSignal.measuredVal = currentTime.toFixed(6);
              }
              return newSignal;
            }),
          };
        },
      },

      // 新增设备: 61082140702619 (普通阀控密封铅酸蓄电池2)
      device61082140702619: {
        fsuId: "61082143802203",
        deviceId: "61082140702619",
        signals: [
          {
            type: "2", // 遥信信号
            id: "0407001001", // 蓄电池告警信号
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示正常
          },
          {
            type: "2", // 遥信信号
            id: "0407002001", // 蓄电池告警信号2
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示正常
          },
          {
            type: "3", // 遥测信号 - 蓄电池总电压
            id: "0407102001",
            setupVal: "53.5",
            status: "0",
            measuredVal: "53.500000",
          },
          {
            type: "3", // 遥测信号 - 蓄电池前半组电压
            id: "0407106001",
            setupVal: "26.75",
            status: "0",
            measuredVal: "26.750000",
          },
          {
            type: "3", // 遥测信号 - 蓄电池后半组电压
            id: "0407107001",
            setupVal: "26.75",
            status: "0",
            measuredVal: "26.750000",
          },
          {
            type: "3", // 遥测信号 - 蓄电池中间点差值
            id: "0407005001",
            setupVal: "0",
            status: "0",
            measuredVal: "0.000000",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              const newSignal = { ...signal };
              if (signal.type === "2") {
                newSignal.measuredVal = "0"; // 遥信信号保持正常
              } else if (signal.type === "3") {
                // 根据配置中的SetValue和Range生成数据
                let setValue, range;
                switch (signal.id) {
                  case "0407102001": // 蓄电池总电压
                    setValue = 53.5;
                    range = 1.0;
                    break;
                  case "0407106001": // 蓄电池前半组电压
                  case "0407107001": // 蓄电池后半组电压
                    setValue = 26.75;
                    range = 0.5;
                    break;
                  case "0407005001": // 蓄电池中间点差值
                    setValue = 0;
                    range = 0.1;
                    break;
                  default:
                    setValue = parseFloat(
                      signal.setupVal || signal.measuredVal
                    );
                    range = setValue * 0.02; // 默认2%波动
                }

                const variation = (Math.random() - 0.5) * 2 * range; // ±Range波动
                const newVal = Math.max(0, setValue + variation);
                newSignal.measuredVal = newVal.toFixed(6);
              }
              return newSignal;
            }),
          };
        },
      },

      // 新增设备: 61082141831306 (温湿感01 - 图片中高亮显示)
      device61082141831306: {
        fsuId: "61082143802203",
        deviceId: "61082141831306",
        signals: [
          {
            type: "2", // 遥信信号
            id: "0418004001", // 温湿度传感器告警1
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示正常
          },
          {
            type: "2", // 遥信信号
            id: "0418005001", // 温湿度传感器告警2
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示正常
          },
          {
            type: "2", // 遥信信号
            id: "0418006001", // 温湿度传感器告警3
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示正常
          },
          {
            type: "2", // 遥信信号
            id: "0418007001", // 温湿度传感器告警4
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示正常
          },
          {
            type: "2", // 遥信信号
            id: "0418008001", // 温湿度传感器告警5
            setupVal: "0",
            status: "0",
            measuredVal: "0", // 0表示正常
          },
          {
            type: "3", // 遥测信号 - 环境温度
            id: "0418101001",
            setupVal: "20",
            status: "0",
            measuredVal: "20.000000",
          },
          {
            type: "3", // 遥测信号 - 环境湿度
            id: "0418102001",
            setupVal: "50",
            status: "0",
            measuredVal: "50.000000",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              const newSignal = { ...signal };
              if (signal.type === "2") {
                newSignal.measuredVal = "0"; // 遥信信号保持正常
              } else if (signal.type === "3") {
                // 根据配置中的SetValue和Range生成数据
                let setValue, range;
                switch (signal.id) {
                  case "0418101001": // 环境温度
                    setValue = 20;
                    range = 4; // ±4度波动
                    break;
                  case "0418102001": // 环境湿度
                    setValue = 50;
                    range = 5; // ±5%波动
                    break;
                  default:
                    setValue = parseFloat(
                      signal.setupVal || signal.measuredVal
                    );
                    range = setValue * 0.1; // 默认10%波动
                }

                const variation = (Math.random() - 0.5) * 2 * range; // ±Range波动
                const newVal = Math.max(0, setValue + variation);
                newSignal.measuredVal = newVal.toFixed(6);
              }
              return newSignal;
            }),
          };
        },
      },

      // 新增设备: 61082141901246 (监控设备01)
      device61082141901246: {
        fsuId: "61082143802203",
        deviceId: "61082141901246",
        signals: [
          {
            type: "2", // 遥信信号
            id: "0419001001", // 监控设备状态
            setupVal: "0",
            status: "0",
            measuredVal: "1", // 1表示监控设备在线
          },
          {
            type: "3", // 遥测信号
            id: "0419101001", // 监控设备工作时间
            setupVal: "0",
            status: "0",
            measuredVal: "7200.000000", // 工作时间（秒）
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              const newSignal = { ...signal };
              if (signal.type === "2") {
                newSignal.measuredVal = "1"; // 监控设备保持在线
              } else if (signal.type === "3") {
                // 工作时间递增
                const currentTime = parseFloat(signal.measuredVal) + 30; // 每次增加30秒
                newSignal.measuredVal = currentTime.toFixed(6);
              }
              return newSignal;
            }),
          };
        },
      },

      // 新增设备: 61082100004224 (特殊设备，可能是网络设备)
      device61082100004224: {
        fsuId: "61082143802203",
        deviceId: "61082100004224",
        signals: [
          {
            type: "2", // 遥信信号
            id: "0499001001", // 网络设备状态
            setupVal: "0",
            status: "0",
            measuredVal: "1", // 1表示设备在线
          },
          {
            type: "6", // 字符串信号
            id: "0499171001", // 设备型号
            setupVal: "",
            status: "0",
            measuredVal: "YTG994",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              const newSignal = { ...signal };
              if (signal.type === "2") {
                newSignal.measuredVal = "1"; // 设备保持在线
              } else if (signal.type === "6") {
                newSignal.measuredVal = signal.measuredVal; // 字符串信号保持不变
              }
              return newSignal;
            }),
          };
        },
      },

      // 空调
      airConditioner: {
        fsuId: "61080243801859",
        deviceId: "61080241501046",
        signals: [
          {
            type: "2",
            id: "0415001001",
            setupVal: "",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "2",
            id: "0415002001",
            setupVal: "",
            status: "3",
            measuredVal: "1",
          },
          {
            type: "2",
            id: "0415003001",
            setupVal: "",
            status: "0",
            measuredVal: "0",
          },
          {
            type: "3",
            id: "0415102001",
            setupVal: "",
            status: "0",
            measuredVal: "20.00",
          },
          {
            type: "3",
            id: "0415103001",
            setupVal: "",
            status: "0",
            measuredVal: "961656832.00",
          },
          {
            type: "3",
            id: "0415105001",
            setupVal: "",
            status: "0",
            measuredVal: "0.00",
          },
          {
            type: "3",
            id: "0415110001",
            setupVal: "",
            status: "0",
            measuredVal: "1.00",
          },
          {
            type: "3",
            id: "0415111001",
            setupVal: "",
            status: "0",
            measuredVal: "0.00",
          },
          {
            type: "3",
            id: "0415112001",
            setupVal: "",
            status: "0",
            measuredVal: "0.00",
          },
          {
            type: "3",
            id: "0415113001",
            setupVal: "",
            status: "0",
            measuredVal: "244.00",
          },
          {
            type: "3",
            id: "0415114001",
            setupVal: "",
            status: "0",
            measuredVal: "0.00",
          },
          {
            type: "3",
            id: "0415115001",
            setupVal: "",
            status: "0",
            measuredVal: "0.00",
          },
          {
            type: "3",
            id: "0415116001",
            setupVal: "",
            status: "0",
            measuredVal: "0.00",
          },
          {
            type: "3",
            id: "0415117001",
            setupVal: "",
            status: "0",
            measuredVal: "26.00",
          },
          {
            type: "3",
            id: "0415118001",
            setupVal: "",
            status: "0",
            measuredVal: "22.00",
          },
        ],
        getRandomData: function () {
          return {
            signals: this.signals.map((signal) => {
              if (signal.type === "3") {
                if (signal.id === "0415102001") {
                  // 设定温度 18-25度
                  const setTemp = (18 + Math.random() * 7).toFixed(2);
                  return { ...signal, measuredVal: setTemp };
                } else if (signal.id === "0415117001") {
                  // 环境温度 20-30度
                  const envTemp = (20 + Math.random() * 10).toFixed(2);
                  return { ...signal, measuredVal: envTemp };
                } else if (signal.id === "0415118001") {
                  // 出风温度
                  const outTemp = (18 + Math.random() * 8).toFixed(2);
                  return { ...signal, measuredVal: outTemp };
                }
              }
              return signal;
            }),
          };
        },
      },
    };
  }

  /**
   * 初始化虚拟数据缓存
   */
  initializeVirtualData() {
    const data = {};
    Object.keys(this.deviceTemplates).forEach((deviceType) => {
      data[deviceType] = this.deviceTemplates[deviceType].getRandomData();
    });
    return data;
  }

  /**
   * 根据设备ID获取设备类型
   */
  getDeviceTypeByDeviceId(deviceId) {
    for (const [type, template] of Object.entries(this.deviceTemplates)) {
      if (template.deviceId === deviceId) {
        return type;
      }
    }
    return null;
  }

  /**
   * 根据FSU ID和设备ID获取响应数据
   */
  getDeviceResponse(fsuId, deviceId) {
    try {
      const deviceType = this.getDeviceTypeByDeviceId(deviceId);

      if (!deviceType) {
        logger.warn("未找到匹配的设备类型", { fsuId, deviceId });
        return null;
      }

      const template = this.deviceTemplates[deviceType];

      // 检查FSU ID是否匹配
      if (template.fsuId !== fsuId) {
        logger.warn("FSU ID不匹配", {
          requestFsuId: fsuId,
          templateFsuId: template.fsuId,
          deviceType,
        });
        return null;
      }

      // 生成当前数据
      const currentData = template.getRandomData();

      // 构造响应XML
      const signalsXml = currentData.signals
        .map(
          (signal) =>
            `<TSemaphore Type="${signal.type}" Id="${signal.id}" SetupVal="${signal.setupVal}" Status="${signal.status}" MeasuredVal="${signal.measuredVal}"/>`
        )
        .join("");

      const responseXml = `<?xml version="1.0" encoding="UTF-8"?><Response><PK_Type><Name>GET_DATA_ACK</Name><Code>402</Code></PK_Type><Info><FsuId>${fsuId}</FsuId><FsuCode>${fsuId}</FsuCode><Result>1</Result><Values><DeviceList><Device Id="${deviceId}" Code="${deviceId}">${signalsXml}</Device></DeviceList></Values></Info></Response>`;

      logger.info("生成设备响应数据", {
        deviceType,
        fsuId,
        deviceId,
        signalCount: currentData.signals.length,
      });

      return responseXml;
    } catch (error) {
      logger.error("生成设备响应数据失败", {
        error: error.message,
        fsuId,
        deviceId,
      });
      return null;
    }
  }

  /**
   * 获取所有支持的设备列表
   */
  getSupportedDevices() {
    return Object.keys(this.deviceTemplates).map((type) => ({
      type,
      fsuId: this.deviceTemplates[type].fsuId,
      deviceId: this.deviceTemplates[type].deviceId,
      signalCount: this.deviceTemplates[type].signals.length,
    }));
  }

  /**
   * 更新虚拟数据（定期刷新）
   */
  refreshVirtualData() {
    Object.keys(this.deviceTemplates).forEach((deviceType) => {
      this.virtualData[deviceType] =
        this.deviceTemplates[deviceType].getRandomData();
    });
    logger.debug("虚拟数据已刷新");
  }

  /**
   * 启动数据刷新定时器
   */
  startDataRefreshTimer(intervalMs = 30000) {
    setInterval(() => {
      this.refreshVirtualData();
    }, intervalMs);
    logger.info("数据刷新定时器已启动", { intervalMs });
  }
}

module.exports = new DeviceDataManager();
