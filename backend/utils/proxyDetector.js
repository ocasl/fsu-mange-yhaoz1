const net = require("net");
const logger = require("./logger");

/**
 * 代理检测工具
 * 自动检测系统代理状态并提供智能连接策略
 */
class ProxyDetector {
  constructor() {
    this.proxyPort = 7890;
    this.proxyHost = "127.0.0.1";
    this.lastCheckTime = 0;
    this.checkInterval = 30000; // 30秒缓存
    this.cachedResult = null;
  }

  /**
   * 检测代理端口是否可用
   * @returns {Promise<boolean>} 代理是否可用
   */
  async isProxyAvailable() {
    // 使用缓存避免频繁检测
    const now = Date.now();
    if (
      this.cachedResult !== null &&
      now - this.lastCheckTime < this.checkInterval
    ) {
      return this.cachedResult;
    }

    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = 2000; // 2秒超时

      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
        }
      };

      socket.setTimeout(timeout);

      socket.on("connect", () => {
        if (!resolved) {
          resolved = true;
          socket.end();
          this.cachedResult = true;
          this.lastCheckTime = now;
          logger.debug(`代理检测: ${this.proxyHost}:${this.proxyPort} 可用`);
          resolve(true);
        }
      });

      socket.on("timeout", () => {
        cleanup();
        this.cachedResult = false;
        this.lastCheckTime = now;
        logger.debug(`代理检测: ${this.proxyHost}:${this.proxyPort} 超时`);
        resolve(false);
      });

      socket.on("error", () => {
        cleanup();
        this.cachedResult = false;
        this.lastCheckTime = now;
        logger.debug(`代理检测: ${this.proxyHost}:${this.proxyPort} 不可用`);
        resolve(false);
      });

      socket.connect(this.proxyPort, this.proxyHost);
    });
  }

  /**
   * 获取推荐的axios配置
   * @param {string} targetUrl - 目标URL，用于判断是否需要代理
   * @returns {Promise<Object>} axios配置对象
   */
  async getRecommendedAxiosConfig(targetUrl = "") {
    const isProxyRunning = await this.isProxyAvailable();

    // 判断目标地址类型
    const isInternalNetwork = this.isInternalNetworkUrl(targetUrl);
    const isVPNNetwork = this.isVPNNetworkUrl(targetUrl);

    let proxyConfig = {};
    let strategy = "";

    if (isInternalNetwork || isVPNNetwork) {
      // 内网或VPN地址，不使用代理
      proxyConfig = { proxy: false };
      strategy = isVPNNetwork ? "VPN直连" : "内网直连";
    } else if (isProxyRunning) {
      // 外网地址且代理可用，使用代理
      proxyConfig = {
        proxy: {
          host: this.proxyHost,
          port: this.proxyPort,
        },
      };
      strategy = "代理连接";
    } else {
      // 外网地址但代理不可用，直连
      proxyConfig = { proxy: false };
      strategy = "直连";
    }

    logger.debug(`连接策略: ${strategy}`, {
      targetUrl:
        targetUrl.substring(0, 50) + (targetUrl.length > 50 ? "..." : ""),
      proxyRunning: isProxyRunning,
      isInternal: isInternalNetwork,
      isVPN: isVPNNetwork,
    });

    return proxyConfig;
  }

  /**
   * 判断是否为内网地址
   * @param {string} url
   * @returns {boolean}
   */
  isInternalNetworkUrl(url) {
    if (!url) return false;

    // 提取主机名
    let hostname = "";
    try {
      const urlObj = new URL(url);
      hostname = urlObj.hostname;
    } catch {
      // 如果不是完整URL，可能直接是IP或域名
      hostname = url.split("://")[1]?.split(":")[0] || url.split(":")[0];
    }

    if (!hostname) return false;

    // 检查是否为内网IP段
    const internalPatterns = [
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^127\./,
      /^localhost$/i,
    ];

    return internalPatterns.some((pattern) => pattern.test(hostname));
  }

  /**
   * 判断是否为VPN网络地址
   * @param {string} url
   * @returns {boolean}
   */
  isVPNNetworkUrl(url) {
    if (!url) return false;

    // VPN相关的域名或特殊网段
    const vpnPatterns = [
      /toweraiot\.cn$/i,
      /sn-r\.toweraiot\.cn$/i,
      /zb-sn-r\.toweraiot\.cn$/i,
      // 可以根据实际情况添加更多VPN相关域名
    ];

    return vpnPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * 清除缓存，强制重新检测
   */
  clearCache() {
    this.cachedResult = null;
    this.lastCheckTime = 0;
    logger.debug("代理检测缓存已清除");
  }

  /**
   * 获取代理状态信息
   * @returns {Promise<Object>} 代理状态信息
   */
  async getProxyStatus() {
    const isAvailable = await this.isProxyAvailable();
    return {
      proxyHost: this.proxyHost,
      proxyPort: this.proxyPort,
      isAvailable,
      lastCheckTime: this.lastCheckTime,
      cacheAge: Date.now() - this.lastCheckTime,
    };
  }
}

// 创建全局实例
const proxyDetector = new ProxyDetector();

module.exports = proxyDetector;
