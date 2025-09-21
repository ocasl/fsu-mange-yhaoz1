import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  message,
  List,
  Tag,
  Typography,
} from "antd";
import {
  UserOutlined,
  CloudServerOutlined,
  BellOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import api from "../services/api";

const { Title, Text } = Typography;

const Dashboard = ({ currentUser }) => {
  const [summary, setSummary] = useState({
    totalOperations: 0,
    fsuOperations: 0,
    alarmOperations: 0,
    configOperations: 0,
    userOperations: 0,
  });
  const [recentOperations, setRecentOperations] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取操作统计信息
  const fetchSummary = async () => {
    try {
      const response = await api.get("/demo/summary");
      if (response.data.success) {
        setSummary(response.data.data.summary);
        setRecentOperations(response.data.data.recentOperations);
      }
    } catch (error) {
      console.error("获取统计信息失败:", error);
    }
  };

  // 创建演示FSU数据
  const createDemoFsu = async () => {
    setLoading(true);
    try {
      const response = await api.post("/demo/fsu");
      if (response.data.success) {
        message.success("演示FSU数据创建成功！请查看操作记录");
        fetchSummary();
      }
    } catch (error) {
      console.error("创建演示FSU失败:", error);
      message.error("创建演示FSU失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建演示告警数据
  const createDemoAlarm = async () => {
    setLoading(true);
    try {
      const response = await api.post("/demo/alarm");
      if (response.data.success) {
        message.success("演示告警数据创建成功！请查看操作记录");
        fetchSummary();
      }
    } catch (error) {
      console.error("创建演示告警失败:", error);
      message.error("创建演示告警失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>仪表盘</Title>
      <Text type="secondary">
        欢迎来到FSU管理系统，{currentUser?.realName || currentUser?.username}！
        您的角色：
        {currentUser?.role === "admin"
          ? "总账号（管理员）"
          : "子账号（普通用户）"}
      </Text>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总操作数"
              value={summary.totalOperations}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="FSU操作"
              value={summary.fsuOperations}
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="告警操作"
              value={summary.alarmOperations}
              prefix={<BellOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="配置操作"
              value={summary.configOperations}
              prefix={<SettingOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        {/* 操作演示 */}
        <Col span={12}>
          <Card
            title="操作记录演示"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {currentUser?.role === "admin"
                  ? "总账号可查看所有操作"
                  : "子账号只能查看自己的操作"}
              </Text>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text type="secondary">
                点击下面的按钮创建演示数据，然后到"操作记录"页面查看详细记录：
              </Text>

              <Space>
                <Button
                  type="primary"
                  icon={<CloudServerOutlined />}
                  loading={loading}
                  onClick={createDemoFsu}
                >
                  创建演示FSU
                </Button>
                <Button
                  icon={<BellOutlined />}
                  loading={loading}
                  onClick={createDemoAlarm}
                >
                  创建演示告警
                </Button>
              </Space>

              <div
                style={{
                  background: "#f6ffed",
                  border: "1px solid #b7eb8f",
                  borderRadius: 6,
                  padding: 12,
                  marginTop: 16,
                }}
              >
                <Text style={{ fontSize: 12, color: "#52c41a" }}>
                  💡 <strong>提示：</strong>
                  {currentUser?.role === "admin"
                    ? "作为总账号，您可以在操作记录中看到所有用户的操作，包括子账号的FSU上线、告警处理等操作。"
                    : "作为子账号，您只能查看自己的操作记录。总账号可以看到您的所有操作行为。"}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 最近操作 */}
        <Col span={12}>
          <Card
            title="最近操作"
            extra={
              <Button
                type="link"
                icon={<EyeOutlined />}
                href="#/operation-logs"
              >
                查看全部
              </Button>
            }
          >
            <List
              dataSource={recentOperations}
              renderItem={(item) => (
                <List.Item style={{ padding: "8px 0" }}>
                  <List.Item.Meta
                    title={
                      <Space size="small">
                        <Tag color={item.success ? "green" : "red"}>
                          {item.module}
                        </Tag>
                        <Text style={{ fontSize: 13 }}>{item.description}</Text>
                      </Space>
                    }
                    description={
                      <Space size="small">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.username}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: "暂无操作记录" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能说明 */}
      <Card title="操作记录功能说明" style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Title level={4}>总账号权限</Title>
            <ul>
              <li>可以查看所有用户的操作记录</li>
              <li>可以看到子账号登录了哪些设备</li>
              <li>可以监控子账号的FSU上线操作</li>
              <li>可以查看子账号的告警处理记录</li>
              <li>可以注册新的子账号</li>
            </ul>
          </Col>
          <Col span={12}>
            <Title level={4}>子账号权限</Title>
            <ul>
              <li>只能查看自己的操作记录</li>
              <li>无法查看其他用户的操作</li>
              <li>无法注册新用户</li>
              <li>所有操作都会被总账号监控</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
