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
