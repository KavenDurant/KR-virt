import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tooltip,
  Tabs,
  Statistic,
  Row,
  Col,
  Progress,
  Typography,
  Descriptions,
  Alert,
  App,
} from "antd";
import {
  PlusOutlined,
  SyncOutlined,
  ClusterOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ApiOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  HddOutlined,
  MonitorOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import type {
  Cluster as ClusterData,
  Node,
  VirtualMachine as VMData,
} from "../../services/mockData";
import { clusterInitService } from "@/services/cluster";
import type { ClusterNodesResponse } from "@/services/cluster";
import type { ClusterSummaryResponse } from "@/services/cluster";

const { Text } = Typography;

// 定义类型
interface Cluster {
  id: string;
  name: string;
  type: string;
  status: string;
  hosts: number;
  vms: number;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  description: string;
  createTime: string;
  tags: string[];
}

interface Host {
  id: string;
  clusterId: string;
  name: string;
  ip: string;
  status: string;
  cpuCores: number;
  cpuUsage: number;
  memory: string;
  memoryUsage: number;
  vms: number;
}

interface Storage {
  id: string;
  clusterId: string;
  name: string;
  type: string;
  status: string;
  capacity: string;
  used: string;
  usage: number;
}

interface Network {
  id: string;
  clusterId: string;
  name: string;
  type: string;
  vlanId: number;
  cidr: string;
  gateway: string;
  usedIps: number;
  totalIps: number;
}

// 模拟集群数据
const mockClusters: Cluster[] = [
  {
    id: "1",
    name: "生产环境集群",
    type: "KVM",
    status: "running",
    hosts: 5,
    vms: 24,
    cpuUsage: 68,
    memoryUsage: 72,
    storageUsage: 65,
    description: "主要生产工作负载集群",
    createTime: "2025-01-10 08:30:00",
    tags: ["生产", "高可用"],
  },
  {
    id: "2",
    name: "测试环境集群",
    type: "KVM",
    status: "warning",
    hosts: 3,
    vms: 15,
    cpuUsage: 45,
    memoryUsage: 58,
    storageUsage: 40,
    description: "测试和开发环境集群",
    createTime: "2025-02-15 14:20:00",
    tags: ["测试", "开发"],
  },
  {
    id: "3",
    name: "DMZ集群",
    type: "VMware",
    status: "running",
    hosts: 2,
    vms: 8,
    cpuUsage: 30,
    memoryUsage: 42,
    storageUsage: 38,
    description: "DMZ区域隔离集群",
    createTime: "2025-03-22 10:15:00",
    tags: ["DMZ", "隔离"],
  },
  {
    id: "4",
    name: "备份集群",
    type: "Proxmox",
    status: "maintenance",
    hosts: 2,
    vms: 5,
    cpuUsage: 15,
    memoryUsage: 25,
    storageUsage: 60,
    description: "数据备份和灾备集群",
    createTime: "2025-04-05 16:40:00",
    tags: ["备份", "灾备"],
  },
];

// 模拟主机数据
const mockHosts: Host[] = [
  {
    id: "1",
    clusterId: "1",
    name: "host-prod-01",
    ip: "192.168.1.101",
    status: "connected",
    cpuCores: 32,
    cpuUsage: 65,
    memory: "128GB",
    memoryUsage: 70,
    vms: 8,
  },
  {
    id: "2",
    clusterId: "1",
    name: "host-prod-02",
    ip: "192.168.1.102",
    status: "connected",
    cpuCores: 32,
    cpuUsage: 72,
    memory: "128GB",
    memoryUsage: 75,
    vms: 10,
  },
  {
    id: "3",
    clusterId: "1",
    name: "host-prod-03",
    ip: "192.168.1.103",
    status: "connected",
    cpuCores: 32,
    cpuUsage: 68,
    memory: "128GB",
    memoryUsage: 66,
    vms: 6,
  },
  {
    id: "4",
    clusterId: "2",
    name: "host-test-01",
    ip: "192.168.2.101",
    status: "connected",
    cpuCores: 16,
    cpuUsage: 45,
    memory: "64GB",
    memoryUsage: 55,
    vms: 5,
  },
  {
    id: "5",
    clusterId: "2",
    name: "host-test-02",
    ip: "192.168.2.102",
    status: "warning",
    cpuCores: 16,
    cpuUsage: 85,
    memory: "64GB",
    memoryUsage: 90,
    vms: 10,
  },
];

// 模拟存储数据
const mockStorage: Storage[] = [
  {
    id: "1",
    clusterId: "1",
    name: "SAN存储-01",
    type: "SAN",
    status: "active",
    capacity: "20TB",
    used: "12TB",
    usage: 60,
  },
  {
    id: "2",
    clusterId: "1",
    name: "NAS存储-01",
    type: "NAS",
    status: "active",
    capacity: "30TB",
    used: "15TB",
    usage: 50,
  },
  {
    id: "3",
    clusterId: "2",
    name: "测试存储-01",
    type: "iSCSI",
    status: "active",
    capacity: "10TB",
    used: "4TB",
    usage: 40,
  },
];

// 模拟网络数据
const mockNetworks: Network[] = [
  {
    id: "1",
    clusterId: "1",
    name: "VLAN-生产-100",
    type: "VLAN",
    vlanId: 100,
    cidr: "10.10.1.0/24",
    gateway: "10.10.1.1",
    usedIps: 45,
    totalIps: 254,
  },
  {
    id: "2",
    clusterId: "1",
    name: "VLAN-管理-101",
    type: "VLAN",
    vlanId: 101,
    cidr: "10.10.2.0/24",
    gateway: "10.10.2.1",
    usedIps: 28,
    totalIps: 254,
  },
  {
    id: "3",
    clusterId: "2",
    name: "VLAN-测试-200",
    type: "VLAN",
    vlanId: 200,
    cidr: "10.20.1.0/24",
    gateway: "10.20.1.1",
    usedIps: 15,
    totalIps: 254,
  },
];

// 获取状态标签
const getStatusTag = (status: string) => {
  switch (status) {
    case "running":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          运行中
        </Tag>
      );
    case "healthy":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          健康
        </Tag>
      );
    case "warning":
      return (
        <Tag icon={<ExclamationCircleOutlined />} color="warning">
          警告
        </Tag>
      );
    case "maintenance":
      return (
        <Tag icon={<SyncOutlined spin />} color="processing">
          维护中
        </Tag>
      );
    case "error":
      return (
        <Tag icon={<WarningOutlined />} color="error">
          错误
        </Tag>
      );
    case "connected":
      return <Tag color="success">已连接</Tag>;
    case "disconnected":
      return <Tag color="error">已断开</Tag>;
    case "active":
      return <Tag color="success">活跃</Tag>;
    case "online":
      return <Tag color="success">在线</Tag>;
    case "offline":
      return <Tag color="error">离线</Tag>;
    case "stopped":
      return <Tag color="default">已停止</Tag>;
    case "suspended":
      return <Tag color="warning">已挂起</Tag>;
    case "standby":
      return <Tag color="orange">待机</Tag>;
    case "started":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          已启动
        </Tag>
      );
    case "failed":
      return (
        <Tag icon={<WarningOutlined />} color="error">
          失败
        </Tag>
      );
    case "inactive":
      return <Tag color="default">未激活</Tag>;
    default:
      return <Tag color="default">{status}</Tag>;
  }
};

const ClusterManagement: React.FC = () => {
  const { modal, message } = App.useApp();
  const [activeTab, setActiveTab] = useState("overview");
  const [clusterList, setClusterList] = useState(mockClusters);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterModalVisible, setClusterModalVisible] = useState(false);
  const [clusterForm] = Form.useForm();
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 真实集群数据状态
  const [realClusterData, setRealClusterData] =
    useState<ClusterNodesResponse | null>(null);
  const [realClusterLoading, setRealClusterLoading] = useState(false);
  const [realClusterError, setRealClusterError] = useState<string | null>(null);

  // 集群概览数据状态
  const [clusterSummaryData, setClusterSummaryData] =
    useState<ClusterSummaryResponse | null>(null);
  const [clusterSummaryLoading, setClusterSummaryLoading] = useState(false);
  const [clusterSummaryError, setClusterSummaryError] = useState<string | null>(
    null
  );

  // 侧边栏选择的节点状态
  const [sidebarSelectedCluster, setSidebarSelectedCluster] =
    useState<ClusterData | null>(null);
  const [sidebarSelectedHost, setSidebarSelectedHost] = useState<Node | null>(
    null
  );
  const [sidebarSelectedVM, setSidebarSelectedVM] = useState<VMData | null>(
    null
  );

  // 监听侧边栏选择事件
  useEffect(() => {
    const handleSidebarSelect = (event: CustomEvent) => {
      const { nodeType, nodeData } = event.detail;
      console.log("集群页面收到侧边栏选择事件:", { nodeType, nodeData });

      // 清空所有选择状态
      setSidebarSelectedCluster(null);
      setSidebarSelectedHost(null);
      setSidebarSelectedVM(null);

      // 处理不同类型的节点选择
      if (nodeType === "cluster") {
        // 选中集群时，不设置 sidebarSelectedCluster，让它显示默认的集群管理页面
        // setSidebarSelectedCluster(nodeData as ClusterData);
      } else if (nodeType === "host") {
        setSidebarSelectedHost(nodeData as Node);
      } else if (nodeType === "vm") {
        setSidebarSelectedVM(nodeData as VMData);
      }
    };

    window.addEventListener(
      "hierarchical-sidebar-select",
      handleSidebarSelect as EventListener
    );

    return () => {
      window.removeEventListener(
        "hierarchical-sidebar-select",
        handleSidebarSelect as EventListener
      );
    };
  }, []);

  // 获取进度条颜色的函数
  const getProgressColor = (percent: number) => {
    if (percent > 80) return "#ff4d4f"; // 保留语义颜色：危险/错误
    if (percent > 60) return "#faad14"; // 保留语义颜色：警告
    return "#52c41a"; // 保留语义颜色：成功/正常
  };

  // 获取真实集群数据
  const fetchRealClusterData = useCallback(async () => {
    setRealClusterLoading(true);
    setRealClusterError(null);
    try {
      const result = await clusterInitService.getClusterNodes();
      if (result.success && result.data) {
        setRealClusterData(result.data);
        console.log("获取集群节点数据成功:", result.data);
      } else {
        console.error("获取集群节点数据失败:", result.message);
        setRealClusterError(result.message);
        message.error(result.message);
      }
    } catch (error) {
      console.error("获取集群节点数据异常:", error);
      const errorMessage = "获取集群数据失败，请稍后重试";
      setRealClusterError(errorMessage);
      message.error(errorMessage);
    } finally {
      setRealClusterLoading(false);
    }
  }, [message, setRealClusterData, setRealClusterLoading, setRealClusterError]);

  // 获取集群概览数据
  const fetchClusterSummaryData = useCallback(async () => {
    setClusterSummaryLoading(true);
    setClusterSummaryError(null);
    try {
      const result = await clusterInitService.getClusterSummary();
      if (result.success && result.data) {
        setClusterSummaryData(result.data);
        console.log("获取集群概览数据成功:", result.data);
      } else {
        console.error("获取集群概览数据失败:", result.message);
        setClusterSummaryError(result.message);
        message.error(result.message);
      }
    } catch (error) {
      console.error("获取集群概览数据异常:", error);
      const errorMessage = "获取集群概览数据失败，请稍后重试";
      setClusterSummaryError(errorMessage);
      message.error(errorMessage);
    } finally {
      setClusterSummaryLoading(false);
    }
  }, [
    message,
    setClusterSummaryData,
    setClusterSummaryLoading,
    setClusterSummaryError,
  ]);

  // 加载集群数据
  useEffect(() => {
    // 模拟API请求延迟
    setTimeout(() => {
      setClusterList(mockClusters);
    }, 500);

    // 获取真实集群数据
    fetchRealClusterData();

    // 获取集群概览数据
    fetchClusterSummaryData();
  }, [fetchRealClusterData, fetchClusterSummaryData]);

  // 处理创建/编辑集群
  const handleClusterModalOk = () => {
    clusterForm.validateFields().then((values) => {
      setClusterModalVisible(false);

      // 如果是编辑现有集群
      if (selectedCluster) {
        const updatedClusters = clusterList.map((cluster) =>
          cluster.id === selectedCluster.id
            ? { ...cluster, ...values }
            : cluster
        );
        setClusterList(updatedClusters);
      } else {
        // 如果是新建集群
        const newCluster = {
          ...values,
          id: String(clusterList.length + 1),
          status: "running",
          hosts: 0,
          vms: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          storageUsage: 0,
          createTime: new Date().toLocaleString(),
        };
        setClusterList([...clusterList, newCluster]);
      }
      clusterForm.resetFields();
      setSelectedCluster(null);
    });
  };

  // 处理取消创建/编辑集群
  const handleClusterModalCancel = () => {
    setClusterModalVisible(false);
    clusterForm.resetFields();
    setSelectedCluster(null);
  };

  // 解散集群
  const handleDissolveCluster = () => {
    modal.confirm({
      title: "确认解散集群",
      content: "此操作将解散当前集群，所有数据将被清除。确定要继续吗？",
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          console.log("开始调用解散集群API...");
          const result = await clusterInitService.dissolveCluster();
          console.log("解散集群API返回结果:", result);

          if (result.success) {
            console.log("解散集群成功，显示成功消息:", result.message);
            message.success(result.message);
            // 刷新集群列表 - 这里可以添加具体的刷新逻辑
          } else {
            console.log("解散集群失败，显示错误消息:", result.message);
            message.error(result.message);
          }
        } catch (error) {
          console.error("解散集群异常:", error);
          message.error("解散集群失败，请稍后重试");
        }
      },
    });
  };

  // 集群详情模态框内的主机表格列定义
  const hostColumns = [
    {
      title: "主机名",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "IP地址",
      dataIndex: "ip",
      key: "ip",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "CPU核心数",
      dataIndex: "cpuCores",
      key: "cpuCores",
    },
    {
      title: "CPU使用率",
      dataIndex: "cpuUsage",
      key: "cpuUsage",
      render: (percent: number) => (
        <Progress
          percent={percent}
          size="small"
          strokeColor={getProgressColor(percent)}
        />
      ),
    },
    {
      title: "内存",
      dataIndex: "memory",
      key: "memory",
    },
    {
      title: "内存使用率",
      dataIndex: "memoryUsage",
      key: "memoryUsage",
      render: (percent: number) => (
        <Progress
          percent={percent}
          size="small"
          strokeColor={getProgressColor(percent)}
        />
      ),
    },
    {
      title: "虚拟机数",
      dataIndex: "vms",
      key: "vms",
    },
  ];

  // 存储表格列定义
  const storageColumns = [
    {
      title: "存储名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "总容量",
      dataIndex: "capacity",
      key: "capacity",
    },
    {
      title: "已使用",
      dataIndex: "used",
      key: "used",
    },
    {
      title: "使用率",
      dataIndex: "usage",
      key: "usage",
      render: (percent: number) => (
        <Progress
          percent={percent}
          size="small"
          strokeColor={getProgressColor(percent)}
        />
      ),
    },
  ];

  // 网络表格列定义
  const networkColumns = [
    {
      title: "网络名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "VLAN ID",
      dataIndex: "vlanId",
      key: "vlanId",
    },
    {
      title: "CIDR",
      dataIndex: "cidr",
      key: "cidr",
    },
    {
      title: "网关",
      dataIndex: "gateway",
      key: "gateway",
    },
    {
      title: "IP使用率",
      key: "ipUsage",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: string, record: any) => (
        <Tooltip title={`${record.usedIps}/${record.totalIps}`}>
          <Progress
            percent={Math.round((record.usedIps / record.totalIps) * 100)}
            size="small"
          />
        </Tooltip>
      ),
    },
  ];

  // 真实集群节点列表的表格列定义
  const realClusterNodesColumns = [
    {
      title: "节点名称",
      dataIndex: "name",
      key: "name",
      render: (
        name: string,
        record: { node_id: string; name: string; ip: string }
      ) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{name}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            ID: {record.node_id}
          </div>
        </div>
      ),
    },
    {
      title: "节点ID",
      dataIndex: "node_id",
      key: "node_id",
    },
    {
      title: "IP地址",
      dataIndex: "ip",
      key: "ip",
      render: (ip: string) => <Tag color="blue">{ip}</Tag>,
    },
    {
      title: "状态",
      key: "status",
      render: () => (
        <Tag icon={<CheckCircleOutlined />} color="success">
          在线
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (
        _: unknown,
        record: { node_id: string; name: string; ip: string }
      ) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => message.info(`查看节点 ${record.name} 详情`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<MonitorOutlined />}
            onClick={() => message.info(`监控节点 ${record.name}`)}
          >
            监控
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ApiOutlined />}
            onClick={() => message.info(`管理节点 ${record.name}`)}
          >
            管理
          </Button>
        </Space>
      ),
    },
  ];

  // 如果从侧边栏选中了集群，显示集群详情
  if (sidebarSelectedCluster) {
    console.log("显示集群详情:", sidebarSelectedCluster);
    const clusterDetailTabs = [
      {
        key: "basic",
        label: "基本信息",
        children: (
          <div>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="集群配置" size="small">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="集群名称">
                      {sidebarSelectedCluster.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="集群类型">
                      {sidebarSelectedCluster.type}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      {getStatusTag(sidebarSelectedCluster.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="物理主机数量">
                      {sidebarSelectedCluster.nodes.length} 台
                    </Descriptions.Item>
                    <Descriptions.Item label="虚拟机总数">
                      {sidebarSelectedCluster.nodes.reduce(
                        (acc, node) => acc + node.vms.length,
                        0
                      )}{" "}
                      台
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="资源统计" size="small">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="平均CPU使用率"
                        value={Math.round(
                          sidebarSelectedCluster.nodes.reduce(
                            (acc, node) => acc + node.cpu,
                            0
                          ) / sidebarSelectedCluster.nodes.length
                        )}
                        suffix="%"
                        prefix={<ThunderboltOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="平均内存使用率"
                        value={Math.round(
                          sidebarSelectedCluster.nodes.reduce(
                            (acc, node) => acc + node.memory,
                            0
                          ) / sidebarSelectedCluster.nodes.length
                        )}
                        suffix="%"
                        prefix={<DatabaseOutlined />}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </div>
        ),
      },
      {
        key: "hosts",
        label: "物理主机",
        children: (
          <div>
            <Card title="物理主机列表" size="small">
              <Table
                size="small"
                dataSource={sidebarSelectedCluster.nodes}
                columns={[
                  {
                    title: "主机名称",
                    dataIndex: "name",
                    key: "name",
                    render: (name: string, record: Node) => (
                      <div>
                        <div style={{ fontWeight: "bold" }}>{name}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          ID: {record.id}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "状态",
                    dataIndex: "status",
                    key: "status",
                    render: (status: string) => getStatusTag(status),
                  },
                  {
                    title: "CPU使用率",
                    dataIndex: "cpu",
                    key: "cpu",
                    render: (cpu: number) => (
                      <Progress
                        percent={cpu}
                        size="small"
                        strokeColor={getProgressColor(cpu)}
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
                        strokeColor={getProgressColor(memory)}
                      />
                    ),
                  },
                  {
                    title: "虚拟机数量",
                    key: "vmCount",
                    render: (_, record: Node) => `${record.vms.length} 台`,
                  },
                  {
                    title: "运行时间",
                    dataIndex: "uptime",
                    key: "uptime",
                  },
                ]}
                pagination={false}
              />
            </Card>
          </div>
        ),
      },
      {
        key: "vms",
        label: "虚拟机",
        children: (
          <div>
            <Card title="虚拟机列表" size="small">
              <Table
                size="small"
                dataSource={sidebarSelectedCluster.nodes.flatMap((node) =>
                  node.vms.map((vm) => ({ ...vm, nodeName: node.name }))
                )}
                columns={[
                  {
                    title: "虚拟机名称",
                    dataIndex: "name",
                    key: "name",
                    render: (
                      name: string,
                      record: VMData & { nodeName?: string }
                    ) => (
                      <div>
                        <div style={{ fontWeight: "bold" }}>{name}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          ID: {record.vmid} | 主机:{" "}
                          {record.nodeName || record.node}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: "状态",
                    dataIndex: "status",
                    key: "status",
                    render: (status: string) => getStatusTag(status),
                  },
                  {
                    title: "配置",
                    key: "config",
                    render: (_, record: VMData) => (
                      <div style={{ fontSize: "12px" }}>
                        <div>CPU: {record.cpu}核</div>
                        <div>内存: {record.memory}GB</div>
                        <div>磁盘: {record.diskSize}GB</div>
                      </div>
                    ),
                  },
                  {
                    title: "运行时间",
                    dataIndex: "uptime",
                    key: "uptime",
                    render: (uptime: string) => uptime || "未运行",
                  },
                ]}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </div>
        ),
      },
    ];

    return (
      <div>
        <Card
          title={
            <Space>
              <ClusterOutlined />
              <span>集群详情 - {sidebarSelectedCluster.name}</span>
              {getStatusTag(sidebarSelectedCluster.status)}
            </Space>
          }
          extra={
            <Space>
              <Button
                onClick={() => {
                  setSidebarSelectedCluster(null);
                }}
              >
                返回集群管理
              </Button>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={() => message.info("正在刷新集群信息...")}
              >
                刷新状态
              </Button>
              <Button
                icon={<MonitorOutlined />}
                onClick={() => message.info("正在打开集群监控...")}
              >
                监控
              </Button>
            </Space>
          }
        >
          <Tabs items={clusterDetailTabs} />
        </Card>
      </div>
    );
  }

  // 如果从侧边栏选中了物理主机，显示主机详情
  if (sidebarSelectedHost) {
    const hostDetailTabs = [
      {
        key: "basic",
        label: "基本信息",
        children: (
          <div>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="主机配置" size="small">
                  <Row>
                    <Col span={12}>
                      <Statistic
                        title="CPU 使用率"
                        value={sidebarSelectedHost.cpu}
                        suffix="%"
                        valueStyle={{
                          color:
                            sidebarSelectedHost.cpu > 80
                              ? "#ff4d4f"
                              : "#3f8600",
                        }}
                        prefix={<ThunderboltOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="内存使用率"
                        value={sidebarSelectedHost.memory}
                        suffix="%"
                        valueStyle={{
                          color:
                            sidebarSelectedHost.memory > 80
                              ? "#ff4d4f"
                              : "#3f8600",
                        }}
                        prefix={<DatabaseOutlined />}
                      />
                    </Col>
                  </Row>
                  <div style={{ margin: "16px 0" }}>
                    <Row>
                      <Col span={24}>
                        <Statistic
                          title="虚拟机数量"
                          value={sidebarSelectedHost.vms.length}
                          suffix="台"
                          prefix={<DesktopOutlined />}
                        />
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="运行状态" size="small">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="主机名">
                      {sidebarSelectedHost.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="主机ID">
                      {sidebarSelectedHost.id}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      {getStatusTag(sidebarSelectedHost.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="主机类型">
                      {sidebarSelectedHost.type}
                    </Descriptions.Item>
                    <Descriptions.Item label="运行时间">
                      {sidebarSelectedHost.uptime}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>
          </div>
        ),
      },
      {
        key: "performance",
        label: "性能监控",
        children: (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="CPU 使用率"
                    value={sidebarSelectedHost.cpu}
                    precision={0}
                    valueStyle={{
                      color:
                        sidebarSelectedHost.cpu > 80 ? "#ff4d4f" : "#3f8600",
                    }}
                    prefix={<ThunderboltOutlined />}
                    suffix="%"
                  />
                  <Progress percent={sidebarSelectedHost.cpu} size="small" />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="内存使用率"
                    value={sidebarSelectedHost.memory}
                    precision={0}
                    valueStyle={{
                      color:
                        sidebarSelectedHost.memory > 80 ? "#ff4d4f" : "#3f8600",
                    }}
                    prefix={<DatabaseOutlined />}
                    suffix="%"
                  />
                  <Progress percent={sidebarSelectedHost.memory} size="small" />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="虚拟机数量"
                    value={sidebarSelectedHost.vms.length}
                    prefix={<DesktopOutlined />}
                    suffix="台"
                  />
                </Card>
              </Col>
            </Row>
          </div>
        ),
      },
    ];

    return (
      <div>
        <Card
          title={
            <Space>
              <HddOutlined />
              <span>物理主机详情 - {sidebarSelectedHost.name}</span>
              {getStatusTag(sidebarSelectedHost.status)}
            </Space>
          }
          extra={
            <Space>
              <Button
                onClick={() => {
                  setSidebarSelectedHost(null);
                }}
              >
                返回集群管理
              </Button>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={() => message.info("正在刷新主机信息...")}
              >
                刷新状态
              </Button>
              <Button
                icon={<MonitorOutlined />}
                onClick={() => message.info("正在打开主机控制台...")}
              >
                控制台
              </Button>
            </Space>
          }
        >
          <Tabs items={hostDetailTabs} />
        </Card>
      </div>
    );
  }

  // 如果从侧边栏选中了虚拟机，显示虚拟机详情
  if (sidebarSelectedVM) {
    const vmDetailTabs = [
      {
        key: "basic",
        label: "基本信息",
        children: (
          <div>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="基本配置" size="small">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="虚拟机名称">
                      {sidebarSelectedVM.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="虚拟机ID">
                      {sidebarSelectedVM.vmid}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      {getStatusTag(sidebarSelectedVM.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="类型">
                      {sidebarSelectedVM.type.toUpperCase()}
                    </Descriptions.Item>
                    <Descriptions.Item label="物理节点">
                      {sidebarSelectedVM.node}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title="硬件配置" size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="CPU 核心数"
                        value={sidebarSelectedVM.cpu}
                        suffix="核"
                        prefix={<ThunderboltOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="内存大小"
                        value={sidebarSelectedVM.memory}
                        suffix="GB"
                        prefix={<DatabaseOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="磁盘大小"
                        value={sidebarSelectedVM.diskSize}
                        suffix="GB"
                        prefix={<HddOutlined />}
                      />
                    </Col>
                  </Row>
                  {sidebarSelectedVM.uptime && (
                    <div style={{ marginTop: "16px" }}>
                      <Statistic
                        title="运行时间"
                        value={sidebarSelectedVM.uptime}
                      />
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        ),
      },
      {
        key: "operations",
        label: "操作日志",
        children: (
          <Alert
            message="虚拟机操作日志"
            description="此功能将显示虚拟机的操作日志和系统事件记录。"
            type="info"
            showIcon
          />
        ),
      },
    ];

    return (
      <div>
        <Card
          title={
            <Space>
              <DesktopOutlined />
              <span>虚拟机详情 - {sidebarSelectedVM.name}</span>
              {getStatusTag(sidebarSelectedVM.status)}
            </Space>
          }
          extra={
            <Space>
              <Button
                onClick={() => {
                  setSidebarSelectedVM(null);
                }}
              >
                返回集群管理
              </Button>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={() => message.info("正在刷新虚拟机信息...")}
              >
                刷新状态
              </Button>
              <Button
                icon={<MonitorOutlined />}
                onClick={() => message.info("正在打开虚拟机控制台...")}
              >
                控制台
              </Button>
            </Space>
          }
        >
          <Tabs items={vmDetailTabs} />
        </Card>
      </div>
    );
  }

  // 只有在选择了主机或虚拟机时才不显示默认的集群管理页面
  if (sidebarSelectedHost || sidebarSelectedVM) {
    return null; // 这种情况已经在上面的条件中处理了
  }      return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <ClusterOutlined />
          <span>集群管理</span>
        </h3>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setClusterModalVisible(true)}
          >
            新建集群
          </Button>
          <Button
            type="primary"
            danger
            icon={<ExclamationCircleOutlined />}
            onClick={handleDissolveCluster}
          >
            解散集群
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={() => {
              fetchRealClusterData(); // 刷新真实集群数据
              fetchClusterSummaryData(); // 刷新集群概览数据
            }}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "overview",
            label: "集群概览",
            children: (
              <div className="cluster-overview">
                {clusterSummaryLoading ? (
                  <div style={{ textAlign: "center", padding: "50px" }}>
                    <SyncOutlined spin style={{ fontSize: "24px" }} />
                    <div style={{ marginTop: "16px" }}>
                      加载集群概览数据中...
                    </div>
                  </div>
                ) : clusterSummaryError ? (
                  <div style={{ textAlign: "center", padding: "50px" }}>
                    <Alert
                      message="获取集群概览数据失败"
                      description={clusterSummaryError}
                      type="error"
                      showIcon
                      action={
                        <Button
                          type="primary"
                          onClick={fetchClusterSummaryData}
                          icon={<SyncOutlined />}
                        >
                          重新加载
                        </Button>
                      }
                    />
                  </div>
                ) : clusterSummaryData ? (
                  <>
                    {/* 集群基本信息 */}
                    <Card
                      title="集群基本信息"
                      style={{ marginBottom: "16px" }}
                      extra={
                        <Button
                          icon={<SyncOutlined />}
                          onClick={fetchClusterSummaryData}
                          size="small"
                        >
                          刷新
                        </Button>
                      }
                    >
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="集群名称">
                              {clusterSummaryData.cluster_name}
                            </Descriptions.Item>
                            <Descriptions.Item label="技术栈">
                              {clusterSummaryData.stack}
                            </Descriptions.Item>
                            <Descriptions.Item label="DC节点">
                              {clusterSummaryData.dc_node}
                            </Descriptions.Item>
                            <Descriptions.Item label="DC版本">
                              {clusterSummaryData.dc_version}
                            </Descriptions.Item>
                            <Descriptions.Item label="仲裁状态">
                              {clusterSummaryData.dc_quorum}
                            </Descriptions.Item>
                          </Descriptions>
                        </Col>
                        <Col xs={24} md={12}>
                          <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="最后更新">
                              {clusterSummaryData.last_updated}
                            </Descriptions.Item>
                            <Descriptions.Item label="最后变更时间">
                              {clusterSummaryData.last_change_time}
                            </Descriptions.Item>
                            <Descriptions.Item label="变更用户">
                              {clusterSummaryData.last_change_user}
                            </Descriptions.Item>
                            <Descriptions.Item label="变更方式">
                              {clusterSummaryData.last_change_via}
                            </Descriptions.Item>
                            <Descriptions.Item label="变更节点">
                              {clusterSummaryData.last_change_node}
                            </Descriptions.Item>
                          </Descriptions>
                        </Col>
                      </Row>
                    </Card>

                    {/* 统计信息 */}
                    <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
                      <Col xs={24} sm={8} md={6}>
                        <Card>
                          <Statistic
                            title="配置节点数"
                            value={clusterSummaryData.nodes_configured}
                            prefix={<ClusterOutlined />}
                            valueStyle={{ color: "#1890ff" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8} md={6}>
                        <Card>
                          <Statistic
                            title="在线节点数"
                            value={
                              clusterSummaryData.nodes.filter(
                                (node) => node.status === "online"
                              ).length
                            }
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8} md={6}>
                        <Card>
                          <Statistic
                            title="配置资源数"
                            value={clusterSummaryData.resources_configured}
                            prefix={<DatabaseOutlined />}
                            valueStyle={{ color: "#722ed1" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8} md={6}>
                        <Card>
                          <Statistic
                            title="运行资源数"
                            value={
                              clusterSummaryData.resources.filter(
                                (resource) => resource.status === "started"
                              ).length
                            }
                            prefix={<ThunderboltOutlined />}
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* 节点列表 */}
                    <Card title="集群节点" style={{ marginBottom: "16px" }}>
                      <Table
                        dataSource={clusterSummaryData.nodes}
                        rowKey="name"
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: "节点名称",
                            dataIndex: "name",
                            key: "name",
                            render: (name: string) => (
                              <Space>
                                <HddOutlined />
                                <strong>{name}</strong>
                              </Space>
                            ),
                          },
                          {
                            title: "状态",
                            dataIndex: "status",
                            key: "status",
                            render: (status: string) =>
                              getStatusTag(status),
                          },
                        ]}
                      />
                    </Card>

                    {/* 资源列表 */}
                    <Card title="集群资源">
                      <Table
                        dataSource={clusterSummaryData.resources}
                        rowKey="name"
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: "资源名称",
                            dataIndex: "name",
                            key: "name",
                            render: (name: string) => (
                              <Space>
                                <ApiOutlined />
                                <strong>{name}</strong>
                              </Space>
                            ),
                          },
                          {
                            title: "类型",
                            dataIndex: "type",
                            key: "type",
                            render: (type: string) => (
                              <Tag color="blue">{type}</Tag>
                            ),
                          },
                          {
                            title: "状态",
                            dataIndex: "status",
                            key: "status",
                            render: (status: string) =>
                              getStatusTag(status),
                          },
                          {
                            title: "运行节点",
                            dataIndex: "node",
                            key: "node",
                            render: (node: string) => (
                              <Tag color="geekblue">{node}</Tag>
                            ),
                          },
                        ]}
                      />
                    </Card>

                    {/* 守护进程状态 */}
                    <Card
                      title="守护进程状态"
                      style={{ marginTop: "16px" }}
                    >
                      <Row gutter={[16, 16]}>
                        {Object.entries(clusterSummaryData.daemons).map(
                          ([daemon, status]) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={daemon}>
                              <Card size="small">
                                <Space
                                  direction="vertical"
                                  style={{ width: "100%" }}
                                >
                                  <Text strong>{daemon}</Text>
                                  {getStatusTag(status)}
                                </Space>
                              </Card>
                            </Col>
                          )
                        )}
                      </Row>
                    </Card>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "50px" }}>
                    <Alert
                      message="暂无集群概览数据"
                      description="请检查集群是否正常运行"
                      type="info"
                      showIcon
                    />
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "list",
            label: "物理机列表",
            children: (
              <div>
                {realClusterLoading ? (
                  <div style={{ textAlign: "center", padding: "50px" }}>
                    <SyncOutlined spin style={{ fontSize: "24px" }} />
                    <div style={{ marginTop: "16px" }}>
                      加载物理机数据中...
                    </div>
                  </div>
                ) : realClusterError ? (
                  <div style={{ textAlign: "center", padding: "50px" }}>
                    <Alert
                      message="获取物理机数据失败"
                      description={realClusterError}
                      type="error"
                      showIcon
                      action={
                        <Button
                          type="primary"
                          onClick={fetchRealClusterData}
                          icon={<SyncOutlined />}
                        >
                          重新加载
                        </Button>
                      }
                    />
                  </div>
                ) : realClusterData && realClusterData.nodes.length > 0 ? (
                  <div>
                    <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
                      <Col xs={24} sm={8}>
                        <Card size="small">
                          <Statistic
                            title="物理机总数"
                            value={realClusterData.nodes.length}
                            prefix={<HddOutlined />}
                            valueStyle={{ color: "#1890ff" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Card size="small">
                          <Statistic
                            title="在线节点"
                            value={realClusterData.nodes.length}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={8}>
                        <Card size="small">
                          <Statistic
                            title="集群状态"
                            value="正常运行"
                            prefix={<ClusterOutlined />}
                            valueStyle={{ color: "#52c41a" }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    <Card title="物理机节点列表" size="small">
                      <Table
                        columns={realClusterNodesColumns}
                        dataSource={realClusterData.nodes}
                        rowKey="node_id"
                        loading={realClusterLoading}
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (total, range) =>
                            `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                        }}
                        scroll={{ x: 800 }}
                      />
                    </Card>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "50px" }}>
                    <Alert
                      message="暂无物理机数据"
                      description="点击下方按钮获取最新的物理机节点信息"
                      type="info"
                      showIcon
                      action={
                        <Button
                          type="primary"
                          onClick={fetchRealClusterData}
                          icon={<SyncOutlined />}
                        >
                          获取数据
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
            
      {/* 创建/编辑集群的模态框 */}
      <Modal
        title={selectedCluster ? "编辑集群" : "新建集群"}
        open={clusterModalVisible}
        onOk={handleClusterModalOk}
        onCancel={handleClusterModalCancel}
        destroyOnHidden
      >
        <Form form={clusterForm} layout="vertical">
          <Form.Item
            name="name"
            label="集群名称"
            rules={[{ required: true, message: "请输入集群名称" }]}
          >
            <Input placeholder="请输入集群名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="集群类型"
            rules={[{ required: true, message: "请选择集群类型" }]}
          >
            <Select placeholder="请选择集群类型">
              <Select.Option value="KVM">KVM</Select.Option>
              <Select.Option value="VMware">VMware</Select.Option>
              <Select.Option value="Proxmox">Proxmox</Select.Option>
              <Select.Option value="Hyper-V">Hyper-V</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="集群描述">
            <Input.TextArea rows={3} placeholder="请输入集群描述" />
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="请输入标签" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 集群详情模态框 */}
      <Modal
        title={`集群详情: ${selectedCluster?.name}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={1000}
        footer={null}
      >
        {selectedCluster && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="状态"
                        value={
                          selectedCluster.status === "running"
                            ? "运行中"
                            : selectedCluster.status
                        }
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="主机数量"
                        value={selectedCluster.hosts}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="虚拟机数量"
                        value={selectedCluster.vms}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="创建时间"
                        value={selectedCluster.createTime}
                      />
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginTop: "20px" }}>
                    <Col span={8}>
                      <div>
                        <Text strong>CPU使用率</Text>
                        <Progress
                          percent={selectedCluster.cpuUsage}
                          status="active"
                        />
                      </div>
                    </Col>
                    <Col span={8}>
                      <div>
                        <Text strong>内存使用率</Text>
                        <Progress
                          percent={selectedCluster.memoryUsage}
                          status="active"
                        />
                      </div>
                    </Col>
                    <Col span={8}>
                      <div>
                        <Text strong>存储使用率</Text>
                        <Progress
                          percent={selectedCluster.storageUsage}
                          status="active"
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Tabs
              style={{ marginTop: "20px" }}
              items={[
                {
                  key: "hosts",
                  label: "主机",
                  children: (
                    <Table
                      columns={hostColumns}
                      dataSource={mockHosts.filter(
                        (host) => host.clusterId === selectedCluster.id
                      )}
                      rowKey="id"
                      pagination={false}
                    />
                  ),
                },
                {
                  key: "storage",
                  label: "存储",
                  children: (
                    <Table
                      columns={storageColumns}
                      dataSource={mockStorage.filter(
                        (storage) => storage.clusterId === selectedCluster.id
                      )}
                      rowKey="id"
                      pagination={false}
                    />
                  ),
                },
                {
                  key: "network",
                  label: "网络",
                  children: (
                    <Table
                      columns={networkColumns}
                      dataSource={mockNetworks.filter(
                        (network) => network.clusterId === selectedCluster.id
                      )}
                      rowKey="id"
                      pagination={false}
                    />
                  ),
                },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default ClusterManagement;
