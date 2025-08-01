import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  List,
  Typography,
  Table,
  Spin,
  Alert,
  Space,
  Tag,
  Tooltip,
  Button,
} from "antd";
import {
  DashboardOutlined,
  CloudServerOutlined,
  HddOutlined,
  GlobalOutlined,
  ClusterOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  AreaChartOutlined,
} from "@ant-design/icons";
import "./Dashboard.less";
import { useTheme } from "@/hooks/useTheme";

const { Title, Text } = Typography;

// 模拟数据 - 实际应用中应该从API获取
const mockResourceData = {
  vm: {
    total: 48,
    running: 36,
    stopped: 10,
    error: 2,
    cpuUsage: 68,
    memoryUsage: 72,
    storageUsage: 45,
  },
  host: {
    total: 8,
    connected: 7,
    disconnected: 1,
    maintenance: 0,
    cpuUsage: 58,
    memoryUsage: 65,
    storageUsage: 42,
    avgCpuCores: 32,
    totalMemory: "1024GB",
    totalStorage: "80TB",
    networkBandwidth: "10Gbps",
    uptime: "平均运行时间: 25天",
  },
  storage: {
    total: "24 TB",
    used: "10.5 TB",
    available: "13.5 TB",
    usagePercent: 44,
  },
  network: {
    vlans: 12,
    publicIPs: 24,
    usedIPs: 18,
  },
  cluster: {
    count: 3,
    healthy: 2,
    warning: 1,
  },
  systemHealth: {
    overall: "normal", // normal, warning, critical
    components: [
      { name: "物理主机", status: "warning", message: "1台主机离线，需要检查" },
      { name: "计算资源", status: "normal", message: "所有计算资源运行正常" },
      {
        name: "存储资源",
        status: "warning",
        message: "存储池 pool-02 使用率超过75%",
      },
      { name: "网络资源", status: "normal", message: "网络连接正常" },
      { name: "系统服务", status: "normal", message: "所有服务运行正常" },
    ],
  },
  performance: [
    {
      name: "物理机CPU",
      current: 58,
      trend: "stable",
      history: [52, 55, 53, 56, 59, 57, 58],
    },
    {
      name: "虚拟机CPU",
      current: 68,
      trend: "up",
      history: [45, 52, 49, 55, 59, 66, 68],
    },
    {
      name: "内存使用率",
      current: 72,
      trend: "stable",
      history: [70, 68, 65, 69, 71, 72, 72],
    },
    {
      name: "存储IO",
      current: 450,
      unit: "IOPS",
      trend: "down",
      history: [520, 490, 510, 480, 465, 455, 450],
    },
    {
      name: "网络吞吐量",
      current: 120,
      unit: "Mbps",
      trend: "up",
      history: [85, 90, 95, 105, 110, 115, 120],
    },
    {
      name: "主机温度",
      current: 42,
      unit: "°C",
      trend: "stable",
      history: [40, 41, 43, 42, 44, 41, 42],
    },
  ],
  alerts: [
    { id: 1, level: "error", message: "物理机 host-03 离线", time: "10分钟前" },
    {
      id: 2,
      level: "warning",
      message: "物理机 host-02 CPU使用率超过85%",
      time: "20分钟前",
    },
    {
      id: 3,
      level: "warning",
      message: "存储池 pool-02 使用率超过75%",
      time: "30分钟前",
    },
    {
      id: 4,
      level: "warning",
      message: "虚拟机 vm-12 内存使用率高",
      time: "1小时前",
    },
    {
      id: 5,
      level: "info",
      message: "物理机 host-01 重启完成",
      time: "2小时前",
    },
    { id: 6, level: "info", message: "系统自动备份完成", time: "3小时前" },
  ],
  recentEvents: [
    {
      id: 1,
      operation: "物理机重启",
      target: "host-prod-01",
      user: "admin",
      time: "1小时前",
    },
    {
      id: 2,
      operation: "创建虚拟机",
      target: "vm-48",
      user: "admin",
      time: "2小时前",
    },
    {
      id: 3,
      operation: "物理机维护",
      target: "host-prod-03",
      user: "operator",
      time: "4小时前",
    },
    {
      id: 4,
      operation: "修改网络配置",
      target: "network-06",
      user: "operator",
      time: "5小时前",
    },
    {
      id: 5,
      operation: "存储迁移",
      target: "volume-23",
      user: "admin",
      time: "1天前",
    },
    {
      id: 6,
      operation: "系统升级",
      target: "全局",
      user: "admin",
      time: "2天前",
    },
  ],
};

const vmColumns = [
  { title: "虚拟机", dataIndex: "name", key: "name" },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    render: (status: string) => {
      const statusMap: Record<string, React.ReactNode> = {
        running: (
          <Text type="success">
            运行中 <CheckCircleOutlined />
          </Text>
        ),
        stopped: <Text type="secondary">已停止</Text>,
        error: (
          <Text type="danger">
            错误 <WarningOutlined />
          </Text>
        ),
      };
      return statusMap[status] || status;
    },
  },
  {
    title: "CPU使用率",
    dataIndex: "cpu",
    key: "cpu",
    render: (cpu: number) => (
      <Progress
        percent={cpu}
        size="small"
        status={cpu > 80 ? "exception" : "normal"}
      />
    ),
  },
  {
    title: "内存使用率",
    dataIndex: "memory",
    key: "memory",
    render: (memory: number) => (
      <Progress
        percent={memory}
        size="small"
        status={memory > 80 ? "exception" : "normal"}
      />
    ),
  },
];

const mockVMData = [
  { key: "1", name: "vm-web-01", status: "running", cpu: 85, memory: 78 },
  { key: "2", name: "vm-db-01", status: "running", cpu: 65, memory: 82 },
  { key: "3", name: "vm-app-01", status: "running", cpu: 45, memory: 62 },
  { key: "4", name: "vm-test-01", status: "stopped", cpu: 0, memory: 0 },
];

// 物理机数据
const mockHostData = [
  {
    key: "1",
    name: "host-prod-01",
    status: "connected",
    cpu: 65,
    memory: 70,
    vms: 8,
    uptime: "25天",
    temperature: 42,
  },
  {
    key: "2",
    name: "host-prod-02",
    status: "connected",
    cpu: 72,
    memory: 75,
    vms: 10,
    uptime: "30天",
    temperature: 45,
  },
  {
    key: "3",
    name: "host-prod-03",
    status: "disconnected",
    cpu: 0,
    memory: 0,
    vms: 0,
    uptime: "离线",
    temperature: 0,
  },
  {
    key: "4",
    name: "host-test-01",
    status: "connected",
    cpu: 45,
    memory: 55,
    vms: 5,
    uptime: "15天",
    temperature: 38,
  },
];

// 物理机表格列定义
const hostColumns = [
  {
    title: "主机名",
    dataIndex: "name",
    key: "name",
    width: 120,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 80,
    render: (status: string) => {
      const statusMap: Record<string, React.ReactNode> = {
        connected: (
          <Text type="success">
            在线 <CheckCircleOutlined />
          </Text>
        ),
        disconnected: (
          <Text type="danger">
            离线 <WarningOutlined />
          </Text>
        ),
        maintenance: <Text type="warning">维护中</Text>,
      };
      return statusMap[status] || status;
    },
  },
  {
    title: "CPU",
    dataIndex: "cpu",
    key: "cpu",
    width: 80,
    render: (cpu: number) => (
      <Progress
        percent={cpu}
        size="small"
        status={cpu > 80 ? "exception" : "normal"}
        format={(percent) => `${percent}%`}
      />
    ),
  },
  {
    title: "内存",
    dataIndex: "memory",
    key: "memory",
    width: 80,
    render: (memory: number) => (
      <Progress
        percent={memory}
        size="small"
        status={memory > 80 ? "exception" : "normal"}
        format={(percent) => `${percent}%`}
      />
    ),
  },
  {
    title: "虚拟机数",
    dataIndex: "vms",
    key: "vms",
    width: 80,
    render: (vms: number) => <span style={{ fontSize: "12px" }}>{vms}</span>,
  },
];

const Dashboard: React.FC = () => {
  const { themeConfig } = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState(mockResourceData);

  // 模拟数据加载
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setData(mockResourceData);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 告警级别对应的颜色和图标
  const getAlertStyle = (level: string) => {
    switch (level) {
      case "error":
        return { color: "#ff4d4f", icon: <WarningOutlined /> };
      case "warning":
        return { color: "#faad14", icon: <WarningOutlined /> };
      case "info":
        return { color: "#1890ff", icon: <SyncOutlined /> };
      default:
        return { color: "#52c41a", icon: <CheckCircleOutlined /> };
    }
  };

  // 健康状态对应样式
  const getHealthStyle = (status: string) => {
    switch (status) {
      case "critical":
        return {
          color: "#ff4d4f",
          bgColor: themeConfig.token.colorBgContainer,
          icon: <ExclamationCircleOutlined />,
        };
      case "warning":
        return {
          color: "#faad14",
          bgColor: themeConfig.token.colorBgContainer,
          icon: <WarningOutlined />,
        };
      default:
        return {
          color: "#52c41a",
          bgColor: themeConfig.token.colorBgContainer,
          icon: <CheckCircleOutlined />,
        };
    }
  };

  // 趋势图标和颜色
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return { icon: "↗", color: "#ff4d4f" };
      case "down":
        return { icon: "↘", color: "#52c41a" };
      default:
        return { icon: "→", color: themeConfig.token.colorPrimary };
    }
  };

  // 获取性能状态的颜色
  const getPerformanceColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "#ff4d4f";
      case "down":
        return "#52c41a";
      default:
        return themeConfig.token.colorPrimary;
    }
  };

  return (
    <Spin spinning={loading} tip="正在加载仪表盘数据...">
      <div
        style={{
          minHeight: loading ? "600px" : "auto",
          backgroundColor: themeConfig.token.colorBgContainer,
        }}
      >
        <div className="dashboard-container">
          <Card
            title={
              <Space>
                <DashboardOutlined />
                <span>系统仪表盘</span>
              </Space>
            }
            extra={
              <Space>
                <Button
                  icon={<SyncOutlined />}
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => {
                      setLoading(false);
                      setData(mockResourceData);
                    }, 1000);
                  }}
                >
                  刷新
                </Button>
                <Text type="secondary">
                  查看系统整体运行状态、资源使用情况及最近事件
                </Text>
              </Space>
            }
            className="dashboard-main-card"
          >
            {" "}
            {/* 系统健康状态 */}
            <div style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card className="health-card">
                    <Title level={4}>
                      系统健康状态
                      {data.systemHealth.overall !== "normal" && (
                        <Tag
                          color={
                            data.systemHealth.overall === "critical"
                              ? "error"
                              : "warning"
                          }
                          style={{ marginLeft: 8 }}
                        >
                          {data.systemHealth.overall === "critical"
                            ? "严重警告"
                            : "注意"}
                        </Tag>
                      )}
                    </Title>

                    <Row gutter={[16, 16]} className="health-components">
                      {data.systemHealth.components.map((comp, index) => {
                        const style = getHealthStyle(comp.status);
                        return (
                          <Col xs={24} sm={12} md={6} key={index}>
                            <Card
                              size="small"
                              className="health-component-card"
                              style={{
                                borderLeft: `4px solid ${style.color}`,
                                backgroundColor: style.bgColor,
                              }}
                            >
                              <div className="health-component-title">
                                {style.icon}
                                <span>{comp.name}</span>
                              </div>
                              <div className="health-component-message">
                                {comp.message}
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </Card>
                </Col>
              </Row>
            </div>{" "}
            {/* 资源概览部分 */}
            <div style={{ marginBottom: 24 }}>
              <Card title="资源概览" className="resource-overview-card">
                <Row gutter={[16, 16]}>
                  {/* 物理机统计 */}
                  <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                    <Card className="resource-card">
                      <Statistic
                        title="物理主机"
                        value={data.host.total}
                        prefix={<HddOutlined />}
                        suffix={`在线: ${data.host.connected}`}
                      />
                      <div className="resource-details">
                        <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                          <Text>离线: {data.host.disconnected}</Text>
                          {data.host.maintenance > 0 && (
                            <Text style={{ marginLeft: "8px" }}>
                              维护: {data.host.maintenance}
                            </Text>
                          )}
                        </div>
                        <Progress
                          percent={data.host.cpuUsage}
                          size="small"
                          status={
                            data.host.cpuUsage > 80 ? "exception" : "normal"
                          }
                          format={(percent) => `CPU ${percent}%`}
                        />
                        <Progress
                          percent={data.host.memoryUsage}
                          size="small"
                          status={
                            data.host.memoryUsage > 80 ? "exception" : "normal"
                          }
                          format={(percent) => `内存 ${percent}%`}
                        />
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                    <Card className="resource-card">
                      <Statistic
                        title="虚拟机"
                        value={data.vm.total}
                        prefix={<CloudServerOutlined />}
                        suffix={`运行中: ${data.vm.running}`}
                      />
                      <div className="resource-details">
                        <Progress
                          percent={data.vm.cpuUsage}
                          size="small"
                          status={
                            data.vm.cpuUsage > 80 ? "exception" : "normal"
                          }
                          format={(percent) => `CPU ${percent}%`}
                        />
                        <Progress
                          percent={data.vm.memoryUsage}
                          size="small"
                          status={
                            data.vm.memoryUsage > 80 ? "exception" : "normal"
                          }
                          format={(percent) => `内存 ${percent}%`}
                        />
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                    <Card className="resource-card">
                      <Statistic
                        title="存储"
                        value={data.storage.total}
                        prefix={<HddOutlined />}
                        suffix={`可用: ${data.storage.available}`}
                      />
                      <div className="resource-details">
                        <Progress
                          percent={data.storage.usagePercent}
                          size="small"
                          format={(percent) => `已使用 ${percent}%`}
                        />
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                    <Card className="resource-card">
                      <Statistic
                        title="网络"
                        value={data.network.vlans}
                        prefix={<GlobalOutlined />}
                        suffix="VLANs"
                      />
                      <div className="resource-details">
                        <Text>
                          公网IP: {data.network.publicIPs} (已用{" "}
                          {data.network.usedIPs})
                        </Text>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} md={12} lg={8} xl={6}>
                    <Card className="resource-card">
                      <Statistic
                        title="集群"
                        value={data.cluster.count}
                        prefix={<ClusterOutlined />}
                        suffix={`健康: ${data.cluster.healthy}`}
                      />
                      {data.cluster.warning > 0 && (
                        <Alert
                          message={`${data.cluster.warning}个集群有警告`}
                          type="warning"
                          showIcon
                          banner
                        />
                      )}
                    </Card>
                  </Col>
                </Row>
              </Card>
            </div>
            {/* 系统性能指标 */}
            <div style={{ marginBottom: 24 }}>
              <Card title="系统性能" className="performance-overview-card">
                <Row gutter={[16, 16]}>
                  {data.performance.map((item, index) => (
                    <Col xs={24} sm={12} md={6} lg={4} key={index}>
                      <Card className="performance-card">
                        <div className="performance-header">
                          <div className="performance-title">
                            <AreaChartOutlined /> {item.name}
                          </div>
                          <Tooltip
                            title={`趋势: ${
                              item.trend === "up"
                                ? "上升"
                                : item.trend === "down"
                                  ? "下降"
                                  : "稳定"
                            }`}
                          >
                            <span
                              className="performance-trend"
                              style={{ color: getTrendIcon(item.trend).color }}
                            >
                              {getTrendIcon(item.trend).icon}
                            </span>
                          </Tooltip>
                        </div>
                        <Statistic
                          value={item.current}
                          suffix={item.unit}
                          valueStyle={{
                            color: getPerformanceColor(item.trend),
                          }}
                        />
                        <div className="performance-chart">
                          {item.history.map((val, i) => (
                            <div
                              key={i}
                              className="chart-bar"
                              style={{
                                height: `${val / 6}%`,
                                backgroundColor: getPerformanceColor(
                                  item.trend,
                                ),
                                opacity: 0.3 + i * 0.1,
                              }}
                            />
                          ))}
                        </div>{" "}
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </div>
            {/* 物理机详细统计 */}
            <div style={{ marginBottom: 24 }}>
              <Card title="物理主机详细统计" className="resource-overview-card">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card className="resource-card">
                      <Statistic
                        title="总计算能力"
                        value={data.host.avgCpuCores * data.host.total}
                        suffix="核心"
                        prefix={<HddOutlined />}
                      />
                      <div className="resource-details">
                        <Text>平均每台: {data.host.avgCpuCores}核心</Text>
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card className="resource-card">
                      <Statistic
                        title="总内存容量"
                        value={data.host.totalMemory}
                        prefix={<GlobalOutlined />}
                      />
                      <div className="resource-details">
                        <Progress
                          percent={data.host.memoryUsage}
                          size="small"
                          format={(percent) => `已使用 ${percent}%`}
                        />
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card className="resource-card">
                      <Statistic
                        title="存储容量"
                        value={data.host.totalStorage}
                        prefix={<HddOutlined />}
                      />
                      <div className="resource-details">
                        <Progress
                          percent={data.host.storageUsage}
                          size="small"
                          format={(percent) => `已使用 ${percent}%`}
                        />
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card className="resource-card">
                      <Statistic
                        title="网络带宽"
                        value={data.host.networkBandwidth}
                        prefix={<GlobalOutlined />}
                      />
                      <div className="resource-details">
                        <Text style={{ fontSize: "12px" }}>
                          {data.host.uptime}
                        </Text>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </div>{" "}
            {/* 详细信息部分 */}
            <div style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                {/* 物理机监控表格 */}
                <Col xs={24} lg={8}>
                  <Card
                    title="物理主机状态"
                    className="detail-card"
                    extra={<a href="#">查看全部</a>}
                  >
                    <div style={{ marginBottom: 16 }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <div style={{ textAlign: "center" }}>
                            <div
                              style={{
                                fontSize: "20px",
                                fontWeight: "bold",
                                color: "#52c41a",
                              }}
                            >
                              {data.host.connected}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              在线主机
                            </div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div style={{ textAlign: "center" }}>
                            <div
                              style={{
                                fontSize: "20px",
                                fontWeight: "bold",
                                color: "#ff4d4f",
                              }}
                            >
                              {data.host.disconnected}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              离线主机
                            </div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div style={{ textAlign: "center" }}>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "#1890ff",
                              }}
                            >
                              {data.host.totalMemory}
                            </div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              总内存
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                    <Table
                      columns={hostColumns}
                      dataSource={mockHostData.slice(0, 3)}
                      pagination={false}
                      size="small"
                      scroll={{ x: true }}
                    />
                  </Card>
                </Col>

                {/* 虚拟机监控表格 */}
                <Col xs={24} lg={8}>
                  <Card
                    title="虚拟机监控"
                    className="detail-card"
                    extra={<a href="#">查看全部</a>}
                  >
                    <Table
                      columns={vmColumns}
                      dataSource={mockVMData.slice(0, 4)}
                      pagination={false}
                      size="small"
                      scroll={{ x: true }}
                    />
                  </Card>
                </Col>

                {/* 告警信息 */}
                <Col xs={24} lg={8}>
                  <Card
                    title="系统告警"
                    className="detail-card alert-card"
                    extra={<a href="#">查看全部</a>}
                  >
                    <List
                      itemLayout="horizontal"
                      dataSource={data.alerts}
                      renderItem={(item) => {
                        const alertStyle = getAlertStyle(item.level);
                        return (
                          <List.Item>
                            <Space>
                              <span style={{ color: alertStyle.color }}>
                                {alertStyle.icon}
                              </span>
                              <div>
                                <div>{item.message}</div>
                                <div className="event-time">{item.time}</div>
                              </div>
                            </Space>
                          </List.Item>
                        );
                      }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 最近事件 */}
              <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
                <Col span={24}>
                  <Card
                    title="最近操作"
                    className="detail-card"
                    extra={<a href="#">查看全部</a>}
                  >
                    <List
                      grid={{
                        gutter: 16,
                        xs: 1,
                        sm: 1,
                        md: 2,
                        lg: 2,
                        xl: 4,
                        xxl: 4,
                      }}
                      dataSource={data.recentEvents}
                      renderItem={(item) => (
                        <List.Item>
                          <Card size="small">
                            <div className="event-title">{item.operation}</div>
                            <div className="event-details">
                              <div>目标: {item.target}</div>
                              <div>用户: {item.user}</div>
                              <div className="event-time">{item.time}</div>
                            </div>
                          </Card>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          </Card>
        </div>
      </div>
    </Spin>
  );
};

export default Dashboard;
