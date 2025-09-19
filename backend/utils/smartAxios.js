const axios = require("axios");
const proxyDetector = require("./proxyDetector");
const logger = require("./logger");

/**
 * 智能axios工具
 * 根据代理状态和目标地址自动选择最佳连接策略
 */
class SmartAxios {
  constructor() {
    this.defaultTimeout = 10000;
  }

  /**
   * 智能GET请求
   * @param {string} url - 请求URL
   * @param {Object} config - axios配置
   * @returns {Promise} axios响应
   */
  async get(url, config = {}) {
    const smartConfig = await this.buildSmartConfig(url, config);

    try {
      const response = await axios.get(url, smartConfig);
      this.logSuccess("GET", url, response.status);
      return response;
    } catch (error) {
      // 如果使用代理失败，尝试直连
      if (smartConfig.proxy && smartConfig.proxy !== false) {
        logger.warn(`代理连接失败，尝试直连: ${error.message}`);
        const directConfig = { ...smartConfig, proxy: false };

        try {
          const response = await axios.get(url, directConfig);
          this.logSuccess("GET", url, response.status, "直连重试成功");
          return response;
        } catch (directError) {
          this.logError("GET", url, directError);
          throw directError;
        }
      } else {
        this.logError("GET", url, error);
        throw error;
      }
    }
  }

  /**
   * 智能POST请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @param {Object} config - axios配置
   * @returns {Promise} axios响应
   */
  async post(url, data, config = {}) {
    const smartConfig = await this.buildSmartConfig(url, config);

    try {
      const response = await axios.post(url, data, smartConfig);
      this.logSuccess("POST", url, response.status);
      return response;
    } catch (error) {
      // 如果使用代理失败，尝试直连
      if (smartConfig.proxy && smartConfig.proxy !== false) {
        logger.warn(`代理连接失败，尝试直连: ${error.message}`);
        const directConfig = { ...smartConfig, proxy: false };

        try {
          const response = await axios.post(url, data, directConfig);
          this.logSuccess("POST", url, response.status, "直连重试成功");
          return response;
        } catch (directError) {
          this.logError("POST", url, directError);
          throw directError;
        }
      } else {
        this.logError("POST", url, error);
        throw error;
      }
    }
  }

  /**
   * 智能PUT请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @param {Object} config - axios配置
   * @returns {Promise} axios响应
   */
  async put(url, data, config = {}) {
    const smartConfig = await this.buildSmartConfig(url, config);
    return axios.put(url, data, smartConfig);
  }

  /**
   * 智能DELETE请求
   * @param {string} url - 请求URL
   * @param {Object} config - axios配置
   * @returns {Promise} axios响应
   */
  async delete(url, config = {}) {
    const smartConfig = await this.buildSmartConfig(url, config);
    return axios.delete(url, smartConfig);
  }

  /**
   * 构建智能配置
   * @param {string} url - 目标URL
   * @param {Object} userConfig - 用户配置
   * @returns {Promise<Object>} 合并后的配置
   */
  async buildSmartConfig(url, userConfig = {}) {
    // 获取推荐的代理配置
    const proxyConfig = await proxyDetector.getRecommendedAxiosConfig(url);

    // 合并配置，用户配置优先级最高
    const smartConfig = {
      timeout: this.defaultTimeout,
      ...proxyConfig,
      ...userConfig,
    };

    // 如果用户明确指定了proxy配置，则使用用户配置
    if (userConfig.hasOwnProperty("proxy")) {
      smartConfig.proxy = userConfig.proxy;
    }

    return smartConfig;
  }

  /**
   * 创建智能axios实例
   * @param {Object} instanceConfig - 实例配置
   * @returns {Object} 智能axios实例
   */
  create(instanceConfig = {}) {
    const smartInstance = {
      get: (url, config) => this.get(url, { ...instanceConfig, ...config }),
      post: (url, data, config) =>
        this.post(url, data, { ...instanceConfig, ...config }),
      put: (url, data, config) =>
        this.put(url, data, { ...instanceConfig, ...config }),
      delete: (url, config) =>
        this.delete(url, { ...instanceConfig, ...config }),
      patch: (url, data, config) =>
        this.patch(url, data, { ...instanceConfig, ...config }),
    };

    return smartInstance;
  }

  /**
   * 智能PATCH请求
   * @param {string} url - 请求URL
   * @param {any} data - 请求数据
   * @param {Object} config - axios配置
   * @returns {Promise} axios响应
   */
  async patch(url, data, config = {}) {
    const smartConfig = await this.buildSmartConfig(url, config);
    return axios.patch(url, data, smartConfig);
  }

  /**
   * 记录成功日志
   */
  logSuccess(method, url, status, note = "") {
    const urlDisplay = url.length > 50 ? url.substring(0, 50) + "..." : url;
    logger.debug(`${method} ${urlDisplay} - ${status} ${note}`);
  }

  /**
   * 记录错误日志
   */
  logError(method, url, error) {
    const urlDisplay = url.length > 50 ? url.substring(0, 50) + "..." : url;
    logger.warn(`${method} ${urlDisplay} 失败: ${error.message}`);
  }

  /**
   * 测试连接策略
   * @param {string} url - 测试URL
   * @returns {Promise<Object>} 测试结果
   */
  async testConnectionStrategy(url) {
    const results = {
      url,
      timestamp: new Date().toISOString(),
      proxyStatus: await proxyDetector.getProxyStatus(),
      tests: [],
    };

    // 测试直连
    try {
      const start = Date.now();
      await axios.get(url, { timeout: 5000, proxy: false });
      results.tests.push({
        strategy: "直连",
        success: true,
        duration: Date.now() - start,
        error: null,
      });
    } catch (error) {
      results.tests.push({
        strategy: "直连",
        success: false,
        duration: null,
        error: error.message,
      });
    }

    // 如果代理可用，测试代理连接
    if (results.proxyStatus.isAvailable) {
      try {
        const start = Date.now();
        await axios.get(url, {
          timeout: 5000,
          proxy: {
            host: proxyDetector.proxyHost,
            port: proxyDetector.proxyPort,
          },
        });
        results.tests.push({
          strategy: "代理",
          success: true,
          duration: Date.now() - start,
          error: null,
        });
      } catch (error) {
        results.tests.push({
          strategy: "代理",
          success: false,
          duration: null,
          error: error.message,
        });
      }
    }

    // 测试智能策略
    try {
      const start = Date.now();
      await this.get(url, { timeout: 5000 });
      results.tests.push({
        strategy: "智能",
        success: true,
        duration: Date.now() - start,
        error: null,
      });
    } catch (error) {
      results.tests.push({
        strategy: "智能",
        success: false,
        duration: null,
        error: error.message,
      });
    }

    return results;
  }
}

// 创建全局实例
const smartAxios = new SmartAxios();

module.exports = smartAxios;
