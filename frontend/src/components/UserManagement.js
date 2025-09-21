import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Card,
  Form,
  Input,
  Select,
  Modal,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  UserAddOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import api from "../services/api";
import UserRegister from "./UserRegister";

const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    users: 0,
    active: 0,
  });

  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.get("/user/list", {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          ...filters,
          ...params,
        },
      });

      if (response.data.success) {
        const { users: userList, pagination: paginationData } =
          response.data.data;
        setUsers(userList);
        setPagination({
          ...pagination,
          total: paginationData.total,
          current: paginationData.page,
        });

        // 计算统计信息
        const total = paginationData.total;
        const admins = userList.filter((user) => user.role === "admin").length;
        const activeUsers = userList.filter(
          (user) => user.status === "active"
        ).length;

        setStats({
          total,
          admins,
          users: total - admins,
          active: activeUsers,
        });
      }
    } catch (error) {
      console.error("获取用户列表失败:", error);
      message.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 更新用户状态
  const updateUserStatus = async (userId, status) => {
    try {
      const response = await api.patch(`/user/${userId}/status`, { status });

      if (response.data.success) {
        message.success("用户状态更新成功");
        fetchUsers();
      } else {
        message.error(response.data.message || "更新失败");
      }
    } catch (error) {
      console.error("更新用户状态失败:", error);
      message.error("更新用户状态失败");
    }
  };

  // 删除用户
  const deleteUser = async (userId) => {
    try {
      const response = await api.delete(`/user/${userId}`);

      if (response.data.success) {
        message.success("用户删除成功");
        fetchUsers();
      } else {
        message.error(response.data.message || "删除失败");
      }
    } catch (error) {
      console.error("删除用户失败:", error);
      message.error("删除用户失败");
    }
  };

  // 搜索用户
  const handleSearch = (values) => {
    setFilters(values);
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
      title: "用户名",
      dataIndex: "username",
      key: "username",
      width: 120,
    },
    {
      title: "真实姓名",
      dataIndex: "realName",
      key: "realName",
      width: 120,
      render: (text) => text || "-",
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      width: 180,
      render: (text) => text || "-",
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      width: 100,
      render: (role) => (
        <Tag color={role === "admin" ? "red" : "blue"}>
          {role === "admin" ? "总账号" : "子账号"}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const statusConfig = {
          active: { color: "green", text: "正常" },
          inactive: { color: "orange", text: "禁用" },
          locked: { color: "red", text: "锁定" },
        };
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "创建者",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 120,
      render: (createdBy) => createdBy?.username || "-",
    },
    {
      title: "最后登录",
      dataIndex: "lastLoginTime",
      key: "lastLoginTime",
      width: 160,
      render: (time) => (time ? new Date(time).toLocaleString() : "-"),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {record.status === "active" ? (
            <Button
              size="small"
              type="text"
              danger
              onClick={() => updateUserStatus(record.id, "inactive")}
            >
              禁用
            </Button>
          ) : (
            <Button
              size="small"
              type="text"
              onClick={() => updateUserStatus(record.id, "active")}
            >
              启用
            </Button>
          )}

          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => deleteUser(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" type="text" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理表格分页变化
  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总用户数"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总账号"
              value={stats.admins}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="子账号"
              value={stats.users}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="活跃用户"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
        </Row>
      </Card>

      <Card
        title="用户管理"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setRegisterModalVisible(true)}
            >
              新增用户
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchUsers()}>
              刷新
            </Button>
          </Space>
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
              placeholder="搜索用户名、姓名或邮箱"
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          <Form.Item name="role">
            <Select placeholder="选择角色" style={{ width: 120 }} allowClear>
              <Option value="admin">总账号</Option>
              <Option value="user">子账号</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="选择状态" style={{ width: 120 }} allowClear>
              <Option value="active">正常</Option>
              <Option value="inactive">禁用</Option>
              <Option value="locked">锁定</Option>
            </Select>
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

        {/* 用户表格 */}
        <Table
          dataSource={users}
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
          rowKey="id"
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 用户注册模态框 */}
      <UserRegister
        visible={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        onSuccess={() => {
          setRegisterModalVisible(false);
          fetchUsers();
        }}
      />
    </div>
  );
};

export default UserManagement;
