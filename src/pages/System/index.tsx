import React, { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Divider,
  Row,
  Col,
  Typography,
  Alert,
  Modal,
  Table,
  Tag,
  Progress,
  Statistic,
  TimePicker,
  DatePicker,
  Upload,
  Radio,
  Slider,
  InputNumber,
  message,
  Popconfirm,
  Avatar,
  Descriptions,
  Steps,
  Spin,
} from "antd";
import {
  SettingOutlined,
  UserOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  ExportOutlined,
  ImportOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  DownloadOutlined,
  UploadOutlined,
  GlobalOutlined,
  MonitorOutlined,
  BugOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  DeploymentUnitOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTheme } from "../../hooks/useTheme";
import { useTabSync } from "@/hooks/useTabSync";

const { Content } = Layout;
const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;
const { Dragger } = Upload;

// 定义类型
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  loginCount: number;
}

interface Backup {
  id: string;
  name: string;
  type: string;
  size: string;
  status: string;
  startTime: string;
  endTime: string;
  description: string;
}

interface LogEntry {
  id: string;
  level: string;
  module: string;
  message: string;
  timestamp: string;
  ip: string;
}

interface GeneralSettings {
  systemName: string;
  description: string;
  adminEmail: string;
  language: string;
  timezone: string;
  sessionTimeout: number;
  autoLogout: boolean;
  enableNotifications: boolean;
}

type ThemeMode = "light" | "dark" | "auto";

// 模拟数据
const mockSystemInfo = {
  version: "2.3.1",
  buildTime: "2024-01-15 14:30:22",
  uptime: "15天 8小时 32分钟",
  license: {
    type: "Enterprise",
    expiry: "2025-12-31",
    status: "active",
    nodes: 100,
    usedNodes: 45,
  },
  hardware: {
    cpu: "64 核心 (Intel Xeon Gold 6248R)",
    memory: "512 GB",
    storage: "50 TB SSD",
    network: "10 Gbps",
  },
};

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

const mockBackups: Backup[] = [
  {
    id: "1",
    name: "系统完整备份_20240120",
    type: "full",
    size: "15.6 GB",
    status: "completed",
    startTime: "2024-01-20 02:00:00",
    endTime: "2024-01-20 02:45:00",
    description: "包含所有系统配置和虚拟机数据",
  },
  {
    id: "2",
    name: "配置增量备份_20240119",
    type: "incremental",
    size: "256 MB",
    status: "completed",
    startTime: "2024-01-19 02:00:00",
    endTime: "2024-01-19 02:05:00",
    description: "仅备份配置变更",
  },
  {
    id: "3",
    name: "系统完整备份_20240118",
    type: "full",
    size: "15.2 GB",
    status: "failed",
    startTime: "2024-01-18 02:00:00",
    endTime: "2024-01-18 02:30:00",
    description: "备份过程中出现错误",
  },
];

const mockLogs: LogEntry[] = [
  {
    id: "1",
    level: "info",
    module: "Authentication",
    message: "用户 admin 登录成功",
    timestamp: "2024-01-20 09:30:15",
    ip: "192.168.1.100",
  },
  {
    id: "2",
    level: "warning",
    module: "Storage",
    message: "存储池使用率超过 80%",
    timestamp: "2024-01-20 09:25:30",
    ip: "192.168.1.10",
  },
  {
    id: "3",
    level: "error",
    module: "Network",
    message: "网络连接超时",
    timestamp: "2024-01-20 09:20:45",
    ip: "192.168.1.15",
  },
  {
    id: "4",
    level: "info",
    module: "VirtualMachine",
    message: "虚拟机 VM-001 启动成功",
    timestamp: "2024-01-20 09:15:12",
    ip: "192.168.1.20",
  },
];

const SystemSettings: React.FC = () => {
  // 使用useTabSync Hook实现tab与URL同步
  const { activeTab, setActiveTab } = useTabSync({ defaultTab: "general" });

  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [userForm] = Form.useForm();
  const [backupForm] = Form.useForm();
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    systemName: "KR-Virt 虚拟化平台",
    description: "企业级虚拟化管理平台",
    adminEmail: "admin@example.com",
    language: "zh-CN",
    timezone: "Asia/Shanghai",
    sessionTimeout: 30,
    autoLogout: true,
    enableNotifications: true,
  });
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [, setSelectedBackup] = useState<Backup | null>(null);
  const { themeMode, setThemeMode, themeConfig } = useTheme();

  // 初始化数据加载
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // 模拟加载系统设置数据
        await new Promise((resolve) => setTimeout(resolve, 1200));
        // 这里可以加载实际的系统配置数据
      } catch (error) {
        console.error("Failed to load system settings:", error);
        message.error("加载系统设置失败");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

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
      case "completed":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            完成
          </Tag>
        );
      case "failed":
        return (
          <Tag icon={<WarningOutlined />} color="error">
            失败
          </Tag>
        );
      case "running":
        return (
          <Tag icon={<SyncOutlined spin />} color="processing">
            运行中
          </Tag>
        );
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // 获取日志级别标签
  const getLogLevelTag = (level: string) => {
    switch (level) {
      case "info":
        return (
          <Tag icon={<InfoCircleOutlined />} color="blue">
            信息
          </Tag>
        );
      case "warning":
        return (
          <Tag icon={<WarningOutlined />} color="orange">
            警告
          </Tag>
        );
      case "error":
        return (
          <Tag icon={<WarningOutlined />} color="red">
            错误
          </Tag>
        );
      case "debug":
        return (
          <Tag icon={<BugOutlined />} color="purple">
            调试
          </Tag>
        );
      default:
        return <Tag color="default">{level}</Tag>;
    }
  };

  // 保存通用设置
  const handleSaveGeneralSettings = async (values: GeneralSettings) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setGeneralSettings({ ...generalSettings, ...values });
      message.success("设置保存成功");
    } catch {
      message.error("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 主题切换
  const handleThemeChange = (value: string) => {
    setThemeMode(value as ThemeMode);
    message.success(
      `已切换到${
        value === "auto" ? "自动" : value === "dark" ? "深色" : "浅色"
      }主题`
    );
  };

  // 用户管理表格列
  const userColumns = [
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
      render: (text: string) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <span>{text}</span>
        </Space>
      ),
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
        const colors = {
          Administrator: "red",
          Operator: "blue",
          Viewer: "green",
        };
        return <Tag color={colors[role as keyof typeof colors]}>{role}</Tag>;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "最后登录",
      dataIndex: "lastLogin",
      key: "lastLogin",
    },
    {
      title: "登录次数",
      dataIndex: "loginCount",
      key: "loginCount",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => editUser(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗?"
            onConfirm={() => deleteUser(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 备份管理表格列
  const backupColumns = [
    {
      title: "备份名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) =>
        type === "full" ? (
          <Tag color="blue">完整备份</Tag>
        ) : (
          <Tag color="green">增量备份</Tag>
        ),
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "开始时间",
      dataIndex: "startTime",
      key: "startTime",
    },
    {
      title: "结束时间",
      dataIndex: "endTime",
      key: "endTime",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: Backup) => (
        <Space>
          <Button type="link" icon={<DownloadOutlined />}>
            下载
          </Button>
          <Button type="link" icon={<SyncOutlined />}>
            恢复
          </Button>
          <Popconfirm
            title="确定要删除这个备份吗?"
            onConfirm={() => deleteBackup(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 系统日志表格列
  const logColumns = [
    {
      title: "级别",
      dataIndex: "level",
      key: "level",
      render: (level: string) => getLogLevelTag(level),
    },
    {
      title: "模块",
      dataIndex: "module",
      key: "module",
    },
    {
      title: "消息",
      dataIndex: "message",
      key: "message",
    },
    {
      title: "IP地址",
      dataIndex: "ip",
      key: "ip",
    },
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
    },
  ];

  // 编辑用户
  const editUser = (user: User) => {
    setSelectedUser(user);
    userForm.setFieldsValue(user);
    setUserModalVisible(true);
  };

  // 删除用户
  const deleteUser = async (userId: string) => {
    try {
      // TODO: 实现实际的删除逻辑，使用 userId 参数
      console.log("删除用户:", userId);
      message.success("用户删除成功");
    } catch {
      message.error("删除失败，请重试");
    }
  };

  // 删除备份
  const deleteBackup = async (backupId: string) => {
    try {
      // TODO: 实现实际的删除逻辑，使用 backupId 参数
      console.log("删除备份:", backupId);
      message.success("备份删除成功");
    } catch {
      message.error("删除失败，请重试");
    }
  };

  // 创建备份
  const createBackup = () => {
    setSelectedBackup(null);
    backupForm.resetFields();
    setBackupModalVisible(true);
  };

  return (
    <Spin spinning={loading} tip="正在加载系统设置...">
      <div
        style={{
          minHeight: loading ? "400px" : "auto",
          backgroundColor: themeConfig.token.colorBgContainer,
        }}
      >
        <Layout className="system-settings">
          <Content style={{ minHeight: 280 }}>
            <Card
              title={
                <Space>
                  <SettingOutlined />
                  <span>系统设置</span>
                </Space>
              }
              extra={
                <Space>
                  <Button icon={<ExportOutlined />}>导出配置</Button>
                  <Button icon={<ImportOutlined />}>导入配置</Button>
                </Space>
              }
            >
              <Tabs activeKey={activeTab} onChange={setActiveTab} type="line">
                {/* 通用设置 */}
                <TabPane
                  tab={
                    <Space>
                      <SettingOutlined />
                      <span>通用设置</span>
                    </Space>
                  }
                  key="general"
                >
                  <Row gutter={[24, 24]}>
                    <Col span={16}>
                      <Form
                        form={form}
                        layout="vertical"
                        initialValues={generalSettings}
                        onFinish={handleSaveGeneralSettings}
                      >
                        <Card title="基本信息" style={{ marginBottom: 24 }}>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="systemName"
                                label="系统名称"
                                rules={[
                                  { required: true, message: "请输入系统名称" },
                                ]}
                              >
                                <Input placeholder="请输入系统名称" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="adminEmail"
                                label="管理员邮箱"
                                rules={[
                                  {
                                    required: true,
                                    message: "请输入管理员邮箱",
                                  },
                                  {
                                    type: "email",
                                    message: "请输入有效的邮箱地址",
                                  },
                                ]}
                              >
                                <Input placeholder="请输入管理员邮箱" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item name="description" label="系统描述">
                            <TextArea rows={3} placeholder="请输入系统描述" />
                          </Form.Item>
                        </Card>

                        <Card title="区域设置" style={{ marginBottom: 24 }}>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item name="language" label="语言">
                                <Select>
                                  <Option value="zh-CN">简体中文</Option>
                                  <Option value="zh-TW">繁体中文</Option>
                                  <Option value="en-US">English</Option>
                                  <Option value="ja-JP">日本語</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="timezone" label="时区">
                                <Select>
                                  <Option value="Asia/Shanghai">
                                    北京时间 (UTC+8)
                                  </Option>
                                  <Option value="Asia/Tokyo">
                                    东京时间 (UTC+9)
                                  </Option>
                                  <Option value="UTC">
                                    协调世界时 (UTC+0)
                                  </Option>
                                  <Option value="America/New_York">
                                    纽约时间 (UTC-5)
                                  </Option>
                                  <Option value="Europe/London">
                                    伦敦时间 (UTC+0)
                                  </Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>

                        <Card title="外观设置" style={{ marginBottom: 24 }}>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item label="主题模式">
                                <Radio.Group
                                  value={themeMode}
                                  onChange={(e) =>
                                    handleThemeChange(e.target.value)
                                  }
                                >
                                  <Radio.Button value="light">
                                    <SunOutlined /> 浅色
                                  </Radio.Button>
                                  <Radio.Button value="dark">
                                    <MoonOutlined /> 深色
                                  </Radio.Button>
                                  <Radio.Button value="auto">
                                    <DesktopOutlined /> 自动
                                  </Radio.Button>
                                </Radio.Group>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="当前主题">
                                <Tag
                                  color={themeMode === "dark" ? "blue" : "gold"}
                                >
                                  {themeMode === "dark"
                                    ? "深色模式"
                                    : themeMode === "light"
                                    ? "浅色模式"
                                    : "自动模式"}
                                </Tag>
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>

                        <Card title="安全设置" style={{ marginBottom: 24 }}>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="sessionTimeout"
                                label="会话超时时间（分钟）"
                              >
                                <InputNumber
                                  min={5}
                                  max={480}
                                  style={{ width: "100%" }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="autoLogout"
                                label="自动登出"
                                valuePropName="checked"
                              >
                                <Switch />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item
                            name="enableNotifications"
                            label="启用系统通知"
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Card>

                        <Form.Item>
                          <Space>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={loading}
                            >
                              保存设置
                            </Button>
                            <Button onClick={() => form.resetFields()}>
                              重置
                            </Button>
                          </Space>
                        </Form.Item>
                      </Form>
                    </Col>

                    <Col span={8}>
                      <Card title="系统信息">
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="版本">
                            {mockSystemInfo.version}
                          </Descriptions.Item>
                          <Descriptions.Item label="构建时间">
                            {mockSystemInfo.buildTime}
                          </Descriptions.Item>
                          <Descriptions.Item label="运行时间">
                            {mockSystemInfo.uptime}
                          </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <div style={{ marginBottom: 16 }}>
                          <Title level={5}>许可证信息</Title>
                          <Space direction="vertical" style={{ width: "100%" }}>
                            <div>
                              <Text type="secondary">类型：</Text>
                              <Tag color="blue">
                                {mockSystemInfo.license.type}
                              </Tag>
                            </div>
                            <div>
                              <Text type="secondary">状态：</Text>
                              {getStatusTag(mockSystemInfo.license.status)}
                            </div>
                            <div>
                              <Text type="secondary">到期时间：</Text>
                              <Text>{mockSystemInfo.license.expiry}</Text>
                            </div>
                            <div>
                              <Text type="secondary">节点使用：</Text>
                              <Progress
                                percent={Math.round(
                                  (mockSystemInfo.license.usedNodes /
                                    mockSystemInfo.license.nodes) *
                                    100
                                )}
                                size="small"
                                format={() =>
                                  `${mockSystemInfo.license.usedNodes}/${mockSystemInfo.license.nodes}`
                                }
                              />
                            </div>
                          </Space>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>

                {/* 用户管理 */}
                <TabPane
                  tab={
                    <Space>
                      <UserOutlined />
                      <span>用户管理</span>
                    </Space>
                  }
                  key="users"
                >
                  <Card
                    title="用户列表"
                    extra={
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setSelectedUser(null);
                          userForm.resetFields();
                          setUserModalVisible(true);
                        }}
                      >
                        新增用户
                      </Button>
                    }
                  >
                    <Table
                      columns={userColumns}
                      dataSource={mockUsers}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                    />
                  </Card>
                </TabPane>

                {/* 安全设置 */}
                <TabPane
                  tab={
                    <Space>
                      <SecurityScanOutlined />
                      <span>安全设置</span>
                    </Space>
                  }
                  key="security"
                >
                  <Row gutter={[24, 24]}>
                    <Col span={12}>
                      <Card title="访问控制">
                        <Form layout="vertical">
                          <Form.Item label="密码策略">
                            <Space
                              direction="vertical"
                              style={{ width: "100%" }}
                            >
                              <div>
                                <Text>最小长度：</Text>
                                <InputNumber
                                  min={6}
                                  max={32}
                                  defaultValue={8}
                                />
                              </div>
                              <div>
                                <Text>必须包含大写字母</Text>
                                <Switch
                                  defaultChecked
                                  style={{ marginLeft: 8 }}
                                />
                              </div>
                              <div>
                                <Text>必须包含小写字母</Text>
                                <Switch
                                  defaultChecked
                                  style={{ marginLeft: 8 }}
                                />
                              </div>
                              <div>
                                <Text>必须包含数字</Text>
                                <Switch
                                  defaultChecked
                                  style={{ marginLeft: 8 }}
                                />
                              </div>
                              <div>
                                <Text>必须包含特殊字符</Text>
                                <Switch style={{ marginLeft: 8 }} />
                              </div>
                            </Space>
                          </Form.Item>

                          <Form.Item label="登录限制">
                            <Space
                              direction="vertical"
                              style={{ width: "100%" }}
                            >
                              <div>
                                <Text>最大失败次数：</Text>
                                <InputNumber
                                  min={3}
                                  max={10}
                                  defaultValue={5}
                                />
                              </div>
                              <div>
                                <Text>锁定时间（分钟）：</Text>
                                <InputNumber
                                  min={5}
                                  max={60}
                                  defaultValue={15}
                                />
                              </div>
                              <div>
                                <Text>启用双因子认证</Text>
                                <Switch style={{ marginLeft: 8 }} />
                              </div>
                            </Space>
                          </Form.Item>
                        </Form>
                      </Card>
                    </Col>

                    <Col span={12}>
                      <Card title="SSL证书">
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <Alert
                            message="SSL证书状态"
                            description="证书有效期至 2025-12-31，剩余 340 天"
                            type="success"
                            showIcon
                            style={{ marginBottom: 16 }}
                          />

                          <Dragger
                            name="certificate"
                            multiple={false}
                            accept=".crt,.pem"
                            beforeUpload={() => false}
                          >
                            <p className="ant-upload-drag-icon">
                              <UploadOutlined />
                            </p>
                            <p className="ant-upload-text">
                              点击或拖拽上传SSL证书
                            </p>
                            <p className="ant-upload-hint">
                              支持 .crt、.pem 格式
                            </p>
                          </Dragger>

                          <Button type="primary" block>
                            更新证书
                          </Button>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>

                {/* 备份恢复 */}
                <TabPane
                  tab={
                    <Space>
                      <DatabaseOutlined />
                      <span>备份恢复</span>
                    </Space>
                  }
                  key="backup"
                >
                  <Row gutter={[24, 24]}>
                    <Col span={24}>
                      <Card
                        title="备份列表"
                        extra={
                          <Space>
                            <Button icon={<SyncOutlined />}>刷新</Button>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={createBackup}
                            >
                              创建备份
                            </Button>
                          </Space>
                        }
                      >
                        <Table
                          columns={backupColumns}
                          dataSource={mockBackups}
                          rowKey="id"
                          pagination={{ pageSize: 10 }}
                        />
                      </Card>
                    </Col>

                    <Col span={12}>
                      <Card title="自动备份设置">
                        <Form layout="vertical">
                          <Form.Item
                            label="启用自动备份"
                            valuePropName="checked"
                          >
                            <Switch defaultChecked />
                          </Form.Item>

                          <Form.Item label="备份频率">
                            <Select defaultValue="daily">
                              <Option value="daily">每日</Option>
                              <Option value="weekly">每周</Option>
                              <Option value="monthly">每月</Option>
                            </Select>
                          </Form.Item>

                          <Form.Item label="备份时间">
                            <TimePicker
                              defaultValue={dayjs("02:00", "HH:mm")}
                              format="HH:mm"
                            />
                          </Form.Item>

                          <Form.Item label="保留份数">
                            <InputNumber min={1} max={30} defaultValue={7} />
                          </Form.Item>

                          <Form.Item>
                            <Button type="primary">保存设置</Button>
                          </Form.Item>
                        </Form>
                      </Card>
                    </Col>

                    <Col span={12}>
                      <Card title="备份统计">
                        <Row gutter={[16, 16]}>
                          <Col span={12}>
                            <Statistic
                              title="总备份数"
                              value={mockBackups.length}
                              prefix={<DatabaseOutlined />}
                            />
                          </Col>
                          <Col span={12}>
                            <Statistic
                              title="成功率"
                              value={Math.round(
                                (mockBackups.filter(
                                  (b) => b.status === "completed"
                                ).length /
                                  mockBackups.length) *
                                  100
                              )}
                              suffix="%"
                              valueStyle={{ color: "#3f8600" }}
                              prefix={<CheckCircleOutlined />}
                            />
                          </Col>
                          <Col span={24}>
                            <div style={{ marginTop: 16 }}>
                              <Text type="secondary">存储使用量</Text>
                              <Progress
                                percent={65}
                                format={(percent) =>
                                  `${percent}% (32.1 GB / 50 GB)`
                                }
                              />
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>

                {/* 系统监控 */}
                <TabPane
                  tab={
                    <Space>
                      <MonitorOutlined />
                      <span>系统监控</span>
                    </Space>
                  }
                  key="monitoring"
                >
                  <Row gutter={[24, 24]}>
                    <Col span={24}>
                      <Card title="系统状态">
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={6}>
                            <Card>
                              <Statistic
                                title="CPU使用率"
                                value={45}
                                suffix="%"
                                valueStyle={{ color: "#1890ff" }}
                                prefix={<ThunderboltOutlined />}
                              />
                              <Progress percent={45} size="small" />
                            </Card>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Card>
                              <Statistic
                                title="内存使用率"
                                value={68}
                                suffix="%"
                                valueStyle={{ color: "#52c41a" }}
                                prefix={<DeploymentUnitOutlined />}
                              />
                              <Progress percent={68} size="small" />
                            </Card>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Card>
                              <Statistic
                                title="存储使用率"
                                value={72}
                                suffix="%"
                                valueStyle={{ color: "#faad14" }}
                                prefix={<DatabaseOutlined />}
                              />
                              <Progress percent={72} size="small" />
                            </Card>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <Card>
                              <Statistic
                                title="网络吞吐"
                                value={1.2}
                                suffix="Gbps"
                                valueStyle={{ color: "#722ed1" }}
                                prefix={<GlobalOutlined />}
                              />
                              <Progress percent={12} size="small" />
                            </Card>
                          </Col>
                        </Row>
                      </Card>
                    </Col>

                    <Col span={24}>
                      <Card title="告警配置">
                        <Form layout="vertical">
                          <Row gutter={16}>
                            <Col span={8}>
                              <Form.Item label="CPU告警阈值 (%)">
                                <Slider defaultValue={80} max={100} />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item label="内存告警阈值 (%)">
                                <Slider defaultValue={85} max={100} />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item label="存储告警阈值 (%)">
                                <Slider defaultValue={90} max={100} />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                label="启用邮件告警"
                                valuePropName="checked"
                              >
                                <Switch defaultChecked />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                label="启用短信告警"
                                valuePropName="checked"
                              >
                                <Switch />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item>
                            <Button type="primary">保存配置</Button>
                          </Form.Item>
                        </Form>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>

                {/* 系统日志 */}
                <TabPane
                  tab={
                    <Space>
                      <FileTextOutlined />
                      <span>系统日志</span>
                    </Space>
                  }
                  key="logs"
                >
                  <Card
                    title="系统日志"
                    extra={
                      <Space>
                        <Select defaultValue="all" style={{ width: 120 }}>
                          <Option value="all">全部级别</Option>
                          <Option value="info">信息</Option>
                          <Option value="warning">警告</Option>
                          <Option value="error">错误</Option>
                        </Select>
                        <Select defaultValue="all" style={{ width: 150 }}>
                          <Option value="all">全部模块</Option>
                          <Option value="Authentication">认证</Option>
                          <Option value="Storage">存储</Option>
                          <Option value="Network">网络</Option>
                          <Option value="VirtualMachine">虚拟机</Option>
                        </Select>
                        <Button icon={<SyncOutlined />}>刷新</Button>
                        <Button icon={<DownloadOutlined />}>导出日志</Button>
                      </Space>
                    }
                  >
                    <Table
                      columns={logColumns}
                      dataSource={mockLogs}
                      rowKey="id"
                      pagination={{ pageSize: 20 }}
                      size="small"
                    />
                  </Card>
                </TabPane>

                {/* 关于系统 */}
                <TabPane
                  tab={
                    <Space>
                      <InfoCircleOutlined />
                      <span>关于系统</span>
                    </Space>
                  }
                  key="about"
                >
                  <Row gutter={[24, 24]}>
                    <Col span={12}>
                      <Card title="产品信息">
                        <Descriptions column={1}>
                          <Descriptions.Item label="产品名称">
                            KR-Virt 虚拟化平台
                          </Descriptions.Item>
                          <Descriptions.Item label="版本号">
                            {mockSystemInfo.version}
                          </Descriptions.Item>
                          <Descriptions.Item label="构建时间">
                            {mockSystemInfo.buildTime}
                          </Descriptions.Item>
                          <Descriptions.Item label="运行时间">
                            {mockSystemInfo.uptime}
                          </Descriptions.Item>
                          <Descriptions.Item label="开发商">
                            科瑞科技有限公司
                          </Descriptions.Item>
                          <Descriptions.Item label="技术支持">
                            support@kr-tech.com
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>

                    <Col span={12}>
                      <Card title="硬件信息">
                        <Descriptions column={1}>
                          <Descriptions.Item label="处理器">
                            {mockSystemInfo.hardware.cpu}
                          </Descriptions.Item>
                          <Descriptions.Item label="内存">
                            {mockSystemInfo.hardware.memory}
                          </Descriptions.Item>
                          <Descriptions.Item label="存储">
                            {mockSystemInfo.hardware.storage}
                          </Descriptions.Item>
                          <Descriptions.Item label="网络">
                            {mockSystemInfo.hardware.network}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>

                    <Col span={24}>
                      <Card title="更新历史">
                        <Steps progressDot current={3} direction="vertical">
                          <Step
                            title="v2.3.1"
                            description="2024-01-15 - 修复网络配置问题，优化用户界面"
                          />
                          <Step
                            title="v2.3.0"
                            description="2024-01-01 - 新增主题切换功能，增强安全性"
                          />
                          <Step
                            title="v2.2.5"
                            description="2023-12-15 - 性能优化，修复已知问题"
                          />
                          <Step
                            title="v2.2.0"
                            description="2023-12-01 - 新增备份恢复功能"
                          />
                        </Steps>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>
              </Tabs>
            </Card>

            {/* 用户管理模态框 */}
            <Modal
              title={selectedUser ? "编辑用户" : "新增用户"}
              open={userModalVisible}
              onCancel={() => setUserModalVisible(false)}
              footer={null}
              width={600}
            >
              <Form
                form={userForm}
                layout="vertical"
                onFinish={(values) => {
                  console.log("User form values:", values);
                  setUserModalVisible(false);
                  message.success(
                    selectedUser ? "用户更新成功" : "用户创建成功"
                  );
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="username"
                      label="用户名"
                      rules={[{ required: true, message: "请输入用户名" }]}
                    >
                      <Input placeholder="请输入用户名" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
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
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="role"
                      label="角色"
                      rules={[{ required: true, message: "请选择角色" }]}
                    >
                      <Select placeholder="请选择角色">
                        <Option value="Administrator">管理员</Option>
                        <Option value="Operator">操作员</Option>
                        <Option value="Viewer">只读用户</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
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
                  </Col>
                </Row>

                {!selectedUser && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="password"
                        label="密码"
                        rules={[{ required: true, message: "请输入密码" }]}
                      >
                        <Input.Password placeholder="请输入密码" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="confirmPassword"
                        label="确认密码"
                        rules={[
                          { required: true, message: "请确认密码" },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (
                                !value ||
                                getFieldValue("password") === value
                              ) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error("两次输入的密码不一致")
                              );
                            },
                          }),
                        ]}
                      >
                        <Input.Password placeholder="请确认密码" />
                      </Form.Item>
                    </Col>
                  </Row>
                )}

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      {selectedUser ? "更新" : "创建"}
                    </Button>
                    <Button onClick={() => setUserModalVisible(false)}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>

            {/* 备份创建模态框 */}
            <Modal
              title="创建备份"
              open={backupModalVisible}
              onCancel={() => setBackupModalVisible(false)}
              footer={null}
              width={600}
            >
              <Form
                form={backupForm}
                layout="vertical"
                onFinish={(values) => {
                  console.log("Backup form values:", values);
                  setBackupModalVisible(false);
                  message.success("备份任务已创建");
                }}
              >
                <Form.Item
                  name="name"
                  label="备份名称"
                  rules={[{ required: true, message: "请输入备份名称" }]}
                >
                  <Input placeholder="请输入备份名称" />
                </Form.Item>

                <Form.Item
                  name="type"
                  label="备份类型"
                  rules={[{ required: true, message: "请选择备份类型" }]}
                >
                  <Radio.Group>
                    <Radio value="full">完整备份</Radio>
                    <Radio value="incremental">增量备份</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item name="description" label="备份描述">
                  <TextArea rows={3} placeholder="请输入备份描述" />
                </Form.Item>

                <Form.Item
                  name="schedule"
                  label="执行时间"
                  rules={[{ required: true, message: "请选择执行时间" }]}
                >
                  <Radio.Group>
                    <Radio value="now">立即执行</Radio>
                    <Radio value="schedule">定时执行</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.schedule !== currentValues.schedule
                  }
                >
                  {({ getFieldValue }) =>
                    getFieldValue("schedule") === "schedule" ? (
                      <Form.Item
                        name="scheduleTime"
                        label="执行时间"
                        rules={[{ required: true, message: "请选择执行时间" }]}
                      >
                        <DatePicker
                          showTime
                          style={{ width: "100%" }}
                          placeholder="请选择执行时间"
                        />
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      创建备份
                    </Button>
                    <Button onClick={() => setBackupModalVisible(false)}>
                      取消
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>
          </Content>
        </Layout>
      </div>
    </Spin>
  );
};

export default SystemSettings;
