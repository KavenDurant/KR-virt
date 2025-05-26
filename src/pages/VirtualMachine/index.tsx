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
  const [loading, setLoading] = useState(true); // 改为初始loading状态
  const [vmList, setVmList] = useState<VirtualMachine[]>([]); // 添加状态管理
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [zoneFilter, setZoneFilter] = useState("全部");

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
    {
      id: "vm-003",
      name: "测试服务器",
      status: "运行中",
      ip: "192.168.1.103",
      cpu: "2核",
      memory: "4GB",
      storage: "50GB",
      createTime: "2025-05-15",
      os: "Ubuntu 22.04",
      hypervisor: "KVM",
      zone: "可用区B",
      cluster: "测试集群",
      host: "物理主机-03",
      description: "开发测试环境",
      owner: "开发团队",
      cpuUsage: "15%",
      memoryUsage: "30%",
      rootDisk: "50GB / 系统盘",
      dataDisk: "无",
      instanceType: "计算型c1.medium",
      networkType: "VPC网络",
      securityGroup: "测试安全组",
      hostName: "test-server-01",
      expireTime: "2025-12-31",
      tags: ["测试环境", "开发测试"],
      platform: "Linux",
    },
    {
      id: "vm-004",
      name: "Windows服务器",
      status: "运行中",
      ip: "192.168.1.104",
      cpu: "4核",
      memory: "8GB",
      storage: "120GB",
      createTime: "2025-05-18",
      os: "Windows Server 2019",
      hypervisor: "KVM",
      zone: "可用区A",
      cluster: "集群-02",
      host: "物理主机-04",
      description: "Windows应用服务器",
      owner: "应用团队",
      cpuUsage: "35%",
      memoryUsage: "60%",
      rootDisk: "120GB / 系统盘",
      dataDisk: "无",
      instanceType: "通用型m1.large",
      networkType: "经典网络",
      securityGroup: "Windows安全组",
      hostName: "win-server-01",
      expireTime: "永久",
      tags: ["生产环境", "应用服务器"],
      platform: "Windows",
    },
    {
      id: "vm-005",
      name: "负载均衡器",
      status: "运行中",
      ip: "192.168.1.105",
      cpu: "2核",
      memory: "4GB",
      storage: "40GB",
      createTime: "2025-05-20",
      os: "CentOS 8.4",
      hypervisor: "KVM",
      zone: "可用区A",
      cluster: "集群-01",
      host: "物理主机-01",
      description: "网络负载均衡服务",
      owner: "网络团队",
      cpuUsage: "20%",
      memoryUsage: "25%",
      rootDisk: "40GB / 系统盘",
      dataDisk: "无",
      instanceType: "网络优化型n1.medium",
      networkType: "VPC网络",
      securityGroup: "网络安全组",
      hostName: "lb-server-01",
      expireTime: "永久",
      tags: ["生产环境", "网络服务"],
      platform: "Linux",
    },
  ];

  // 添加数据加载effect
  useEffect(() => {
    const loadVmData = () => {
      setLoading(true);
      // 模拟API调用延迟
      setTimeout(() => {
        setVmList(mockVmData);
        setLoading(false);
      }, 1200);
    };

    loadVmData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <Tag
            color={config.color}
            style={{
              borderRadius: "4px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              width: "fit-content",
            }}
          >
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
      title: "CPU使用率",
      dataIndex: "cpuUsage",
      key: "cpuUsage",
      width: 100,
      render: (usage: string) => {
        const usageValue = parseInt(usage);
        return (
          <div
            style={{
              color:
                !isNaN(usageValue) && usageValue > 80
                  ? "#ff4d4f"
                  : themeConfig.token.colorTextBase,
            }}
          >
            {usage}
          </div>
        );
      },
    },
    {
      title: "内存使用率",
      dataIndex: "memoryUsage",
      key: "memoryUsage",
      width: 100,
      render: (usage: string) => {
        const usageValue = parseInt(usage);
        return (
          <div
            style={{
              color:
                !isNaN(usageValue) && usageValue > 80
                  ? "#ff4d4f"
                  : themeConfig.token.colorTextBase,
            }}
          >
            {usage}
          </div>
        );
      },
    },
    {
      title: "可用区",
      dataIndex: "zone",
      key: "zone",
      width: 100,
    },
    {
      title: "集群",
      dataIndex: "cluster",
      key: "cluster",
      width: 100,
    },
    {
      title: "宿主机",
      dataIndex: "host",
      key: "host",
      width: 120,
    },
    {
      title: "实例类型",
      dataIndex: "instanceType",
      key: "instanceType",
      width: 140,
    },
    {
      title: "网络类型",
      dataIndex: "networkType",
      key: "networkType",
      width: 100,
    },
    {
      title: "安全组",
      dataIndex: "securityGroup",
      key: "securityGroup",
      width: 120,
    },
    {
      title: "平台",
      dataIndex: "platform",
      key: "platform",
      width: 90,
      render: (platform: string) => {
        const getPlatformConfig = (platform: string) => {
          switch (platform) {
            case "Linux":
              return { color: "blue", icon: "🐧" };
            case "Windows":
              return { color: "purple", icon: "🪟" };
            default:
              return { color: "default", icon: "💻" };
          }
        };

        const config = getPlatformConfig(platform);
        return (
          <Tag
            color={config.color}
            style={{
              borderRadius: "4px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: "12px" }}>{config.icon}</span>
            {platform}
          </Tag>
        );
      },
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      width: 150,
      ellipsis: true,
    },
    {
      title: "拥有者",
      dataIndex: "owner",
      key: "owner",
      width: 120,
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 120,
      sorter: (a, b) =>
        new Date(a.createTime).getTime() - new Date(b.createTime).getTime(),
    },
    {
      title: "到期时间",
      dataIndex: "expireTime",
      key: "expireTime",
      width: 120,
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
          <Button
            size="small"
            icon={<ReloadOutlined />}
            style={{
              backgroundColor: themeConfig.token.colorBgContainer,
              borderColor: themeConfig.token.colorBorder,
              color: themeConfig.token.colorTextBase,
            }}
          >
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
      <h1 style={{ color: themeConfig.token.colorTextBase }}>虚拟机管理</h1>

      <Row gutter={16} style={{ marginBottom: "24px", width: "100%" }}>
        <Col span={6} xxl={6} xl={6} lg={6} md={12} sm={24} xs={24}>
          <Card
            style={{
              backgroundColor: themeConfig.token.colorBgContainer,
              color: themeConfig.token.colorTextBase,
              border: `1px solid ${themeConfig.token.colorBorder}`,
            }}
          >
            <Statistic title="总虚拟机数量" value={12} />
          </Card>
        </Col>
        <Col span={6} xxl={6} xl={6} lg={6} md={12} sm={24} xs={24}>
          <Card
            style={{
              backgroundColor: themeConfig.token.colorBgContainer,
              color: themeConfig.token.colorTextBase,
              border: `1px solid ${themeConfig.token.colorBorder}`,
            }}
          >
            <Statistic
              title="运行中"
              value={8}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6} xxl={6} xl={6} lg={6} md={12} sm={24} xs={24}>
          <Card
            style={{
              backgroundColor: themeConfig.token.colorBgContainer,
              color: themeConfig.token.colorTextBase,
              border: `1px solid ${themeConfig.token.colorBorder}`,
            }}
          >
            <Statistic
              title="已停止"
              value={3}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col span={6} xxl={6} xl={6} lg={6} md={12} sm={24} xs={24}>
          <Card
            style={{
              backgroundColor: themeConfig.token.colorBgContainer,
              color: themeConfig.token.colorTextBase,
              border: `1px solid ${themeConfig.token.colorBorder}`,
            }}
          >
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
        style={{
          backgroundColor: themeConfig.token.colorBgContainer,
          color: themeConfig.token.colorTextBase,
          border: `1px solid ${themeConfig.token.colorBorder}`,
          width: "100%",
        }}
        styles={{
          header: {
            backgroundColor: themeConfig.token.colorBgContainer,
            color: themeConfig.token.colorTextBase,
            borderBottom: `1px solid ${themeConfig.token.colorBorder}`,
          },
        }}
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
              style={{
                width: 240,
                backgroundColor: themeConfig.token.colorBgContainer,
                borderColor: themeConfig.token.colorBorder,
              }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              style={{
                width: 120,
                backgroundColor: themeConfig.token.colorBgContainer,
                borderColor: themeConfig.token.colorBorder,
              }}
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
              style={{
                width: 140,
                backgroundColor: themeConfig.token.colorBgContainer,
                borderColor: themeConfig.token.colorBorder,
              }}
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
              <Button
                icon={<FilterOutlined />}
                style={{
                  backgroundColor: themeConfig.token.colorBgContainer,
                  borderColor: themeConfig.token.colorBorder,
                }}
              />
            </Tooltip>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              icon={<SyncOutlined />}
              style={{
                backgroundColor: themeConfig.token.colorBgContainer,
                borderColor: themeConfig.token.colorBorder,
              }}
              onClick={handleRefresh}
            >
              刷新
            </Button>
            <Tooltip title="导出">
              <Button
                icon={<ExportOutlined />}
                style={{
                  backgroundColor: themeConfig.token.colorBgContainer,
                  borderColor: themeConfig.token.colorBorder,
                }}
              />
            </Tooltip>
            <Tooltip title="批量操作">
              <Dropdown menu={{ items: menuItems }}>
                <Button
                  style={{
                    backgroundColor: themeConfig.token.colorBgContainer,
                    borderColor: themeConfig.token.colorBorder,
                  }}
                >
                  批量操作 <DownOutlined />
                </Button>
              </Dropdown>
            </Tooltip>
            <Tooltip title="表格列设置">
              <Button
                icon={<SettingOutlined />}
                style={{
                  backgroundColor: themeConfig.token.colorBgContainer,
                  borderColor: themeConfig.token.colorBorder,
                }}
              />
            </Tooltip>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            itemRender: (page, type, originalElement) => {
              if (type === "page") {
                return (
                  <a style={{ color: themeConfig.token.colorTextBase }}>
                    {page}
                  </a>
                );
              }
              return originalElement;
            },
          }}
          loading={loading}
          style={{
            backgroundColor: themeConfig.token.colorBgContainer,
            width: "100%",
          }}
          scroll={{ x: 2500 }}
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
