import axios from "axios";
import { message } from "antd";

// 创建axios实例
const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_BASE_URL || "http://49.233.218.18:3001/api",
  timeout: 30000, // 30秒超时
  headers: {
    "Content-Type": "application/json",
  },
});

// 生产环境API配置说明：
// 如果要部署到服务器，请将上面的 localhost 改为您的公网IP
// 例如：baseURL: "http://123.456.789.123:3001/api"
// 或者创建 .env 文件设置 REACT_APP_API_BASE_URL=http://您的公网IP:3001/api

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 在发送请求之前做些什么
    console.log(
      `发送请求: ${config.method?.toUpperCase()} ${config.url}`,
      config.data
    );
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    console.log(`收到响应: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    // 对响应错误做点什么
    console.error("响应错误:", error);

    let errorMessage = "网络请求失败";

    if (error.response) {
      // 服务器响应了错误状态码
      const { status, data } = error.response;

      // 处理认证相关错误
      if (status === 401) {
        // 清除本地存储的认证信息
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // 如果不是登录页面，跳转到登录页面
        if (!window.location.pathname.includes("/login")) {
          window.location.reload(); // 刷新页面回到登录状态
        }

        errorMessage = data?.message || "登录已过期，请重新登录";
      } else {
        errorMessage = data?.message || `服务器错误 (${status})`;
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = "服务器无响应，请检查网络连接";
    } else {
      // 请求配置错误
      errorMessage = error.message || "请求配置错误";
    }

    // 显示错误提示（登录页面不显示401错误）
    if (
      !(
        error.response?.status === 401 &&
        window.location.pathname.includes("/login")
      )
    ) {
      message.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// API接口定义
export const fsuApi = {
  // FSU设备注册
  register: (data) => api.post("/fsu/register", data),

  // 测试SC连接
  testConnection: () => api.get("/fsu/test-connection"),

  // 获取系统状态
  getStatus: () => api.get("/fsu/status"),

  // 健康检查
  health: () => api.get("/fsu/health"),

  // 上线管理相关接口
  // 获取FSU上线列表
  getFsuOnlineList: (params) => api.get("/fsu/online/list", { params }),

  // 添加FSU上线记录
  addFsuOnline: (data) => api.post("/fsu/online", data),

  // 更新FSU上线记录
  updateFsuOnline: (id, data) => api.put(`/fsu/online/${id}`, data),

  // 更新FSU上线状态（上线/下线切换）
  updateFsuOnlineStatus: (id, data) =>
    api.patch(`/fsu/online/${id}/status`, data),

  // 删除FSU上线记录
  deleteFsuOnline: (id) => api.delete(`/fsu/online/${id}`),

  // 批量删除FSU上线记录
  batchDeleteFsuOnline: (ids) => api.post("/fsu/online/batch-delete", { ids }),

  // 获取FSU上线详情
  getFsuOnlineDetail: (id) => api.get(`/fsu/online/${id}`),

  // 导出FSU上线数据
  exportFsuOnline: (params) =>
    api.get("/fsu/online/export", { params, responseType: "blob" }),

  // 获取厂商列表
  getVendorList: () => api.get("/fsu/vendors"),

  // 获取FSU类型列表
  getFsuTypeList: () => api.get("/fsu/types"),

  // 告警管理相关接口
  // 获取告警列表
  getAlarmList: (params) => api.get("/alarm/report/list", { params }),

  // 上报告警
  reportAlarm: (data) => api.post("/alarm/report", data),

  // 清除告警
  clearAlarm: (data) => api.post("/alarm/clear", data),

  // 删除告警记录
  deleteAlarmRecord: (id) => api.delete(`/alarm/${id}`),

  // 获取告警详情
  getAlarmDetail: (id) => api.get(`/alarm/${id}`),

  // 从日志中获取SCIP
  getScipFromLogs: (fsuId) =>
    api.get("/alarm/scip", { params: fsuId ? { fsuId } : {} }),

  // FSU配置管理相关接口
  // 获取所有配置
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),

  // 配置管理专用接口
  getAllConfigs: (params) => api.get("/config", { params }),
  getActiveConfig: () => api.get("/config/active"),
  createConfig: (data) => api.post("/config", data),
  updateConfig: (id, data) => api.put(`/config/${id}`, data),
  deleteConfig: (id) => api.delete(`/config/${id}`),
  activateConfig: (id) => api.post(`/config/${id}/activate`),

  // 心跳服务管理接口
  getHeartbeatStatus: () => api.get("/heartbeat/status"),
  startHeartbeat: () => api.post("/heartbeat/start"),
  stopHeartbeat: () => api.post("/heartbeat/stop"),
  restartHeartbeat: () => api.post("/heartbeat/restart"),
};

// 工具函数：处理API响应
export const handleApiResponse = (response) => {
  const { data } = response;
  if (data.success) {
    return data;
  } else {
    throw new Error(data.message || "操作失败");
  }
};

// 工具函数：处理API错误
export const handleApiError = (error) => {
  console.error("API错误:", error);

  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return "未知错误";
  }
};

export default api;
