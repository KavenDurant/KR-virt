import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Tag,
  Space,
  Input,
  Select,
  Dropdown,
  Tooltip,
} from "antd";
import type { MenuProps } from "antd";
import {
  PoweroffOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  SettingOutlined,
  DownOutlined,
  PlusOutlined,
  SyncOutlined,
  ExportOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTheme } from "../../hooks/useTheme";
import type {
  Cluster as ClusterData,
  VirtualMachine as VMData,
} from "../../services/mockData";
import { ClusterStats, VMDetails } from "../../components/ClusterVMDisplay";

// 定义虚拟机数据类型
interface VirtualMachine {
  id: string;
  name: string;
  status: string;
  ip: string;
  cpu: string | number;
  memory: string | number;
  storage: string | number;
  createTime: string;
  os: string;
  hypervisor: string;
  zone: string;
  cluster: string;
  host: string;
  description: string;
  owner: string;
  cpuUsage: string;
  memoryUsage: string;
  rootDisk: string;
  dataDisk: string;
  instanceType: string;
  networkType: string;
  securityGroup: string;
  hostName: string;
  expireTime: string;
  tags: string[];
  platform: string;
}

const VirtualMachineManagement: React.FC = () => {
  const { themeConfig } = useTheme();
  const [loading, setLoading] = useState(true);
  const [vmList, setVmList] = useState<VirtualMachine[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [zoneFilter, setZoneFilter] = useState("全部");

  // 添加侧边栏选择状态
  const [selectedNodeType, setSelectedNodeType] = useState<
    "cluster" | "vm" | null
  >(null);
  const [selectedNodeData, setSelectedNodeData] = useState<
    ClusterData | VMData | null
  >(null);

  // 监听侧边栏选择事件
  useEffect(() => {
    const handleSidebarSelect = (event: CustomEvent) => {
      const { nodeType, nodeData } = event.detail;
      setSelectedNodeType(nodeType);
      setSelectedNodeData(nodeData);
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

  // 如果有选中的节点，显示相应的组件
  if (selectedNodeData) {
    if (selectedNodeType === "cluster") {
      return <ClusterStats cluster={selectedNodeData as ClusterData} />;
    } else if (selectedNodeType === "vm") {
      return <VMDetails vm={selectedNodeData as VMData} />;
    }
  }

  // 模拟数据
  const mockVmData: VirtualMachine[] = [
    {
      id: "vm-001",
      name: "Web服务器01",
      status: "运行中",
      ip: "192.168.1.101",
      cpu: "4核",
      memory: "8GB",
      storage: "100GB",
      createTime: "2025-05-10",
      os: "CentOS 8.4",
      hypervisor: "KVM",
      zone: "可用区A",
      cluster: "集群-01",
      host: "物理主机-01",
      description: "主要Web服务",
      owner: "系统管理员",
      cpuUsage: "25%",
      memoryUsage: "45%",
      rootDisk: "100GB / 系统盘",
      dataDisk: "无",
      instanceType: "通用型m1.large",
      networkType: "经典网络",
      securityGroup: "默认安全组",
      hostName: "web-server-01",
      expireTime: "永久",
      tags: ["生产环境", "Web服务"],
      platform: "Linux",
    },
    {
      id: "vm-002",
      name: "DB服务器01",
      status: "已停止",
      ip: "192.168.1.102",
      cpu: "8核",
      memory: "16GB",
      storage: "500GB",
      createTime: "2025-05-12",
      os: "Oracle Linux 8",
      hypervisor: "KVM",
      zone: "可用区A",
      cluster: "集群-01",
      host: "物理主机-02",
      description: "主数据库服务器",
      owner: "DBA团队",
      cpuUsage: "0%",
      memoryUsage: "0%",
      rootDisk: "100GB / 系统盘",
      dataDisk: "400GB / 数据盘",
      instanceType: "内存优化型r1.large",
      networkType: "经典网络",
      securityGroup: "数据库安全组",
      hostName: "db-server-01",
      expireTime: "永久",
      tags: ["生产环境", "数据库"],
      platform: "Linux",
    },
  ];

  // 数据加载effect
  useEffect(() => {
    const loadVmData = () => {
      setLoading(true);
      setTimeout(() => {
        setVmList(mockVmData);
        setLoading(false);
      }, 1200);
    };

    loadVmData();
  }, []);

  // 筛选数据
  const filteredData = vmList.filter((vm) => {
    const matchSearch =
      searchText === "" ||
      vm.name.toLowerCase().includes(searchText.toLowerCase()) ||
      vm.id.toLowerCase().includes(searchText.toLowerCase()) ||
      (vm.ip && vm.ip.includes(searchText));

    const matchStatus = statusFilter === "全部" || vm.status === statusFilter;
    const matchZone = zoneFilter === "全部" || vm.zone === zoneFilter;

    return matchSearch && matchStatus && matchZone;
  });

  // 刷新数据函数
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setVmList(mockVmData);
      setLoading(false);
    }, 800);
  };

  const columns: ColumnsType<VirtualMachine> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (status: string) => {
        const getStatusConfig = (status: string) => {
          switch (status) {
            case "运行中":
              return { color: "success", icon: "●" };
            case "已停止":
              return { color: "error", icon: "●" };
            case "异常":
              return { color: "warning", icon: "●" };
            default:
              return { color: "default", icon: "●" };
          }
        };

        const config = getStatusConfig(status);
        return (
          <Tag color={config.color}>
            <span style={{ fontSize: "8px" }}>{config.icon}</span>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "IP地址",
      dataIndex: "ip",
      key: "ip",
      width: 120,
    },
    {
      title: "操作系统",
      dataIndex: "os",
      key: "os",
      width: 140,
    },
    {
      title: "CPU",
      dataIndex: "cpu",
      key: "cpu",
      width: 80,
    },
    {
      title: "内存",
      dataIndex: "memory",
      key: "memory",
      width: 80,
    },
    {
      title: "存储",
      dataIndex: "storage",
      key: "storage",
      width: 80,
    },
    {
      title: "操作",
      key: "action",
      fixed: "right" as const,
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.status === "已停止" ? (
            <Button type="primary" size="small" icon={<PlayCircleOutlined />}>
              启动
            </Button>
          ) : (
            <Button danger size="small" icon={<PoweroffOutlined />}>
              停止
            </Button>
          )}
          <Button size="small" icon={<ReloadOutlined />}>
            重启
          </Button>
        </Space>
      ),
    },
  ];

  const menuItems: MenuProps["items"] = [
    { key: "1", icon: <PoweroffOutlined />, label: "批量停止" },
    { key: "2", icon: <DeleteOutlined />, label: "批量删除" },
    { key: "3", icon: <CopyOutlined />, label: "批量克隆" },
  ];

  return (
    <div style={{ width: "100%" }}>
      <h3 style={{ color: themeConfig.token.colorTextBase }}>虚拟机管理</h3>

      <Row gutter={16} style={{ marginBottom: "24px", width: "100%" }}>
        <Col span={6}>
          <Card>
            <Statistic title="总虚拟机数量" value={12} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行中"
              value={8}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已停止"
              value={3}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="异常"
              value={1}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="虚拟机列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            创建虚拟机
          </Button>
        }
      >
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              placeholder="搜索虚拟机名称、IP或ID"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              style={{ width: 120 }}
              placeholder="状态"
              defaultValue="全部"
              options={[
                { value: "全部", label: "全部状态" },
                { value: "运行中", label: "运行中" },
                { value: "已停止", label: "已停止" },
                { value: "异常", label: "异常" },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
            />
            <Select
              style={{ width: 140 }}
              placeholder="可用区"
              defaultValue="全部"
              options={[
                { value: "全部", label: "全部可用区" },
                { value: "可用区A", label: "可用区A" },
                { value: "可用区B", label: "可用区B" },
              ]}
              value={zoneFilter}
              onChange={(value) => setZoneFilter(value)}
            />
            <Tooltip title="更多筛选条件">
              <Button icon={<FilterOutlined />} />
            </Tooltip>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<SyncOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Tooltip title="导出">
              <Button icon={<ExportOutlined />} />
            </Tooltip>
            <Tooltip title="批量操作">
              <Dropdown menu={{ items: menuItems }}>
                <Button>
                  批量操作 <DownOutlined />
                </Button>
              </Dropdown>
            </Tooltip>
            <Tooltip title="表格列设置">
              <Button icon={<SettingOutlined />} />
            </Tooltip>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
          scroll={{ x: 1200 }}
          bordered
          size="middle"
          rowSelection={{
            type: "checkbox",
            columnWidth: 48,
            selections: [Table.SELECTION_ALL, Table.SELECTION_NONE],
          }}
        />
      </Card>
    </div>
  );
};

export default VirtualMachineManagement;
