import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Card,
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  Tag,
  Drawer,
  Descriptions,
  Row,
  Col,
  Statistic,
  Alert,
  Modal,
  Form,
  message,
  Tabs,
  List,
  Avatar,
} from "antd";
import {
  AuditOutlined,
  ExportOutlined,
  EyeOutlined,
  WarningOutlined,
  SecurityScanOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";
import AuditConfig from "./AuditConfig";
import dayjs, { Dayjs } from "dayjs";

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

// 审计日志类型定义
interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceType: string;
  sourceIP: string;
  userAgent: string;
  result: "success" | "failure" | "warning";
  riskLevel: "low" | "medium" | "high" | "critical";
  description: string;
  details?: Record<string, unknown>;
  sessionId: string;
}

// 安全事件类型定义
interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: string;
  severity: "info" | "warning" | "error" | "critical";
  source: string;
  target: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "false_positive";
  assignee?: string;
}

// 登录会话类型定义
interface LoginSession {
  id: string;
  userId: string;
  userName: string;
  loginTime: string;
  logoutTime?: string;
  sourceIP: string;
  userAgent: string;
  status: "active" | "expired" | "terminated";
  duration?: string;
}

// 模拟审计日志数据 - 移到组件外部
const mockAuditLogs: AuditLog[] = [
  {
    id: "audit-001",
    timestamp: "2025-05-26 14:30:15",
    userId: "admin",
    userName: "管理员",
    userRole: "administrator",
    action: "创建虚拟机",
    resource: "vm-web-001",
    resourceType: "virtual_machine",
    sourceIP: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    result: "success",
    riskLevel: "low",
    description: "成功创建虚拟机 vm-web-001",
    sessionId: "session-001",
  },
  {
    id: "audit-002",
    timestamp: "2025-05-26 14:25:32",
    userId: "operator1",
    userName: "运维员",
    userRole: "operator",
    action: "删除用户",
    resource: "user-test",
    resourceType: "user",
    sourceIP: "192.168.1.105",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    result: "failure",
    riskLevel: "high",
    description: "尝试删除用户失败：权限不足",
    sessionId: "session-002",
  },
  {
    id: "audit-003",
    timestamp: "2025-05-26 14:20:18",
    userId: "admin",
    userName: "管理员",
    userRole: "administrator",
    action: "修改系统配置",
    resource: "system-config",
    resourceType: "system",
    sourceIP: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    result: "success",
    riskLevel: "medium",
    description: "修改系统安全配置",
    details: {
      configKey: "session.timeout",
      oldValue: "3600",
      newValue: "1800",
    },
    sessionId: "session-001",
  },
  {
    id: "audit-004",
    timestamp: "2025-05-26 14:15:45",
    userId: "unknown",
    userName: "未知用户",
    userRole: "guest",
    action: "登录尝试",
    resource: "login",
    resourceType: "authentication",
    sourceIP: "203.0.113.50",
    userAgent: "curl/7.68.0",
    result: "failure",
    riskLevel: "critical",
    description: "多次登录失败，疑似暴力破解攻击",
    sessionId: "",
  },
];

// 模拟安全事件数据 - 移到组件外部
const mockSecurityEvents: SecurityEvent[] = [
  {
    id: "event-001",
    timestamp: "2025-05-26 14:15:45",
    eventType: "暴力破解攻击",
    severity: "critical",
    source: "203.0.113.50",
    target: "login-service",
    description: "检测到来自外部IP的多次登录失败尝试",
    status: "investigating",
    assignee: "安全管理员",
  },
  {
    id: "event-002",
    timestamp: "2025-05-26 13:45:22",
    eventType: "异常访问",
    severity: "warning",
    source: "192.168.1.200",
    target: "admin-panel",
    description: "非工作时间访问管理面板",
    status: "resolved",
    assignee: "运维管理员",
  },
  {
    id: "event-003",
    timestamp: "2025-05-26 13:30:10",
    eventType: "权限提升",
    severity: "error",
    source: "user-test",
    target: "system-config",
    description: "普通用户尝试访问系统配置",
    status: "open",
  },
];

// 模拟登录会话数据 - 移到组件外部
const mockLoginSessions: LoginSession[] = [
  {
    id: "session-001",
    userId: "admin",
    userName: "管理员",
    loginTime: "2025-05-26 08:30:00",
    sourceIP: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "active",
    duration: "6小时",
  },
  {
    id: "session-002",
    userId: "operator1",
    userName: "运维员",
    loginTime: "2025-05-26 09:15:00",
    logoutTime: "2025-05-26 17:30:00",
    sourceIP: "192.168.1.105",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    status: "expired",
    duration: "8小时15分钟",
  },
];

const AuditManagement: React.FC = () => {
  const { themeConfig } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("audit-logs");

  // 审计日志状态
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [logDrawerVisible, setLogDrawerVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  // 安全事件状态
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(
    null,
  );
  const [eventDrawerVisible, setEventDrawerVisible] = useState(false);

  // 登录会话状态
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);

  // 配置状态
  const [configVisible, setConfigVisible] = useState(false);

  // 筛选状态
  const [filters, setFilters] = useState<{
    dateRange: [Dayjs, Dayjs] | null;
    userId: string;
    action: string;
    result: string;
    riskLevel: string;
    resourceType: string;
  }>({
    dateRange: null,
    userId: "",
    action: "",
    result: "",
    riskLevel: "",
    resourceType: "",
  });

  const loadAuditData = useCallback(() => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setAuditLogs(mockAuditLogs);
      setSecurityEvents(mockSecurityEvents);
      setLoginSessions(mockLoginSessions);
      setLoading(false);
    }, 500);
  }, []); // 移除依赖项，因为mock数据现在在组件外部，是固定的

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  // 获取结果标签颜色
  const getResultColor = (result: string) => {
    switch (result) {
      case "success":
        return "success";
      case "failure":
        return "error";
      case "warning":
        return "warning";
      default:
        return "default";
    }
  };

  // 获取风险等级颜色
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "gold";
      case "low":
        return "green";
      default:
        return "default";
    }
  };

  // 获取严重程度颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "red";
      case "error":
        return "orange";
      case "warning":
        return "gold";
      case "info":
        return "blue";
      default:
        return "default";
    }
  };

  // 审计日志表格列定义
  const auditLogColumns = [
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      sorter: (a: AuditLog, b: AuditLog) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "用户",
      dataIndex: "userName",
      key: "userName",
      width: 120,
      render: (text: string, record: AuditLog) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{text}</span>
          <Tag>{record.userRole}</Tag>
        </Space>
      ),
    },
    {
      title: "操作",
      dataIndex: "action",
      key: "action",
      width: 150,
    },
    {
      title: "资源",
      key: "resource",
      width: 180,
      render: (record: AuditLog) => (
        <Space direction="vertical" size="small">
          <span>{record.resource}</span>
          <Tag>{record.resourceType}</Tag>
        </Space>
      ),
    },
    {
      title: "结果",
      dataIndex: "result",
      key: "result",
      width: 80,
      render: (result: string) => (
        <Tag color={getResultColor(result)}>
          {result === "success"
            ? "成功"
            : result === "failure"
              ? "失败"
              : "警告"}
        </Tag>
      ),
    },
    {
      title: "风险等级",
      dataIndex: "riskLevel",
      key: "riskLevel",
      width: 100,
      render: (level: string) => (
        <Tag color={getRiskLevelColor(level)}>
          {level === "critical"
            ? "严重"
            : level === "high"
              ? "高"
              : level === "medium"
                ? "中"
                : "低"}
        </Tag>
      ),
    },
    {
      title: "来源IP",
      dataIndex: "sourceIP",
      key: "sourceIP",
      width: 130,
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (record: AuditLog) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewLogDetails(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  // 安全事件表格列定义
  const securityEventColumns = [
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      sorter: (a: SecurityEvent, b: SecurityEvent) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "事件类型",
      dataIndex: "eventType",
      key: "eventType",
      width: 120,
    },
    {
      title: "严重程度",
      dataIndex: "severity",
      key: "severity",
      width: 100,
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>
          {severity === "critical"
            ? "严重"
            : severity === "error"
              ? "错误"
              : severity === "warning"
                ? "警告"
                : "信息"}
        </Tag>
      ),
    },
    {
      title: "源",
      dataIndex: "source",
      key: "source",
      width: 150,
    },
    {
      title: "目标",
      dataIndex: "target",
      key: "target",
      width: 150,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        const statusMap = {
          open: { color: "red", text: "待处理" },
          investigating: { color: "orange", text: "调查中" },
          resolved: { color: "green", text: "已解决" },
          false_positive: { color: "gray", text: "误报" },
        };
        const config = statusMap[status as keyof typeof statusMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      render: (record: SecurityEvent) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => viewEventDetails(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  // 登录会话表格列定义
  const sessionColumns = [
    {
      title: "用户",
      dataIndex: "userName",
      key: "userName",
      width: 120,
      render: (text: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: "登录时间",
      dataIndex: "loginTime",
      key: "loginTime",
      width: 160,
    },
    {
      title: "登出时间",
      dataIndex: "logoutTime",
      key: "logoutTime",
      width: 160,
      render: (time: string) => time || "-",
    },
    {
      title: "持续时间",
      dataIndex: "duration",
      key: "duration",
      width: 120,
    },
    {
      title: "来源IP",
      dataIndex: "sourceIP",
      key: "sourceIP",
      width: 130,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        const statusMap = {
          active: { color: "green", text: "活跃" },
          expired: { color: "orange", text: "已过期" },
          terminated: { color: "red", text: "已终止" },
        };
        const config = statusMap[status as keyof typeof statusMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  // 查看日志详情
  const viewLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setLogDrawerVisible(true);
  };

  // 查看事件详情
  const viewEventDetails = (event: SecurityEvent) => {
    setSelectedEvent(event);
    setEventDrawerVisible(true);
  };

  // 导出审计日志
  const exportAuditLogs = (values: {
    dateRange: [Dayjs, Dayjs];
    format: string;
    includeDetails: boolean;
  }) => {
    console.log("导出参数:", values);
    message.success("审计日志导出成功");
    setExportModalVisible(false);
  };

  // 统计数据
  const getStatistics = () => {
    const today = dayjs().format("YYYY-MM-DD");
    const todayLogs = auditLogs.filter((log) =>
      log.timestamp.startsWith(today),
    );
    const failureLogs = auditLogs.filter((log) => log.result === "failure");
    const criticalEvents = securityEvents.filter(
      (event) => event.severity === "critical",
    );
    const activeSessions = loginSessions.filter(
      (session) => session.status === "active",
    );

    return {
      totalLogs: auditLogs.length,
      todayLogs: todayLogs.length,
      failureLogs: failureLogs.length,
      criticalEvents: criticalEvents.length,
      activeSessions: activeSessions.length,
    };
  };

  const statistics = getStatistics();

  return (
    <Layout
      style={{
        minHeight: "100vh",
        backgroundColor: themeConfig.token.colorBgLayout,
      }}
    >
      <Content style={{ padding: "24px" }}>
        <Card
          title={
            <Space>
              <AuditOutlined />
              <span>审计管理</span>
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={<SettingOutlined />}
                onClick={() => setConfigVisible(true)}
              >
                配置
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => setExportModalVisible(true)}
              >
                导出日志
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadAuditData}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          }
        >
          {/* 统计概览 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="审计日志总数"
                  value={statistics.totalLogs}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日日志"
                  value={statistics.todayLogs}
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="失败操作"
                  value={statistics.failureLogs}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="活跃会话"
                  value={statistics.activeSessions}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Card>
            </Col>
          </Row>

          {/* 安全警告 */}
          {statistics.criticalEvents > 0 && (
            <Alert
              message="安全警告"
              description={`检测到 ${statistics.criticalEvents} 个严重安全事件，请及时处理！`}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
              action={
                <Button
                  size="small"
                  danger
                  onClick={() => setActiveTab("security-events")}
                >
                  查看详情
                </Button>
              }
            />
          )}

          {/* 选项卡内容 */}
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  审计日志
                </span>
              }
              key="audit-logs"
            >
              {/* 筛选条件 */}
              <Card size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} md={6}>
                    <RangePicker
                      style={{ width: "100%" }}
                      placeholder={["开始时间", "结束时间"]}
                      onChange={(dates) =>
                        setFilters({
                          ...filters,
                          dateRange: dates as [Dayjs, Dayjs] | null,
                        })
                      }
                    />
                  </Col>
                  <Col xs={24} sm={12} md={4}>
                    <Select
                      placeholder="操作结果"
                      style={{ width: "100%" }}
                      allowClear
                      onChange={(value) =>
                        setFilters({ ...filters, result: value })
                      }
                    >
                      <Option value="success">成功</Option>
                      <Option value="failure">失败</Option>
                      <Option value="warning">警告</Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={4}>
                    <Select
                      placeholder="风险等级"
                      style={{ width: "100%" }}
                      allowClear
                      onChange={(value) =>
                        setFilters({ ...filters, riskLevel: value })
                      }
                    >
                      <Option value="critical">严重</Option>
                      <Option value="high">高</Option>
                      <Option value="medium">中</Option>
                      <Option value="low">低</Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Search
                      placeholder="搜索用户、操作、资源..."
                      allowClear
                      onSearch={(value) => console.log("搜索:", value)}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={4}>
                    <Space>
                      <Button icon={<FilterOutlined />}>筛选</Button>
                      <Button>重置</Button>
                    </Space>
                  </Col>
                </Row>
              </Card>

              <Table
                columns={auditLogColumns}
                dataSource={auditLogs}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
                scroll={{ x: 1200 }}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <SecurityScanOutlined />
                  安全事件
                </span>
              }
              key="security-events"
            >
              <Table
                columns={securityEventColumns}
                dataSource={securityEvents}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
                scroll={{ x: 1000 }}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  登录会话
                </span>
              }
              key="login-sessions"
            >
              <Table
                columns={sessionColumns}
                dataSource={loginSessions}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
                scroll={{ x: 900 }}
              />
            </TabPane>
          </Tabs>
        </Card>

        {/* 审计日志详情抽屉 */}
        <Drawer
          title="审计日志详情"
          width={600}
          onClose={() => setLogDrawerVisible(false)}
          open={logDrawerVisible}
        >
          {selectedLog && (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Descriptions title="基本信息" bordered size="small">
                <Descriptions.Item label="时间" span={3}>
                  {selectedLog.timestamp}
                </Descriptions.Item>
                <Descriptions.Item label="用户" span={2}>
                  {selectedLog.userName} ({selectedLog.userId})
                </Descriptions.Item>
                <Descriptions.Item label="角色">
                  <Tag>{selectedLog.userRole}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="操作" span={2}>
                  {selectedLog.action}
                </Descriptions.Item>
                <Descriptions.Item label="结果">
                  <Tag color={getResultColor(selectedLog.result)}>
                    {selectedLog.result === "success"
                      ? "成功"
                      : selectedLog.result === "failure"
                        ? "失败"
                        : "警告"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="资源" span={2}>
                  {selectedLog.resource}
                </Descriptions.Item>
                <Descriptions.Item label="资源类型">
                  <Tag>{selectedLog.resourceType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风险等级" span={3}>
                  <Tag color={getRiskLevelColor(selectedLog.riskLevel)}>
                    {selectedLog.riskLevel === "critical"
                      ? "严重"
                      : selectedLog.riskLevel === "high"
                        ? "高"
                        : selectedLog.riskLevel === "medium"
                          ? "中"
                          : "低"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="来源IP" span={2}>
                  {selectedLog.sourceIP}
                </Descriptions.Item>
                <Descriptions.Item label="会话ID">
                  {selectedLog.sessionId}
                </Descriptions.Item>
                <Descriptions.Item label="用户代理" span={3}>
                  {selectedLog.userAgent}
                </Descriptions.Item>
                <Descriptions.Item label="描述" span={3}>
                  {selectedLog.description}
                </Descriptions.Item>
              </Descriptions>

              {selectedLog.details && (
                <Card title="详细信息" size="small">
                  <pre
                    style={{
                      backgroundColor: themeConfig.token.colorBgContainer,
                      padding: "12px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      wordWrap: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </Card>
              )}
            </Space>
          )}
        </Drawer>

        {/* 安全事件详情抽屉 */}
        <Drawer
          title="安全事件详情"
          width={600}
          onClose={() => setEventDrawerVisible(false)}
          open={eventDrawerVisible}
        >
          {selectedEvent && (
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Descriptions title="事件信息" bordered size="small">
                <Descriptions.Item label="事件ID" span={3}>
                  {selectedEvent.id}
                </Descriptions.Item>
                <Descriptions.Item label="时间" span={3}>
                  {selectedEvent.timestamp}
                </Descriptions.Item>
                <Descriptions.Item label="事件类型" span={2}>
                  {selectedEvent.eventType}
                </Descriptions.Item>
                <Descriptions.Item label="严重程度">
                  <Tag color={getSeverityColor(selectedEvent.severity)}>
                    {selectedEvent.severity === "critical"
                      ? "严重"
                      : selectedEvent.severity === "error"
                        ? "错误"
                        : selectedEvent.severity === "warning"
                          ? "警告"
                          : "信息"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="源" span={2}>
                  {selectedEvent.source}
                </Descriptions.Item>
                <Descriptions.Item label="目标">
                  {selectedEvent.target}
                </Descriptions.Item>
                <Descriptions.Item label="状态" span={2}>
                  <Tag
                    color={
                      selectedEvent.status === "open"
                        ? "red"
                        : selectedEvent.status === "investigating"
                          ? "orange"
                          : selectedEvent.status === "resolved"
                            ? "green"
                            : "gray"
                    }
                  >
                    {selectedEvent.status === "open"
                      ? "待处理"
                      : selectedEvent.status === "investigating"
                        ? "调查中"
                        : selectedEvent.status === "resolved"
                          ? "已解决"
                          : "误报"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="处理人">
                  {selectedEvent.assignee || "未分配"}
                </Descriptions.Item>
                <Descriptions.Item label="描述" span={3}>
                  {selectedEvent.description}
                </Descriptions.Item>
              </Descriptions>

              <Card title="处理建议" size="small">
                <List size="small">
                  <List.Item>立即检查相关系统日志</List.Item>
                  <List.Item>分析攻击模式和来源</List.Item>
                  <List.Item>加强相关安全策略</List.Item>
                  <List.Item>通知相关安全管理员</List.Item>
                </List>
              </Card>
            </Space>
          )}
        </Drawer>

        {/* 导出日志模态框 */}
        <Modal
          title="导出审计日志"
          open={exportModalVisible}
          onCancel={() => setExportModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form layout="vertical" onFinish={exportAuditLogs}>
            <Form.Item
              name="dateRange"
              label="时间范围"
              rules={[{ required: true, message: "请选择时间范围" }]}
            >
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="format" label="导出格式" initialValue="excel">
              <Select>
                <Option value="excel">Excel (.xlsx)</Option>
                <Option value="csv">CSV (.csv)</Option>
                <Option value="pdf">PDF (.pdf)</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="includeDetails"
              valuePropName="checked"
              initialValue={false}
            >
              <span>包含详细信息</span>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<DownloadOutlined />}
                >
                  导出
                </Button>
                <Button onClick={() => setExportModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 审计配置 */}
        <AuditConfig
          visible={configVisible}
          onClose={() => setConfigVisible(false)}
        />
      </Content>
    </Layout>
  );
};

export default AuditManagement;
