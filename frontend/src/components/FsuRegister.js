import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Card,
  Table,
  Tag,
  Space,
  Divider,
  Alert,
  Spin,
  Tooltip,
  Row,
  Col,
} from "antd";
import {
  SendOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { fsuApi, handleApiResponse, handleApiError } from "../services/api";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const FsuRegister = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // 设备选项配置
  const deviceOptions = [
    { value: "power", label: "高压配电", icon: "⚡" },
    { value: "air", label: "空调", icon: "❄️" },
    { value: "battery", label: "蓄电池", icon: "🔋" },
  ];

  // 网络类型选项
  const networkOptions = [
    { value: "4G", label: "4G网络" },
    { value: "5G", label: "5G网络" },
    { value: "ETHERNET", label: "有线网络" },
    { value: "WIFI", label: "WiFi网络" },
  ];

  // 组件挂载时测试连接
  useEffect(() => {
    testConnection();
  }, []);

  // 测试SC服务器连接
  const testConnection = async () => {
    try {
      setTestingConnection(true);
      const response = await fsuApi.testConnection();
      const result = handleApiResponse(response);
      setConnectionStatus({ connected: true, message: result.message });
    } catch (error) {
      const errorMsg = handleApiError(error);
      setConnectionStatus({ connected: false, message: errorMsg });
    } finally {
      setTestingConnection(false);
    }
  };

  // 提交FSU注册请求
  const handleSubmit = async () => {
    try {
      setLoading(true);

      // 表单验证
      const values = await form.validateFields();

      // 添加时间戳和其他信息
      const fsuData = {
        ...values,
        submitTime: new Date().toISOString(),
        clientInfo: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        },
      };

      console.log("提交FSU注册数据:", fsuData);

      // 调用后端API
      const response = await fsuApi.register(fsuData);
      const result = handleApiResponse(response);

      // 显示成功消息
      message.success("FSU注册请求已发送，正在处理中...");

      // 添加到历史记录
      const historyItem = {
        key: Date.now(),
        fsuId: values.fsuId,
        fsuCode: values.fsuCode,
        devices: values.devices,
        networkType: values.networkType,
        status: result.success ? "success" : "error",
        message: result.message,
        submitTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        processTime: result.processTime,
      };

      setHistory((prev) => [historyItem, ...prev]);

      // 如果成功，清空表单
      if (result.success) {
        form.resetFields();
      }
    } catch (error) {
      const errorMsg = handleApiError(error);
      console.error("FSU注册失败:", error);

      // 添加失败记录到历史
      const values = form.getFieldsValue();
      const historyItem = {
        key: Date.now(),
        fsuId: values.fsuId || "未知",
        fsuCode: values.fsuCode || "未知",
        devices: values.devices || [],
        networkType: values.networkType || "未知",
        status: "error",
        message: errorMsg,
        submitTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        processTime: 0,
      };

      setHistory((prev) => [historyItem, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  // 清空历史记录
  const clearHistory = () => {
    setHistory([]);
    message.success("历史记录已清空");
  };

  // 表格列配置
  const columns = [
    {
      title: "FSU ID",
      dataIndex: "fsuId",
      key: "fsuId",
      width: 120,
    },
    {
      title: "FSU编码",
      dataIndex: "fsuCode",
      key: "fsuCode",
      width: 160,
      ellipsis: true,
    },
    {
      title: "设备列表",
      dataIndex: "devices",
      key: "devices",
      width: 200,
      render: (devices) => (
        <Space wrap>
          {devices.map((device) => {
            const option = deviceOptions.find((opt) => opt.value === device);
            return (
              <Tag key={device} color="blue">
                {option?.icon} {option?.label || device}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: "网络类型",
      dataIndex: "networkType",
      key: "networkType",
      width: 100,
      render: (type) => <Tag color="green">{type}</Tag>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status, record) => {
        const statusConfig = {
          success: {
            color: "success",
            icon: <CheckCircleOutlined />,
            text: "成功",
          },
          error: {
            color: "error",
            icon: <CloseCircleOutlined />,
            text: "失败",
          },
          processing: {
            color: "processing",
            icon: <SyncOutlined spin />,
            text: "处理中",
          },
        };

        const config = statusConfig[status] || statusConfig.processing;

        return (
          <Tooltip title={record.message}>
            <Tag color={config.color} icon={config.icon}>
              {config.text}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "提交时间",
      dataIndex: "submitTime",
      key: "submitTime",
      width: 160,
    },
    {
      title: "处理耗时",
      dataIndex: "processTime",
      key: "processTime",
      width: 100,
      render: (time) => (time ? `${time}ms` : "-"),
    },
  ];

  return (
    <div className="fsu-register">
      {/* 连接状态提示 */}
      <Card className="connection-card" style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <WifiOutlined />
              <span>SC服务器连接状态:</span>
              {testingConnection ? (
                <Spin size="small" />
              ) : connectionStatus ? (
                <Tag
                  color={connectionStatus.connected ? "success" : "error"}
                  icon={
                    connectionStatus.connected ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CloseCircleOutlined />
                    )
                  }
                >
                  {connectionStatus.connected ? "已连接" : "连接失败"}
                </Tag>
              ) : (
                <Tag color="default">未知</Tag>
              )}
              {connectionStatus && (
                <span style={{ color: "#666", fontSize: "12px" }}>
                  {connectionStatus.message}
                </span>
              )}
            </Space>
          </Col>
          <Col>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={testConnection}
              loading={testingConnection}
            >
              重新测试
            </Button>
          </Col>
        </Row>
      </Card>

      {/* FSU注册表单 */}
      <Card
        title={
          <Space>
            <SendOutlined />
            FSU设备注册
          </Space>
        }
        className="form-card"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            networkType: "4G",
            softwareVersion: "V1.0.0",
          }}
          onFinish={handleSubmit}
        >
          <Row gutter={24}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="fsuId"
                label={
                  <Space>
                    FSU ID
                    <Tooltip title="FSU设备的唯一标识符，10-20位数字">
                      <InfoCircleOutlined style={{ color: "#999" }} />
                    </Tooltip>
                  </Space>
                }
                rules={[
                  { required: true, message: "请输入FSU ID" },
                  { pattern: /^\d{10,20}$/, message: "请输入10-20位数字" },
                ]}
              >
                <Input placeholder="例如：10024" maxLength={20} showCount />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="fsuCode"
                label={
                  <Space>
                    FSU编码
                    <Tooltip title="FSU设备编码，必须为14位字符">
                      <InfoCircleOutlined style={{ color: "#999" }} />
                    </Tooltip>
                  </Space>
                }
                rules={[
                  { required: true, message: "请输入FSU编码" },
                  { len: 14, message: "FSU编码必须为14位字符" },
                ]}
              >
                <Input
                  placeholder="例如：11010110100001"
                  maxLength={14}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="networkType" label="网络类型">
                <Select placeholder="请选择网络类型">
                  {networkOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="devices"
                label={
                  <Space>
                    设备列表
                    <Tooltip title="选择FSU监控的设备类型，至少选择一个">
                      <InfoCircleOutlined style={{ color: "#999" }} />
                    </Tooltip>
                  </Space>
                }
                rules={[
                  { required: true, message: "请至少选择一个设备" },
                  { type: "array", min: 1, message: "请至少选择一个设备" },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择监控设备"
                  optionLabelProp="label"
                >
                  {deviceOptions.map((option) => (
                    <Option
                      key={option.value}
                      value={option.value}
                      label={`${option.icon} ${option.label}`}
                    >
                      <Space>
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="softwareVersion" label="软件版本">
                <Input placeholder="例如：V2.3.5" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注">
            <TextArea
              placeholder="可选，填写备注信息"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SendOutlined />}
                size="large"
                disabled={!connectionStatus?.connected}
              >
                {loading ? "正在注册..." : "发起注册请求"}
              </Button>

              <Button onClick={() => form.resetFields()} disabled={loading}>
                重置表单
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {!connectionStatus?.connected && (
          <Alert
            message="SC服务器连接异常"
            description="请检查网络连接或联系系统管理员"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      <Divider />

      {/* 历史记录 */}
      <Card
        title={
          <Space>
            <InfoCircleOutlined />
            注册历史记录
          </Space>
        }
        extra={
          <Space>
            <Button
              size="small"
              onClick={clearHistory}
              disabled={history.length === 0}
            >
              清空记录
            </Button>
          </Space>
        }
        className="history-card"
      >
        <Table
          dataSource={history}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: "暂无注册记录",
          }}
        />
      </Card>
    </div>
  );
};

export default FsuRegister;
