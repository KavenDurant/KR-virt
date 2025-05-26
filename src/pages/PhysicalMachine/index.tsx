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
  Badge,
  Typography,
  Descriptions,
  Alert,
} from "antd";
import {
  PlusOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
  SaveOutlined,
  ApiOutlined,
  DatabaseOutlined,
  AreaChartOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  LineChartOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";

const { Content } = Layout;
const { TabPane } = Tabs;
const { Text } = Typography;

// 物理机接口类型定义
interface NetworkInterface {
  name: string;
  speed: string;
  status: string;
  throughput: string;
}

interface StorageDevice {
  type: string;
  size: string;
  usage: number;
}

interface CPU {
  model: string;
  cores: number;
  threads: number;
  frequency: string;
  usage: number;
}

interface Memory {
  total: string;
  used: string;
  usage: number;
}

interface Host {
  id: string;
  name: string;
  ip: string;
  status: string;
  cluster: string;
  clusterId: string;
  cpu: CPU;
  memory: Memory;
  storage: StorageDevice[];
  network: NetworkInterface[];
  vms: number;
  os: string;
  hypervisor: string;
  location: string;
  lastChecked: string;
  tags: string[];
}

// 模拟物理机数据
const mockHosts: Host[] = [
  {
    id: "1",
    name: "host-node-01",
    ip: "192.168.1.101",
    status: "running",
    cluster: "生产环境集群",
    clusterId: "1",
    cpu: {
      model: "Intel Xeon Gold 6248R",
      cores: 32,
      threads: 64,
      frequency: "3.0 GHz",
      usage: 65,
    },
    memory: {
      total: "256 GB",
      used: "180 GB",
      usage: 70,
    },
    storage: [
      { type: "SSD", size: "1.2 TB", usage: 68 },
      { type: "HDD", size: "12 TB", usage: 55 },
    ],
    network: [
      { name: "eth0", speed: "10 Gbps", status: "up", throughput: "4.2 Gbps" },
      { name: "eth1", speed: "10 Gbps", status: "up", throughput: "3.8 Gbps" },
    ],
    vms: 15,
    os: "CentOS 8.4",
    hypervisor: "KVM",
    location: "机房A-机架03-U5",
    lastChecked: "2025-05-22 14:30:45",
    tags: ["生产", "高性能", "高可用"],
  },
  {
    id: "2",
    name: "host-node-02",
    ip: "192.168.1.102",
    status: "running",
    cluster: "生产环境集群",
    clusterId: "1",
    cpu: {
      model: "Intel Xeon Gold 6248R",
      cores: 32,
      threads: 64,
      frequency: "3.0 GHz",
      usage: 72,
    },
    memory: {
      total: "256 GB",
      used: "195 GB",
      usage: 76,
    },
    storage: [
      { type: "SSD", size: "1.2 TB", usage: 72 },
      { type: "HDD", size: "12 TB", usage: 60 },
    ],
    network: [
      { name: "eth0", speed: "10 Gbps", status: "up", throughput: "4.8 Gbps" },
      { name: "eth1", speed: "10 Gbps", status: "up", throughput: "4.2 Gbps" },
    ],
    vms: 18,
    os: "CentOS 8.4",
    hypervisor: "KVM",
    location: "机房A-机架03-U7",
    lastChecked: "2025-05-22 14:32:15",
    tags: ["生产", "高性能", "高可用"],
  },
  {
    id: "3",
    name: "host-test-01",
    ip: "192.168.2.101",
    status: "warning",
    cluster: "测试环境集群",
    clusterId: "2",
    cpu: {
      model: "Intel Xeon Silver 4210R",
      cores: 16,
      threads: 32,
      frequency: "2.4 GHz",
      usage: 85,
    },
    memory: {
      total: "128 GB",
      used: "115 GB",
      usage: 90,
    },
    storage: [
      { type: "SSD", size: "800 GB", usage: 75 },
      { type: "HDD", size: "8 TB", usage: 65 },
    ],
    network: [
      { name: "eth0", speed: "10 Gbps", status: "up", throughput: "6.5 Gbps" },
      { name: "eth1", speed: "10 Gbps", status: "up", throughput: "5.8 Gbps" },
    ],
    vms: 12,
    os: "Ubuntu 22.04 LTS",
    hypervisor: "KVM",
    location: "机房B-机架01-U3",
    lastChecked: "2025-05-22 14:28:30",
    tags: ["测试", "开发"],
  },
  {
    id: "4",
    name: "host-backup-01",
    ip: "192.168.3.101",
    status: "maintenance",
    cluster: "备份集群",
    clusterId: "4",
    cpu: {
      model: "AMD EPYC 7302",
      cores: 16,
      threads: 32,
      frequency: "3.0 GHz",
      usage: 25,
    },
    memory: {
      total: "128 GB",
      used: "48 GB",
      usage: 38,
    },
    storage: [
      { type: "SSD", size: "500 GB", usage: 45 },
      { type: "HDD", size: "24 TB", usage: 70 },
    ],
    network: [
      { name: "eth0", speed: "10 Gbps", status: "up", throughput: "2.2 Gbps" },
      { name: "eth1", speed: "10 Gbps", status: "up", throughput: "1.8 Gbps" },
    ],
    vms: 5,
    os: "CentOS 8.4",
    hypervisor: "Proxmox",
    location: "机房C-机架05-U2",
    lastChecked: "2025-05-22 13:15:10",
    tags: ["备份", "存储"],
  },
  {
    id: "5",
    name: "host-dmz-01",
    ip: "192.168.4.101",
    status: "running",
    cluster: "DMZ集群",
    clusterId: "3",
    cpu: {
      model: "Intel Xeon E-2288G",
      cores: 8,
      threads: 16,
      frequency: "3.7 GHz",
      usage: 45,
    },
    memory: {
      total: "64 GB",
      used: "32 GB",
      usage: 50,
    },
    storage: [
      { type: "SSD", size: "500 GB", usage: 55 },
      { type: "HDD", size: "4 TB", usage: 40 },
    ],
    network: [
      { name: "eth0", speed: "1 Gbps", status: "up", throughput: "450 Mbps" },
      { name: "eth1", speed: "1 Gbps", status: "up", throughput: "320 Mbps" },
    ],
    vms: 4,
    os: "Ubuntu 22.04 LTS",
    hypervisor: "VMware ESXi",
    location: "机房D-机架02-U1",
    lastChecked: "2025-05-22 14:10:22",
    tags: ["DMZ", "隔离"],
  },
];

// 模拟虚拟机数据
const mockVMs = [
  {
    id: "1",
    hostId: "1",
    name: "vm-prod-web-01",
    status: "running",
    cpu: 8,
    memory: "32GB",
    os: "CentOS 8",
  },
  {
    id: "2",
    hostId: "1",
    name: "vm-prod-db-01",
    status: "running",
    cpu: 16,
    memory: "64GB",
    os: "Ubuntu 22.04",
  },
  {
    id: "3",
    hostId: "2",
    name: "vm-prod-app-01",
    status: "running",
    cpu: 8,
    memory: "32GB",
    os: "CentOS 8",
  },
  {
    id: "4",
    hostId: "2",
    name: "vm-prod-cache-01",
    status: "running",
    cpu: 4,
    memory: "16GB",
    os: "Ubuntu 22.04",
  },
  {
    id: "5",
    hostId: "3",
    name: "vm-test-web-01",
    status: "running",
    cpu: 4,
    memory: "16GB",
    os: "CentOS 8",
  },
];

// 实时性能监控模拟数据
const mockPerformanceData = {
  cpuUsage: [
    { time: "00:00", value: 42 },
    { time: "01:00", value: 38 },
    { time: "02:00", value: 35 },
    { time: "03:00", value: 30 },
    { time: "04:00", value: 32 },
    { time: "05:00", value: 35 },
    { time: "06:00", value: 45 },
    { time: "07:00", value: 55 },
    { time: "08:00", value: 62 },
    { time: "09:00", value: 70 },
    { time: "10:00", value: 75 },
    { time: "11:00", value: 80 },
    { time: "12:00", value: 78 },
    { time: "13:00", value: 74 },
    { time: "14:00", value: 70 },
    { time: "15:00", value: 65 },
    { time: "16:00", value: 68 },
    { time: "17:00", value: 72 },
    { time: "18:00", value: 65 },
    { time: "19:00", value: 60 },
    { time: "20:00", value: 55 },
    { time: "21:00", value: 50 },
    { time: "22:00", value: 45 },
    { time: "23:00", value: 40 },
  ],
};

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
    case "error":
      return (
        <Tag icon={<WarningOutlined />} color="error">
          错误
        </Tag>
      );
    case "maintenance":
      return (
        <Tag icon={<ClockCircleOutlined />} color="processing">
          维护中
        </Tag>
      );
    case "stopped":
      return (
        <Tag icon={<PauseCircleOutlined />} color="default">
          已停止
        </Tag>
      );
    case "up":
      return <Tag color="success">连接</Tag>;
    case "down":
      return <Tag color="error">断开</Tag>;
    default:
      return <Tag color="default">{status}</Tag>;
  }
};

const PhysicalMachineManagement: React.FC = () => {
  const { themeConfig } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");
  const [hostList, setHostList] = useState<Host[]>(mockHosts);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [hostModalVisible, setHostModalVisible] = useState(false);
  const [hostForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 加载物理机数据
  useEffect(() => {
    // 模拟API请求延迟
    setLoading(true);
    setTimeout(() => {
      setHostList(mockHosts);
      setLoading(false);
    }, 500);
  }, []);

  // 处理创建/编辑物理机
  const handleHostModalOk = () => {
    hostForm.validateFields().then((values) => {
      setHostModalVisible(false);

      // 如果是编辑现有物理机
      if (selectedHost) {
        const updatedHosts = hostList.map((host) =>
          host.id === selectedHost.id
            ? {
                ...host,
                name: values.name,
                ip: values.ip,
                cluster: values.cluster,
                clusterId: values.clusterId,
                os: values.os,
                hypervisor: values.hypervisor,
                location: values.location,
                tags: values.tags,
              }
            : host,
        );
        setHostList(updatedHosts);
      } else {
        // 如果是新建物理机
        const newHost: Host = {
          id: String(hostList.length + 1),
          name: values.name,
          ip: values.ip,
          status: "maintenance", // 新添加的物理机初始状态为维护中
          cluster: values.cluster,
          clusterId: values.clusterId,
          cpu: {
            model: "Unknown",
            cores: 0,
            threads: 0,
            frequency: "0 GHz",
            usage: 0,
          },
          memory: {
            total: "0 GB",
            used: "0 GB",
            usage: 0,
          },
          storage: [{ type: "Unknown", size: "0 TB", usage: 0 }],
          network: [
            {
              name: "eth0",
              speed: "0 Gbps",
              status: "down",
              throughput: "0 Gbps",
            },
          ],
          vms: 0,
          os: values.os,
          hypervisor: values.hypervisor,
          location: values.location,
          lastChecked: new Date().toLocaleString(),
          tags: values.tags,
        };
        setHostList([...hostList, newHost]);
      }

      hostForm.resetFields();
      setSelectedHost(null);
    });
  };

  // 处理取消创建/编辑物理机
  const handleHostModalCancel = () => {
    setHostModalVisible(false);
    hostForm.resetFields();
    setSelectedHost(null);
  };

  // 编辑物理机
  const editHost = (record: Host) => {
    setSelectedHost(record);
    hostForm.setFieldsValue({
      name: record.name,
      ip: record.ip,
      cluster: record.cluster,
      clusterId: record.clusterId,
      os: record.os,
      hypervisor: record.hypervisor,
      location: record.location,
      tags: record.tags,
    });
    setHostModalVisible(true);
  };

  // 删除物理机
  const deleteHost = (id: string) => {
    setHostList(hostList.filter((host) => host.id !== id));
  };

  // 查看物理机详情
  const viewHostDetails = (record: Host) => {
    setSelectedHost(record);
    setDetailModalVisible(true);
  };

  // 物理机表格列定义
  const hostColumns = [
    {
      title: "物理机名称",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Host) => (
        <a onClick={() => viewHostDetails(record)}>{text}</a>
      ),
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
      title: "所属集群",
      dataIndex: "cluster",
      key: "cluster",
    },
    {
      title: "CPU",
      key: "cpu",
      render: (_: string, record: Host) => (
        <div>
          <div>{record.cpu.model}</div>
          <div>
            {record.cpu.cores}核/{record.cpu.threads}线程
          </div>
        </div>
      ),
    },
    {
      title: "CPU使用率",
      dataIndex: ["cpu", "usage"],
      key: "cpuUsage",
      render: (percent: number) => (
        <Progress
          percent={percent}
          size="small"
          strokeColor={
            percent > 80 ? "#ff4d4f" : percent > 60 ? "#faad14" : "#52c41a"
          }
        />
      ),
    },
    {
      title: "内存",
      key: "memory",
      render: (_: string, record: Host) => (
        <div>
          <div>{record.memory.total}</div>
          <div>{record.memory.usage}% 已使用</div>
        </div>
      ),
    },
    {
      title: "内存使用率",
      dataIndex: ["memory", "usage"],
      key: "memoryUsage",
      render: (percent: number) => (
        <Progress
          percent={percent}
          size="small"
          strokeColor={
            percent > 80 ? "#ff4d4f" : percent > 60 ? "#faad14" : "#52c41a"
          }
        />
      ),
    },
    {
      title: "虚拟机",
      dataIndex: "vms",
      key: "vms",
    },
    {
      title: "操作",
      key: "action",
      render: (_: string, record: Host) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="link"
              onClick={() => viewHostDetails(record)}
              icon={<CloudServerOutlined />}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              onClick={() => editHost(record)}
              icon={<EditOutlined />}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这台物理机吗?"
            onConfirm={() => deleteHost(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 虚拟机表格列定义
  const vmColumns = [
    {
      title: "虚拟机名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "CPU",
      dataIndex: "cpu",
      key: "cpu",
      render: (cpu: number) => `${cpu} vCPU`,
    },
    {
      title: "内存",
      dataIndex: "memory",
      key: "memory",
    },
    {
      title: "操作系统",
      dataIndex: "os",
      key: "os",
    },
  ];

  return (
    <Layout className="physical-machine-management">
      <Content style={{ minHeight: 280 }}>
        <Card
          title={
            <Space>
              <SaveOutlined />
              <span>物理机管理</span>
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setHostModalVisible(true)}
              >
                新增物理机
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
            <TabPane tab="物理机概览" key="overview">
              <div className="host-overview">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                      <Statistic
                        title="物理机总数"
                        value={hostList.length}
                        prefix={<CloudServerOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                      <Statistic
                        title="运行中"
                        value={
                          hostList.filter((host) => host.status === "running")
                            .length
                        }
                        valueStyle={{ color: "#52c41a" }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                      <Statistic
                        title="警告"
                        value={
                          hostList.filter((host) => host.status === "warning")
                            .length
                        }
                        valueStyle={{ color: "#faad14" }}
                        prefix={<ExclamationCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                      <Statistic
                        title="维护中"
                        value={
                          hostList.filter(
                            (host) => host.status === "maintenance",
                          ).length
                        }
                        valueStyle={{ color: "#1890ff" }}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Divider orientation="left">资源使用概览</Divider>

                <Row gutter={[16, 16]}>
                  {" "}
                  <Col xs={24} sm={12}>
                    <Card title="平均CPU使用率" extra={<ApiOutlined />}>
                      <Progress
                        percent={Math.round(
                          hostList.reduce(
                            (acc, host) => acc + host.cpu.usage,
                            0,
                          ) / hostList.length,
                        )}
                        status="active"
                        strokeColor={{
                          "0%": "#108ee9",
                          "100%": "#87d068",
                        }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Card title="平均内存使用率" extra={<DatabaseOutlined />}>
                      <Progress
                        percent={Math.round(
                          hostList.reduce(
                            (acc, host) => acc + host.memory.usage,
                            0,
                          ) / hostList.length,
                        )}
                        status="active"
                        strokeColor={{
                          "0%": "#108ee9",
                          "100%": "#87d068",
                        }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Divider orientation="left">物理机状态</Divider>

                <Row gutter={[16, 16]}>
                  {hostList.map((host) => (
                    <Col xs={24} sm={12} lg={8} key={host.id}>
                      <Card
                        title={
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span>{host.name}</span>
                            {getStatusTag(host.status)}
                          </div>
                        }
                        extra={
                          <a onClick={() => viewHostDetails(host)}>详情</a>
                        }
                        style={{ height: "100%" }}
                      >
                        <Row gutter={[16, 8]}>
                          <Col span={12}>
                            <Text type="secondary">IP地址</Text>
                            <div>{host.ip}</div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">所属集群</Text>
                            <div>{host.cluster}</div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">CPU</Text>
                            <div>
                              {host.cpu.cores}核/{host.cpu.threads}线程
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text type="secondary">内存</Text>
                            <div>{host.memory.total}</div>
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
                            <Text>CPU使用率</Text>
                            <Text>{host.cpu.usage}%</Text>
                          </div>
                          <Progress percent={host.cpu.usage} size="small" />
                        </div>

                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "8px",
                            }}
                          >
                            <Text>内存使用率</Text>
                            <Text>{host.memory.usage}%</Text>
                          </div>
                          <Progress percent={host.memory.usage} size="small" />
                        </div>

                        <div style={{ marginTop: "16px" }}>
                          <Space>
                            <Badge
                              status="processing"
                              text={`${host.vms} 台虚拟机`}
                            />
                            <Badge status="success" text={host.os} />
                          </Space>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </TabPane>

            <TabPane tab="物理机列表" key="list">
              <Table
                columns={hostColumns}
                dataSource={hostList}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
          </Tabs>
        </Card>

        {/* 创建/编辑物理机的模态框 */}
        <Modal
          title={selectedHost ? "编辑物理机" : "添加物理机"}
          open={hostModalVisible}
          onOk={handleHostModalOk}
          onCancel={handleHostModalCancel}
          destroyOnClose
        >
          <Form form={hostForm} layout="vertical">
            <Form.Item
              name="name"
              label="物理机名称"
              rules={[{ required: true, message: "请输入物理机名称" }]}
            >
              <Input placeholder="请输入物理机名称" />
            </Form.Item>

            <Form.Item
              name="ip"
              label="IP地址"
              rules={[
                { required: true, message: "请输入IP地址" },
                {
                  pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
                  message: "IP地址格式不正确",
                },
              ]}
            >
              <Input placeholder="请输入IP地址" />
            </Form.Item>

            <Form.Item
              name="clusterId"
              label="所属集群"
              rules={[{ required: true, message: "请选择所属集群" }]}
            >
              <Select placeholder="请选择所属集群">
                <Select.Option value="1">生产环境集群</Select.Option>
                <Select.Option value="2">测试环境集群</Select.Option>
                <Select.Option value="3">DMZ集群</Select.Option>
                <Select.Option value="4">备份集群</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="cluster"
              label="集群名称"
              rules={[{ required: true, message: "请输入集群名称" }]}
            >
              <Select placeholder="请选择集群名称">
                <Select.Option value="生产环境集群">生产环境集群</Select.Option>
                <Select.Option value="测试环境集群">测试环境集群</Select.Option>
                <Select.Option value="DMZ集群">DMZ集群</Select.Option>
                <Select.Option value="备份集群">备份集群</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="os"
              label="操作系统"
              rules={[{ required: true, message: "请选择操作系统" }]}
            >
              <Select placeholder="请选择操作系统">
                <Select.Option value="CentOS 7">CentOS 7</Select.Option>
                <Select.Option value="CentOS 8.4">CentOS 8.4</Select.Option>
                <Select.Option value="Ubuntu 20.04 LTS">
                  Ubuntu 20.04 LTS
                </Select.Option>
                <Select.Option value="Ubuntu 22.04 LTS">
                  Ubuntu 22.04 LTS
                </Select.Option>
                <Select.Option value="Debian 11">Debian 11</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="hypervisor"
              label="虚拟化平台"
              rules={[{ required: true, message: "请选择虚拟化平台" }]}
            >
              <Select placeholder="请选择虚拟化平台">
                <Select.Option value="KVM">KVM</Select.Option>
                <Select.Option value="VMware ESXi">VMware ESXi</Select.Option>
                <Select.Option value="Proxmox">Proxmox</Select.Option>
                <Select.Option value="Hyper-V">Hyper-V</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="location"
              label="物理位置"
              rules={[{ required: true, message: "请输入物理位置" }]}
            >
              <Input placeholder="例如：机房A-机架03-U5" />
            </Form.Item>

            <Form.Item name="tags" label="标签">
              <Select mode="tags" placeholder="请输入标签" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 物理机详情模态框 */}
        <Modal
          title={`物理机详情: ${selectedHost?.name}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={1000}
          footer={null}
        >
          {selectedHost && (
            <>
              <Tabs defaultActiveKey="info">
                <TabPane tab="基本信息" key="info">
                  <Descriptions
                    bordered
                    column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
                  >
                    <Descriptions.Item label="物理机名称">
                      {selectedHost.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="IP地址">
                      {selectedHost.ip}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                      {getStatusTag(selectedHost.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="所属集群">
                      {selectedHost.cluster}
                    </Descriptions.Item>
                    <Descriptions.Item label="操作系统">
                      {selectedHost.os}
                    </Descriptions.Item>
                    <Descriptions.Item label="虚拟化平台">
                      {selectedHost.hypervisor}
                    </Descriptions.Item>
                    <Descriptions.Item label="物理位置">
                      {selectedHost.location}
                    </Descriptions.Item>
                    <Descriptions.Item label="最后检查">
                      {selectedHost.lastChecked}
                    </Descriptions.Item>
                    <Descriptions.Item label="标签">
                      {selectedHost.tags.map((tag: string) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </Descriptions.Item>
                  </Descriptions>

                  <Divider orientation="left">处理器</Divider>
                  <Descriptions
                    bordered
                    column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
                  >
                    <Descriptions.Item label="型号">
                      {selectedHost.cpu.model}
                    </Descriptions.Item>
                    <Descriptions.Item label="物理核心数">
                      {selectedHost.cpu.cores}
                    </Descriptions.Item>
                    <Descriptions.Item label="逻辑处理器数">
                      {selectedHost.cpu.threads}
                    </Descriptions.Item>
                    <Descriptions.Item label="频率">
                      {selectedHost.cpu.frequency}
                    </Descriptions.Item>
                    <Descriptions.Item label="使用率">
                      <Progress percent={selectedHost.cpu.usage} size="small" />
                    </Descriptions.Item>
                  </Descriptions>

                  <Divider orientation="left">内存</Divider>
                  <Descriptions
                    bordered
                    column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
                  >
                    <Descriptions.Item label="总内存">
                      {selectedHost.memory.total}
                    </Descriptions.Item>
                    <Descriptions.Item label="已使用">
                      {selectedHost.memory.used}
                    </Descriptions.Item>
                    <Descriptions.Item label="使用率">
                      <Progress
                        percent={selectedHost.memory.usage}
                        size="small"
                      />
                    </Descriptions.Item>
                  </Descriptions>

                  <Divider orientation="left">存储</Divider>
                  <Table
                    dataSource={selectedHost.storage}
                    columns={[
                      { title: "类型", dataIndex: "type", key: "type" },
                      { title: "容量", dataIndex: "size", key: "size" },
                      {
                        title: "使用率",
                        dataIndex: "usage",
                        key: "usage",
                        render: (percent: number) => (
                          <Progress percent={percent} size="small" />
                        ),
                      },
                    ]}
                    pagination={false}
                    rowKey="type"
                  />

                  <Divider orientation="left">网络</Divider>
                  <Table
                    dataSource={selectedHost.network}
                    columns={[
                      { title: "接口", dataIndex: "name", key: "name" },
                      { title: "速率", dataIndex: "speed", key: "speed" },
                      {
                        title: "状态",
                        dataIndex: "status",
                        key: "status",
                        render: (status: string) => getStatusTag(status),
                      },
                      {
                        title: "吞吐量",
                        dataIndex: "throughput",
                        key: "throughput",
                      },
                    ]}
                    pagination={false}
                    rowKey="name"
                  />
                </TabPane>

                <TabPane tab="虚拟机" key="vms">
                  <Table
                    columns={vmColumns}
                    dataSource={mockVMs.filter(
                      (vm) => vm.hostId === selectedHost.id,
                    )}
                    rowKey="id"
                    pagination={false}
                  />
                </TabPane>

                <TabPane tab="性能监控" key="performance">
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Card
                        title="CPU使用率（24小时）"
                        extra={<AreaChartOutlined />}
                      >
                        <div
                          style={{
                            height: "300px",
                            background: themeConfig.token.colorBgLayout,
                            padding: "20px",
                            borderRadius: "4px",
                          }}
                        >
                          {/* 实际应用中这里会使用图表组件如ECharts或Recharts */}
                          <Alert
                            message="这里将显示CPU使用率图表（模拟占位）"
                            type="info"
                            showIcon
                          />

                          {/* 简单模拟图表效果 */}
                          <div
                            style={{
                              marginTop: "20px",
                              height: "200px",
                              position: "relative",
                            }}
                          >
                            {mockPerformanceData.cpuUsage.map((item, index) => (
                              <div
                                key={index}
                                style={{
                                  position: "absolute",
                                  left: `${
                                    (index /
                                      (mockPerformanceData.cpuUsage.length -
                                        1)) *
                                    100
                                  }%`,
                                  bottom: `${item.value}%`,
                                  width: "2px",
                                  height: "2px",
                                  background: "#1890ff",
                                  transform: "translate(-50%, 50%)",
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title="内存使用率" extra={<BarChartOutlined />}>
                        <div
                          style={{
                            height: "200px",
                            background: themeConfig.token.colorBgLayout,
                            padding: "20px",
                            borderRadius: "4px",
                          }}
                        >
                          <Alert
                            message="这里将显示内存使用率图表（模拟占位）"
                            type="info"
                            showIcon
                          />
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title="存储性能" extra={<LineChartOutlined />}>
                        <div
                          style={{
                            height: "200px",
                            background: themeConfig.token.colorBgLayout,
                            padding: "20px",
                            borderRadius: "4px",
                          }}
                        >
                          <Alert
                            message="这里将显示存储性能图表（模拟占位）"
                            type="info"
                            showIcon
                          />
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title="网络吞吐量" extra={<ApiOutlined />}>
                        <div
                          style={{
                            height: "200px",
                            background: themeConfig.token.colorBgLayout,
                            padding: "20px",
                            borderRadius: "4px",
                          }}
                        >
                          <Alert
                            message="这里将显示网络吞吐量图表（模拟占位）"
                            type="info"
                            showIcon
                          />
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </TabPane>
              </Tabs>
            </>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default PhysicalMachineManagement;
