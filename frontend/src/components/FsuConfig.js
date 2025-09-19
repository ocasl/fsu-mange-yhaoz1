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
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fsuApi, handleApiResponse, handleApiError } from "../services/api";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

const FsuConfig = () => {
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [heartbeatStatus, setHeartbeatStatus] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) =>
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
  });

  // 初始化加载数据
  useEffect(() => {
    loadConfigs();
    loadHeartbeatStatus();

    // 定期刷新心跳状态
    const interval = setInterval(loadHeartbeatStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // 加载配置列表
  const loadConfigs = async (searchParams = {}) => {
    setTableLoading(true);
    try {
      const response = await fsuApi.get("/config", {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...searchParams,
        },
      });

      const result = handleApiResponse(response);
      setDataSource(result.list);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination.total,
        current: result.pagination.current,
      }));
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setTableLoading(false);
    }
  };

  // 加载心跳服务状态
  const loadHeartbeatStatus = async () => {
    try {
      const response = await fsuApi.get("/heartbeat/status");
      const result = handleApiResponse(response);
      setHeartbeatStatus(result);
    } catch (error) {
      console.error("获取心跳状态失败:", error);
    }
  };

  // 启动心跳服务
  const startHeartbeat = async () => {
    setLoading(true);
    try {
      const response = await fsuApi.post("/heartbeat/start");
      const result = handleApiResponse(response);
      message.success("心跳服务启动成功");
      loadHeartbeatStatus();
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // 停止心跳服务
  const stopHeartbeat = async () => {
    setLoading(true);
    try {
      const response = await fsuApi.post("/heartbeat/stop");
      const result = handleApiResponse(response);
      message.success("心跳服务已停止");
      loadHeartbeatStatus();
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // 重启心跳服务
  const restartHeartbeat = async () => {
    setLoading(true);
    try {
      const response = await fsuApi.post("/heartbeat/restart");
      const result = handleApiResponse(response);
      message.success("心跳服务重启成功");
      loadHeartbeatStatus();
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // 激活配置
  const activateConfig = async (record) => {
    setLoading(true);
    try {
      const response = await fsuApi.post(`/config/${record._id}/activate`);
      const result = handleApiResponse(response);
      message.success("配置已激活");
      loadConfigs();
      loadHeartbeatStatus();
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: "配置名称",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Text strong={record.isActive}>{text}</Text>
          {record.isActive && <Tag color="green">当前活动</Tag>}
        </Space>
      ),
    },
    {
      title: "FSU ID",
      dataIndex: "fsuId",
      key: "fsuId",
    },
    {
      title: "软件版本",
      dataIndex: "softwareVersion",
      key: "softwareVersion",
    },
    {
      title: "运营商",
      dataIndex: "carrier",
      key: "carrier",
      render: (carrier) => {
        const colors = { CU: "blue", CT: "orange", CM: "green" };
        const names = { CU: "联通", CT: "电信", CM: "移动" };
        return <Tag color={colors[carrier]}>{names[carrier] || carrier}</Tag>;
      },
    },
    {
      title: "设备数量",
      dataIndex: "devices",
      key: "devices",
      render: (devices) => <Badge count={devices?.length || 0} showZero />,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (time) => dayjs(time).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          {!record.isActive && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => activateConfig(record)}
              loading={loading}
            >
              激活
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {!record.isActive && (
            <Popconfirm
              title="确定删除此配置吗？"
              onConfirm={() => handleDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 处理编辑
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (record) => {
    setLoading(true);
    try {
      await fsuApi.delete(`/config/${record._id}`);
      message.success("删除成功");
      loadConfigs();
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let response;
      if (editingRecord) {
        response = await fsuApi.put(`/config/${editingRecord._id}`, values);
      } else {
        response = await fsuApi.post("/config", values);
      }

      const result = handleApiResponse(response);
      message.success(editingRecord ? "更新成功" : "创建成功");
      setIsModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
      loadConfigs();
    } catch (error) {
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 心跳服务状态卡片 */}
      <Card
        title="FSU心跳服务状态"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={startHeartbeat}
              loading={loading}
              disabled={heartbeatStatus?.isRunning}
            >
              启动
            </Button>
            <Button
              icon={<PauseCircleOutlined />}
              onClick={stopHeartbeat}
              loading={loading}
              disabled={!heartbeatStatus?.isRunning}
            >
              停止
            </Button>
            <Button
              icon={<SyncOutlined />}
              onClick={restartHeartbeat}
              loading={loading}
            >
              重启
            </Button>
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                {heartbeatStatus?.isRunning ? (
                  <Badge status="processing" text="运行中" />
                ) : (
                  <Badge status="default" text="已停止" />
                )}
              </div>
              <Text type="secondary">服务状态</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                {heartbeatStatus?.heartbeatCount || 0}
              </div>
              <Text type="secondary">心跳次数</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                {heartbeatStatus?.uptimeFormatted || "0秒"}
              </div>
              <Text type="secondary">运行时长</Text>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>
                {heartbeatStatus?.currentConfig?.name || "无"}
              </div>
              <Text type="secondary">当前配置</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 配置管理卡片 */}
      <Card
        title="FSU配置管理"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRecord(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              新增配置
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadConfigs()}
              loading={tableLoading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="_id"
          loading={tableLoading}
          pagination={pagination}
          onChange={(pag) => {
            setPagination(pag);
            loadConfigs();
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 配置编辑弹窗 */}
      <Modal
        title={editingRecord ? "编辑配置" : "新增配置"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingRecord(null);
        }}
        width={800}
        confirmLoading={loading}
      >
        <Alert
          message="参数说明"
          description="以下参数直接影响LOGIN报文内容，修改后将在下次心跳服务启动时生效"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="配置名称"
                rules={[{ required: true, message: "请输入配置名称" }]}
              >
                <Input placeholder="如：生产环境配置" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="description" label="配置描述">
                <Input placeholder="配置用途说明" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>基本信息</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fsuId"
                label={
                  <Space>
                    FSU设备ID
                    <Tooltip title="对应LOGIN报文中的FsuId字段">
                      <SettingOutlined style={{ color: "#999" }} />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: "请输入FSU设备ID" }]}
              >
                <Input placeholder="61082143802203" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fsuCode"
                label={
                  <Space>
                    FSU设备编码
                    <Tooltip title="对应LOGIN报文中的FsuCode字段">
                      <SettingOutlined style={{ color: "#999" }} />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: "请输入FSU设备编码" }]}
              >
                <Input placeholder="61082143802203" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>网络信息</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="macId" label="MAC地址">
                <Input placeholder="869221025266666" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="imsiId" label="IMSI号码">
                <Input placeholder="460068161666666" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="networkType" label="网络类型">
                <Select placeholder="选择网络类型">
                  <Option value="4G">4G</Option>
                  <Option value="5G">5G</Option>
                  <Option value="LTE">LTE</Option>
                  <Option value="ETHERNET">以太网</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="lockedNetworkType" label="锁定网络类型">
                <Select placeholder="选择锁定网络类型">
                  <Option value="LTE">LTE</Option>
                  <Option value="WCDMA">WCDMA</Option>
                  <Option value="GSM">GSM</Option>
                  <Option value="CDMA">CDMA</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="carrier" label="运营商">
                <Select placeholder="选择运营商">
                  <Option value="CU">联通</Option>
                  <Option value="CT">电信</Option>
                  <Option value="CM">移动</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="softwareVersion" label="软件版本">
                <Select placeholder="选择软件版本">
                  <Option value="25.1.HQ.FSU.TT.AA02.R_GX-1.1.0.002">
                    25.1.HQ.FSU.TT.AA02.R_GX-1.1.0.002
                  </Option>
                  <Option value="25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002">
                    25.1.HQ.FSU.TT.AA02.R_LW-1.2.9.002
                  </Option>
                  <Option value="24.1.BH.FSU.TT.AA06.R_SE-1.0.9.666">
                    24.1.BH.FSU.TT.AA06.R_SE-1.0.9.666
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>厂商信息</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="fsuVendor" label="FSU软件厂商">
                <Input placeholder="ZXLW" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fsuManufactor" label="FSU硬件厂商">
                <Input placeholder="ZXLW" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fsuType" label="FSU型号">
                <Input placeholder="ZNV EISUA X7" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nmType" label="网管型号">
                <Input placeholder="DTM-W101T" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="nmVendor" label="网管厂商">
                <Input placeholder="大唐" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scServerAddress" label="SC服务器地址">
                <Input placeholder="sn-r.toweraiot.cn" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>设备列表</Divider>
          <Form.Item
            name="devices"
            label="设备ID列表（每行一个）"
            tooltip="这些设备ID将出现在LOGIN报文的DeviceList中"
          >
            <TextArea
              rows={6}
              placeholder={`61082140601589
61082141820991
61082140702618
61082140702619
61082141841251
61082143802203
61082141831306`}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FsuConfig;
