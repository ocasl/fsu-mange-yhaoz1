import React, { useState } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import api from "../services/api";

const { Option } = Select;
const { TextArea } = Input;

const UserRegister = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await api.post("/user/register", values);

      if (response.data.success) {
        message.success("用户注册成功！");
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.data.message || "注册失败");
      }
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }

      console.error("用户注册失败:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("注册失败，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="新增用户"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          注册
        </Button>,
      ]}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          role: "user",
        }}
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: "请输入用户名" },
            { min: 3, message: "用户名至少3个字符" },
            { max: 20, message: "用户名最多20个字符" },
            {
              pattern: /^[a-zA-Z0-9_]+$/,
              message: "用户名只能包含字母、数字和下划线",
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="请输入用户名"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: "请输入密码" },
            { min: 6, message: "密码至少6个字符" },
            { max: 50, message: "密码最多50个字符" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入密码"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认密码"
          dependencies={["password"]}
          rules={[
            { required: true, message: "请确认密码" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("两次输入的密码不一致"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请再次输入密码"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="realName"
          label="真实姓名"
          rules={[{ max: 20, message: "姓名最多20个字符" }]}
        >
          <Input placeholder="请输入真实姓名（可选）" size="large" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[{ type: "email", message: "请输入有效的邮箱地址" }]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="请输入邮箱（可选）"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="role"
          label="用户角色"
          rules={[{ required: true, message: "请选择用户角色" }]}
        >
          <Select placeholder="请选择用户角色" size="large">
            <Option value="admin">总账号（管理员）</Option>
            <Option value="user">子账号（普通用户）</Option>
          </Select>
        </Form.Item>

        <Form.Item name="description" label="用户描述">
          <TextArea
            placeholder="请输入用户描述（可选）"
            rows={3}
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>

      <div
        style={{
          background: "#f0f2f5",
          padding: 12,
          borderRadius: 6,
          marginTop: 16,
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", color: "#666" }}>用户角色说明：</h4>
        <ul style={{ margin: 0, paddingLeft: 16, color: "#888", fontSize: 12 }}>
          <li>
            <strong>总账号：</strong>
            可以查看所有用户的操作记录，可以注册新的子账号
          </li>
          <li>
            <strong>子账号：</strong>只能查看自己的操作记录，不能注册新用户
          </li>
        </ul>
      </div>
    </Modal>
  );
};

export default UserRegister;
