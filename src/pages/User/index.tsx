import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Tooltip,
  Modal,
  Form,
  Switch,
  message,
  Spin,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";

const { Search } = Input;
const { Option } = Select;

// 用户数据类型定义
interface User {
  id: string;
  username: string;
  email: string;
  realName: string;
  role: string;
  status: "active" | "disabled" | "locked";
  lastLogin: string;
  createTime: string;
  department: string;
  phone: string;
}

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    realName: "系统管理员",
    role: "administrator",
    status: "active",
    lastLogin: "2025-05-26 10:30:00",
    createTime: "2025-01-01 00:00:00",
    department: "信息技术部",
    phone: "13800138000",
  },
  {
    id: "2",
    username: "operator1",
    email: "operator1@example.com",
    realName: "运维员",
    role: "operator",
    status: "active",
    lastLogin: "2025-05-26 09:15:00",
    createTime: "2025-02-15 00:00:00",
    department: "运维部",
    phone: "13800138001",
  },
  {
    id: "3",
    username: "user1",
    email: "user1@example.com",
    realName: "普通用户",
    role: "user",
    status: "disabled",
    lastLogin: "2025-05-25 16:45:00",
    createTime: "2025-03-10 00:00:00",
    department: "业务部",
    phone: "13800138002",
  },
];

const UserManagement: React.FC = () => {
  const { themeConfig } = useTheme();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // 模拟数据加载
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      // 模拟API调用延迟
      setTimeout(() => {
        setUsers(mockUsers);
        setLoading(false);
      }, 800);
    };

    loadData();
  }, []);

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: "success", text: "正常" },
      disabled: { color: "warning", text: "禁用" },
      locked: { color: "error", text: "锁定" },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取角色标签
  const getRoleTag = (role: string) => {
    const roleMap = {
      administrator: { color: "red", text: "管理员" },
      operator: { color: "orange", text: "运维员" },
      user: { color: "blue", text: "普通用户" },
    };
    const config = roleMap[role as keyof typeof roleMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  // Column type definition
  interface UserTableColumn {
    title: string;
    dataIndex?: keyof User;
    key: string;
    width: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render?: (text: any, record: User) => React.ReactNode;
  }

  const columns: UserTableColumn[] = [
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
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      width: 100,
      render: (role: string) => getRoleTag(role),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "部门",
      dataIndex: "department",
      key: "department",
      width: 120,
    },
    {
      title: "最后登录",
      dataIndex: "lastLogin",
      key: "lastLogin",
      width: 150,
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: User) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === "active" ? "禁用" : "启用"}>
            <Button
              type="link"
              icon={
                record.status === "active" ? (
                  <LockOutlined />
                ) : (
                  <UnlockOutlined />
                )
              }
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 处理编辑
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  // 处理状态切换
  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    setUsers(
      users.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
    );
    message.success(`用户状态已${newStatus === "active" ? "启用" : "禁用"}`);
  };

  // 处理删除
  const handleDelete = (user: User) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除用户 "${user.realName}" 吗？`,
      onOk: () => {
        setUsers(users.filter((u) => u.id !== user.id));
        message.success("删除成功");
      },
    });
  };

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
      message.success("数据已刷新");
    }, 500);
  };

  // 统计数据
  const statistics = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    disabled: users.filter((u) => u.status === "disabled").length,
    administrators: users.filter((u) => u.role === "administrator").length,
  };

  // 如果正在加载，显示Loading状态
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          background: themeConfig.token.colorBgLayout,
        }}
      >
        <Spin size="large" tip="加载用户数据中..." />
      </div>
    );
  }

  return (
    <div
      style={{ padding: "24px", background: themeConfig.token.colorBgLayout }}
    >
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>用户管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => {
                setEditingUser(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              新增用户
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
          </Space>
        }
      >
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={statistics.total}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={statistics.active}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="禁用用户"
                value={statistics.disabled}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="管理员"
                value={statistics.administrators}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索用户名、姓名、邮箱..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="角色"
              style={{ width: "100%" }}
              value={roleFilter}
              onChange={setRoleFilter}
            >
              <Option value="all">全部角色</Option>
              <Option value="administrator">管理员</Option>
              <Option value="operator">运维员</Option>
              <Option value="user">普通用户</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">正常</Option>
              <Option value="disabled">禁用</Option>
              <Option value="locked">锁定</Option>
            </Select>
          </Col>
        </Row>

        {/* 用户表格 */}
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 用户编辑模态框 */}
      <Modal
        title={editingUser ? "编辑用户" : "新增用户"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            console.log("提交用户数据:", values);
            message.success(editingUser ? "用户更新成功" : "用户创建成功");
            setModalVisible(false);
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: "请输入用户名" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="realName"
                label="真实姓名"
                rules={[{ required: true, message: "请输入真实姓名" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: "请输入邮箱" },
                  { type: "email", message: "请输入有效的邮箱地址" },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[{ required: true, message: "请输入手机号" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: "请选择角色" }]}
              >
                <Select>
                  <Option value="administrator">管理员</Option>
                  <Option value="operator">运维员</Option>
                  <Option value="user">普通用户</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="department"
                label="部门"
                rules={[{ required: true, message: "请输入部门" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? "更新" : "创建"}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
