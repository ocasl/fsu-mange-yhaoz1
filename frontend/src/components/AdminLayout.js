import React, { useState } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  Space,
  Badge,
  Button,
  Drawer,
  Breadcrumb,
  theme,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CloudServerOutlined,
  DashboardOutlined,
  DesktopOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  TeamOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  ApiOutlined,
  FileTextOutlined,
  HomeOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const AdminLayout = ({
  children,
  currentPage = "fsu-online",
  onMenuClick,
  currentUser,
  onLogout,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 菜单项配置 - 根据用户角色过滤
  const baseMenuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "首页",
    },
    {
      key: "fsu-online",
      icon: <MonitorOutlined />,
      label: "FSU上线",
    },
    {
      key: "alarm-report",
      icon: <BellOutlined />,
      label: "告警管理",
    },
    {
      key: "operation-logs",
      icon: <FileTextOutlined />,
      label: "操作记录",
    },
  ];

  // 添加管理员专用菜单
  const adminMenuItems = [
    {
      key: "user-management",
      icon: <TeamOutlined />,
      label: "用户管理",
    },
  ];

  const menuItems =
    currentUser?.role === "admin"
      ? [...baseMenuItems, ...adminMenuItems]
      : baseMenuItems;

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人中心",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "账户设置",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      danger: true,
    },
  ];

  // 面包屑映射
  const breadcrumbMap = {
    dashboard: ["首页"],
    "fsu-online": ["首页", "FSU上线"],
    "alarm-report": ["首页", "告警管理"],
    "operation-logs": ["首页", "操作记录"],
    "user-management": ["首页", "用户管理"],
  };

  const handleMenuClick = ({ key }) => {
    console.log("菜单点击:", key);
    if (onMenuClick) {
      onMenuClick(key);
    }
  };

  const handleUserMenuClick = ({ key }) => {
    switch (key) {
      case "logout":
        if (onLogout) {
          onLogout();
        }
        break;
      case "profile":
        console.log("打开个人中心");
        break;
      case "settings":
        console.log("打开账户设置");
        break;
      default:
        break;
    }
  };

  // 移动端菜单
  const renderMobileMenu = () => (
    <Drawer
      title="导航菜单"
      placement="left"
      onClose={() => setMobileMenuVisible(false)}
      open={mobileMenuVisible}
      bodyStyle={{ padding: 0 }}
    >
      <Menu
        mode="inline"
        selectedKeys={[currentPage]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ border: 0 }}
      />
    </Drawer>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
        }}
        className="admin-sider"
      >
        {/* Logo区域 */}
        <div
          style={{
            height: 64,
            padding: "16px",
            display: "flex",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.1)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <CloudServerOutlined style={{ fontSize: 24, color: "#fff" }} />
          {!collapsed && (
            <Text
              strong
              style={{ color: "#fff", marginLeft: 12, fontSize: 16 }}
            >
              监控管理系统
            </Text>
          )}
        </div>

        {/* 导航菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 0 }}
        />
      </Sider>

      {/* 主要内容区域 */}
      <Layout
        style={{
          marginLeft: collapsed ? 0 : 200,
          transition: "margin-left 0.2s",
        }}
      >
        {/* 顶部导航栏 */}
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            borderBottom: "1px solid #f0f0f0",
            position: "sticky",
            top: 0,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* 折叠按钮 */}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 64,
                height: 64,
                display: window.innerWidth > 992 ? "flex" : "none",
                alignItems: "center",
                justifyContent: "center",
              }}
            />

            {/* 移动端菜单按钮 */}
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setMobileMenuVisible(true)}
              style={{
                fontSize: "16px",
                width: 64,
                height: 64,
                display: window.innerWidth <= 992 ? "flex" : "none",
                alignItems: "center",
                justifyContent: "center",
              }}
            />

            {/* 面包屑导航 */}
            <Breadcrumb
              style={{ margin: "0 16px" }}
              items={breadcrumbMap[currentPage]?.map((item, index) => ({
                title:
                  index === 0 ? (
                    <>
                      <HomeOutlined /> <span>{item}</span>
                    </>
                  ) : (
                    item
                  ),
              }))}
            />
          </div>

          {/* 右侧用户区域 */}
          <div
            style={{ display: "flex", alignItems: "center", paddingRight: 24 }}
          >
            <Space size="large">
              {/* 通知铃铛 */}
              <Badge count={5} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{ fontSize: 16 }}
                />
              </Badge>

              {/* 用户信息 */}
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: handleUserMenuClick,
                }}
                placement="bottomRight"
                arrow
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 6,
                    transition: "background-color 0.2s",
                  }}
                >
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    style={{
                      marginRight: 8,
                      backgroundColor:
                        currentUser?.role === "admin" ? "#f56a00" : "#1890ff",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>
                      {currentUser?.realName || currentUser?.username || "用户"}
                    </Text>
                    <Text
                      type="secondary"
                      style={{ fontSize: 12, lineHeight: 1 }}
                    >
                      {currentUser?.role === "admin" ? "总账号" : "子账号"}
                    </Text>
                  </div>
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content
          style={{
            margin: 0,
            padding: 0,
            minHeight: "calc(100vh - 64px)",
            background: "#f0f2f5",
            overflow: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* 移动端菜单抽屉 */}
      {renderMobileMenu()}
    </Layout>
  );
};

export default AdminLayout;
