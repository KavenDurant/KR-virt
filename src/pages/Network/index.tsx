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
  Divider,
  Typography,
  Descriptions,
  InputNumber,
  Drawer,
  Spin,
  App,
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
} from "@ant-design/icons";
// 导入网络拓扑图组件
import { NetworkTopology } from "./components";
// 导入网络服务
import {
  getNetworkConfig,
  getNodeNetworks,
  createNetwork as createNetworkAPI,
  deleteNetwork as deleteNetworkAPI,
  getNetworkTopology,
} from "@/services/network";
import type {
  Network,
  IPDetail,
  Route,
  SecurityRule,
  CreateNetworkRequest,
  NodeNetwork,
  NetworkTopologyResponse,
} from "@/services/network/types";
// 导入集群服务
import { clusterInitService } from "@/services/cluster";
import type { ClusterTreeNode } from "@/services/cluster/types";

const { Content } = Layout;
const { Text } = Typography;

// 现有页面保持原有功能

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

// 类型定义已移动到 @/services/network/types

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
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState("overview");

  const [networkList, setNetworkList] = useState<Network[]>([]);
  const [nodeNetworks, setNodeNetworks] = useState<NodeNetwork[]>([]);
  const [clusterNodes, setClusterNodes] = useState<ClusterTreeNode[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [networkModalVisible, setNetworkModalVisible] = useState(false);
  const [networkForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false); // 新增modal loading状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [ipDetailsVisible, setIpDetailsVisible] = useState(false);
  const [selectedNetworkIps, setSelectedNetworkIps] = useState<IPDetail[]>([]);
  const [currentHostname] = useState("node215"); // 当前主机名，可以从全局状态获取

  // 网络拓扑相关状态
  const [topologyData, setTopologyData] = useState<
    NetworkTopologyResponse | undefined
  >(undefined);
  const [topologyLoading, setTopologyLoading] = useState(false);

  // 各个tab的加载状态
  const [tabsLoaded, setTabsLoaded] = useState<Record<string, boolean>>({});

  // 适配网络数据格式
  const adaptNetworkDataForUI = (config: Network): Network => ({
    net_name: config.net_name,
    hostname: config.hostname,
    mac: config.mac,
    driver: config.driver,
    net_type: config.net_type,
    bridge: config.bridge,
    vlan_id: config.vlan_id,
    ip_addr: config.ip_addr,
    netmask: config.netmask,
    dhcp_start: config.dhcp_start,
    dhcp_end: config.dhcp_end,
  });

  // 加载集群节点列表
  const loadClusterNodes = useCallback(async () => {
    try {
      const response = await clusterInitService.getClusterTree();
      if (response.success && Array.isArray(response.data?.nodes)) {
        setClusterNodes(response.data.nodes);
        // 如果没有选中节点，默认选择第一个节点
        if (!selectedNode && response.data.nodes.length > 0) {
          setSelectedNode(response.data.nodes[0].name);
        }
      } else {
        setClusterNodes([]);
      }
    } catch (error) {
      console.error("获取集群节点列表失败:", error);
      setClusterNodes([]);
    }
  }, [selectedNode]);

  // 加载节点网络列表
  const loadNodeNetworks = useCallback(async (hostname?: string) => {
    if (!hostname) {
      setNodeNetworks([]);
      return;
    }

    try {
      const response = await getNodeNetworks(hostname);
      if (response.success && Array.isArray(response.data?.networks)) {
        setNodeNetworks(response.data.networks);
      } else {
        setNodeNetworks([]);
      }
    } catch (error) {
      console.error("获取节点网络列表失败:", error);
      setNodeNetworks([]);
    }
  }, []);

  // 处理节点选择变化
  const handleNodeChange = useCallback(
    async (nodeName: string) => {
      setSelectedNode(nodeName);
      setNodeNetworks([]); // 清空当前网络列表
      await loadNodeNetworks(nodeName);
    },
    [loadNodeNetworks]
  );

  // 加载网络配置列表
  const loadNetworkConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getNetworkConfig();
      if (response.success && Array.isArray(response.data?.networks)) {
        const adaptedNetworks = response.data.networks.map(
          adaptNetworkDataForUI
        );
        setNetworkList(adaptedNetworks);
      } else {
        setNetworkList([]);
        message.error(response.message || "获取网络配置失败");
      }
    } catch (error) {
      console.error("获取网络配置失败:", error);
      setNetworkList([]);
      message.error("获取网络配置失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  // 加载网络拓扑数据
  const loadNetworkTopology = useCallback(async () => {
    try {
      setTopologyLoading(true);
      const response = await getNetworkTopology();

      if (response.success && response.data) {
        setTopologyData(response.data);
      } else {
        console.log("API响应失败:", response.message);
        setTopologyData(undefined);
      }
    } catch (error) {
      console.error("API调用异常:", error);
      setTopologyData(undefined);
    } finally {
      setTopologyLoading(false);
    }
  }, []);

  // 初始化只加载集群节点，其他数据按需加载
  useEffect(() => {
    const initializeData = async () => {
      await loadClusterNodes();
    };
    initializeData();
  }, [loadClusterNodes]);

  // 当选中节点变化时，加载对应的网络列表
  useEffect(() => {
    if (selectedNode) {
      loadNodeNetworks(selectedNode);
    }
  }, [selectedNode, loadNodeNetworks]);

  // 拓扑图节点点击处理
  const handleTopologyNodeClick = useCallback((node: unknown) => {
    console.log("点击了节点:", node);
    // 可以在这里添加节点点击的处理逻辑
  }, []);

  // 拓扑图边点击处理
  const handleTopologyEdgeClick = useCallback((edge: unknown) => {
    console.log("点击了边:", edge);
    // 可以在这里添加边点击的处理逻辑
  }, []);

  // 处理tab切换的按需加载
  const handleTabChange = useCallback(
    async (activeKey: string) => {
      setActiveTab(activeKey);

      try {
        switch (activeKey) {
          case "overview":
          case "list":
            // 网络概览和列表：只在第一次访问时加载，之后依赖刷新按钮
            if (!tabsLoaded[activeKey]) {
              setLoading(true);
              await loadNetworkConfig();
              setTabsLoaded((prev) => ({ ...prev, [activeKey]: true }));
            }
            break;
          case "topology":
            // 网络拓扑：每次切换都重新加载，获取最新数据
            setTopologyLoading(true);
            await loadNetworkTopology();
            setTabsLoaded((prev) => ({ ...prev, [activeKey]: true }));
            break;
          case "routes":
          case "security":
            // 路由和安全规则：使用模拟数据，标记为已加载
            setTabsLoaded((prev) => ({ ...prev, [activeKey]: true }));
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`加载${activeKey}数据失败:`, error);
      } finally {
        // 清理loading状态
        if (activeKey === "overview" || activeKey === "list") {
          setLoading(false);
        }
        if (activeKey === "topology") {
          setTopologyLoading(false);
        }
      }
    },
    [tabsLoaded, loadNetworkConfig, loadNetworkTopology]
  );

  // 当首次进入页面且是overview tab时，触发数据加载
  useEffect(() => {
    if (activeTab === "overview" && !tabsLoaded["overview"]) {
      handleTabChange("overview");
    }
  }, [activeTab, tabsLoaded, handleTabChange]);

  // 处理创建/编辑网络
  const handleNetworkModalOk = async () => {
    try {
      setModalLoading(true); // 开始loading
      const values = await networkForm.validateFields();

      // 如果是编辑现有网络
      if (selectedNetwork) {
        // 编辑网络逻辑（这里应该调用API，当前是模拟）
        const updatedNetworks = networkList.map((network) =>
          network.net_name === selectedNetwork.net_name &&
          network.hostname === selectedNetwork.hostname
            ? ({ ...network, ...values } as Network)
            : network
        );
        setNetworkList(updatedNetworks);
        message.success("网络编辑成功");
        // 编辑成功后关闭对话框
        setNetworkModalVisible(false);
        networkForm.resetFields();
        setSelectedNetwork(null);
      } else {
        // 如果是新建网络
        const createParams: CreateNetworkRequest = {
          hostname: values.hostname || selectedNode || currentHostname,
          net_name: values.name,
          forward: values.forward,
          ip_addr: values.ip_addr,
          netmask: values.netmask,
          dhcp_start: values.dhcp_start,
          dhcp_end: values.dhcp_end,
        };

        // 根据网络类型添加对应参数
        if (values.forward === "isolated") {
          createParams.vlan_id = values.vlan_id || null;
        } else if (values.forward === "nat") {
          // 处理bridge_name，如果是数组则取第一个值，否则直接使用
          const bridgeName = Array.isArray(values.bridge_name)
            ? values.bridge_name[0]
            : values.bridge_name;
          createParams.bridge_name = bridgeName || null;
        }

        const response = await createNetworkAPI(createParams);

        if (response.success) {
          message.success(response.data?.message || "网络创建成功");
          // 重新加载网络列表
          await loadNetworkConfig();
          // 成功后关闭对话框
          setNetworkModalVisible(false);
          networkForm.resetFields();
          setSelectedNetwork(null);
        } else {
          message.error(response.message || "网络创建失败");
          // 失败时不关闭对话框，loading会在finally中清理
          return;
        }
      }
    } catch (error) {
      console.error("网络操作失败:", error);
      message.error("网络操作失败");
      // 异常时不关闭对话框，loading会在finally中清理
    } finally {
      setModalLoading(false); // 结束loading
    }
  };

  // 处理取消创建/编辑网络
  const handleNetworkModalCancel = () => {
    setNetworkModalVisible(false);
    networkForm.resetFields();
    setSelectedNetwork(null);
    setModalLoading(false); // 关闭弹窗时清理loading状态
  };

  // 编辑网络
  const editNetwork = (record: Network) => {
    setSelectedNetwork(record);
    setSelectedNode(record.hostname);
    setModalLoading(false); // 确保loading状态清理
    networkForm.setFieldsValue({
      hostname: record.hostname,
      name: record.net_name,
      forward: record.net_type === "isolated" ? "isolated" : "nat",
      vlan_id: record.vlan_id,
      bridge_name: record.bridge,
      ip_addr: record.ip_addr,
      netmask: record.netmask,
      dhcp_start: record.dhcp_start,
      dhcp_end: record.dhcp_end,
    });
    // 加载对应节点的网络信息
    loadNodeNetworks(record.hostname);
    setNetworkModalVisible(true);
  };

  // 删除网络
  const deleteNetwork = async (netName: string, hostname: string) => {
    try {
      setLoading(true);
      const response = await deleteNetworkAPI({
        net_name: netName,
        hostname: hostname,
      });

      if (response.success) {
        message.success(response.data?.message || "删除网络成功");
        // 重新加载网络列表
        await loadNetworkConfig();
      } else {
        message.error(response?.message || "删除网络失败");
      }
    } catch (error) {
      console.error("删除网络失败:", error);
      message.error("删除网络失败");
    } finally {
      setLoading(false);
    }
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
      mockIpDetails.filter(
        (ip) => ip.networkId === `${record.net_name}-${record.hostname}`
      )
    );
    setIpDetailsVisible(true);
  };

  // 网络表格列定义
  const networkColumns = [
    {
      title: "网络名称",
      dataIndex: "net_name",
      key: "net_name",
      render: (text: string, record: Network) => (
        <a onClick={() => viewNetworkDetails(record)}>{text || "N/A"}</a>
      ),
    },
    {
      title: "主机名",
      dataIndex: "hostname",
      key: "hostname",
      render: (text: string) => text || "N/A",
    },
    {
      title: "类型",
      dataIndex: "net_type",
      key: "net_type",
      render: (type: string) => (
        <Tag
          color={
            type === "nat" ? "blue" : type === "isolated" ? "orange" : "default"
          }
        >
          {type?.toUpperCase() || "N/A"}
        </Tag>
      ),
    },
    {
      title: "MAC地址",
      dataIndex: "mac",
      key: "mac",
      render: (mac: string) => mac || "N/A",
    },
    {
      title: "驱动",
      dataIndex: "driver",
      key: "driver",
      render: (driver: string) => driver?.toUpperCase() || "N/A",
    },
    {
      title: "网桥",
      dataIndex: "bridge",
      key: "bridge",
      render: (bridge: string) => bridge || "N/A",
    },
    {
      title: "VLAN ID",
      dataIndex: "vlan_id",
      key: "vlan_id",
      render: (vlanId: number | null) => vlanId ?? "N/A",
    },
    {
      title: "IP地址",
      dataIndex: "ip_addr",
      key: "ip_addr",
      render: (ip: string) => ip || "N/A",
    },
    {
      title: "子网掩码",
      dataIndex: "netmask",
      key: "netmask",
      render: (mask: string) => mask || "N/A",
    },
    {
      title: "DHCP起始",
      dataIndex: "dhcp_start",
      key: "dhcp_start",
      render: (start: string) => start || "N/A",
    },
    {
      title: "DHCP结束",
      dataIndex: "dhcp_end",
      key: "dhcp_end",
      render: (end: string) => end || "N/A",
    },
    {
      title: "操作",
      key: "action",
      render: (_: string, record: Network) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              onClick={() => viewNetworkDetails(record)}
              icon={<GlobalOutlined />}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              onClick={() => editNetwork(record)}
              icon={<EditOutlined />}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个网络吗?"
            onConfirm={async () =>
              await deleteNetwork(record.net_name, record.hostname)
            }
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
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
    <Spin spinning={loading} tip="加载网络数据中...">
      <div style={{ minHeight: loading ? "400px" : "auto" }}>
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
                    onClick={() => {
                      setModalLoading(false); // 确保loading状态清理
                      setNetworkModalVisible(true);
                    }}
                  >
                    新建网络
                  </Button>
                  <Button
                    icon={<SyncOutlined />}
                    onClick={async () => {
                      // 根据当前激活的tab刷新对应数据
                      switch (activeTab) {
                        case "overview":
                        case "list":
                          await Promise.all([
                            loadNetworkConfig(),
                            selectedNode
                              ? loadNodeNetworks(selectedNode)
                              : Promise.resolve(),
                          ]);
                          break;
                        case "topology":
                          await loadNetworkTopology();
                          break;
                        default:
                          // 通用刷新：集群节点
                          await loadClusterNodes();
                          break;
                      }
                    }}
                  >
                    刷新
                  </Button>
                </Space>
              }
            >
              <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                items={[
                  {
                    key: "overview",
                    label: "网络概览",
                    children:
                      !tabsLoaded["overview"] && loading ? (
                        <div style={{ textAlign: "center", padding: "50px" }}>
                          <Spin size="large" tip="加载网络概览数据中..." />
                        </div>
                      ) : (
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
                                      (network) => network.vlan_id !== null
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
                                  value={
                                    networkList.filter(
                                      (network) => network.net_type === "public"
                                    ).length
                                  }
                                  prefix={<CloudOutlined />}
                                />
                              </Card>
                            </Col>
                            <Col xs={24} sm={12} md={8} lg={6}>
                              <Card>
                                <Statistic
                                  title="IP分配率"
                                  value={
                                    networkList.length > 0
                                      ? Math.round(
                                          (networkList.filter(
                                            (network) =>
                                              network.net_type === "nat"
                                          ).length /
                                            networkList.length) *
                                            100
                                        )
                                      : 0
                                  }
                                  suffix="%"
                                  prefix={<ApiOutlined />}
                                />
                              </Card>
                            </Col>
                          </Row>

                          <Divider orientation="left">网络使用情况</Divider>

                          <Row gutter={[16, 16]}>
                            {(networkList || []).map((network) => (
                              <Col
                                xs={24}
                                sm={12}
                                lg={8}
                                key={network.net_name + "-" + network.hostname}
                              >
                                <Card
                                  title={
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                      }}
                                    >
                                      <ApartmentOutlined
                                        style={{
                                          fontSize: "14px",
                                          color:
                                            network.net_type === "nat"
                                              ? "#1890ff"
                                              : "#fa8c16",
                                        }}
                                      />
                                      <span
                                        style={{
                                          fontSize: "14px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        {network.net_name || "N/A"}
                                      </span>
                                      <Tag
                                        color={
                                          network.net_type === "nat"
                                            ? "blue"
                                            : "orange"
                                        }
                                        style={{
                                          fontSize: "10px",
                                          padding: "0 4px",
                                          lineHeight: "16px",
                                        }}
                                      >
                                        {network.net_type?.toUpperCase() ||
                                          "N/A"}
                                      </Tag>
                                    </div>
                                  }
                                  extra={
                                    <Button
                                      type="link"
                                      size="small"
                                      onClick={() =>
                                        viewNetworkDetails(network)
                                      }
                                      style={{ padding: "0 4px" }}
                                    >
                                      详情
                                    </Button>
                                  }
                                  style={{
                                    height: "100%",
                                    borderTop: `3px solid ${
                                      network.net_type === "nat"
                                        ? "#1890ff"
                                        : "#fa8c16"
                                    }`,
                                    transition: "all 0.3s ease",
                                  }}
                                  bodyStyle={{ padding: "12px" }}
                                  hoverable
                                >
                                  <Row gutter={[8, 8]}>
                                    <Col span={24}>
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          marginBottom: "8px",
                                          fontSize: "12px",
                                          color: "#666",
                                        }}
                                      >
                                        <span>
                                          节点: {network.hostname || "N/A"}
                                        </span>
                                        <span>
                                          驱动:{" "}
                                          {network.driver?.toUpperCase() ||
                                            "N/A"}
                                        </span>
                                      </div>
                                    </Col>

                                    <Col span={12}>
                                      <div
                                        style={{
                                          textAlign: "center",
                                          padding: "8px 0",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: "11px",
                                            color: "#999",
                                            marginBottom: "2px",
                                          }}
                                        >
                                          网关IP
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "13px",
                                            fontFamily: "monospace",
                                            color: "#333",
                                          }}
                                        >
                                          {network.ip_addr || "N/A"}
                                        </div>
                                      </div>
                                    </Col>

                                    <Col span={12}>
                                      <div
                                        style={{
                                          textAlign: "center",
                                          padding: "8px 0",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: "11px",
                                            color: "#999",
                                            marginBottom: "2px",
                                          }}
                                        >
                                          子网掩码
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "13px",
                                            fontFamily: "monospace",
                                            color: "#333",
                                          }}
                                        >
                                          {network.netmask || "N/A"}
                                        </div>
                                      </div>
                                    </Col>

                                    <Col span={24}>
                                      <div
                                        style={{
                                          background: "#f8f9fa",
                                          padding: "6px 8px",
                                          borderRadius: "4px",
                                          margin: "4px 0",
                                          fontSize: "11px",
                                          color: "#666",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                          }}
                                        >
                                          <span>
                                            DHCP: {network.dhcp_start || "N/A"}
                                          </span>
                                          <span>
                                            至 {network.dhcp_end || "N/A"}
                                          </span>
                                        </div>
                                      </div>
                                    </Col>

                                    <Col span={24}>
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          marginTop: "8px",
                                          fontSize: "11px",
                                          color: "#999",
                                        }}
                                      >
                                        <div>
                                          {network.bridge && (
                                            <span>网桥: {network.bridge}</span>
                                          )}
                                          {network.vlan_id !== null && (
                                            <span
                                              style={{
                                                marginLeft: network.bridge
                                                  ? "8px"
                                                  : "0",
                                              }}
                                            >
                                              VLAN: {network.vlan_id}
                                            </span>
                                          )}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "10px",
                                            fontFamily: "monospace",
                                          }}
                                        >
                                          {network.mac?.slice(-8) || "N/A"}
                                        </div>
                                      </div>
                                    </Col>
                                  </Row>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      ),
                  },
                  {
                    key: "list",
                    label: "网络列表",
                    children:
                      !tabsLoaded["list"] && loading ? (
                        <div style={{ textAlign: "center", padding: "50px" }}>
                          <Spin size="large" tip="加载网络列表数据中..." />
                        </div>
                      ) : (
                        <Table
                          columns={networkColumns}
                          dataSource={networkList}
                          rowKey={(record) =>
                            `${record.net_name}-${record.hostname}`
                          }
                          loading={loading}
                          pagination={{ pageSize: 10 }}
                          scroll={{ x: 1400 }}
                        />
                      ),
                  },
                  {
                    key: "routes",
                    label: "路由表",
                    children: (
                      <Card
                        title="路由表"
                        extra={
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                          >
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
                    ),
                  },
                  {
                    key: "security",
                    label: "安全组规则",
                    children: (
                      <Card
                        title="安全组规则"
                        extra={
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                          >
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
                    ),
                  },
                  {
                    key: "topology",
                    label: "网络拓扑",
                    children: topologyLoading ? (
                      <div style={{ textAlign: "center", padding: "50px" }}>
                        <Spin size="large" tip="加载网络拓扑数据中..." />
                      </div>
                    ) : (
                      <div>
                        <div
                          style={{
                            marginBottom: 16,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <Button
                            icon={<SyncOutlined />}
                            onClick={loadNetworkTopology}
                            loading={topologyLoading}
                            type="primary"
                          >
                            刷新拓扑图
                          </Button>
                          <span style={{ color: "#666", fontSize: "12px" }}>
                            状态:{" "}
                            {topologyLoading
                              ? "加载中..."
                              : topologyData
                              ? `已加载 ${
                                  topologyData.nodes?.length || 0
                                } 个节点`
                              : "无数据"}
                            {" | 每次切换自动刷新"}
                          </span>
                        </div>
                        <NetworkTopology
                          apiData={topologyData}
                          loading={topologyLoading}
                          onNodeClick={handleTopologyNodeClick}
                          onEdgeClick={handleTopologyEdgeClick}
                          height={600}
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </Card>

            {/* 创建/编辑网络的模态框 */}
            <Modal
              title={selectedNetwork ? "编辑网络" : "新建网络"}
              open={networkModalVisible}
              onOk={handleNetworkModalOk}
              onCancel={handleNetworkModalCancel}
              okButtonProps={{ loading: modalLoading }}
              cancelButtonProps={{ disabled: modalLoading }}
              width={700}
              destroyOnHidden
            >
              <Form form={networkForm} layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="hostname"
                      label="目标节点"
                      rules={[{ required: true, message: "请选择目标节点" }]}
                    >
                      <Select
                        placeholder="请选择目标节点"
                        onChange={handleNodeChange}
                        value={selectedNode}
                      >
                        {clusterNodes.map((node) => (
                          <Select.Option key={node.name} value={node.name}>
                            {node.name} ({node.ip}) - {node.status}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="forward"
                      label="网络类型"
                      rules={[{ required: true, message: "请选择网络类型" }]}
                    >
                      <Select placeholder="请选择网络类型">
                        <Select.Option value="isolated">ISOLATED</Select.Option>
                        <Select.Option value="nat">NAT</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

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
                    <div style={{ paddingTop: "30px", color: "#666" }}>
                      <Text type="secondary">
                        选择节点后可查看可用的网桥资源
                      </Text>
                    </div>
                  </Col>
                </Row>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.forward !== currentValues.forward
                  }
                >
                  {({ getFieldValue }) => {
                    const forwardType = getFieldValue("forward");

                    return (
                      <>
                        {forwardType === "isolated" && (
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="vlan_id"
                                label="VLAN ID"
                                help="隔离网络默认为空，系统自动分配"
                              >
                                <InputNumber
                                  style={{ width: "100%" }}
                                  placeholder="留空自动分配"
                                  min={1}
                                  max={4094}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <div
                                style={{ paddingTop: "30px", color: "#666" }}
                              >
                                <Text type="secondary">
                                  隔离网络将创建独立的虚拟网络
                                </Text>
                              </div>
                            </Col>
                          </Row>
                        )}

                        {forwardType === "nat" && (
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="bridge_name"
                                label="网桥名称"
                                help="可选择现有网桥或手动输入新的网桥名称"
                              >
                                <Select
                                  mode="tags"
                                  allowClear
                                  showSearch
                                  placeholder="选择现有网桥或输入新的网桥名称"
                                  maxTagCount={1}
                                  options={nodeNetworks
                                    .filter((net) => net.type === "bridge")
                                    .map((net) => ({
                                      label: `${net.device} (${net.connection})`,
                                      value: net.device,
                                    }))}
                                  filterOption={(input, option) =>
                                    (option?.label ?? "")
                                      .toLowerCase()
                                      .includes(input.toLowerCase()) ||
                                    (option?.value ?? "")
                                      .toLowerCase()
                                      .includes(input.toLowerCase())
                                  }
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <div
                                style={{ paddingTop: "30px", color: "#666" }}
                              >
                                <Text type="secondary">
                                  NAT网络将提供网络地址转换功能
                                </Text>
                              </div>
                            </Col>
                          </Row>
                        )}
                      </>
                    );
                  }}
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="ip_addr"
                      label="网关IP地址"
                      rules={[
                        { required: true, message: "请输入网关IP地址" },
                        {
                          pattern: /^([0-9]{1,3}\.){3}[0-9]{1,3}$/,
                          message: "IP地址格式不正确",
                        },
                      ]}
                    >
                      <Input placeholder="例如: 192.168.1.1" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="netmask"
                      label="子网掩码"
                      rules={[
                        { required: true, message: "请输入子网掩码" },
                        {
                          pattern: /^([0-9]{1,3}\.){3}[0-9]{1,3}$/,
                          message: "子网掩码格式不正确",
                        },
                      ]}
                    >
                      <Input placeholder="例如: 255.255.255.0" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="dhcp_start"
                      label="DHCP起始地址"
                      rules={[
                        { required: true, message: "请输入DHCP起始地址" },
                        {
                          pattern: /^([0-9]{1,3}\.){3}[0-9]{1,3}$/,
                          message: "IP地址格式不正确",
                        },
                      ]}
                    >
                      <Input placeholder="例如: 192.168.1.100" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="dhcp_end"
                      label="DHCP结束地址"
                      rules={[
                        { required: true, message: "请输入DHCP结束地址" },
                        {
                          pattern: /^([0-9]{1,3}\.){3}[0-9]{1,3}$/,
                          message: "IP地址格式不正确",
                        },
                      ]}
                    >
                      <Input placeholder="例如: 192.168.1.200" />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Modal>

            {/* 网络详情模态框 */}
            <Modal
              title={`网络详情: ${selectedNetwork?.net_name}`}
              open={detailModalVisible}
              onCancel={() => setDetailModalVisible(false)}
              width={1000}
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
                      {selectedNetwork.net_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="网络类型">
                      {selectedNetwork.net_type?.toUpperCase()}
                    </Descriptions.Item>
                    <Descriptions.Item label="主机名">
                      {selectedNetwork.hostname}
                    </Descriptions.Item>

                    {selectedNetwork.vlan_id !== null && (
                      <Descriptions.Item label="VLAN ID">
                        {selectedNetwork.vlan_id}
                      </Descriptions.Item>
                    )}

                    <Descriptions.Item label="IP地址">
                      {selectedNetwork.ip_addr}
                    </Descriptions.Item>
                    <Descriptions.Item label="子网掩码">
                      {selectedNetwork.netmask}
                    </Descriptions.Item>

                    <Descriptions.Item label="网桥">
                      {selectedNetwork.bridge}
                    </Descriptions.Item>

                    <Descriptions.Item label="驱动">
                      {selectedNetwork.driver?.toUpperCase()}
                    </Descriptions.Item>

                    <Descriptions.Item label="DHCP起始">
                      {selectedNetwork.dhcp_start}
                    </Descriptions.Item>

                    <Descriptions.Item label="DHCP结束">
                      {selectedNetwork.dhcp_end}
                    </Descriptions.Item>

                    <Descriptions.Item label="MAC地址" span={2}>
                      <span style={{ fontFamily: "monospace" }}>
                        {selectedNetwork.mac}
                      </span>
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
              title={`${selectedNetwork?.net_name} - IP地址分配`}
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
                    <Descriptions.Item label="网络名称">
                      {selectedNetwork.net_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="IP地址">
                      {selectedNetwork.ip_addr}
                    </Descriptions.Item>
                    <Descriptions.Item label="子网掩码">
                      {selectedNetwork.netmask}
                    </Descriptions.Item>
                    <Descriptions.Item label="DHCP范围">
                      {selectedNetwork.dhcp_start} - {selectedNetwork.dhcp_end}
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
      </div>
    </Spin>
  );
};

export default NetworkManagement;
