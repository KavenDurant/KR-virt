import React from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Alert,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  BugOutlined,
} from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface LogEntry {
  id: string;
  level: string;
  module: string;
  message: string;
  timestamp: string;
  ip: string;
}

interface LogManagementProps {
  logs: LogEntry[];
  onRefresh?: () => void;
  onExport?: () => void;
  onSearch?: () => void;
}

// 模拟日志数据
const mockLogs: LogEntry[] = [
  {
    id: "1",
    level: "info",
    module: "用户管理",
    message: "用户 admin 登录成功",
    timestamp: "2024-01-20 14:30:22",
    ip: "192.168.1.100",
  },
  {
    id: "2",
    level: "warning",
    module: "系统监控",
    message: "CPU使用率超过阈值 80%",
    timestamp: "2024-01-20 14:25:15",
    ip: "127.0.0.1",
  },
  {
    id: "3",
    level: "error",
    module: "存储管理",
    message: "磁盘空间不足，剩余空间少于 10%",
    timestamp: "2024-01-20 14:20:08",
    ip: "127.0.0.1",
  },
  {
    id: "4",
    level: "info",
    module: "虚拟机管理",
    message: "虚拟机 VM-001 启动成功",
    timestamp: "2024-01-20 14:15:33",
    ip: "192.168.1.102",
  },
  {
    id: "5",
    level: "debug",
    module: "网络管理",
    message: "网络连接状态检查完成",
    timestamp: "2024-01-20 14:10:45",
    ip: "127.0.0.1",
  },
  {
    id: "6",
    level: "warning",
    module: "备份服务",
    message: "备份任务执行时间超出预期",
    timestamp: "2024-01-20 14:05:12",
    ip: "127.0.0.1",
  },
  {
    id: "7",
    level: "info",
    module: "用户管理",
    message: "用户 operator 权限更新",
    timestamp: "2024-01-20 14:00:28",
    ip: "192.168.1.105",
  },
];

const LogManagement: React.FC<LogManagementProps> = ({
  logs = mockLogs,
  onRefresh,
  onExport,
  onSearch,
}) => {
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

  const logColumns = [
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      sorter: (a: LogEntry, b: LogEntry) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "级别",
      dataIndex: "level",
      key: "level",
      render: getLogLevelTag,
      width: 90,
      filters: [
        { text: "信息", value: "info" },
        { text: "警告", value: "warning" },
        { text: "错误", value: "error" },
        { text: "调试", value: "debug" },
      ],
      onFilter: (value: unknown, record: LogEntry) => record.level === value,
    },
    {
      title: "模块",
      dataIndex: "module",
      key: "module",
      width: 120,
      filters: [
        { text: "用户管理", value: "用户管理" },
        { text: "系统监控", value: "系统监控" },
        { text: "存储管理", value: "存储管理" },
        { text: "虚拟机管理", value: "虚拟机管理" },
        { text: "网络管理", value: "网络管理" },
        { text: "备份服务", value: "备份服务" },
      ],
      onFilter: (value: unknown, record: LogEntry) => record.module === value,
    },
    {
      title: "消息",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
    },
    {
      title: "IP地址",
      dataIndex: "ip",
      key: "ip",
      width: 140,
    },
  ];

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span>日志管理</span>
        </Space>
      }
      extra={
        <Space>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            size="small"
          >
            刷新
          </Button>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={onExport}
            size="small"
          >
            导出
          </Button>
        </Space>
      }
    >
      {/* 过滤器 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="搜索日志内容"
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col span={4}>
          <Select placeholder="选择级别" style={{ width: "100%" }} allowClear>
            <Option value="info">信息</Option>
            <Option value="warning">警告</Option>
            <Option value="error">错误</Option>
            <Option value="debug">调试</Option>
          </Select>
        </Col>
        <Col span={4}>
          <Select placeholder="选择模块" style={{ width: "100%" }} allowClear>
            <Option value="用户管理">用户管理</Option>
            <Option value="系统监控">系统监控</Option>
            <Option value="存储管理">存储管理</Option>
            <Option value="虚拟机管理">虚拟机管理</Option>
            <Option value="网络管理">网络管理</Option>
            <Option value="备份服务">备份服务</Option>
          </Select>
        </Col>
        <Col span={6}>
          <RangePicker
            style={{ width: "100%" }}
            showTime
            placeholder={["开始时间", "结束时间"]}
          />
        </Col>
        <Col span={4}>
          <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>
            搜索
          </Button>
        </Col>
      </Row>

      {/* 统计信息 */}
      <Alert
        message="日志统计"
        description={
          <div>
            <Space size="large">
              <span>总数: {logs.length}</span>
              <span style={{ color: "#1890ff" }}>
                信息: {logs.filter((log) => log.level === "info").length}
              </span>
              <span style={{ color: "#faad14" }}>
                警告: {logs.filter((log) => log.level === "warning").length}
              </span>
              <span style={{ color: "#ff4d4f" }}>
                错误: {logs.filter((log) => log.level === "error").length}
              </span>
              <span style={{ color: "#722ed1" }}>
                调试: {logs.filter((log) => log.level === "debug").length}
              </span>
            </Space>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 日志表格 */}
      <Table
        columns={logColumns}
        dataSource={logs}
        rowKey="id"
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
        }}
        scroll={{ y: 400 }}
        size="small"
      />
    </Card>
  );
};

export default LogManagement;
