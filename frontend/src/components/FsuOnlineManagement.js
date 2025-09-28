import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Modal,
  message,
  Popconfirm,
  Row,
  Col,
  Tag,
  Tooltip,
  Divider,
  Typography,
  Alert,
  Badge,
  Switch,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  SettingOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PoweroffOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fsuApi, handleApiResponse, handleApiError } from "../services/api";
import { getScServerOptions, generateMainVPN } from "../data/provinceConfig";

const { Option } = Select;
const { Title, Text } = Typography;

const FsuOnlineManagement = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
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
      id: 1,
      fsuid: "FSU001",
      siteName: "北京朝阳基站",
      scServerAddress: "sn.toweraiot.cn",
      mainVpn: "sn.toweraiot.cn,sn.toweraiot.cn",
      softwareVendor: "中国铁塔",
      hardwareVendor: "高新兴",
      fsuType: "ZNV EISUA X7",
      version: "25.1.HQ.FSU.TT.AA01.R_GX-1.1.0.000",
      powerId: "PWR001",
      lithiumBatteryId1: "LI001",
      temperatureId: "TEMP001",
      lithiumBatteryId2: "LI002",
      airConditionerId: "AC001",
      lithiumBatteryId3: "LI003",
      smartAccessId: "SA001",
      lithiumBatteryId4: "LI004",
      waterLeakageId: "WL001",
      leadAcidBatteryId1: "LA001",
      infraredId: "IR001",
      smokeDetectorId: "SMOKE001",
      leadAcidBatteryId2: "LA002",
      nonSmartAccessId: "NSA001",
      creator: "张三",
      createTime: "2024-01-15 10:30:00",
      status: "online",
    },
    {
      id: 2,
      fsuid: "FSU002",
      siteName: "上海浦东机房",
      scServerAddress: "sn.toweraiot.cn",
      mainVpn: "sn.toweraiot.cn,sn.toweraiot.cn",
      softwareVendor: "高新兴",
      hardwareVendor: "深圳力维",
      fsuType: "ZNV EISUA X7",
      version: "24.1.HQ.FSU.SR.AA09.R",
      powerId: "PWR002",
      lithiumBatteryId1: "LI005",
      temperatureId: "TEMP002",
      lithiumBatteryId2: "LI006",
      airConditionerId: "AC002",
      creator: "李四",
      createTime: "2024-01-14 15:20:00",
      status: "offline",
    },
  ];

  // FSU软件厂家选项
  const softwareVendorOptions = [
    { label: "中国铁塔", value: "中国铁塔" },
    { label: "高新兴", value: "高新兴" },
    { label: "赛尔通信", value: "赛尔通信" },
    { label: "大唐移动", value: "大唐移动" },
  ];

  // FSU硬件厂家选项
  const hardwareVendorOptions = [
    { label: "高新兴", value: "高新兴" },
    { label: "深圳力维", value: "深圳力维" },
    { label: "赛尔通信", value: "赛尔通信" },
    { label: "大唐移动", value: "大唐移动" },
  ];

  // FSU软件版本选项 - 只包含三个指定版本
  const softwareVersionOptions = [
    {
      label: "25.1.HQ.FSU.TT.AA02.R_GX-1.1.0.002",
      value: "25.1.HQ.FSU.TT.AA02.R_GX-1.1.0.002",
    },
    {
      label: "25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002",
      value: "25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002",
    },
    {
      label: "24.1.BH.FSU.TT.AA06.R_SE-1.0.9.666",
      value: "24.1.BH.FSU.TT.AA06.R_SE-1.0.9.666",
    },
  ];

  // 应用类型选项 - 固定值ZNV EISUA X7
  const applicationTypeOptions = [
    { label: "ZNV EISUA X7", value: "ZNV EISUA X7" },
  ];

  // FSU类型选项
  const fsuTypeOptions = [
    { label: "动环监控", value: "动环监控" },
    { label: "基站监控", value: "基站监控" },
    { label: "机房监控", value: "机房监控" },
    { label: "网络监控", value: "网络监控" },
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

      const response = await fsuApi.getFsuOnlineList(params);
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

  // 新增FSU
  const handleAdd = () => {
    setEditingRecord(null);
    setIsModalVisible(true);
    form.resetFields();

    // 设置默认值
    form.setFieldsValue({
      scServerAddress: "sn.toweraiot.cn",
      mainVpn: "sn.toweraiot.cn,sn.toweraiot.cn",
      fsuType: "ZNV EISUA X7",
    });
  };

  // 编辑FSU
  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsModalVisible(true);
    form.setFieldsValue(record);
  };

  // 切换FSU状态（上线/下线）
  const handleToggleStatus = async (record) => {
    try {
      setLoading(true);
      const newStatus = record.status === "online" ? "offline" : "online";

      // 调用后端API切换状态
      const response = await fsuApi.updateFsuOnlineStatus(record._id, {
        status: newStatus,
      });
      const result = handleApiResponse(response);

      message.success({
        content: (
          <div>
            <p>
              <strong>
                {newStatus === "online" ? "🟢 设备上线成功" : "🔴 设备下线成功"}
              </strong>
            </p>
            <p>FSU ID: {record.fsuid}</p>
            <p>当前状态: {newStatus === "online" ? "在线" : "离线"}</p>
          </div>
        ),
        duration: 3,
      });

      loadData();
    } catch (error) {
      const errorMsg = handleApiError(error);
      message.error(`状态切换失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // 删除FSU（真正删除记录）
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await fsuApi.deleteFsuOnline(id);
      const result = handleApiResponse(response);

      // 显示详细的成功信息
      message.success({
        content: (
          <div>
            <p>
              <strong>🗑️ 记录删除成功</strong>
            </p>
            <p>FSU ID: {result.data?.fsuid || "Unknown"}</p>
            <p>下线方式: {result.data?.offlineMethod || "停止心跳服务"}</p>
            <p>记录已永久删除，设备已断开连接</p>
          </div>
        ),
        duration: 5,
      });

      loadData();
    } catch (error) {
      const errorMsg = handleApiError(error);
      message.error(`删除失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请选择要删除的记录");
      return;
    }

    try {
      setLoading(true);
      const response = await fsuApi.batchDeleteFsuOnline(selectedRowKeys);
      const result = handleApiResponse(response);

      // 显示详细的批量删除成功信息
      const offlineSuccessCount =
        result.data?.offlineResults?.filter((r) => r.success).length || 0;
      const deletedCount = result.data?.deletedCount || 0;

      message.success({
        content: (
          <div>
            <p>
              <strong>🟢 批量设备下线成功</strong>
            </p>
            <p>
              成功下线设备: {offlineSuccessCount}/{selectedRowKeys.length}
            </p>
            <p>删除记录数量: {deletedCount}</p>
            <p>下线方式: {result.data?.offlineMethod || "停止心跳服务"}</p>
            <p>所有选中设备已断开连接</p>
          </div>
        ),
        duration: 5,
      });

      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      const errorMsg = handleApiError(error);
      message.error(`批量删除失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // 保存FSU信息
  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      console.log("保存FSU信息:", values);

      // 添加creator字段
      const saveData = {
        ...values,
        creator: "admin", // 这里应该从用户信息中获取
      };

      let response;
      if (editingRecord) {
        // 编辑
        response = await fsuApi.updateFsuOnline(editingRecord._id, saveData);
      } else {
        // 新增
        response = await fsuApi.addFsuOnline(saveData);
      }

      const result = handleApiResponse(response);
      message.success(editingRecord ? "修改成功" : "添加成功");
      setIsModalVisible(false);
      loadData();
    } catch (error) {
      const errorMsg = handleApiError(error);
      message.error(`保存失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: "ID",
      dataIndex: "_id",
      key: "_id",
      width: 200,
      fixed: "left",
      render: (text) => (
        <Text copyable style={{ fontSize: "12px" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "FSU ID",
      dataIndex: "fsuid",
      key: "fsuid",
      width: 120,
      fixed: "left",
      render: (text) => (
        <Text copyable strong style={{ color: "#1890ff" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "站点名称",
      dataIndex: "siteName",
      key: "siteName",
      width: 140,
      ellipsis: true,
      render: (text) => <Text style={{ color: "#13c2c2" }}>{text}</Text>,
    },
    {
      title: "SC服务器地址",
      dataIndex: "scServerAddress",
      key: "scServerAddress",
      width: 140,
      render: (text) => (
        <Text copyable code style={{ color: "#722ed1" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "MainVPN",
      dataIndex: "mainVpn",
      key: "mainVpn",
      width: 160,
      ellipsis: true,
      render: (text) => (
        <Text copyable code style={{ color: "#eb2f96" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "软件厂家",
      dataIndex: "softwareVendor",
      key: "softwareVendor",
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "硬件厂家",
      dataIndex: "hardwareVendor",
      key: "hardwareVendor",
      width: 120,
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: "FSU类别",
      dataIndex: "fsuType",
      key: "fsuType",
      width: 120,
      render: (text) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: "版本",
      dataIndex: "version",
      key: "version",
      width: 100,
    },
    {
      title: "开关电源",
      dataIndex: "powerId",
      key: "powerId",
      width: 120,
      render: (text) => text || "-",
    },
    {
      title: "锂电池1",
      dataIndex: "lithiumBatteryId1",
      key: "lithiumBatteryId1",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "温湿度",
      dataIndex: "temperatureId",
      key: "temperatureId",
      width: 120,
      render: (text) => text || "-",
    },
    {
      title: "锂电池2",
      dataIndex: "lithiumBatteryId2",
      key: "lithiumBatteryId2",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "空调",
      dataIndex: "airConditionerId",
      key: "airConditionerId",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "锂电池3",
      dataIndex: "lithiumBatteryId3",
      key: "lithiumBatteryId3",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "智能门禁",
      dataIndex: "smartAccessId",
      key: "smartAccessId",
      width: 120,
      render: (text) => text || "-",
    },
    {
      title: "锂电池4",
      dataIndex: "lithiumBatteryId4",
      key: "lithiumBatteryId4",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "水浸",
      dataIndex: "waterLeakageId",
      key: "waterLeakageId",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "蓄电池1",
      dataIndex: "leadAcidBatteryId1",
      key: "leadAcidBatteryId1",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "红外",
      dataIndex: "infraredId",
      key: "infraredId",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "烟感",
      dataIndex: "smokeDetectorId",
      key: "smokeDetectorId",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "蓄电池2",
      dataIndex: "leadAcidBatteryId2",
      key: "leadAcidBatteryId2",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "非智能门禁",
      dataIndex: "nonSmartAccessId",
      key: "nonSmartAccessId",
      width: 120,
      render: (text) => text || "-",
    },
    {
      title: "预留设备13",
      dataIndex: "deviceId13",
      key: "deviceId13",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "预留设备14",
      dataIndex: "deviceId14",
      key: "deviceId14",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "预留设备15",
      dataIndex: "deviceId15",
      key: "deviceId15",
      width: 100,
      render: (text) => text || "-",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const statusConfig = {
          online: {
            color: "success",
            text: "在线",
            icon: <CheckCircleOutlined />,
          },
          offline: {
            color: "error",
            text: "离线",
            icon: <CloseCircleOutlined />,
          },
          connecting: {
            color: "processing",
            text: "连接中",
            icon: <SyncOutlined spin />,
          },
        };
        const config = statusConfig[status] || statusConfig.offline;
        return (
          <Badge
            status={
              config.color === "success"
                ? "processing"
                : config.color === "error"
                ? "error"
                : "default"
            }
            text={
              <Tag color={config.color} icon={config.icon}>
                {config.text}
              </Tag>
            }
          />
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
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 160,
      render: (text) => (text ? dayjs(text).format("YYYY-MM-DD HH:mm") : "-"),
    },
    {
      title: "最后心跳时间",
      dataIndex: "lastHeartbeatTime",
      key: "lastHeartbeatTime",
      width: 160,
      render: (text) => (text ? dayjs(text).format("YYYY-MM-DD HH:mm") : "-"),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
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

          <Tooltip title={record.status === "online" ? "下线设备" : "上线设备"}>
            <Switch
              checked={record.status === "online"}
              onChange={() => handleToggleStatus(record)}
              checkedChildren={<PlayCircleOutlined />}
              unCheckedChildren={<PauseCircleOutlined />}
              loading={loading}
              size="small"
            />
          </Tooltip>

          <Tooltip title="永久删除记录">
            <Popconfirm
              title={
                <div>
                  <p>
                    <strong>⚠️ 永久删除警告</strong>
                  </p>
                  <p>删除此记录将会：</p>
                  <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                    <li>永久删除数据库记录</li>
                    <li>立即停止FSU客户端心跳服务</li>
                    <li>设备将无法响应SC服务器请求</li>
                    <li>
                      <strong>设备将下线并断开连接</strong>
                    </li>
                  </ul>
                  <p>此操作不可恢复，确定要永久删除吗？</p>
                </div>
              }
              onConfirm={() => handleDelete(record._id)}
              okText="确定删除"
              cancelText="取消"
              okType="danger"
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

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: record.status === "connecting",
    }),
  };

  return (
    <div style={{ padding: "16px", background: "#f0f2f5" }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0, textAlign: "left" }}>
          <CloudServerOutlined style={{ color: "#1890ff", marginRight: 8 }} />
          上线管理
        </Title>
        <Text type="secondary">管理和监控FSU设备的上线状态</Text>
      </div>

      {/* 权限提示 */}
      <Alert
        message={
          JSON.parse(localStorage.getItem("user") || "{}")?.role === "admin"
            ? "总账号权限：您可以查看所有用户创建的FSU上线记录"
            : "子账号权限：您只能查看自己创建的FSU上线记录"
        }
        type={
          JSON.parse(localStorage.getItem("user") || "{}")?.role === "admin"
            ? "success"
            : "info"
        }
        showIcon
        style={{ marginBottom: 16 }}
        closable
      />

      {/* 搜索筛选区域 */}
      <Card title="查询筛选" style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col>
              <Form.Item name="fsuid" label="FSU ID">
                <Input
                  placeholder="请输入FSU ID"
                  allowClear
                  style={{ width: 200 }}
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="creator" label="创建人">
                <Input
                  placeholder="请输入创建人"
                  allowClear
                  style={{ width: 150 }}
                />
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
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增
          </Button>
          <Popconfirm
            title={
              <div>
                <p>
                  <strong>⚠️ 批量设备下线警告</strong>
                </p>
                <p>
                  您将删除 <strong>{selectedRowKeys.length}</strong>{" "}
                  条记录，此操作将会：
                </p>
                <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                  <li>立即停止所有选中FSU的心跳服务</li>
                  <li>关闭相关的WebService服务器</li>
                  <li>所有选中的设备将无法响应SC服务器</li>
                  <li>
                    <strong>所有选中的设备将下线并断开连接</strong>
                  </li>
                </ul>
                <p>
                  确定要批量删除记录并下线 {selectedRowKeys.length} 个设备吗？
                </p>
              </div>
            }
            onConfirm={handleBatchDelete}
            disabled={selectedRowKeys.length === 0}
            okText="确定批量下线"
            cancelText="取消"
            okType="danger"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={selectedRowKeys.length === 0}
              loading={loading}
            >
              批量下线
            </Button>
          </Popconfirm>
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button icon={<SettingOutlined />}>列设置</Button>
        </Space>

        {selectedRowKeys.length > 0 && (
          <Alert
            message={`已选择 ${selectedRowKeys.length} 项`}
            type="info"
            showIcon
            style={{ marginTop: 16 }}
            action={
              <Button size="small" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            }
          />
        )}
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={dataSource}
          rowKey="_id"
          loading={tableLoading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
            },
          }}
          scroll={{ x: 3600, y: 500 }}
          size="middle"
          locale={{
            emptyText: "暂无数据",
          }}
        />
      </Card>

      {/* 添加/编辑弹窗 */}
      <Modal
        title={editingRecord ? "编辑FSU上线" : "添加FSU上线"}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        confirmLoading={loading}
        destroyOnClose
      >
        <Alert
          message="注意"
          description="如果只需FSU上线，可仅填写必填项；如需其他设备在线，请补充填写对应设备ID。从提交到完成上线，通常耗时约5分钟。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fsuid"
                label="FSU ID"
                rules={[{ required: true, message: "请输入FSU ID" }]}
              >
                <Input placeholder="请输入FSU ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="siteName"
                label="FSU站点名称"
                rules={[{ required: true, message: "请输入FSU站点名称" }]}
              >
                <Input placeholder="例如：北京朝阳基站" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="scServerAddress"
                label="SC服务器地址"
                rules={[{ required: true, message: "请选择SC服务器地址" }]}
                initialValue="ln-r.toweraiot.cn"
              >
                <Select
                  placeholder="请选择SC服务器地址"
                  showSearch
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={(value) => {
                    // 自动生成MainVPN
                    const mainVpn = generateMainVPN(value);
                    form.setFieldsValue({ mainVpn });
                  }}
                >
                  {getScServerOptions().map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="mainVpn"
                label="MainVPN"
                rules={[{ required: true, message: "MainVPN地址不能为空" }]}
                initialValue="ln.toweraiot.cn,ln.toweraiot.cn"
              >
                <Input
                  placeholder="将根据SC服务器地址自动生成"
                  readOnly
                  style={{ backgroundColor: "#f5f5f5" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="version"
                label="软件版本"
                rules={[{ required: true, message: "请选择软件版本" }]}
              >
                <Select placeholder="请选择软件版本">
                  {softwareVersionOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fsuType"
                label="应用类型"
                rules={[{ required: true, message: "请选择应用类型" }]}
                initialValue="ZNV EISUA X7"
              >
                <Select placeholder="应用类型：ZNV EISUA X7（固定值）" disabled>
                  {applicationTypeOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="softwareVendor"
                label="软件厂家"
                rules={[{ required: true, message: "请选择软件厂家" }]}
              >
                <Select placeholder="请选择软件厂家">
                  {softwareVendorOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hardwareVendor"
                label="硬件厂家"
                rules={[{ required: true, message: "请选择硬件厂家" }]}
              >
                <Select placeholder="请选择硬件厂家">
                  {hardwareVendorOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            设备关联信息（可选）- 4个锂电池 + 2个蓄电池 + 烟感 + 9个其他设备
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="powerId" label="电源ID">
                <Input placeholder="请输入电源ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lithiumBatteryId1" label="锂电池1ID">
                <Input placeholder="请输入锂电池1ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="temperatureId" label="温湿度ID">
                <Input placeholder="请输入温湿度ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lithiumBatteryId2" label="锂电池2ID">
                <Input placeholder="请输入锂电池2ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="airConditionerId" label="空调ID">
                <Input placeholder="请输入空调ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lithiumBatteryId3" label="锂电池3ID">
                <Input placeholder="请输入锂电池3ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="smartAccessId" label="智能门禁ID">
                <Input placeholder="请输入智能门禁ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lithiumBatteryId4" label="锂电池4ID">
                <Input placeholder="请输入锂电池4ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="waterLeakageId" label="水浸ID">
                <Input placeholder="请输入水浸ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="leadAcidBatteryId1" label="蓄电池1ID">
                <Input placeholder="请输入蓄电池1ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="infraredId" label="红外ID">
                <Input placeholder="请输入红外ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="smokeDetectorId" label="烟感ID">
                <Input placeholder="请输入烟感ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="leadAcidBatteryId2" label="蓄电池2ID">
                <Input placeholder="请输入蓄电池2ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nonSmartAccessId" label="非智能门禁ID">
                <Input placeholder="请输入非智能门禁ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deviceId13" label="预留设备13ID">
                <Input placeholder="请输入设备13ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deviceId14" label="预留设备14ID">
                <Input placeholder="请输入设备14ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deviceId15" label="预留设备15ID">
                <Input placeholder="请输入设备15ID" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default FsuOnlineManagement;
