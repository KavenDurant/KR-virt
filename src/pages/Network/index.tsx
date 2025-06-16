import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Tooltip,
  Tabs,
  Statistic,
  Row,
  Col,
  Progress,
  Divider,
  Typography,
  Descriptions,
  InputNumber,
  Switch,
  Drawer,
} from "antd";
import {
  PlusOutlined,
  SyncOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ApiOutlined,
  ApartmentOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudOutlined,
  RocketOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { useTabSync } from "@/hooks/useTabSync";
import ReactFlow, {
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Controls,
  MiniMap,
} from "reactflow";
import type { Node, Edge, Connection } from "reactflow";
import "reactflow/dist/style.css";

const { Content } = Layout;
const { TabPane } = Tabs;
const { Text } = Typography;

// 模拟网络数据
const mockNetworks = [
  {
    id: "1",
    name: "生产网络-VLAN100",
    type: "VLAN",
    vlanId: 100,
    cidr: "10.10.100.0/24",
    gateway: "10.10.100.1",
    dns: ["8.8.8.8", "114.114.114.114"],
    dhcp: true,
    status: "active",
    description: "生产环境主要业务网络",
    usedIps: 168,
    totalIps: 254,
    cluster: "生产环境集群",
    clusterId: "1",
    tags: ["生产", "业务"],
  },
  {
    id: "2",
    name: "管理网络-VLAN200",
    type: "VLAN",
    vlanId: 200,
    cidr: "10.10.200.0/24",
    gateway: "10.10.200.1",
    dns: ["8.8.8.8", "114.114.114.114"],
    dhcp: false,
    status: "active",
    description: "管理网络",
    usedIps: 38,
    totalIps: 254,
    cluster: "生产环境集群",
    clusterId: "1",
    tags: ["管理"],
  },
  {
    id: "3",
    name: "存储网络-VLAN300",
    type: "VLAN",
    vlanId: 300,
    cidr: "10.10.30.0/24",
    gateway: "10.10.30.1",
    dns: ["8.8.8.8", "114.114.114.114"],
    dhcp: false,
    status: "active",
    description: "存储网络",
    usedIps: 15,
    totalIps: 254,
    cluster: "生产环境集群",
    clusterId: "1",
    tags: ["存储", "iSCSI"],
  },
  {
    id: "4",
    name: "测试网络-VLAN400",
    type: "VLAN",
    vlanId: 400,
    cidr: "10.20.100.0/24",
    gateway: "10.20.100.1",
    dns: ["8.8.8.8", "114.114.114.114"],
    dhcp: true,
    status: "active",
    description: "测试环境网络",
    usedIps: 56,
    totalIps: 254,
    cluster: "测试环境集群",
    clusterId: "2",
    tags: ["测试", "开发"],
  },
  {
    id: "5",
    name: "DMZ网络-VLAN500",
    type: "VLAN",
    vlanId: 500,
    cidr: "192.168.10.0/24",
    gateway: "192.168.10.1",
    dns: ["8.8.8.8", "114.114.114.114"],
    dhcp: true,
    status: "active",
    description: "DMZ区域网络",
    usedIps: 28,
    totalIps: 254,
    cluster: "DMZ集群",
    clusterId: "3",
    tags: ["DMZ", "安全"],
  },
  {
    id: "6",
    name: "公网NAT池",
    type: "Public",
    vlanId: null,
    cidr: "203.0.113.0/28",
    gateway: "203.0.113.1",
    dns: ["8.8.8.8", "114.114.114.114"],
    dhcp: false,
    status: "active",
    description: "公网IP地址池",
    usedIps: 12,
    totalIps: 14,
    cluster: null,
    clusterId: null,
    tags: ["公网", "NAT"],
  },
];

// 模拟IP详情数据
const mockIpDetails = [
  {
    ip: "10.10.100.10",
    networkId: "1",
    status: "used",
    macAddress: "52:54:00:12:34:56",
    hostname: "web-server-01",
    vmId: "1",
    description: "生产Web服务器",
  },
  {
    ip: "10.10.100.11",
    networkId: "1",
    status: "used",
    macAddress: "52:54:00:12:34:57",
    hostname: "db-server-01",
    vmId: "2",
    description: "生产数据库服务器",
  },
  {
    ip: "10.10.100.12",
    networkId: "1",
    status: "reserved",
    macAddress: null,
    hostname: null,
    vmId: null,
    description: "预留地址",
  },
]; // 模拟路由表数据
const mockRoutes: Route[] = [
  {
    id: "1",
    destination: "0.0.0.0/0",
    nextHop: "203.0.113.1",
    interface: "eth0",
    metric: 100,
    type: "static",
  },
  {
    id: "2",
    destination: "10.20.0.0/16",
    nextHop: "10.10.100.254",
    interface: "eth1",
    metric: 10,
    type: "static",
  },
  {
    id: "3",
    destination: "192.168.0.0/16",
    nextHop: "10.10.100.254",
    interface: "eth1",
    metric: 10,
    type: "static",
  },
]; // 模拟安全组规则
const mockSecurityRules: SecurityRule[] = [
  {
    id: "1",
    name: "Allow HTTP/HTTPS",
    direction: "ingress",
    protocol: "TCP",
    portRange: "80,443",
    source: "0.0.0.0/0",
    action: "allow",
    priority: 100,
  },
  {
    id: "2",
    name: "Allow SSH",
    direction: "ingress",
    protocol: "TCP",
    portRange: "22",
    source: "10.10.200.0/24",
    action: "allow",
    priority: 110,
  },
  {
    id: "3",
    name: "Block All Other Traffic",
    direction: "ingress",
    protocol: "ALL",
    portRange: "ALL",
    source: "0.0.0.0/0",
    action: "deny",
    priority: 1000,
  },
];

// 定义网络接口类型
interface Network {
  id: string;
  name: string;
  type: string;
  vlanId: number | null;
  cidr: string;
  gateway: string;
  dns: string[];
  dhcp: boolean;
  status: string;
  description: string;
  usedIps: number;
  totalIps: number;
  cluster: string | null;
  clusterId: string | null;
  tags: string[];
}

// 定义IP详情接口类型
interface IPDetail {
  ip: string;
  networkId: string;
  status: string;
  macAddress: string | null;
  hostname: string | null;
  vmId: string | null;
  description: string;
}

// 定义路由接口类型
interface Route {
  id: string;
  destination: string;
  nextHop: string;
  interface: string;
  metric: number;
  type: string;
}

// 定义安全组规则类型
interface SecurityRule {
  id: string;
  name: string;
  direction: string;
  protocol: string;
  portRange: string;
  source: string;
  action: string;
  priority: number;
}

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
        <Tag icon={<ExclamationCircleOutlined />} color="warning">
          未激活
        </Tag>
      );
    case "error":
      return (
        <Tag icon={<WarningOutlined />} color="error">
          错误
        </Tag>
      );
    case "used":
      return <Tag color="blue">已使用</Tag>;
    case "available":
      return <Tag color="green">可用</Tag>;
    case "reserved":
      return <Tag color="orange">已预留</Tag>;
    case "allow":
      return <Tag color="green">允许</Tag>;
    case "deny":
      return <Tag color="red">拒绝</Tag>;
    default:
      return <Tag color="default">{status}</Tag>;
  }
};

const NetworkManagement: React.FC = () => {
  // 使用useTabSync Hook实现tab与URL同步
  const { activeTab, setActiveTab } = useTabSync({ defaultTab: "overview" });
  
  const [networkList, setNetworkList] = useState<Network[]>(mockNetworks);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [networkModalVisible, setNetworkModalVisible] = useState(false);
  const [networkForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [ipDetailsVisible, setIpDetailsVisible] = useState(false);
  const [selectedNetworkIps, setSelectedNetworkIps] = useState<IPDetail[]>([]);

  // 定义拓扑图节点数据
  const initialNodes: Node[] = [
    {
      id: "router",
      type: "default",
      position: { x: 536, y: 124 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <CloudOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
            <div>主路由器</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              IP: 192.168.1.1
            </div>
          </div>
        ),
      },
      style: {
        background: "#fff",
        border: "2px solid #1890ff",
        borderRadius: "8px",
        padding: "10px",
        width: 120,
        height: 80,
      },
    },
    {
      id: "switch-core",
      type: "default",
      position: { x: 408, y: 378 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <ShareAltOutlined style={{ fontSize: "20px", color: "#52c41a" }} />
            <div>核心交换机</div>
            <div style={{ fontSize: "12px", color: "#666" }}>连接所有网络</div>
          </div>
        ),
      },
      style: {
        background: "#fff",
        border: "2px solid #52c41a",
        borderRadius: "8px",
        padding: "8px",
        width: 100,
        height: 70,
      },
    },
    {
      id: "switch-prod",
      type: "default",
      position: { x: 536, y: 378 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <ShareAltOutlined style={{ fontSize: "20px", color: "#52c41a" }} />
            <div>生产交换机</div>
            <div style={{ fontSize: "12px", color: "#666" }}>连接生产网络</div>
          </div>
        ),
      },
      style: {
        background: "#fff",
        border: "2px solid #52c41a",
        borderRadius: "8px",
        padding: "8px",
        width: 100,
        height: 70,
      },
    },
    {
      id: "network-nat",
      type: "default",
      position: { x: 177, y: 280 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <ApartmentOutlined style={{ fontSize: "16px", color: "#722ed1" }} />
            <div>默认网络</div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              NAT | 192.168.122.0/24
            </div>
          </div>
        ),
      },
      style: {
        background: "#fff",
        border: "1px solid #722ed1",
        borderRadius: "6px",
        padding: "6px",
        width: 120,
        height: 60,
      },
    },
    {
      id: "network-prod",
      type: "default",
      position: { x: 496, y: 280 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <ApartmentOutlined style={{ fontSize: "16px", color: "#1890ff" }} />
            <div>生产网络</div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              BRIDGE | 10.0.0.0/24
            </div>
          </div>
        ),
      },
      style: {
        background: "#fff",
        border: "1px solid #1890ff",
        borderRadius: "6px",
        padding: "6px",
        width: 120,
        height: 60,
      },
    },
    {
      id: "network-isolated",
      type: "default",
      position: { x: 810, y: 280 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <ApartmentOutlined style={{ fontSize: "16px", color: "#fa8c16" }} />
            <div>隔离网络</div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              ISOLATED | 192.168.200.0/24
            </div>
          </div>
        ),
      },
      style: {
        background: "#fff",
        border: "1px solid #fa8c16",
        borderRadius: "6px",
        padding: "6px",
        width: 120,
        height: 60,
      },
    },
    {
      id: "network-direct",
      type: "default",
      position: { x: 1135, y: 280 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <ApartmentOutlined style={{ fontSize: "16px", color: "#13c2c2" }} />
            <div>直连网络</div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              DIRECT | 无子网
            </div>
          </div>
        ),
      },
      style: {
        background: "#fff",
        border: "1px solid #13c2c2",
        borderRadius: "6px",
        padding: "6px",
        width: 120,
        height: 60,
      },
    },
    {
      id: "vm-web-01",
      type: "default",
      position: { x: 202, y: 507 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <RocketOutlined style={{ fontSize: "16px", color: "#1890ff" }} />
            <div>Web服务器-01</div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              IP: 192.168.122.101 | 在线
            </div>
          </div>
        ),
      },
      style: {
        background: "#f6ffed",
        border: "1px solid #b7eb8f",
        borderRadius: "6px",
        padding: "6px",
        width: 140,
        height: 60,
      },
    },
    {
      id: "vm-db-02",
      type: "default",
      position: { x: 438, y: 507 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <RocketOutlined style={{ fontSize: "16px", color: "#1890ff" }} />
            <div>数据库服务器-02</div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              IP: 10.0.0.10 | 在线
            </div>
          </div>
        ),
      },
      style: {
        background: "#f6ffed",
        border: "1px solid #b7eb8f",
        borderRadius: "6px",
        padding: "6px",
        width: 140,
        height: 60,
      },
    },
    {
      id: "vm-db-03",
      type: "default",
      position: { x: 848, y: 507 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <RocketOutlined style={{ fontSize: "16px", color: "#1890ff" }} />
            <div>数据库服务器-03</div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              IP: 192.168.200.10 | 在线
            </div>
          </div>
        ),
      },
      style: {
        background: "#f6ffed",
        border: "1px solid #b7eb8f",
        borderRadius: "6px",
        padding: "6px",
        width: 140,
        height: 60,
      },
    },
    {
      id: "vm-test-04",
      type: "default",
      position: { x: 1158, y: 507 },
      data: {
        label: (
          <div style={{ textAlign: "center" }}>
            <RocketOutlined style={{ fontSize: "16px", color: "#1890ff" }} />
            <div>测试服务器-04</div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              IP: 192.168.122.102 | 离线
            </div>
          </div>
        ),
      },
      style: {
        background: "#fff2e8",
        border: "1px solid #ffbb96",
        borderRadius: "6px",
        padding: "6px",
        width: 140,
        height: 60,
      },
    },
  ];

  // 定义拓扑图边数据
  const initialEdges: Edge[] = [
    {
      id: "router-core",
      source: "router",
      target: "switch-core",
      type: "default",
      style: { stroke: "#1890ff", strokeWidth: 2 },
      animated: true,
    },
    {
      id: "router-prod",
      source: "router",
      target: "switch-prod",
      type: "default",
      style: { stroke: "#1890ff", strokeWidth: 2 },
      animated: true,
    },
    {
      id: "core-nat",
      source: "switch-core",
      target: "network-nat",
      type: "default",
      style: { stroke: "#722ed1", strokeWidth: 2, strokeDasharray: "5,5" },
    },
    {
      id: "prod-bridge",
      source: "switch-prod",
      target: "network-prod",
      type: "default",
      style: { stroke: "#1890ff", strokeWidth: 2, strokeDasharray: "5,5" },
    },
    {
      id: "core-isolated",
      source: "switch-core",
      target: "network-isolated",
      type: "default",
      style: { stroke: "#fa8c16", strokeWidth: 2, strokeDasharray: "5,5" },
    },
    {
      id: "core-direct",
      source: "switch-core",
      target: "network-direct",
      type: "default",
      style: { stroke: "#13c2c2", strokeWidth: 2, strokeDasharray: "5,5" },
    },
    {
      id: "nat-web01",
      source: "network-nat",
      target: "vm-web-01",
      type: "default",
      style: { stroke: "#52c41a", strokeWidth: 1 },
    },
    {
      id: "prod-db02",
      source: "network-prod",
      target: "vm-db-02",
      type: "default",
      style: { stroke: "#52c41a", strokeWidth: 1 },
    },
    {
      id: "isolated-db03",
      source: "network-isolated",
      target: "vm-db-03",
      type: "default",
      style: { stroke: "#52c41a", strokeWidth: 1 },
    },
    {
      id: "direct-test04",
      source: "network-direct",
      target: "vm-test-04",
      type: "default",
      style: { stroke: "#ff7875", strokeWidth: 1 },
    },
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // 加载网络数据
  useEffect(() => {
    // 模拟API请求延迟
    setLoading(true);
    setTimeout(() => {
      setNetworkList(mockNetworks);
      setLoading(false);
    }, 500);
  }, []);

  // 处理创建/编辑网络
  const handleNetworkModalOk = () => {
    networkForm.validateFields().then((values: Partial<Network>) => {
      setNetworkModalVisible(false);

      // 如果是编辑现有网络
      if (selectedNetwork) {
        const updatedNetworks = networkList.map((network) =>
          network.id === selectedNetwork.id
            ? ({ ...network, ...values } as Network)
            : network,
        );
        setNetworkList(updatedNetworks);
      } else {
        // 如果是新建网络
        const newNetwork: Network = {
          ...(values as Network),
          id: String(networkList.length + 1),
          status: "active",
          usedIps: 0,
          totalIps: calculateTotalIPs(values.cidr || ""),
        };
        setNetworkList([...networkList, newNetwork]);
      }

      networkForm.resetFields();
      setSelectedNetwork(null);
    });
  };

  // 处理取消创建/编辑网络
  const handleNetworkModalCancel = () => {
    setNetworkModalVisible(false);
    networkForm.resetFields();
    setSelectedNetwork(null);
  };

  // 编辑网络
  const editNetwork = (record: Network) => {
    setSelectedNetwork(record);
    networkForm.setFieldsValue({
      name: record.name,
      type: record.type,
      vlanId: record.vlanId,
      cidr: record.cidr,
      gateway: record.gateway,
      dns: record.dns,
      dhcp: record.dhcp,
      description: record.description,
      cluster: record.cluster,
      clusterId: record.clusterId,
      tags: record.tags,
    });
    setNetworkModalVisible(true);
  };

  // 删除网络
  const deleteNetwork = (id: string) => {
    setNetworkList(networkList.filter((network) => network.id !== id));
  };

  // 查看网络详情
  const viewNetworkDetails = (record: Network) => {
    setSelectedNetwork(record);
    setDetailModalVisible(true);
  };

  // 查看IP详情
  const viewIPDetails = (record: Network) => {
    setSelectedNetwork(record);
    setSelectedNetworkIps(
      mockIpDetails.filter((ip) => ip.networkId === record.id),
    );
    setIpDetailsVisible(true);
  };

  // 计算子网中总IP数量
  const calculateTotalIPs = (cidr: string) => {
    if (!cidr) return 0;
    const parts = cidr.split("/");
    if (parts.length !== 2) return 0;

    const prefix = parseInt(parts[1], 10);
    if (isNaN(prefix)) return 0;

    // 计算主机位数，减2是去掉网络地址和广播地址
    return Math.pow(2, 32 - prefix) - 2;
  };

  // IP使用率计算
  const calculateIPUsagePercent = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  // 网络表格列定义
  const networkColumns = [
    {
      title: "网络名称",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Network) => (
        <a onClick={() => viewNetworkDetails(record)}>{text}</a>
      ),
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
      render: (vlanId: number | null) => (vlanId ? vlanId : "-"),
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
      title: "DHCP",
      dataIndex: "dhcp",
      key: "dhcp",
      render: (dhcp: boolean) =>
        dhcp ? <Tag color="green">开启</Tag> : <Tag color="default">关闭</Tag>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "IP使用率",
      key: "ipUsage",
      render: (_: string, record: Network) => (
        <Tooltip title={`${record.usedIps}/${record.totalIps}`}>
          <Progress
            percent={calculateIPUsagePercent(record.usedIps, record.totalIps)}
            size="small"
            strokeColor={
              calculateIPUsagePercent(record.usedIps, record.totalIps) > 80
                ? "#ff4d4f"
                : calculateIPUsagePercent(record.usedIps, record.totalIps) > 60
                  ? "#faad14"
                  : "#52c41a"
            }
          />
        </Tooltip>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: string, record: Network) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="link"
              onClick={() => viewNetworkDetails(record)}
              icon={<GlobalOutlined />}
            />
          </Tooltip>
          <Tooltip title="IP分配">
            <Button
              type="link"
              onClick={() => viewIPDetails(record)}
              icon={<ApiOutlined />}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              onClick={() => editNetwork(record)}
              icon={<EditOutlined />}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个网络吗?"
            onConfirm={() => deleteNetwork(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // IP详情表格列定义
  const ipColumns = [
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
      title: "MAC地址",
      dataIndex: "macAddress",
      key: "macAddress",
      render: (mac: string | null) => mac || "-",
    },
    {
      title: "主机名",
      dataIndex: "hostname",
      key: "hostname",
      render: (hostname: string | null) => hostname || "-",
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "操作",
      key: "action",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      render: (_: string, _record: IPDetail) => (
        <Space size="middle">
          <Button type="link" size="small">
            编辑
          </Button>
          <Button type="link" size="small" danger>
            释放
          </Button>
        </Space>
      ),
    },
  ];

  // 路由表列定义
  const routeColumns = [
    {
      title: "目标网络",
      dataIndex: "destination",
      key: "destination",
    },
    {
      title: "下一跳",
      dataIndex: "nextHop",
      key: "nextHop",
    },
    {
      title: "接口",
      dataIndex: "interface",
      key: "interface",
    },
    {
      title: "跃点数",
      dataIndex: "metric",
      key: "metric",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) =>
        type === "static" ? (
          <Tag color="blue">静态</Tag>
        ) : (
          <Tag color="green">动态</Tag>
        ),
    },
    {
      title: "操作",
      key: "action",
      render: () => (
        <Space size="middle">
          <Button type="link" size="small">
            编辑
          </Button>
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 安全组规则列定义
  const securityRuleColumns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "方向",
      dataIndex: "direction",
      key: "direction",
      render: (direction: string) =>
        direction === "ingress" ? (
          <Tag color="blue">入站</Tag>
        ) : (
          <Tag color="orange">出站</Tag>
        ),
    },
    {
      title: "协议",
      dataIndex: "protocol",
      key: "protocol",
    },
    {
      title: "端口范围",
      dataIndex: "portRange",
      key: "portRange",
    },
    {
      title: "源/目标",
      dataIndex: "source",
      key: "source",
    },
    {
      title: "动作",
      dataIndex: "action",
      key: "action",
      render: (action: string) => getStatusTag(action),
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
    },
    {
      title: "操作",
      key: "action",
      render: () => (
        <Space size="middle">
          <Button type="link" size="small">
            编辑
          </Button>
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout className="network-management">
      <Content style={{ minHeight: 280 }}>
        <Card
          title={
            <Space>
              <GlobalOutlined />
              <span>网络管理</span>
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setNetworkModalVisible(true)}
              >
                新建网络
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 500);
                }}
              >
                刷新
              </Button>
            </Space>
          }
        >
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="网络概览" key="overview">
              <div className="network-overview">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                      <Statistic
                        title="网络总数"
                        value={networkList.length}
                        prefix={<GlobalOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                      <Statistic
                        title="VLAN网络"
                        value={
                          networkList.filter(
                            (network) => network.type === "VLAN",
                          ).length
                        }
                        prefix={<ApartmentOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                      <Statistic
                        title="公网IP"
                        value={networkList
                          .filter((network) => network.type === "Public")
                          .reduce((acc, curr) => acc + curr.totalIps, 0)}
                        prefix={<CloudOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                      <Statistic
                        title="IP分配率"
                        value={Math.round(
                          (networkList.reduce(
                            (acc, curr) => acc + curr.usedIps,
                            0,
                          ) /
                            networkList.reduce(
                              (acc, curr) => acc + curr.totalIps,
                              0,
                            )) *
                            100,
                        )}
                        suffix="%"
                        prefix={<ApiOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Divider orientation="left">网络使用情况</Divider>

                <Row gutter={[16, 16]}>
                  {networkList.map((network) => (
                    <Col xs={24} sm={12} lg={8} key={network.id}>
                      <Card
                        title={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span>{network.name}</span>
                            {getStatusTag(network.status)}
                          </div>
                        }
                        extra={
                          <a onClick={() => viewNetworkDetails(network)}>
                            详情
                          </a>
                        }
                        style={{ height: "100%" }}
                      >
                        <Row gutter={[16, 8]}>
                          <Col span={12}>
                            <Text type="secondary">类型</Text>
                            <div>{network.type}</div>
                          </Col>
                          <Col span={12}>
                            {network.vlanId !== null && (
                              <>
                                <Text type="secondary">VLAN ID</Text>
                                <div>{network.vlanId}</div>
                              </>
                            )}
                          </Col>
                          <Col span={24}>
                            <Text type="secondary">CIDR</Text>
                            <div>{network.cidr}</div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">网关</Text>
                            <div>{network.gateway}</div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">DHCP</Text>
                            <div>{network.dhcp ? "已开启" : "已关闭"}</div>
                          </Col>
                        </Row>

                        <Divider style={{ margin: "12px 0" }} />

                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "8px",
                            }}
                          >
                            <Text>IP使用率</Text>
                            <Text>
                              {network.usedIps}/{network.totalIps}
                            </Text>
                          </div>
                          <Progress
                            percent={calculateIPUsagePercent(
                              network.usedIps,
                              network.totalIps,
                            )}
                            size="small"
                            strokeColor={
                              calculateIPUsagePercent(
                                network.usedIps,
                                network.totalIps,
                              ) > 80
                                ? "#ff4d4f"
                                : calculateIPUsagePercent(
                                      network.usedIps,
                                      network.totalIps,
                                    ) > 60
                                  ? "#faad14"
                                  : "#52c41a"
                            }
                          />
                        </div>

                        <div style={{ marginTop: "16px" }}>
                          {network.tags.map((tag: string) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </TabPane>

            <TabPane tab="网络列表" key="list">
              <Table
                columns={networkColumns}
                dataSource={networkList}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </TabPane>

            <TabPane tab="路由表" key="routes">
              <Card
                title="路由表"
                extra={
                  <Button type="primary" size="small" icon={<PlusOutlined />}>
                    添加路由
                  </Button>
                }
              >
                <Table
                  columns={routeColumns}
                  dataSource={mockRoutes}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            </TabPane>

            <TabPane tab="安全组规则" key="security">
              <Card
                title="安全组规则"
                extra={
                  <Button type="primary" size="small" icon={<PlusOutlined />}>
                    添加规则
                  </Button>
                }
              >
                <Table
                  columns={securityRuleColumns}
                  dataSource={mockSecurityRules}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            </TabPane>

            <TabPane tab="网络拓扑" key="topology">
              <Card style={{ height: "600px" }}>
                <div style={{ height: "500px", width: "100%" }}>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    connectionMode={ConnectionMode.Loose}
                    fitView
                    attributionPosition="top-right"
                  >
                    <Controls />
                    <MiniMap
                      nodeStrokeColor="#333"
                      nodeColor="#fff"
                      nodeBorderRadius={2}
                      maskColor="rgba(0, 0, 0, 0.1)"
                    />
                    <Background gap={12} size={1} />
                  </ReactFlow>
                </div>
                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        background: "#1890ff",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span>路由器/交换机</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        background: "#722ed1",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span>NAT网络</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        background: "#1890ff",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span>桥接网络</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        background: "#fa8c16",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span>隔离网络</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        background: "#13c2c2",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span>直连网络</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        background: "#52c41a",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span>在线虚拟机</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        background: "#ff7875",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span>离线虚拟机</span>
                  </div>
                </div>
              </Card>
            </TabPane>
          </Tabs>
        </Card>

        {/* 创建/编辑网络的模态框 */}
        <Modal
          title={selectedNetwork ? "编辑网络" : "新建网络"}
          open={networkModalVisible}
          onOk={handleNetworkModalOk}
          onCancel={handleNetworkModalCancel}
          width={700}
          destroyOnHidden
        >
          <Form form={networkForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="网络名称"
                  rules={[{ required: true, message: "请输入网络名称" }]}
                >
                  <Input placeholder="请输入网络名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="网络类型"
                  rules={[{ required: true, message: "请选择网络类型" }]}
                >
                  <Select placeholder="请选择网络类型">
                    <Select.Option value="VLAN">VLAN</Select.Option>
                    <Select.Option value="Public">公网</Select.Option>
                    <Select.Option value="Private">私有网络</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="vlanId"
                  label="VLAN ID"
                  rules={[
                    {
                      required: false,
                      type: "number",
                      min: 1,
                      max: 4094,
                      message: "VLAN ID必须在1-4094之间",
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="请输入VLAN ID (1-4094)"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="clusterId" label="所属集群">
                  <Select placeholder="请选择所属集群">
                    <Select.Option value="1">生产环境集群</Select.Option>
                    <Select.Option value="2">测试环境集群</Select.Option>
                    <Select.Option value="3">DMZ集群</Select.Option>
                    <Select.Option value="4">备份集群</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="cidr"
                  label="CIDR"
                  rules={[
                    { required: true, message: "请输入CIDR" },
                    {
                      pattern:
                        /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))$/,
                      message: "CIDR格式不正确",
                    },
                  ]}
                >
                  <Input placeholder="例如: 192.168.1.0/24" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="gateway"
                  label="网关"
                  rules={[
                    { required: true, message: "请输入网关地址" },
                    {
                      pattern: /^([0-9]{1,3}\.){3}[0-9]{1,3}$/,
                      message: "IP地址格式不正确",
                    },
                  ]}
                >
                  <Input placeholder="例如: 192.168.1.1" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="dns" label="DNS服务器">
                  <Select mode="tags" placeholder="请输入DNS服务器IP地址" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dhcp" label="DHCP" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="描述">
              <Input.TextArea rows={3} placeholder="请输入网络描述" />
            </Form.Item>

            <Form.Item name="tags" label="标签">
              <Select mode="tags" placeholder="请输入标签" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 网络详情模态框 */}
        <Modal
          title={`网络详情: ${selectedNetwork?.name}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={800}
          footer={null}
        >
          {selectedNetwork && (
            <>
              <Descriptions
                title="基本信息"
                bordered
                column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
              >
                <Descriptions.Item label="网络名称">
                  {selectedNetwork.name}
                </Descriptions.Item>
                <Descriptions.Item label="网络类型">
                  {selectedNetwork.type}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {getStatusTag(selectedNetwork.status)}
                </Descriptions.Item>

                {selectedNetwork.vlanId && (
                  <Descriptions.Item label="VLAN ID">
                    {selectedNetwork.vlanId}
                  </Descriptions.Item>
                )}

                <Descriptions.Item label="CIDR">
                  {selectedNetwork.cidr}
                </Descriptions.Item>
                <Descriptions.Item label="网关">
                  {selectedNetwork.gateway}
                </Descriptions.Item>

                <Descriptions.Item label="DHCP">
                  {selectedNetwork.dhcp ? (
                    <Tag color="green">开启</Tag>
                  ) : (
                    <Tag color="default">关闭</Tag>
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="DNS服务器">
                  {selectedNetwork.dns.join(", ")}
                </Descriptions.Item>

                <Descriptions.Item
                  label="IP使用情况"
                  span={selectedNetwork.vlanId ? 1 : 2}
                >
                  <div>
                    <div style={{ marginBottom: "8px" }}>
                      {selectedNetwork.usedIps}/{selectedNetwork.totalIps}(
                      {calculateIPUsagePercent(
                        selectedNetwork.usedIps,
                        selectedNetwork.totalIps,
                      )}
                      %)
                    </div>
                    <Progress
                      percent={calculateIPUsagePercent(
                        selectedNetwork.usedIps,
                        selectedNetwork.totalIps,
                      )}
                      size="small"
                    />
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label="所属集群">
                  {selectedNetwork.cluster || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="描述" span={3}>
                  {selectedNetwork.description}
                </Descriptions.Item>

                <Descriptions.Item label="标签" span={3}>
                  {selectedNetwork.tags.map((tag: string) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Button
                type="primary"
                onClick={() => viewIPDetails(selectedNetwork)}
                icon={<ApiOutlined />}
                style={{ marginRight: "16px" }}
              >
                IP地址分配
              </Button>

              <Button
                onClick={() => editNetwork(selectedNetwork)}
                icon={<EditOutlined />}
              >
                编辑网络
              </Button>
            </>
          )}
        </Modal>

        {/* IP详情抽屉 */}
        <Drawer
          title={`${selectedNetwork?.name} - IP地址分配`}
          placement="right"
          width={800}
          onClose={() => setIpDetailsVisible(false)}
          open={ipDetailsVisible}
          extra={
            <Button type="primary" icon={<PlusOutlined />}>
              分配IP
            </Button>
          }
        >
          {selectedNetwork && (
            <>
              <Descriptions
                bordered
                column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
              >
                <Descriptions.Item label="CIDR">
                  {selectedNetwork.cidr}
                </Descriptions.Item>
                <Descriptions.Item label="网关">
                  {selectedNetwork.gateway}
                </Descriptions.Item>
                <Descriptions.Item label="IP使用率">
                  {selectedNetwork.usedIps}/{selectedNetwork.totalIps}(
                  {calculateIPUsagePercent(
                    selectedNetwork.usedIps,
                    selectedNetwork.totalIps,
                  )}
                  %)
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Table
                columns={ipColumns}
                dataSource={selectedNetworkIps}
                rowKey="ip"
                pagination={{ pageSize: 10 }}
              />
            </>
          )}
        </Drawer>
      </Content>
    </Layout>
  );
};

export default NetworkManagement;
