import React, { useState, useEffect } from "react";
import { ConfigProvider } from "antd";
import AdminLayout from "./components/AdminLayout";
import FsuOnlineManagement from "./components/FsuOnlineManagement";
import FsuRegister from "./components/FsuRegister";
import AlarmReport from "./components/AlarmReport";
import UserManagement from "./components/UserManagement";
import OperationLogs from "./components/OperationLogs";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import zhCN from "antd/locale/zh_CN";
import "dayjs/locale/zh-cn";
import dayjs from "dayjs";

// 设置dayjs中文
dayjs.locale("zh-cn");

function App() {
  const [currentPage, setCurrentPage] = useState("fsu-online");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("解析用户信息失败:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // 处理登录成功
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage("fsu-online");
  };

  // 处理菜单点击
  const handleMenuClick = (page) => {
    setCurrentPage(page);
  };

  // 如果未登录，显示登录页面
  if (!isLoggedIn) {
    return (
      <ConfigProvider locale={zhCN}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </ConfigProvider>
    );
  }

  // 页面组件映射
  const pageComponents = {
    dashboard: <Dashboard currentUser={currentUser} />,
    "fsu-online": <FsuOnlineManagement />,
    "alarm-report": <AlarmReport />,
    "operation-logs": <OperationLogs />,
    "user-management":
      currentUser?.role === "admin" ? (
        <UserManagement />
      ) : (
        <div style={{ padding: 24 }}>
          <h1>权限不足</h1>
          <p>只有总账号可以访问用户管理功能</p>
        </div>
      ),
  };

  return (
    <ConfigProvider locale={zhCN}>
      <AdminLayout
        currentPage={currentPage}
        onMenuClick={handleMenuClick}
        currentUser={currentUser}
        onLogout={handleLogout}
      >
        {pageComponents[currentPage] || pageComponents["fsu-online"]}
      </AdminLayout>
    </ConfigProvider>
  );
}

export default App;
