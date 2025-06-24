/**
 * 集群相关测试数据
 * 提供集群管理功能的标准测试数据
 */

// 集群节点数据
export const mockClusterNodes = [
  {
    id: 'node155',
    name: 'node155',
    type: 'host',
    status: 'online',
    ip: '192.168.1.155',
    cpu_usage: 45.2,
    memory_usage: 67.8,
    disk_usage: 34.5,
    parent: null,
    children: []
  },
  {
    id: 'node156',
    name: 'node156',
    type: 'host',
    status: 'offline',
    ip: '192.168.1.156',
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    parent: null,
    children: []
  },
  {
    id: 'vm001',
    name: 'vm001',
    type: 'vm',
    status: 'running',
    ip: '192.168.1.201',
    cpu_usage: 23.1,
    memory_usage: 45.6,
    disk_usage: 78.9,
    parent: 'node155',
    children: []
  }
];

// 集群状态数据
export const mockClusterStatus = {
  total_hosts: 2,
  online_hosts: 1,
  offline_hosts: 1,
  total_vms: 1,
  running_vms: 1,
  stopped_vms: 0,
  cluster_health: 'warning'
};

// 集群初始化配置
export const mockClusterInitConfig = {
  cluster_name: 'test-cluster',
  management_network: '192.168.1.0/24',
  storage_network: '192.168.2.0/24',
  hosts: [
    {
      hostname: 'node155',
      ip: '192.168.1.155',
      role: 'master'
    },
    {
      hostname: 'node156',
      ip: '192.168.1.156',
      role: 'worker'
    }
  ]
};

// 主机详情数据
export const mockHostDetails = {
  id: 'node155',
  name: 'node155',
  ip: '192.168.1.155',
  status: 'online',
  hardware: {
    cpu: {
      model: 'Intel Xeon E5-2680 v4',
      cores: 28,
      threads: 56,
      frequency: '2.40GHz'
    },
    memory: {
      total: '128GB',
      available: '41GB',
      usage: 67.8
    },
    storage: [
      {
        device: '/dev/sda',
        size: '1TB',
        type: 'SSD',
        usage: 34.5
      }
    ],
    network: [
      {
        interface: 'eth0',
        ip: '192.168.1.155',
        status: 'up',
        speed: '1Gbps'
      }
    ]
  },
  vms: [
    {
      id: 'vm001',
      name: 'vm001',
      status: 'running',
      cpu_cores: 4,
      memory: '8GB',
      disk: '100GB'
    }
  ]
};
