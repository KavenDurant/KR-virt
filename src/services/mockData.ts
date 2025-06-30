import { clusterInitService } from "./cluster";
import type { ClusterTreeResponse } from "./cluster/types";

// Mock数据服务 - 模拟PVE风格的集群和虚拟机数据
export interface VirtualMachine {
  id: string;
  name: string;
  status: "running" | "stopped" | "suspended" | "error";
  type: string;
  vmid: number;
  cpu: number;
  memory: number;
  diskSize: number;
  node: string;
  uptime?: string;
}

export interface Node {
  id: string;
  name: string;
  type: "node";
  status: "online" | "offline" | "standby" | "maintenance";
  cpu: number;
  memory: number;
  uptime: string;
  vms: VirtualMachine[];
  ip?: string; // 可选的IP地址
  is_dc?: boolean; // 可选的数据中心节点标识
}

// 网络接口定义
export interface Network {
  id: string;
  name: string;
  type: "network";
  status: "active" | "inactive";
  networkType: string; // bridge, virtual, etc.
}

// 存储接口定义
export interface Storage {
  id: string;
  name: string;
  type: "storage";
  status: "active" | "inactive";
  size: number;
  used: number;
}

export interface Cluster {
  id: string;
  name: string;
  type: "cluster";
  status: "healthy" | "warning" | "error";
  nodes: Node[];
  networks?: Network[]; // 可选，以保持向后兼容
  storages?: Storage[]; // 可选，以保持向后兼容
}

export interface DataCenter {
  id: string;
  name: string;
  type: "datacenter";
  clusters: Cluster[];
}

// 集群页面专用的侧边栏数据

// 集群页面专用的侧边栏数据
export const mockClusterDataCenter: DataCenter = {
  id: "datacenter-cluster",
  name: "Cluster-DataCenter",
  type: "datacenter",
  clusters: [
    {
      id: "cluster-prod",
      name: "生产环境集群",
      type: "cluster",
      status: "healthy",
      nodes: [
        {
          id: "node-prod-01",
          name: "prod-host-01",
          type: "node",
          status: "online",
          cpu: 75,
          memory: 85,
          uptime: "25 天",
          vms: [
            {
              id: "vm-web-01",
              name: "web-frontend-01",
              status: "running",
              type: "qemu",
              vmid: 1001,
              cpu: 8,
              memory: 16,
              diskSize: 200,
              node: "prod-host-01",
              uptime: "25 天 10 小时",
            },
            {
              id: "vm-api-01",
              name: "api-backend-01",
              status: "running",
              type: "qemu",
              vmid: 1002,
              cpu: 12,
              memory: 32,
              diskSize: 500,
              node: "prod-host-01",
              uptime: "25 天 10 小时",
            },
            {
              id: "vm-db-master",
              name: "database-master",
              status: "running",
              type: "qemu",
              vmid: 1003,
              cpu: 16,
              memory: 64,
              diskSize: 2000,
              node: "prod-host-01",
              uptime: "25 天 10 小时",
            },
          ],
        },
        {
          id: "node-prod-02",
          name: "prod-host-02",
          type: "node",
          status: "online",
          cpu: 60,
          memory: 70,
          uptime: "25 天",
          vms: [
            {
              id: "vm-web-02",
              name: "web-frontend-02",
              status: "running",
              type: "qemu",
              vmid: 1004,
              cpu: 8,
              memory: 16,
              diskSize: 200,
              node: "prod-host-02",
              uptime: "25 天 10 小时",
            },
            {
              id: "vm-cache-01",
              name: "redis-cluster-01",
              status: "running",
              type: "lxc",
              vmid: 1005,
              cpu: 4,
              memory: 8,
              diskSize: 100,
              node: "prod-host-02",
              uptime: "20 天 5 小时",
            },
            {
              id: "vm-monitor",
              name: "monitoring-stack",
              status: "running",
              type: "qemu",
              vmid: 1006,
              cpu: 4,
              memory: 16,
              diskSize: 300,
              node: "prod-host-02",
              uptime: "25 天 10 小时",
            },
          ],
        },
      ],
    },
    {
      id: "cluster-test",
      name: "测试环境集群",
      type: "cluster",
      status: "healthy",
      nodes: [
        {
          id: "node-test-01",
          name: "test-host-01",
          type: "node",
          status: "online",
          cpu: 45,
          memory: 55,
          uptime: "12 天",
          vms: [
            {
              id: "vm-test-web",
              name: "test-web-server",
              status: "running",
              type: "qemu",
              vmid: 2001,
              cpu: 4,
              memory: 8,
              diskSize: 100,
              node: "test-host-01",
              uptime: "8 天 3 小时",
            },
            {
              id: "vm-test-db",
              name: "test-database",
              status: "stopped",
              type: "qemu",
              vmid: 2002,
              cpu: 4,
              memory: 8,
              diskSize: 200,
              node: "test-host-01",
            },
          ],
        },
      ],
    },
    {
      id: "cluster-backup",
      name: "备份集群",
      type: "cluster",
      status: "warning",
      nodes: [
        {
          id: "node-backup-01",
          name: "backup-host-01",
          type: "node",
          status: "offline",
          cpu: 0,
          memory: 0,
          uptime: "离线",
          vms: [
            {
              id: "vm-backup-01",
              name: "backup-storage",
              status: "error",
              type: "qemu",
              vmid: 3001,
              cpu: 2,
              memory: 4,
              diskSize: 5000,
              node: "backup-host-01",
            },
          ],
        },
      ],
    },
  ],
};

// 虚拟机页面专用的侧边栏数据
export const mockVMDataCenter: DataCenter = {
  id: "datacenter-vm",
  name: "VM-DataCenter",
  type: "datacenter",
  clusters: [
    {
      id: "cluster-vm-01",
      name: "虚拟机集群-01",
      type: "cluster",
      status: "healthy",
      nodes: [
        {
          id: "node-vm-01",
          name: "vm-host-01",
          type: "node",
          status: "online",
          cpu: 55,
          memory: 68,
          uptime: "18 天",
          vms: [
            {
              id: "vm-app-01",
              name: "application-server-01",
              status: "running",
              type: "qemu",
              vmid: 101,
              cpu: 6,
              memory: 12,
              diskSize: 150,
              node: "vm-host-01",
              uptime: "15 天 6 小时",
            },
            {
              id: "vm-db-01",
              name: "mysql-database-01",
              status: "running",
              type: "qemu",
              vmid: 102,
              cpu: 8,
              memory: 24,
              diskSize: 1000,
              node: "vm-host-01",
              uptime: "18 天 2 小时",
            },
            {
              id: "vm-file-01",
              name: "file-storage-01",
              status: "running",
              type: "qemu",
              vmid: 103,
              cpu: 2,
              memory: 8,
              diskSize: 3000,
              node: "vm-host-01",
              uptime: "18 天 2 小时",
            },
            {
              id: "vm-cache-redis",
              name: "redis-cache-server",
              status: "stopped",
              type: "lxc",
              vmid: 104,
              cpu: 2,
              memory: 4,
              diskSize: 50,
              node: "vm-host-01",
            },
          ],
        },
        {
          id: "node-vm-02",
          name: "vm-host-02",
          type: "node",
          status: "online",
          cpu: 40,
          memory: 50,
          uptime: "18 天",
          vms: [
            {
              id: "vm-app-02",
              name: "application-server-02",
              status: "running",
              type: "qemu",
              vmid: 201,
              cpu: 6,
              memory: 12,
              diskSize: 150,
              node: "vm-host-02",
              uptime: "15 天 6 小时",
            },
            {
              id: "vm-nginx-01",
              name: "nginx-proxy-01",
              status: "running",
              type: "lxc",
              vmid: 202,
              cpu: 1,
              memory: 2,
              diskSize: 20,
              node: "vm-host-02",
              uptime: "18 天 2 小时",
            },
            {
              id: "vm-log-01",
              name: "log-collector-01",
              status: "suspended",
              type: "lxc",
              vmid: 203,
              cpu: 2,
              memory: 4,
              diskSize: 200,
              node: "vm-host-02",
            },
          ],
        },
      ],
    },
    {
      id: "cluster-vm-02",
      name: "虚拟机集群-02",
      type: "cluster",
      status: "healthy",
      nodes: [
        {
          id: "node-vm-03",
          name: "vm-host-03",
          type: "node",
          status: "online",
          cpu: 25,
          memory: 35,
          uptime: "10 天",
          vms: [
            {
              id: "vm-dev-01",
              name: "dev-environment-01",
              status: "running",
              type: "qemu",
              vmid: 301,
              cpu: 4,
              memory: 8,
              diskSize: 100,
              node: "vm-host-03",
              uptime: "5 天 12 小时",
            },
            {
              id: "vm-jenkins",
              name: "jenkins-ci-server",
              status: "running",
              type: "qemu",
              vmid: 302,
              cpu: 4,
              memory: 8,
              diskSize: 200,
              node: "vm-host-03",
              uptime: "10 天 1 小时",
            },
            {
              id: "vm-git-01",
              name: "gitlab-server",
              status: "running",
              type: "qemu",
              vmid: 303,
              cpu: 4,
              memory: 16,
              diskSize: 500,
              node: "vm-host-03",
              uptime: "10 天 1 小时",
            },
          ],
        },
      ],
    },
  ],
};

// 获取侧边栏数据的服务
// 根据不同的模块路径返回对应的侧边栏数据
// 集群页面和虚拟机页面使用不同的数据结构
export const getSidebarData = (modulePath: string) => {
  switch (modulePath) {
    case "/virtual-machine":
      // 虚拟机页面：显示以虚拟机管理为主的层次结构
      return mockVMDataCenter;
    case "/cluster":
      // 集群页面：显示以集群管理为主的层次结构
      return mockClusterDataCenter;
    default:
      return null;
  }
};

// 新增：获取集群树数据的异步函数
export const getClusterSidebarData = async (): Promise<DataCenter | null> => {
  try {
    // 调用集群树API
    const result = await clusterInitService.getClusterTree();

    if (result.success && result.data) {
      // 将API数据转换为侧边栏数据格式
      return convertClusterTreeToDataCenter(result.data);
    } else {
      console.warn("获取集群树失败:", result.message);
      // 不再回退到mock数据，抛出错误让上层处理
      throw new Error(result.message || "获取集群树失败");
    }
  } catch (error) {
    console.error("获取集群树数据异常:", error);
    // 不再回退到mock数据，重新抛出错误
    throw error;
  }
};

// 将集群树API响应转换为DataCenter格式
const convertClusterTreeToDataCenter = (
  treeData: ClusterTreeResponse,
): DataCenter => {
  return {
    id: "datacenter-real",
    name: "实际集群环境",
    type: "datacenter",
    clusters: [
      {
        id: treeData.cluster_uuid,
        name: treeData.cluster_name,
        type: "cluster",
        status: "healthy", // 可以根据节点状态推断集群状态
        nodes: treeData.nodes.map((node) => ({
          id: node.node_id,
          name: node.name,
          type: "node" as const,
          status: node.status as NodeStatus, // 直接使用API返回的状态
          cpu: 0, // API中没有这些信息，使用默认值
          memory: 0,
          uptime: getNodeStatusConfig(node.status).label,
          vms: [], // API中没有虚拟机信息，使用空数组
          ip: node.ip, // 添加IP地址信息
          is_dc: node.is_dc, // 添加是否为数据中心节点标识
        })),
        networks:
          treeData.networks?.map((network) => ({
            id: `network-${network.name}`,
            name: network.name,
            type: "network" as const,
            status:
              network.status === "active"
                ? ("active" as const)
                : ("inactive" as const),
            networkType: network.type,
          })) || [],
        storages:
          treeData.storages?.map((storage) => ({
            id: `storage-${storage.name}`,
            name: storage.name,
            type: "storage" as const,
            status:
              storage.status === "active"
                ? ("active" as const)
                : ("inactive" as const),
            size: storage.size,
            used: storage.used,
          })) || [],
      },
    ],
  };
};

// 节点状态类型定义
export type NodeStatus = 'online' | 'offline' | 'standby' | 'maintenance';

// 节点状态映射配置
export const NODE_STATUS_CONFIG = {
  online: {
    label: '在线',
    color: '#52c41a',
    icon: '🟢',
  },
  offline: {
    label: '离线',
    color: '#8c8c8c',
    icon: '⚫',
  },
  standby: {
    label: '节点待命',
    color: '#faad14',
    icon: '🟡',
  },
  maintenance: {
    label: '维护模式',
    color: '#ff7a00',
    icon: '🟠',
  },
} as const;

// 获取节点状态配置
export const getNodeStatusConfig = (status: string) => {
  return NODE_STATUS_CONFIG[status as NodeStatus] || {
    label: status,
    color: '#d9d9d9',
    icon: '⚪',
  };
};

// 获取状态颜色
export const getStatusColor = (status: string) => {
  switch (status) {
    case "running":
    case "online":
    case "healthy":
    case "active":
      return "#52c41a";
    case "stopped":
    case "offline":
    case "inactive":
      return "#8c8c8c"; // 更新离线状态为灰色
    case "suspended":
    case "warning":
    case "standby":
      return "#faad14";
    case "maintenance":
      return "#ff7a00"; // 新增维护模式状态
    case "error":
      return "#ff4d4f";
    default:
      return "#d9d9d9";
  }
};

// 获取状态图标
export const getStatusIcon = (type: string) => {
  if (type === "qemu") {
    return "🖥️";
  } else if (type === "lxc") {
    return "📦";
  } else if (type === "node") {
    return "🖲️";
  } else if (type === "cluster") {
    return "🔗";
  } else if (type === "datacenter") {
    return "🏢";
  }
  return "📁";
};

// 虚拟机管理页面数据类型
export interface VMManagementData {
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
  uptime?: string;
  powerState?: string;
  tools?: string;
  snapshots?: number;
}

// 虚拟机管理页面模拟数据
export const mockVMManagementData: VMManagementData[] = [
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
    uptime: "15天8小时",
    powerState: "开机",
    tools: "已安装",
    snapshots: 3,
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
    uptime: "0天0小时",
    powerState: "关机",
    tools: "已安装",
    snapshots: 1,
  },
  {
    id: "vm-003",
    name: "应用服务器01",
    status: "运行中",
    ip: "192.168.1.103",
    cpu: "8核",
    memory: "32GB",
    storage: "200GB",
    createTime: "2025-05-15",
    os: "Ubuntu 20.04",
    hypervisor: "KVM",
    zone: "可用区B",
    cluster: "集群-02",
    host: "物理主机-03",
    description: "应用服务器",
    owner: "开发团队",
    cpuUsage: "60%",
    memoryUsage: "75%",
    rootDisk: "100GB / 系统盘",
    dataDisk: "100GB / 数据盘",
    instanceType: "计算优化型c1.xlarge",
    networkType: "VPC网络",
    securityGroup: "应用安全组",
    hostName: "app-server-01",
    expireTime: "2025-12-31",
    tags: ["测试环境", "应用服务"],
    platform: "Linux",
    uptime: "10天12小时",
    powerState: "开机",
    tools: "已安装",
    snapshots: 5,
  },
  {
    id: "vm-004",
    name: "Windows服务器01",
    status: "运行中",
    ip: "192.168.1.104",
    cpu: "4核",
    memory: "16GB",
    storage: "150GB",
    createTime: "2025-05-18",
    os: "Windows Server 2019",
    hypervisor: "KVM",
    zone: "可用区A",
    cluster: "集群-01",
    host: "物理主机-01",
    description: "Windows应用服务器",
    owner: "运维团队",
    cpuUsage: "35%",
    memoryUsage: "55%",
    rootDisk: "150GB / 系统盘",
    dataDisk: "无",
    instanceType: "通用型m1.large",
    networkType: "经典网络",
    securityGroup: "默认安全组",
    hostName: "win-server-01",
    expireTime: "永久",
    tags: ["生产环境", "Windows"],
    platform: "Windows",
    uptime: "8天6小时",
    powerState: "开机",
    tools: "已安装",
    snapshots: 2,
  },
  {
    id: "vm-005",
    name: "缓存服务器01",
    status: "异常",
    ip: "192.168.1.105",
    cpu: "2核",
    memory: "8GB",
    storage: "50GB",
    createTime: "2025-05-20",
    os: "CentOS 7.9",
    hypervisor: "KVM",
    zone: "可用区B",
    cluster: "集群-02",
    host: "物理主机-04",
    description: "Redis缓存服务器",
    owner: "开发团队",
    cpuUsage: "15%",
    memoryUsage: "80%",
    rootDisk: "50GB / 系统盘",
    dataDisk: "无",
    instanceType: "内存优化型r1.medium",
    networkType: "VPC网络",
    securityGroup: "缓存安全组",
    hostName: "cache-server-01",
    expireTime: "2025-10-31",
    tags: ["开发环境", "缓存"],
    platform: "Linux",
    uptime: "2天4小时",
    powerState: "开机",
    tools: "未安装",
    snapshots: 0,
  },
];
