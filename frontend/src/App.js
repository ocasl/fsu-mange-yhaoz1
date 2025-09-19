import React, { useState } from "react";
import { ConfigProvider } from "antd";
import AdminLayout from "./components/AdminLayout";
import FsuOnlineManagement from "./components/FsuOnlineManagement";
import FsuRegister from "./components/FsuRegister";
import AlarmReport from "./components/AlarmReport";
import AlarmClear from "./components/AlarmClear";
import FsuConfig from "./components/FsuConfig";
import zhCN from "antd/locale/zh_CN";
import "dayjs/locale/zh-cn";
import dayjs from "dayjs";

// 设置dayjs中文
dayjs.locale("zh-cn");

function App() {
  const [currentPage, setCurrentPage] = useState("fsu-online");

  // 处理菜单点击
  const handleMenuClick = (page) => {
    setCurrentPage(page);
  };

  // 页面组件映射
  const pageComponents = {
    dashboard: (
      <div style={{ padding: 24 }}>
        <h1>仪表盘</h1>
        <p>欢迎来到FSU管理系统</p>
      </div>
    ),
    "fsu-online": <FsuOnlineManagement />,
    "fsu-config": <FsuConfig />,
    "alarm-report": <AlarmReport />,
    "alarm-clear": <AlarmClear />,
    "log-management": (
      <div style={{ padding: 24 }}>
        <h1>日志管理</h1>
        <p>日志管理功能开发中...</p>
      </div>
    ),
    "user-management": (
      <div style={{ padding: 24 }}>
        <h1>用户管理</h1>
        <p>用户管理功能开发中...</p>
      </div>
    ),
  };

  return (
    <ConfigProvider locale={zhCN}>
      <AdminLayout currentPage={currentPage} onMenuClick={handleMenuClick}>
        {pageComponents[currentPage] || pageComponents["fsu-online"]}
      </AdminLayout>
    </ConfigProvider>
  );
}

export default App;
