import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Form,
  Input,
  Button,
  Space,
  Modal,
  message,
  Popconfirm,
  Row,
  Col,
  Typography,
  Alert,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fsuApi, handleApiResponse, handleApiError } from "../services/api";

const { Title, Text } = Typography;

const AlarmClear = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [scipLoading, setScipLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) =>
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
  });

  // 模拟数据
  const mockData = [
    {
      id: 26,
      fsuid: "61082243800070",
      signalId: "0406017001",
      alarmDesc: "交流输入电压过高告警",
      deviceId: "61082406000006",
      collectorIp: "192.168.1.100",
      creator: "系统管理员",
      clearTime: "2025-08-23 14:07:43",
      createTime: "2025-08-23 14:07:43",
      status: "已清除",
    },
    {
      id: 25,
      fsuid: "61089543800145",
      signalId: "0477004001",
      alarmDesc: "蓄电池二级低压脱离告警",
      deviceId: "61082477000704",
      collectorIp: "192.168.1.101",
      creator: "系统管理员",
      clearTime: "2025-08-23 14:04:45",
      createTime: "2025-08-23 14:04:45",
      status: "已清除",
    },
  ];

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  // 加载数据
  const loadData = async (searchParams = {}) => {
    setTableLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchParams,
      };

      const response = await fsuApi.getAlarmList("clear", params);
      const result = handleApiResponse(response);

      setDataSource(result.data.list || []);
      setPagination((prev) => ({
        ...prev,
        total: result.data.total || 0,
        current: result.data.page || 1,
        pageSize: result.data.pageSize || 10,
      }));
    } catch (error) {
      const errorMsg = handleApiError(error);
      message.error(`数据加载失败: ${errorMsg}`);
      setDataSource([]);
    } finally {
      setTableLoading(false);
    }
  };

  // 搜索
  const handleSearch = async () => {
    try {
      const values = await searchForm.validateFields();
      console.log("搜索条件:", values);

      // 重置分页到第一页
      setPagination((prev) => ({ ...prev, current: 1 }));

      // 调用loadData传入搜索参数
      await loadData(values);
      message.success("搜索完成");
    } catch (error) {
      console.error("搜索失败:", error);
      message.error("搜索失败");
    }
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    loadData();
  };

  // 新增清除告警
  const handleAdd = () => {
    setEditingRecord(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  // 编辑清除告警
  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsModalVisible(true);
    form.setFieldsValue(record);
  };

  // 删除清除告警记录
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await fsuApi.deleteAlarmRecord(id);
      const result = handleApiResponse(response);
      message.success("删除成功");
      loadData();
    } catch (error) {
      const errorMsg = handleApiError(error);
      message.error(`删除失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // 保存清除告警信息
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      console.log("保存清除告警信息:", values);

      if (editingRecord) {
        // 编辑逻辑暂时不支持，因为后端没有update接口
        message.warning("暂不支持编辑告警记录");
        setIsModalVisible(false);
        return;
      }

      // 清除告警
      const response = await fsuApi.clearAlarm(values);
      const result = handleApiResponse(response);

      message.success("告警清除成功！告警已从运监平台清除，请稍后确认。");
      setIsModalVisible(false);
      loadData();
    } catch (error) {
      const errorMsg = handleApiError(error);
      message.error(`清除失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // 自动获取SCIP
  const handleGetScip = async () => {
    try {
      setScipLoading(true);
      const response = await fsuApi.getScipFromLogs();
      const result = handleApiResponse(response);

      if (result.success && result.data.scip) {
        form.setFieldsValue({ collectorIp: result.data.scip });
        message.success(`成功获取到SCIP: ${result.data.scip}`);
        if (result.data.source) {
          message.info(`来源: ${result.data.source}`);
        }
      } else {
        message.warning(result.message || "未找到SCIP信息");
      }
    } catch (error) {
      const errorMsg = handleApiError(error);
      message.error(`获取SCIP失败: ${errorMsg}`);
    } finally {
      setScipLoading(false);
    }
  };

  // 复制到剪贴板
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success("已添加到剪贴板");
    });
  };

  // 表格列配置
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      fixed: "left",
    },
    {
      title: "FSU ID",
      dataIndex: "fsuid",
      key: "fsuid",
      width: 140,
      render: (text) => (
        <Text
          copyable={{
            onCopy: () => handleCopy(text),
          }}
          strong
          style={{ color: "#1890ff" }}
        >
          {text}
        </Text>
      ),
    },
    {
      title: "信号量ID",
      dataIndex: "signalId",
      key: "signalId",
      width: 120,
      render: (text) => (
        <Text
          copyable={{
            onCopy: () => handleCopy(text),
          }}
          style={{ color: "#722ed1" }}
        >
          {text}
        </Text>
      ),
    },
    {
      title: "告警描述",
      dataIndex: "alarmDesc",
      key: "alarmDesc",
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          <Text style={{ color: "#f5222d" }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: "设备ID",
      dataIndex: "deviceId",
      key: "deviceId",
      width: 140,
      render: (text) => (
        <Text
          copyable={{
            onCopy: () => handleCopy(text),
          }}
          style={{ color: "#52c41a" }}
        >
          {text}
        </Text>
      ),
    },
    {
      title: "采集机IP",
      dataIndex: "collectorIp",
      key: "collectorIp",
      width: 120,
      render: (text) => (
        <Text
          copyable={{
            onCopy: () => handleCopy(text),
          }}
          code
        >
          {text}
        </Text>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const isCleared = status === "已清除";
        return (
          <Text type={isCleared ? "success" : "danger"} strong>
            {isCleared ? (
              <CheckCircleOutlined style={{ marginRight: 4 }} />
            ) : (
              <CloseCircleOutlined style={{ marginRight: 4 }} />
            )}
            {status}
          </Text>
        );
      },
    },
    {
      title: "创建人",
      dataIndex: "creator",
      key: "creator",
      width: 100,
    },
    {
      title: "更新时间",
      dataIndex: "clearTime",
      key: "clearTime",
      width: 160,
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 160,
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这条记录吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f0f2f5" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
          清除告警
        </Title>
        <Text type="secondary">清除运监平台中的告警信息</Text>
      </div>

      {/* 搜索筛选区域 */}
      <Card title="查询筛选" style={{ marginBottom: 24 }}>
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} style={{ width: "100%" }}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="fsuid" label="FSU ID">
                <Input placeholder="请输入FSU ID" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="signalId" label="信号量ID">
                <Input placeholder="请输入信号量ID" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="alarmDesc" label="告警描述">
                <Input placeholder="请输入告警描述" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="deviceId" label="设备ID">
                <Input placeholder="请输入设备ID" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="creator" label="创建人">
                <Input placeholder="请输入创建人" allowClear />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Space>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={tableLoading}
          >
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      {/* 操作按钮区域 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            新增清除告警
          </Button>
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={tableLoading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
            },
          }}
          scroll={{ x: 1400, y: 600 }}
          size="middle"
          locale={{
            emptyText: "暂无告警清除记录",
          }}
        />
      </Card>

      {/* 添加/编辑清除告警弹窗 */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
            {editingRecord ? "编辑清除告警" : "添加清除告警"}
          </Space>
        }
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        confirmLoading={loading}
        destroyOnClose
        okText="确定"
        cancelText="取消"
      >
        <Alert
          message="重要提示"
          description="采集机IP请前往OMC日志系统查询最后一次注册报文中的SCIP，按需填写信息提交后，向运维申请消除告警，请仔细检查并慎重提交!"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="fsuid"
            label="FSU ID"
            rules={[{ required: true, message: "请输入FSU ID" }]}
          >
            <Input placeholder="例如：61082243800070" />
          </Form.Item>

          <Form.Item
            name="signalId"
            label="信号量ID"
            rules={[{ required: true, message: "请输入信号量ID" }]}
          >
            <Input placeholder="例如：0406017001" />
          </Form.Item>

          <Form.Item
            name="alarmDesc"
            label="告警描述"
            rules={[{ required: true, message: "请输入告警描述" }]}
          >
            <Input placeholder="例如：电池熔丝故障告警" />
          </Form.Item>

          <Form.Item
            name="deviceId"
            label="设备ID"
            rules={[{ required: true, message: "请输入设备ID" }]}
          >
            <Input placeholder="例如：61082406000006" />
          </Form.Item>

          <Form.Item
            name="collectorIp"
            label={
              <Space>
                采集机IP
                <Tooltip title="点击按钮自动从注册报文中获取SCIP">
                  <Button
                    type="link"
                    size="small"
                    icon={<SyncOutlined />}
                    loading={scipLoading}
                    onClick={handleGetScip}
                    style={{ padding: 0, height: "auto" }}
                  >
                    自动获取
                  </Button>
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: "请输入采集机IP" },
              {
                pattern:
                  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                message: "请输入正确的IP地址格式",
              },
            ]}
          >
            <Input
              placeholder="例如：192.168.1.100"
              addonAfter={
                <Button
                  type="text"
                  size="small"
                  icon={<SyncOutlined />}
                  loading={scipLoading}
                  onClick={handleGetScip}
                  title="自动获取SCIP"
                />
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlarmClear;
