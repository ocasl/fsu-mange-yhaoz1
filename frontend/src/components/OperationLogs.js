import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic,
  message,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import api from "../services/api";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const OperationLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [stats, setStats] = useState({
    totalOperations: 0,
    successOperations: 0,
    failedOperations: 0,
    successRate: 0,
  });
  const [currentUser, setCurrentUser] = useState(null);

  const [form] = Form.useForm();

  // 获取当前用户信息
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // 获取操作日志
  const fetchLogs = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get("/logs", {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          ...filters,
          ...params,
        },
      });

      if (response.data.success) {
        const { logs: logList, pagination: paginationData } =
          response.data.data;
        setLogs(logList);
        setPagination({
          ...pagination,
          total: paginationData.total,
          current: paginationData.page,
        });
      }
    } catch (error) {
      console.error("获取操作日志失败:", error);
      message.error("获取操作日志失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取操作统计
  const fetchStats = async () => {
    try {
      const response = await api.get("/logs/stats/overview", {
        params: { timeRange: "7d" },
      });

      if (response.data.success) {
        setStats(response.data.data.overview);
      }
    } catch (error) {
      console.error("获取统计信息失败:", error);
    }
  };

  // 查看日志详情
  const viewLogDetail = async (logId) => {
    try {
      const response = await api.get(`/logs/${logId}`);

      if (response.data.success) {
        setSelectedLog(response.data.data.log);
        setDetailModalVisible(true);
      }
    } catch (error) {
      console.error("获取日志详情失败:", error);
      message.error("获取日志详情失败");
    }
  };

  // 搜索日志
  const handleSearch = (values) => {
    const searchParams = { ...values };

    // 处理时间范围
    if (values.timeRange) {
      searchParams.startTime = values.timeRange[0].toISOString();
      searchParams.endTime = values.timeRange[1].toISOString();
      delete searchParams.timeRange;
    }

    setFilters(searchParams);
    setPagination({ ...pagination, current: 1 });
  };

  // 重置搜索
  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setPagination({ ...pagination, current: 1 });
  };

  // 表格列定义
  const columns = [
    {
      title: "操作时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (time) => new Date(time).toLocaleString(),
      sorter: true,
    },
    {
      title: "操作用户",
      dataIndex: "username",
      key: "username",
      width: 120,
      render: (username, record) => (
        <Space>
          <span>{username}</span>
          {record.userId?.role === "admin" && (
            <Tag color="red" size="small">
              总账号
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "操作模块",
      dataIndex: "module",
      key: "module",
      width: 100,
      render: (module) => {
        const moduleColors = {
          USER: "blue",
          ALARM: "red",
          CONFIG: "green",
          FSU: "orange",
          SYSTEM: "purple",
        };
        return <Tag color={moduleColors[module] || "default"}>{module}</Tag>;
      },
    },
    {
      title: "操作类型",
      dataIndex: "operation",
      key: "operation",
      width: 120,
    },
    {
      title: "操作描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "操作结果",
      dataIndex: "success",
      key: "success",
      width: 100,
      render: (success) => (
        <Tag
          color={success ? "green" : "red"}
          icon={success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {success ? "成功" : "失败"}
        </Tag>
      ),
    },
    {
      title: "耗时",
      dataIndex: "duration",
      key: "duration",
      width: 80,
      render: (duration) => (duration ? `${duration}ms` : "-"),
    },
    {
      title: "IP地址",
      dataIndex: "ip",
      key: "ip",
      width: 120,
    },
    {
      title: "操作",
      key: "action",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => viewLogDetail(record._id)}
        >
          详情
        </Button>
      ),
    },
  ];

  // 处理表格变化
  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination(newPagination);
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [pagination.current, pagination.pageSize, filters]);

  return (
    <div style={{ padding: 24 }}>
      {/* 统计卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总操作数"
              value={stats.totalOperations}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="成功操作"
              value={stats.successOperations}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="失败操作"
              value={stats.failedOperations}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="成功率"
              value={stats.successRate}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{
                color: stats.successRate > 90 ? "#52c41a" : "#faad14",
              }}
            />
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <span>操作日志</span>
            {currentUser?.role !== "admin" && (
              <Tag color="blue">仅显示个人操作记录</Tag>
            )}
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchLogs();
              fetchStats();
            }}
          >
            刷新
          </Button>
        }
      >
        {/* 搜索表单 */}
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="search">
            <Input
              placeholder="搜索操作描述或URL"
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          <Form.Item name="module">
            <Select placeholder="操作模块" style={{ width: 120 }} allowClear>
              <Option value="USER">用户</Option>
              <Option value="ALARM">告警</Option>
              <Option value="CONFIG">配置</Option>
              <Option value="FSU">FSU</Option>
              <Option value="SYSTEM">系统</Option>
            </Select>
          </Form.Item>
          <Form.Item name="success">
            <Select placeholder="操作结果" style={{ width: 120 }} allowClear>
              <Option value="true">成功</Option>
              <Option value="false">失败</Option>
            </Select>
          </Form.Item>
          <Form.Item name="timeRange">
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder={["开始时间", "结束时间"]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
              >
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 日志表格 */}
        <Table
          dataSource={logs}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          rowKey="_id"
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* 日志详情模态框 */}
      <Modal
        title="操作日志详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedLog(null);
        }}
        footer={null}
        width={800}
      >
        {selectedLog && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="操作时间" span={2}>
              {new Date(selectedLog.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="操作用户">
              <Space>
                {selectedLog.username}
                {selectedLog.userId?.role === "admin" && (
                  <Tag color="red" size="small">
                    总账号
                  </Tag>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="操作结果">
              <Tag
                color={selectedLog.success ? "green" : "red"}
                icon={
                  selectedLog.success ? (
                    <CheckCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )
                }
              >
                {selectedLog.success ? "成功" : "失败"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="操作模块">
              <Tag color="blue">{selectedLog.module}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="操作类型">
              {selectedLog.operation}
            </Descriptions.Item>
            <Descriptions.Item label="操作描述" span={2}>
              {selectedLog.description}
            </Descriptions.Item>
            <Descriptions.Item label="请求方法">
              {selectedLog.method}
            </Descriptions.Item>
            <Descriptions.Item label="耗时">
              {selectedLog.duration ? `${selectedLog.duration}ms` : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="请求URL" span={2}>
              <code>{selectedLog.url}</code>
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">
              {selectedLog.ip}
            </Descriptions.Item>
            <Descriptions.Item label="用户代理">
              {selectedLog.userAgent || "-"}
            </Descriptions.Item>
            {selectedLog.errorMessage && (
              <Descriptions.Item label="错误信息" span={2}>
                <TextArea
                  value={selectedLog.errorMessage}
                  rows={3}
                  readOnly
                  style={{ background: "#fff2f0", border: "1px solid #ffccc7" }}
                />
              </Descriptions.Item>
            )}
            {selectedLog.requestData && (
              <Descriptions.Item label="请求数据" span={2}>
                <TextArea
                  value={JSON.stringify(selectedLog.requestData, null, 2)}
                  rows={6}
                  readOnly
                  style={{ fontFamily: "monospace", fontSize: 12 }}
                />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OperationLogs;
