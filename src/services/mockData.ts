// Mock数据服务 - 模拟PVE风格的集群和虚拟机数据
export interface VirtualMachine {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'suspended' | 'error';
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
  type: 'node';
  status: 'online' | 'offline';
  cpu: number;
  memory: number;
  uptime: string;
  vms: VirtualMachine[];
}

export interface Cluster {
  id: string;
  name: string;
  type: 'cluster';
  status: 'healthy' | 'warning' | 'error';
  nodes: Node[];
}

export interface DataCenter {
  id: string;
  name: string;
  type: 'datacenter';
  clusters: Cluster[];
}

// Mock数据
export const mockDataCenter: DataCenter = {
  id: 'datacenter-1',
  name: 'DataCenter-Main',
  type: 'datacenter',
  clusters: [
    {
      id: 'cluster-1',
      name: 'Production-Cluster',
      type: 'cluster',
      status: 'healthy',
      nodes: [
        {
          id: 'node-1',
          name: 'pve-node-01',
          type: 'node',
          status: 'online',
          cpu: 85,
          memory: 78,
          uptime: '15 天',
          vms: [
            {
              id: 'vm-101',
              name: 'web-server-01',
              status: 'running',
              type: 'qemu',
              vmid: 101,
              cpu: 4,
              memory: 8,
              diskSize: 100,
              node: 'pve-node-01',
              uptime: '12 天 8 小时'
            },
            {
              id: 'vm-102',
              name: 'database-01',
              status: 'running',
              type: 'qemu',
              vmid: 102,
              cpu: 8,
              memory: 16,
              diskSize: 500,
              node: 'pve-node-01',
              uptime: '12 天 8 小时'
            },
            {
              id: 'vm-103',
              name: 'app-server-01',
              status: 'stopped',
              type: 'qemu',
              vmid: 103,
              cpu: 2,
              memory: 4,
              diskSize: 50,
              node: 'pve-node-01'
            },
            {
              id: 'vm-104',
              name: 'redis-cache',
              status: 'running',
              type: 'lxc',
              vmid: 104,
              cpu: 1,
              memory: 2,
              diskSize: 20,
              node: 'pve-node-01',
              uptime: '8 天 15 小时'
            },
            {
              id: 'vm-105',
              name: 'file-server',
              status: 'running',
              type: 'qemu',
              vmid: 105,
              cpu: 2,
              memory: 8,
              diskSize: 2000,
              node: 'pve-node-01',
              uptime: '20 天 4 小时'
            }
          ]
        },
        {
          id: 'node-2',
          name: 'pve-node-02',
          type: 'node',
          status: 'online',
          cpu: 65,
          memory: 45,
          uptime: '15 天',
          vms: [
            {
              id: 'vm-201',
              name: 'backup-server',
              status: 'running',
              type: 'qemu',
              vmid: 201,
              cpu: 2,
              memory: 8,
              diskSize: 1000,
              node: 'pve-node-02',
              uptime: '10 天 3 小时'
            },
            {
              id: 'vm-202',
              name: 'monitoring-01',
              status: 'running',
              type: 'lxc',
              vmid: 202,
              cpu: 1,
              memory: 2,
              diskSize: 20,
              node: 'pve-node-02',
              uptime: '15 天 1 小时'
            }
          ]
        }
      ]
    },
    {
      id: 'cluster-2',
      name: 'Development-Cluster',
      type: 'cluster',
      status: 'healthy',
      nodes: [
        {
          id: 'node-3',
          name: 'dev-node-01',
          type: 'node',
          status: 'online',
          cpu: 45,
          memory: 60,
          uptime: '7 天',
          vms: [
            {
              id: 'vm-301',
              name: 'dev-web-01',
              status: 'running',
              type: 'qemu',
              vmid: 301,
              cpu: 2,
              memory: 4,
              diskSize: 50,
              node: 'dev-node-01',
              uptime: '5 天 12 小时'
            },
            {
              id: 'vm-302',
              name: 'test-env-01',
              status: 'suspended',
              type: 'qemu',
              vmid: 302,
              cpu: 1,
              memory: 2,
              diskSize: 30,
              node: 'dev-node-01'
            }
          ]
        }
      ]
    },
    {
      id: 'cluster-3',
      name: 'Testing-Cluster',
      type: 'cluster',
      status: 'warning',
      nodes: [
        {
          id: 'node-4',
          name: 'test-node-01',
          type: 'node',
          status: 'offline',
          cpu: 0,
          memory: 0,
          uptime: '离线',
          vms: [
            {
              id: 'vm-401',
              name: 'test-vm-01',
              status: 'error',
              type: 'qemu',
              vmid: 401,
              cpu: 2,
              memory: 4,
              diskSize: 40,
              node: 'test-node-01'
            }
          ]
        }
      ]
    }
  ]
};

// 获取侧边栏数据的服务
export const getSidebarData = (modulePath: string) => {
  switch (modulePath) {
    case '/virtual-machine':
      return mockDataCenter;
    case '/cluster':
      return mockDataCenter;
    default:
      return null;
  }
};

// 获取状态颜色
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
    case 'online':
    case 'healthy':
      return '#52c41a';
    case 'stopped':
    case 'offline':
      return '#ff4d4f';
    case 'suspended':
    case 'warning':
      return '#faad14';
    case 'error':
      return '#ff4d4f';
    default:
      return '#d9d9d9';
  }
};

// 获取状态图标
export const getStatusIcon = (type: string) => {
  if (type === 'qemu') {
    return '🖥️';
  } else if (type === 'lxc') {
    return '📦';
  } else if (type === 'node') {
    return '🖲️';
  } else if (type === 'cluster') {
    return '🔗';
  } else if (type === 'datacenter') {
    return '🏢';
  }
  return '📁';
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
