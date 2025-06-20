import React, { useState, useEffect, useCallback } from "react";
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
  Spin,
  Row,
  Col,
  Statistic,
  App,
  Typography,
  Alert,
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
  CopyOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";
import {
  userService,
  type User,
  type CreateUserRequest,
  type UserType,
} from "../../services/user";

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

// 表单值类型定义
interface UserFormValues {
  login_name: string;
  user_name: string;
  user_type: UserType;
  email?: string;
  phone?: string;
  department?: string;
  status?: boolean;
}

// 用户类型映射
const userTypeMap = {
  system_admin: { color: "red", text: "系统管理员" },
  operator: { color: "orange", text: "运维员" },
  user: { color: "blue", text: "普通用户" },
};

const UserManagement: React.FC = () => {
  const { message } = App.useApp();
  const { themeConfig } = useTheme();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [createUserResult, setCreateUserResult] = useState<{
    login_name: string;
    password: string;
  } | null>(null);

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.getUserList();
      if (response.success && response.data) {
        setUsers(response.data.users);
      } else {
        message.error(response.message || "获取用户列表失败");
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      message.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  // 初始化加载数据
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  // 获取用户类型标签
  const getUserTypeTag = (userType: UserType) => {
    const config = userTypeMap[userType];
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
      title: "登录名",
      dataIndex: "login_name",
      key: "login_name",
      width: 120,
    },
    {
      title: "用户名",
      dataIndex: "user_name",
      key: "user_name",
      width: 120,
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "用户类型",
      dataIndex: "user_type",
      key: "user_type",
      width: 100,
      render: (userType: UserType) => getUserTypeTag(userType),
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
      dataIndex: "last_login",
      key: "last_login",
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
  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === "active" ? "disabled" : "active";
      const response = await userService.toggleUserStatus(user.id, newStatus);
      if (response.success) {
        setUsers(
          users.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
        message.success(response.message);
      } else {
        message.error(response.message || "状态更新失败");
      }
    } catch (error) {
      console.error("Failed to toggle user status:", error);
      message.error("状态更新失败");
    }
  };

  // 处理删除
  const handleDelete = (user: User) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除用户 "${user.user_name}" 吗？`,
      onOk: async () => {
        try {
          const response = await userService.deleteUser(user.id);
          if (response.success) {
            setUsers(users.filter((u) => u.id !== user.id));
            message.success(response.message);
          } else {
            message.error(response.message || "删除失败");
          }
        } catch (error) {
          console.error("Failed to delete user:", error);
          message.error("删除失败");
        }
      },
    });
  };

  // 刷新数据
  const handleRefresh = () => {
    loadUsers();
  };

  // 处理表单提交
  const handleFormSubmit = async (values: UserFormValues) => {
    console.log("🚀 handleFormSubmit called with values:", values);
    console.log("📝 editingUser:", editingUser);

    try {
      if (editingUser) {
        // 更新用户
        const updateData = {
          user_name: values.user_name,
          user_type: values.user_type,
          email: values.email,
          phone: values.phone,
          department: values.department,
          status: values.status ? ("active" as const) : ("disabled" as const),
        };
        const response = await userService.updateUser(
          editingUser.id,
          updateData
        );
        if (response.success) {
          message.success(response.message);
          setModalVisible(false);
          loadUsers(); // 重新加载用户列表
        } else {
          message.error(response.message || "用户更新失败");
        }
      } else {
        // 创建新用户
        const createRequest: CreateUserRequest = {
          login_name: values.login_name,
          user_name: values.user_name,
          user_type: values.user_type,
        };

        console.log("📡 Calling userService.createUser with:", createRequest);
        const response = await userService.createUser(createRequest);
        console.log("📥 API response:", response);

        if (response.success && response.data) {
          console.log("✅ User created successfully:", response.data);
          setCreateUserResult(response.data);
          message.success(response.message);
          loadUsers(); // 重新加载用户列表
          // 不关闭模态框，显示创建结果
        } else {
          console.log("❌ User creation failed:", response.message);
          message.error(response.message || "用户创建失败");
        }
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
      message.error(editingUser ? "用户更新失败" : "用户创建失败");
    }
  };

  // 统计数据
  const statistics = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    disabled: users.filter((u) => u.status === "disabled").length,
    administrators: users.filter((u) => u.user_type === "system_admin").length,
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
    <div style={{ background: themeConfig.token.colorBgLayout }}>
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
                setCreateUserResult(null);
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
              placeholder="用户类型"
              style={{ width: "100%" }}
              value={roleFilter}
              onChange={setRoleFilter}
            >
              <Option value="all">全部类型</Option>
              <Option value="system_admin">系统管理员</Option>
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
        onCancel={() => {
          setModalVisible(false);
          setCreateUserResult(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="login_name"
                label="登录名"
                rules={[{ required: true, message: "请输入登录名" }]}
              >
                <Input placeholder="用于登录的用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="user_name"
                label="用户名"
                rules={[{ required: true, message: "请输入用户名" }]}
              >
                <Input placeholder="用户的显示名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="user_type"
                label="用户类型"
                rules={[{ required: true, message: "请选择用户类型" }]}
              >
                <Select placeholder="请选择用户类型">
                  <Option value="system_admin">系统管理员</Option>
                  <Option value="operator">运维员</Option>
                  <Option value="user">普通用户</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? "更新" : "创建"}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setCreateUserResult(null);
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 显示创建用户结果 */}
        {createUserResult && !editingUser && (
          <Alert
            message="用户创建成功！"
            description={
              <div>
                <p>
                  <strong>登录名：</strong>
                  {createUserResult.login_name}
                </p>
                <p>
                  <strong>初始密码：</strong>
                  <Text code copyable={{ text: createUserResult.password }}>
                    {createUserResult.password}
                  </Text>
                  <Button
                    type="link"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(createUserResult.password);
                      message.success("密码已复制到剪贴板");
                    }}
                  >
                    复制密码
                  </Button>
                </p>
                <p style={{ color: "#ff4d4f", fontSize: "12px" }}>
                  请妥善保存此密码，用户首次登录后建议修改密码。
                </p>
              </div>
            }
            type="success"
            showIcon
            style={{ marginTop: 16 }}
            action={
              <Button
                size="small"
                onClick={() => {
                  setModalVisible(false);
                  setCreateUserResult(null);
                }}
              >
                关闭
              </Button>
            }
          />
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
