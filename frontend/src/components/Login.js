import React, { useState } from "react";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import api from "../services/api";

const { Title } = Typography;

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post("/user/login", values);

      if (response.data.success) {
        const { token, user } = response.data.data;

        // 存储token和用户信息
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        message.success("登录成功！");
        onLoginSuccess(user);
      } else {
        message.error(response.data.message || "登录失败");
      }
    } catch (error) {
      console.error("登录错误:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("登录失败，请检查网络连接");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          borderRadius: 12,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
            监控管理系统
          </Title>
          <p style={{ color: "#666", marginTop: 8 }}>请登录您的账号</p>
        </div>

        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[
              {
                required: true,
                message: "请输入用户名!",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: "请输入密码!",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                borderRadius: 6,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", color: "#666", fontSize: 12 }}>
          <p>监控管理系统 v1.0.0</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
