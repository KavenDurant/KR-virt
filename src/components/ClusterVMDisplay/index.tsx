import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Typography,
  Divider,
} from "antd";
import {
  ClusterOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { Cluster, VirtualMachine } from "../../services/mockData";
import { useTheme } from "../../hooks/useTheme";

const { Title, Text } = Typography;

interface ClusterStatsProps {
  cluster: Cluster;
}

interface VMDetailsProps {
  vm: VirtualMachine;
}

// 集群统计组件
export const ClusterStats: React.FC<ClusterStatsProps> = ({ cluster }) => {
  const { actualTheme } = useTheme();

  // 计算集群统计信息
  const totalVMs = cluster.nodes.reduce(
    (sum, node) => sum + node.vms.length,
    0
  );
  const runningVMs = cluster.nodes.reduce(
    (sum, node) =>
      sum + node.vms.filter((vm) => vm.status === "running").length,
    0
  );
  const stoppedVMs = cluster.nodes.reduce(
    (sum, node) =>
      sum + node.vms.filter((vm) => vm.status === "stopped").length,
    0
  );
  const suspendedVMs = cluster.nodes.reduce(
    (sum, node) =>
      sum + node.vms.filter((vm) => vm.status === "suspended").length,
    0
  );

  const totalCpu =
    cluster.nodes.reduce((sum, node) => sum + node.cpu, 0) /
    cluster.nodes.length;
  const totalMemory =
    cluster.nodes.reduce((sum, node) => sum + node.memory, 0) /
    cluster.nodes.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "#52c41a";
      case "warning":
        return "#faad14";
      case "error":
        return "#f5222d";
      default:
        return "#d9d9d9";
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Title
          level={3}
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ClusterOutlined style={{ color: getStatusColor(cluster.status) }} />
          {cluster.name}
          <Tag
            color={getStatusColor(cluster.status)}
            style={{ marginLeft: "8px" }}
          >
            {cluster.status}
          </Tag>
        </Title>
        <Text type="secondary">集群概览 · {cluster.nodes.length} 个节点</Text>
      </div>

      {/* 集群统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="虚拟机总数"
              value={totalVMs}
              prefix={<DesktopOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="运行中"
              value={runningVMs}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已停止"
              value={stoppedVMs}
              prefix={<StopOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="暂停中"
              value={suspendedVMs}
              prefix={<WarningOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 资源使用情况 */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} md={12}>
          <Card title="CPU 使用率" size="small">
            <Progress
              percent={Math.round(totalCpu)}
              status={
                totalCpu > 80
                  ? "exception"
                  : totalCpu > 60
                  ? "active"
                  : "success"
              }
              strokeColor={
                totalCpu > 80
                  ? "#f5222d"
                  : totalCpu > 60
                  ? "#faad14"
                  : "#52c41a"
              }
            />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              平均使用率: {totalCpu.toFixed(1)}%
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="内存使用率" size="small">
            <Progress
              percent={Math.round(totalMemory)}
              status={
                totalMemory > 80
                  ? "exception"
                  : totalMemory > 60
                  ? "active"
                  : "success"
              }
              strokeColor={
                totalMemory > 80
                  ? "#f5222d"
                  : totalMemory > 60
                  ? "#faad14"
                  : "#52c41a"
              }
            />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              平均使用率: {totalMemory.toFixed(1)}%
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 节点列表 */}
      <Card title="节点详情" size="small">
        <Row gutter={[8, 8]}>
          {cluster.nodes.map((node) => (
            <Col xs={24} sm={12} md={8} key={node.id}>
              <Card
                size="small"
                style={{
                  backgroundColor:
                    actualTheme === "dark" ? "#1f1f1f" : "#fafafa",
                  border: `1px solid ${
                    actualTheme === "dark" ? "#434343" : "#d9d9d9"
                  }`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <DatabaseOutlined
                    style={{
                      color: node.status === "online" ? "#52c41a" : "#f5222d",
                    }}
                  />                  <Text strong>{node.name}</Text>
                  <Tag
                    color={node.status === "online" ? "green" : "red"}
                  >
                    {node.status}
                  </Tag>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: actualTheme === "dark" ? "#888" : "#666",
                  }}
                >
                  <div>
                    CPU: {node.cpu}% | 内存: {node.memory}%
                  </div>
                  <div>运行时间: {node.uptime}</div>
                  <div>虚拟机: {node.vms.length} 台</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

// VM详情组件
export const VMDetails: React.FC<VMDetailsProps> = ({ vm }) => {
  const { actualTheme } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "#52c41a";
      case "stopped":
        return "#f5222d";
      case "suspended":
        return "#faad14";
      case "error":
        return "#ff4d4f";
      default:
        return "#d9d9d9";
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "qemu" ? <DesktopOutlined /> : <DatabaseOutlined />;
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Title
          level={3}
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {getTypeIcon(vm.type)}
          {vm.name} ({vm.vmid})
          <Tag color={getStatusColor(vm.status)} style={{ marginLeft: "8px" }}>
            {vm.status}
          </Tag>
        </Title>
        <Text type="secondary">虚拟机详情 · {vm.type.toUpperCase()}</Text>
      </div>

      {/* 基本信息 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="基本配置" size="small">
            <Row>
              <Col span={12}>
                <Statistic title="CPU 核心数" value={vm.cpu} suffix="核" />
              </Col>
              <Col span={12}>
                <Statistic title="内存大小" value={vm.memory} suffix="GB" />
              </Col>
            </Row>
            <Divider style={{ margin: "16px 0" }} />
            <Row>
              <Col span={24}>
                <Statistic title="磁盘大小" value={vm.diskSize} suffix="GB" />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="运行状态" size="small">
            <div style={{ marginBottom: "16px" }}>
              <Text strong>物理节点:</Text>
              <Tag style={{ marginLeft: "8px" }}>{vm.node}</Tag>
            </div>
            {vm.uptime && (
              <div style={{ marginBottom: "16px" }}>
                <Text strong>运行时间:</Text>
                <Text style={{ marginLeft: "8px", color: "#52c41a" }}>
                  {vm.uptime}
                </Text>
              </div>
            )}
            <div>
              <Text strong>虚拟机类型:</Text>
              <Tag color="blue" style={{ marginLeft: "8px" }}>
                {vm.type.toUpperCase()}
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细信息面板 */}
      <Card title="详细信息" style={{ marginTop: "16px" }} size="small">
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={8}>
            <div>
              <Text
                strong
                style={{ color: actualTheme === "dark" ? "#fff" : "#000" }}
              >
                虚拟机ID:
              </Text>
              <br />
              <Text>{vm.vmid}</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <Text
                strong
                style={{ color: actualTheme === "dark" ? "#fff" : "#000" }}
              >
                状态:
              </Text>
              <br />
              <Tag color={getStatusColor(vm.status)}>{vm.status}</Tag>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div>
              <Text
                strong
                style={{ color: actualTheme === "dark" ? "#fff" : "#000" }}
              >
                物理节点:
              </Text>
              <br />
              <Text>{vm.node}</Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
