import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Alert,

} from "antd";
import {
  MonitorOutlined,

  DeploymentUnitOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

interface SystemMonitoringProps {
  onRefresh?: () => void;
}

// 模拟系统监控数据
const mockMonitoringData = {
  systemLoad: {
    cpu: 45,
    memory: 68,
    disk: 32,
    network: 28,
  },
  services: [
    { name: "虚拟化服务", status: "running", uptime: "15天 8小时" },
    { name: "网络服务", status: "running", uptime: "15天 8小时" },
    { name: "存储服务", status: "running", uptime: "15天 7小时" },
    { name: "监控服务", status: "warning", uptime: "2小时 30分钟" },
    { name: "备份服务", status: "stopped", uptime: "-" },
  ],
  alerts: [
    {
      id: "1",
      level: "warning",
      message: "CPU使用率持续较高",
      time: "2024-01-20 14:30:00",
      source: "系统监控",
    },
    {
      id: "2",
      level: "info",
      message: "定期备份已完成",
      time: "2024-01-20 02:45:00",
      source: "备份服务",
    },
    {
      id: "3",
      level: "error",
      message: "磁盘空间不足",
      time: "2024-01-19 18:20:00",
      source: "存储监控",
    },
  ],
};

const SystemMonitoring: React.FC<SystemMonitoringProps> = ({ onRefresh }) => {
  // 获取服务状态标签
  const getServiceStatusTag = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            运行中
          </Tag>
        );
      case "stopped":
        return (
          <Tag icon={<ExclamationCircleOutlined />} color="error">
            已停止
          </Tag>
        );
      case "warning":
        return (
          <Tag icon={<WarningOutlined />} color="warning">
            异常
          </Tag>
        );
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // 获取告警级别标签
  const getAlertLevelTag = (level: string) => {
    switch (level) {
      case "info":
        return (
          <Tag icon={<CheckCircleOutlined />} color="blue">
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
          <Tag icon={<ExclamationCircleOutlined />} color="red">
            错误
          </Tag>
        );
      default:
        return <Tag color="default">{level}</Tag>;
    }
  };

  const serviceColumns = [
    {
      title: "服务名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: getServiceStatusTag,
    },
    {
      title: "运行时间",
      dataIndex: "uptime",
      key: "uptime",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: any) => (
        <Space>
          {record.status === "running" ? (
            <Button type="link" size="small" danger>
              停止
            </Button>
          ) : (
            <Button type="link" size="small">
              启动
            </Button>
          )}
          <Button type="link" size="small">
            重启
          </Button>
        </Space>
      ),
    },
  ];

  const alertColumns = [
    {
      title: "级别",
      dataIndex: "level",
      key: "level",
      render: getAlertLevelTag,
      width: 80,
    },
    {
      title: "消息",
      dataIndex: "message",
      key: "message",
    },
    {
      title: "来源",
      dataIndex: "source",
      key: "source",
      width: 120,
    },
    {
      title: "时间",
      dataIndex: "time",
      key: "time",
      width: 180,
    },
  ];

  return (
    <div>
      {/* 系统负载监控 */}
      <Card
        title={
          <Space>
            <MonitorOutlined />
            <span>系统负载监控</span>
          </Space>
        }
        extra={
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            size="small"
          >
            刷新
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[24, 24]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="CPU使用率"
                value={mockMonitoringData.systemLoad.cpu}
                suffix="%"
                valueStyle={{
                  color: mockMonitoringData.systemLoad.cpu > 80 ? "#cf1322" : "#3f8600",
                }}
              />
              <Progress
                percent={mockMonitoringData.systemLoad.cpu}
                size="small"
                strokeColor={
                  mockMonitoringData.systemLoad.cpu > 80
                    ? "#ff4d4f"
                    : mockMonitoringData.systemLoad.cpu > 60
                      ? "#faad14"
                      : "#52c41a"
                }
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="内存使用率"
                value={mockMonitoringData.systemLoad.memory}
                suffix="%"
                valueStyle={{
                  color: mockMonitoringData.systemLoad.memory > 80 ? "#cf1322" : "#3f8600",
                }}
              />
              <Progress
                percent={mockMonitoringData.systemLoad.memory}
                size="small"
                strokeColor={
                  mockMonitoringData.systemLoad.memory > 80
                    ? "#ff4d4f"
                    : mockMonitoringData.systemLoad.memory > 60
                      ? "#faad14"
                      : "#52c41a"
                }
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="磁盘使用率"
                value={mockMonitoringData.systemLoad.disk}
                suffix="%"
                valueStyle={{
                  color: mockMonitoringData.systemLoad.disk > 80 ? "#cf1322" : "#3f8600",
                }}
              />
              <Progress
                percent={mockMonitoringData.systemLoad.disk}
                size="small"
                strokeColor={
                  mockMonitoringData.systemLoad.disk > 80
                    ? "#ff4d4f"
                    : mockMonitoringData.systemLoad.disk > 60
                      ? "#faad14"
                      : "#52c41a"
                }
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="网络使用率"
                value={mockMonitoringData.systemLoad.network}
                suffix="%"
                valueStyle={{
                  color: mockMonitoringData.systemLoad.network > 80 ? "#cf1322" : "#3f8600",
                }}
              />
              <Progress
                percent={mockMonitoringData.systemLoad.network}
                size="small"
                strokeColor={
                  mockMonitoringData.systemLoad.network > 80
                    ? "#ff4d4f"
                    : mockMonitoringData.systemLoad.network > 60
                      ? "#faad14"
                      : "#52c41a"
                }
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* 服务状态 */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <DeploymentUnitOutlined />
                <span>服务状态</span>
              </Space>
            }
          >
            <Table
              columns={serviceColumns}
              dataSource={mockMonitoringData.services}
              rowKey="name"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 系统告警 */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <WarningOutlined />
                <span>系统告警</span>
              </Space>
            }
          >
            <Alert
              message="当前系统状态"
              description="检测到1个警告，请及时处理"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={alertColumns}
              dataSource={mockMonitoringData.alerts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SystemMonitoring; 