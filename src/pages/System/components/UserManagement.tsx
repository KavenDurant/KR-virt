import React from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../hooks/useTheme";

const { Option } = Select;

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  loginCount: number;
}

interface UserManagementProps {
  users: User[];
  editingUser: User | null;
  userModalVisible: boolean;
  userForm: any;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => Promise<void>;
  onAddUser: () => void;
  onUserModalCancel: () => void;
  onUserFormSubmit: (values: any) => Promise<void>;
}

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    role: "Administrator",
    status: "active",
    lastLogin: "2024-01-20 09:30:00",
    loginCount: 1250,
  },
  {
    id: "2",
    username: "operator",
    email: "operator@example.com",
    role: "Operator",
    status: "active",
    lastLogin: "2024-01-20 08:45:00",
    loginCount: 890,
  },
  {
    id: "3",
    username: "viewer",
    email: "viewer@example.com",
    role: "Viewer",
    status: "inactive",
    lastLogin: "2024-01-18 16:20:00",
    loginCount: 156,
  },
];

const UserManagement: React.FC<UserManagementProps> = ({
  users = mockUsers,
  editingUser,
  userModalVisible,
  userForm,
  onEditUser,
  onDeleteUser,
  onAddUser,
  onUserModalCancel,
  onUserFormSubmit,
}) => {
  const { themeConfig } = useTheme();

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            活跃
          </Tag>
        );
      case "inactive":
        return (
          <Tag icon={<WarningOutlined />} color="warning">
            非活跃
          </Tag>
        );
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const userColumns = [
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        const roleColors: Record<string, string> = {
          Administrator: "red",
          Operator: "blue",
          Viewer: "green",
        };
        return <Tag color={roleColors[role] || "default"}>{role}</Tag>;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: getStatusTag,
    },
    {
      title: "登录次数",
      dataIndex: "loginCount",
      key: "loginCount",
    },
    {
      title: "最后登录",
      dataIndex: "lastLogin",
      key: "lastLogin",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: User) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEditUser(record)}
            size="small"
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDeleteUser(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "8px",
        backgroundColor: themeConfig.token.colorBgContainer,
        minHeight: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <>
        <Card
          title="用户管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={onAddUser}>
              添加用户
            </Button>
          }
        >
          <Table
            columns={userColumns}
            dataSource={users}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Card>

        <Modal
          title={editingUser ? "编辑用户" : "添加用户"}
          open={userModalVisible}
          onCancel={onUserModalCancel}
          footer={null}
          width={600}
        >
          <Form
            form={userForm}
            layout="vertical"
            onFinish={onUserFormSubmit}
            preserve={false}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: "请输入用户名" },
                { min: 3, message: "用户名至少3个字符" },
                { max: 20, message: "用户名最多20个字符" },
              ]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: "请输入邮箱" },
                { type: "email", message: "请输入有效的邮箱地址" },
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            {!editingUser && (
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: "请输入密码" },
                  { min: 8, message: "密码至少8个字符" },
                ]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            )}

            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: "请选择角色" }]}
            >
              <Select placeholder="请选择角色">
                <Option value="Administrator">管理员</Option>
                <Option value="Operator">操作员</Option>
                <Option value="Viewer">查看者</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: "请选择状态" }]}
            >
              <Select placeholder="请选择状态">
                <Option value="active">活跃</Option>
                <Option value="inactive">非活跃</Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button onClick={onUserModalCancel}>取消</Button>
                <Button type="primary" htmlType="submit">
                  {editingUser ? "保存" : "添加"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </>
    </div>
  );
};

export default UserManagement;
