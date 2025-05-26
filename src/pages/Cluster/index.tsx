import React, { useState, useEffect } from "react";
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
} from "antd";
import {
  PlusOutlined,
  SyncOutlined,
  ClusterOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ApiOutlined,
  CloudOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";

const { Content } = Layout;
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
    default:
      return <Tag color="default">{status}</Tag>;
  }
};

const ClusterManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [clusterList, setClusterList] = useState(mockClusters);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterModalVisible, setClusterModalVisible] = useState(false);
  const [clusterForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { themeConfig } = useTheme();

  // 获取进度条颜色的函数
  const getProgressColor = (percent: number) => {
    if (percent > 80) return "#ff4d4f"; // 保留语义颜色：危险/错误
    if (percent > 60) return "#faad14"; // 保留语义颜色：警告
    return "#52c41a"; // 保留语义颜色：成功/正常
  };

  // 加载集群数据
  useEffect(() => {
    // 模拟API请求延迟
    setLoading(true);
    setTimeout(() => {
      setClusterList(mockClusters);
      setLoading(false);
    }, 500);
  }, []);

  // 处理创建/编辑集群
  const handleClusterModalOk = () => {
    clusterForm.validateFields().then((values) => {
      setClusterModalVisible(false);

      // 如果是编辑现有集群
      if (selectedCluster) {
        const updatedClusters = clusterList.map((cluster) =>
          cluster.id === selectedCluster.id
            ? { ...cluster, ...values }
            : cluster,
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

  // 编辑集群
  const editCluster = (record: Cluster) => {
    setSelectedCluster(record);
    clusterForm.setFieldsValue({
      name: record.name,
      type: record.type,
      description: record.description,
      tags: record.tags,
    });
    setClusterModalVisible(true);
  };

  // 删除集群
  const deleteCluster = (id: string) => {
    setClusterList(clusterList.filter((cluster) => cluster.id !== id));
  };

  // 查看集群详情
  const viewClusterDetails = (record: Cluster) => {
    setSelectedCluster(record);
    setDetailModalVisible(true);
  };

  // 集群表格列定义
  const clusterColumns = [
    {
      title: "集群名称",
      dataIndex: "name",
      key: "name",
      render: (_: string, record: Cluster) => (
        <a onClick={() => viewClusterDetails(record)}>{record.name}</a>
      ),
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
      title: "主机数量",
      dataIndex: "hosts",
      key: "hosts",
    },
    {
      title: "虚拟机数量",
      dataIndex: "vms",
      key: "vms",
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
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
    },
    {
      title: "操作",
      key: "action",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: string, record: any) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="link"
              onClick={() => viewClusterDetails(record)}
              icon={<InfoCircleOutlined />}
            />
          </Tooltip>
          <Tooltip title="编辑集群">
            <Button
              type="link"
              onClick={() => editCluster(record)}
              icon={<InfoCircleOutlined />}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个集群吗?"
            onConfirm={() => deleteCluster(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<ExclamationCircleOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

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

  return (
    <Layout className="cluster-management">
      <Content style={{ minHeight: 280 }}>
        <Card
          title={
            <Space>
              <ClusterOutlined />
              <span>集群管理</span>
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setClusterModalVisible(true)}
              >
                新建集群
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
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "overview",
                label: "集群概览",
                children: (
                  <div className="cluster-overview">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Card>
                          <Statistic
                            title="集群总数"
                            value={clusterList.length}
                            prefix={<ClusterOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Card>
                          <Statistic
                            title="主机总数"
                            value={mockClusters.reduce(
                              (acc, curr) => acc + curr.hosts,
                              0,
                            )}
                            prefix={<CloudOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Card>
                          <Statistic
                            title="虚拟机总数"
                            value={mockClusters.reduce(
                              (acc, curr) => acc + curr.vms,
                              0,
                            )}
                            prefix={<DesktopOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={8} lg={6}>
                        <Card>
                          <Statistic
                            title="平均CPU使用率"
                            value={Math.round(
                              mockClusters.reduce(
                                (acc, curr) => acc + curr.cpuUsage,
                                0,
                              ) / mockClusters.length,
                            )}
                            suffix="%"
                            prefix={<ApiOutlined />}
                          />
                        </Card>
                      </Col>
                    </Row>

                    <Divider orientation="left">集群状态</Divider>

                    <Row gutter={[16, 16]}>
                      {mockClusters.map((cluster) => (
                        <Col xs={24} sm={12} lg={8} key={cluster.id}>
                          <Card
                            title={
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>{cluster.name}</span>
                                {getStatusTag(cluster.status)}
                              </div>
                            }
                            extra={
                              <a onClick={() => viewClusterDetails(cluster)}>
                                详情
                              </a>
                            }
                            style={{ height: "100%" }}
                          >
                            <Row gutter={[16, 16]}>
                              <Col span={12}>
                                <Statistic
                                  title="主机数"
                                  value={cluster.hosts}
                                />
                              </Col>
                              <Col span={12}>
                                <Statistic
                                  title="虚拟机数"
                                  value={cluster.vms}
                                />
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
                                <Text>CPU</Text>
                                <Text>{cluster.cpuUsage}%</Text>
                              </div>
                              <Progress
                                percent={cluster.cpuUsage}
                                size="small"
                              />
                            </div>
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "8px",
                                }}
                              >
                                <Text>内存</Text>
                                <Text>{cluster.memoryUsage}%</Text>
                              </div>
                              <Progress
                                percent={cluster.memoryUsage}
                                size="small"
                              />
                            </div>
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "8px",
                                }}
                              >
                                <Text>存储</Text>
                                <Text>{cluster.storageUsage}%</Text>
                              </div>
                              <Progress
                                percent={cluster.storageUsage}
                                size="small"
                              />
                            </div>
                            <div style={{ marginTop: "16px" }}>
                              {cluster.tags.map((tag: string) => (
                                <Tag key={tag}>{tag}</Tag>
                              ))}
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ),
              },
              {
                key: "list",
                label: "集群列表",
                children: (
                  <Table
                    columns={clusterColumns}
                    dataSource={clusterList}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                ),
              },
            ]}
          />
        </Card>
        {/* 创建/编辑集群的模态框 */}{" "}
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
                          (host) => host.clusterId === selectedCluster.id,
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
                          (storage) => storage.clusterId === selectedCluster.id,
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
                          (network) => network.clusterId === selectedCluster.id,
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
      </Content>
    </Layout>
  );
};

export default ClusterManagement;
