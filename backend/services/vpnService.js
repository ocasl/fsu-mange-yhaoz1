const smartAxios = require("../utils/smartAxios");
const { exec, spawn } = require("child_process");
const os = require("os");
const net = require("net");
const logger = require("../utils/logger");

/**
 * VPN连接服务
 * 实现FSU客户端的网络隧道连接
 */
class VpnService {
  constructor() {
    this.isConnected = false;
    this.internalIP = null;
    this.vpnProcess = null;
    this.vpnConfig = {
      server: process.env.VPN_SERVER || "117.156.97.152",
      username: process.env.VPN_USER || "61082143802203",
      password: process.env.VPN_PASSWORD || "61082143802203",
      scHost: "sn.toweraiot.cn", // 修改默认SC地址
      scPort: 8080,
      // VPN连接配置
      vpnType: process.env.VPN_TYPE || "openvpn", // openvpn, l2tp, pptp
      vpnPort: process.env.VPN_PORT || 1194,
      configFile: process.env.VPN_CONFIG_FILE || null,
    };
    this.tunnelAgent = null;
  }

  /**
   * 检测VPN环境并获取内网IP
   * @returns {Promise<boolean>} 是否成功检测到VPN环境
   */
  async connect() {
    try {
      logger.info("开始检测VPN环境", {
        server: this.vpnConfig.server,
        username: this.vpnConfig.username,
      });

      // 1. 检测是否已在VPN环境中
      const vpnDetected = await this.detectVpnEnvironment();
      if (vpnDetected.isInVpn) {
        this.internalIP = vpnDetected.vpnIP;
        this.isConnected = true;

        logger.info("检测到VPN环境", {
          internalIP: this.internalIP,
          interface: vpnDetected.interface,
          connectionType: "detected_vpn",
        });

        // 测试到SC服务器的连通性
        const scReachable = await this.testScServer();
        if (!scReachable) {
          logger.warn("SC服务器连接测试失败，但继续尝试");
        }

        return true;
      }

      // 2. 如果没有检测到VPN，提供连接指导
      logger.warn("未检测到VPN环境，请手动连接VPN");
      this.logVpnConnectionGuide();

      // 3. 使用模拟模式作为备用方案
      logger.info("使用模拟模式作为备用方案");
      return await this.connectSimulated();
    } catch (error) {
      logger.error("VPN环境检测失败", {
        error: error.message,
        stack: error.stack,
      });

      // 失败时尝试模拟模式
      logger.info("尝试使用模拟VPN模式");
      return await this.connectSimulated();
    }
  }

  /**
   * 模拟VPN连接（备用方案）
   * @returns {Promise<boolean>}
   */
  async connectSimulated() {
    try {
      logger.info("使用模拟VPN连接模式");

      // 生成内网IP
      this.internalIP = this.generateInternalIP();

      // 测试网络连通性
      const networkOk = await this.testNetworkConnectivity();
      if (!networkOk) {
        logger.warn("网络连通性测试失败");
      }

      this.isConnected = true;
      logger.info("模拟VPN连接成功", {
        internalIP: this.internalIP,
        connectionType: "simulated",
      });

      return true;
    } catch (error) {
      logger.error("模拟VPN连接失败", { error: error.message });
      return false;
    }
  }

  /**
   * 检测VPN环境
   * @returns {Promise<Object>} VPN检测结果
   */
  async detectVpnEnvironment() {
    try {
      const interfaces = os.networkInterfaces();

      // 1. 检查VPN接口
      const vpnInterface = this.findVpnInterface(interfaces);
      if (vpnInterface) {
        return {
          isInVpn: true,
          vpnIP: vpnInterface.address,
          interface: vpnInterface.name,
          method: "vpn_interface",
        };
      }

      // 2. 检查路由表（Windows）
      if (os.platform() === "win32") {
        const routeResult = await this.checkWindowsRoutes();
        if (routeResult.isInVpn) {
          return routeResult;
        }
      }

      // 3. 检查特定IP段的连通性
      const connectivityResult = await this.checkVpnConnectivity();
      if (connectivityResult.isInVpn) {
        return connectivityResult;
      }

      // 4. 使用本机内网IP作为备用
      const localIP = this.getLocalInternalIP(interfaces);
      if (localIP) {
        logger.info("使用本机内网IP作为VPN IP", { ip: localIP });
        return {
          isInVpn: true,
          vpnIP: localIP,
          interface: "local",
          method: "local_internal_ip",
        };
      }

      return {
        isInVpn: false,
        vpnIP: null,
        interface: null,
        method: "not_detected",
      };
    } catch (error) {
      logger.error("VPN环境检测异常", { error: error.message });
      return {
        isInVpn: false,
        vpnIP: null,
        interface: null,
        method: "error",
        error: error.message,
      };
    }
  }

  /**
   * 查找VPN网络接口
   * @param {Object} interfaces 网络接口
   * @returns {Object|null} VPN接口信息
   */
  findVpnInterface(interfaces) {
    const vpnInterfaceNames = [
      "tun",
      "tap",
      "ppp",
      "vpn",
      "openvpn",
      "l2tp",
      "pptp",
      "wireguard",
      "wg",
      "tieta",
    ];

    // 第一优先级：查找10.x.x.x网段的VPN IP
    for (const interfaceName in interfaces) {
      const iface = interfaces[interfaceName];
      for (const alias of iface) {
        if (
          alias.family === "IPv4" &&
          !alias.internal &&
          alias.address.startsWith("10.")
        ) {
          logger.info("找到VPN内网IP (10.x.x.x)", {
            interface: interfaceName,
            address: alias.address,
          });
          return {
            name: interfaceName,
            address: alias.address,
            family: alias.family,
          };
        }
      }
    }

    // 第二优先级：查找明确的VPN接口名称
    for (const interfaceName in interfaces) {
      const iface = interfaces[interfaceName];

      // 检查接口名称或IP地址格式
      const isVpnInterface = vpnInterfaceNames.some((name) =>
        interfaceName.toLowerCase().includes(name)
      );
      const isIPInterface = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(
        interfaceName
      );
      const isSpecialVpnInterface =
        interfaceName.toLowerCase().includes("trust") ||
        interfaceName.toLowerCase().includes("vnic");

      if (isVpnInterface || isIPInterface || isSpecialVpnInterface) {
        for (const alias of iface) {
          if (alias.family === "IPv4" && !alias.internal) {
            // 最优先：10.5.x.x网段（你的VPN服务器分配的真实IP）
            if (alias.address.startsWith("10.5.")) {
              logger.info(`找到真实VPN接口: ${interfaceName}`, {
                ip: alias.address,
                netmask: alias.netmask,
                type: "real_vpn_10_5_segment",
              });
              return {
                name: interfaceName,
                address: alias.address,
                netmask: alias.netmask,
              };
            }
          }
        }
      }
    }

    // 其次查找其他10.x.x.x网段
    for (const interfaceName in interfaces) {
      const iface = interfaces[interfaceName];
      const isVpnInterface = vpnInterfaceNames.some((name) =>
        interfaceName.toLowerCase().includes(name)
      );
      const isIPInterface = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(
        interfaceName
      );
      const isSpecialVpnInterface =
        interfaceName.toLowerCase().includes("trust") ||
        interfaceName.toLowerCase().includes("vnic");

      if (isVpnInterface || isIPInterface || isSpecialVpnInterface) {
        for (const alias of iface) {
          if (alias.family === "IPv4" && !alias.internal) {
            // 其他10.x网段
            if (
              alias.address.startsWith("10.") &&
              !alias.address.startsWith("10.5.")
            ) {
              logger.info(`找到VPN接口: ${interfaceName}`, {
                ip: alias.address,
                netmask: alias.netmask,
                type: "vpn_10_segment",
              });
              return {
                name: interfaceName,
                address: alias.address,
                netmask: alias.netmask,
              };
            }
          }
        }
      }
    }

    // 如果没找到10.x网段，找其他VPN接口
    for (const interfaceName in interfaces) {
      const iface = interfaces[interfaceName];
      const isVpnInterface = vpnInterfaceNames.some((name) =>
        interfaceName.toLowerCase().includes(name)
      );
      const isIPInterface = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(
        interfaceName
      );
      const isSpecialVpnInterface =
        interfaceName.toLowerCase().includes("trust") ||
        interfaceName.toLowerCase().includes("vnic");

      if (isVpnInterface || isIPInterface || isSpecialVpnInterface) {
        for (const alias of iface) {
          if (alias.family === "IPv4" && !alias.internal) {
            logger.info(`找到VPN接口: ${interfaceName}`, {
              ip: alias.address,
              netmask: alias.netmask,
              type: "other_vpn",
            });
            return {
              name: interfaceName,
              address: alias.address,
              netmask: alias.netmask,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * 检查Windows路由表
   * @returns {Promise<Object>} 路由检查结果
   */
  async checkWindowsRoutes() {
    return new Promise((resolve) => {
      exec("route print", (error, stdout) => {
        if (error) {
          logger.warn("无法获取Windows路由表", { error: error.message });
          resolve({ isInVpn: false });
          return;
        }

        // 查找VPN相关的路由
        const lines = stdout.split("\n");
        for (const line of lines) {
          if (line.includes("0.0.0.0") && line.includes("0.0.0.0")) {
            // 分析默认路由，如果网关在VPN IP段内
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
              const gateway = parts[2];
              if (this.isPrivateIP(gateway)) {
                logger.info("通过路由表检测到VPN环境", { gateway });
                resolve({
                  isInVpn: true,
                  vpnIP: gateway,
                  interface: "route_table",
                  method: "windows_route",
                });
                return;
              }
            }
          }
        }

        resolve({ isInVpn: false });
      });
    });
  }

  /**
   * 检查VPN连通性
   * @returns {Promise<Object>} 连通性检查结果
   */
  async checkVpnConnectivity() {
    try {
      // 测试到SC服务器的连通性
      const scReachable = await this.testScServer();
      if (scReachable) {
        // 如果能连接到SC服务器，可能已在VPN环境中
        const localIP = this.getLocalInternalIP();
        if (localIP) {
          logger.info("通过SC服务器连通性检测到VPN环境", { ip: localIP });
          return {
            isInVpn: true,
            vpnIP: localIP,
            interface: "connectivity",
            method: "sc_connectivity",
          };
        }
      }

      return { isInVpn: false };
    } catch (error) {
      logger.warn("VPN连通性检查失败", { error: error.message });
      return { isInVpn: false };
    }
  }

  /**
   * 获取本机内网IP
   * @param {Object} interfaces 网络接口（可选）
   * @returns {string|null} 内网IP地址
   */
  getLocalInternalIP(interfaces = null) {
    try {
      if (!interfaces) {
        interfaces = os.networkInterfaces();
      }

      for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        for (const alias of iface) {
          if (alias.family === "IPv4" && !alias.internal) {
            if (this.isPrivateIP(alias.address)) {
              return alias.address;
            }
          }
        }
      }

      return null;
    } catch (error) {
      logger.error("获取本机内网IP失败", { error: error.message });
      return null;
    }
  }

  /**
   * 输出VPN连接指导
   */
  logVpnConnectionGuide() {
    logger.info("=== VPN连接指导 ===");
    logger.info("请手动连接VPN，然后重新启动服务:");
    logger.info("1. Windows: 使用系统VPN设置或第三方VPN客户端");
    logger.info("2. Linux: 使用OpenVPN或NetworkManager");
    logger.info("3. macOS: 使用系统VPN设置或Tunnelblick");
    logger.info("");
    logger.info("VPN服务器信息:");
    logger.info(`- 服务器: ${this.vpnConfig.server}`);
    logger.info(`- 用户名: ${this.vpnConfig.username}`);
    logger.info(`- 类型: ${this.vpnConfig.vpnType}`);
    logger.info("==================");
  }

  /**
   * 获取VPN状态摘要
   * @returns {Object} VPN状态摘要
   */
  async getVpnStatusSummary() {
    const detection = await this.detectVpnEnvironment();

    return {
      isConnected: detection.isInVpn,
      internalIP: detection.vpnIP,
      interface: detection.interface,
      detectionMethod: detection.method,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取VPN分配的内网IP
   * @returns {Promise<string|null>}
   */
  async getVpnInternalIP() {
    return new Promise((resolve) => {
      try {
        const interfaces = os.networkInterfaces();

        // 查找VPN接口
        for (const interfaceName in interfaces) {
          const iface = interfaces[interfaceName];

          // 常见的VPN接口名称
          const vpnInterfaceNames = ["tun", "tap", "ppp", "vpn", "openvpn"];
          const isVpnInterface = vpnInterfaceNames.some((name) =>
            interfaceName.toLowerCase().includes(name)
          );

          if (isVpnInterface) {
            for (const alias of iface) {
              if (alias.family === "IPv4" && !alias.internal) {
                logger.info(`找到VPN内网IP: ${alias.address}`, {
                  interface: interfaceName,
                });
                resolve(alias.address);
                return;
              }
            }
          }
        }

        // 如果没有找到VPN接口，查找内网IP段
        for (const interfaceName in interfaces) {
          const iface = interfaces[interfaceName];
          for (const alias of iface) {
            if (alias.family === "IPv4" && !alias.internal) {
              const ip = alias.address;
              // 检查是否为内网IP段
              if (this.isPrivateIP(ip)) {
                logger.info(`使用内网IP作为VPN IP: ${ip}`, {
                  interface: interfaceName,
                });
                resolve(ip);
                return;
              }
            }
          }
        }

        logger.warn("未找到VPN内网IP");
        resolve(null);
      } catch (error) {
        logger.error("获取VPN内网IP失败", { error: error.message });
        resolve(null);
      }
    });
  }

  /**
   * 检查是否为内网IP
   * @param {string} ip
   * @returns {boolean}
   */
  isPrivateIP(ip) {
    const parts = ip.split(".").map(Number);

    // 10.0.0.0/8
    if (parts[0] === 10) return true;

    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;

    return false;
  }

  /**
   * 测试网络连通性
   * @returns {Promise<boolean>}
   */
  async testNetworkConnectivity() {
    try {
      // 测试到公网的连通性
      const response = await smartAxios.get("http://www.baidu.com", {
        timeout: 3000,
        validateStatus: () => true,
      });

      logger.info("网络连通性测试成功", { status: response.status });
      return true;
    } catch (error) {
      logger.warn("网络连通性测试失败", { error: error.message });
      return false;
    }
  }

  /**
   * 测试VPN服务器连通性
   * @returns {Promise<boolean>}
   */
  async testVpnServer() {
    try {
      // 使用TCP连接测试VPN端口
      const isReachable = await this.testTcpConnection(
        this.vpnConfig.server,
        this.vpnConfig.vpnPort
      );

      if (isReachable) {
        logger.info("VPN服务器连通性测试成功", {
          server: this.vpnConfig.server,
          port: this.vpnConfig.vpnPort,
        });
        return true;
      } else {
        logger.warn("VPN服务器连通性测试失败", {
          server: this.vpnConfig.server,
          port: this.vpnConfig.vpnPort,
        });
        return false;
      }
    } catch (error) {
      logger.warn("VPN服务器连通性测试异常", {
        error: error.message,
        server: this.vpnConfig.server,
      });
      return false;
    }
  }

  /**
   * 测试TCP连接
   * @param {string} host
   * @param {number} port
   * @returns {Promise<boolean>}
   */
  async testTcpConnection(host, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 5000;

      socket.setTimeout(timeout);

      socket.on("connect", () => {
        socket.destroy();
        resolve(true);
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });

      socket.on("error", () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  /**
   * 测试SC服务器连通性
   * @returns {Promise<boolean>}
   */
  async testScServer() {
    try {
      const response = await axios.get(
        `http://${this.vpnConfig.scHost}:${this.vpnConfig.scPort}`,
        {
          timeout: 5000,
          validateStatus: () => true,
        }
      );
      logger.info("SC服务器连通性测试成功", {
        status: response.status,
        server: `${this.vpnConfig.scHost}:${this.vpnConfig.scPort}`,
      });
      return true;
    } catch (error) {
      logger.warn("SC服务器连通性测试失败", {
        error: error.message,
        server: `${this.vpnConfig.scHost}:${this.vpnConfig.scPort}`,
      });
      return false;
    }
  }

  /**
   * 生成内网IP地址（模拟VPN分配）
   * @returns {string}
   */
  generateInternalIP() {
    // 根据FSU ID生成内网IP
    const fsuId = this.vpnConfig.username;
    const lastFourDigits = fsuId.slice(-4);
    const ip = `10.4.${Math.floor(parseInt(lastFourDigits) / 256)}.${
      parseInt(lastFourDigits) % 256
    }`;
    return ip;
  }

  /**
   * 获取内网IP地址（优先使用VPN检测结果）
   * @returns {Promise<string>} 内网IP地址
   */
  async getInternalIP() {
    // 如果已经有检测到的IP，直接返回
    if (this.internalIP) {
      return this.internalIP;
    }

    // 重新检测VPN环境
    const detection = await this.detectVpnEnvironment();
    if (detection.isInVpn && detection.vpnIP) {
      this.internalIP = detection.vpnIP;
      logger.info("获取到VPN内网IP", {
        ip: detection.vpnIP,
        method: detection.method,
        interface: detection.interface,
      });
      return this.internalIP;
    }

    // 如果没有检测到VPN，使用生成的IP
    this.internalIP = this.generateInternalIP();
    logger.warn("未检测到VPN，使用生成的内网IP", { ip: this.internalIP });
    return this.internalIP;
  }

  /**
   * 重置VPN状态（Node.js无法主动断开系统VPN连接）
   */
  async disconnect() {
    try {
      this.isConnected = false;
      this.internalIP = null;

      logger.info("VPN状态已重置");
      logger.info("注意: Node.js无法主动断开系统VPN连接，请手动断开VPN");
    } catch (error) {
      logger.error("重置VPN状态失败", { error: error.message });
    }
  }

  /**
   * 获取当前系统的所有网络接口信息
   * @returns {Object} 网络接口信息
   */
  getNetworkInterfaces() {
    try {
      const interfaces = os.networkInterfaces();
      const result = {};

      for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        result[interfaceName] = iface
          .filter((alias) => alias.family === "IPv4" && !alias.internal)
          .map((alias) => ({
            address: alias.address,
            netmask: alias.netmask,
            mac: alias.mac,
            isPrivate: this.isPrivateIP(alias.address),
          }));
      }

      return result;
    } catch (error) {
      logger.error("获取网络接口信息失败", { error: error.message });
      return {};
    }
  }

  /**
   * 获取系统状态信息
   * @returns {Object} 系统状态
   */
  getSystemStatus() {
    return {
      isConnected: this.isConnected,
      internalIP: this.internalIP,
      vpnConfig: {
        server: this.vpnConfig.server,
        username: this.vpnConfig.username,
        vpnType: this.vpnConfig.vpnType,
        port: this.vpnConfig.vpnPort,
      },
      platform: os.platform(),
      networkInterfaces: this.getNetworkInterfaces(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 检查VPN连接状态
   * @returns {boolean} 是否已连接
   */
  isVpnConnected() {
    return this.isConnected;
  }

  /**
   * 获取内网IP地址
   * @returns {string|null} 内网IP地址
   */
  getInternalIPAddress() {
    return this.internalIP;
  }
}

// 创建单例实例
const vpnService = new VpnService();

module.exports = vpnService;
