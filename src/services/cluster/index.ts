/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群初始化服务 - 优化版本，使用统一的API工具
 */

import { api, mockApi, type StandardResponse } from '@/utils/apiHelper';
import { CookieUtils } from '@/utils/cookies';
import { EnvConfig } from '@/config/env';
import type {
  ClusterStatusResponse,
  CreateClusterConfig,
  JoinClusterConfig,
  CreateClusterRequest,
  JoinClusterRequest,
  CreateClusterResponse,
  HostnameResponse,
  IpAddressesResponse,
  DissolveClusterResponse,
  ClusterNodesResponse,
  ClusterSummaryResponse,
  ClusterResourcesResponse,
  ClusterTreeResponse,
  NodeSummaryResponse,
} from "./types";

// 配置区域
const USE_MOCK_DATA = EnvConfig.ENABLE_MOCK; // 通过环境变量控制是否使用模拟数据

class ClusterInitService {
  private readonly AUTH_TOKEN_KEY = "kr_virt_cluster_auth_token";
  private statusCache: {
    data: ClusterStatusResponse;
    timestamp: number;
  } | null = null;
  private readonly CACHE_DURATION = 5000; // 5秒缓存

  /**
   * 获取节点主机名
   */
  async getNodeHostname(): Promise<StandardResponse<{ hostname: string }>> {
    if (USE_MOCK_DATA) {
      return mockApi.get('/node/hostname', {}, {
        useMock: true,
        mockData: { hostname: "cluster-master-node" },
        defaultSuccessMessage: "获取主机名成功",
      });
    }

    return api.get<HostnameResponse>('/node/hostname', {}, {
      skipAuth: true,
      defaultSuccessMessage: "获取主机名成功",
      defaultErrorMessage: "获取主机名失败，请稍后重试",
    });
  }

  /**
   * 获取节点IP地址列表
   */
  async getNodeIpAddresses(): Promise<StandardResponse<{ ip_addresses: string[] }>> {
    if (USE_MOCK_DATA) {
      return mockApi.get('/node/ips', {}, {
        useMock: true,
        mockData: { ip_addresses: ["192.168.1.100", "192.168.1.101", "10.0.0.100"] },
        defaultSuccessMessage: "获取IP地址列表成功",
      });
    }

    return api.get<IpAddressesResponse>('/node/ips', {}, {
      skipAuth: true,
      defaultSuccessMessage: "获取IP地址列表成功",
      defaultErrorMessage: "获取IP地址列表失败，请稍后重试",
    });
  }

  /**
   * 检查集群状态
   */
  async checkClusterStatus(): Promise<ClusterStatusResponse> {
    console.log(
      "🔍 checkClusterStatus API调用 - 来源:",
      new Error().stack?.split("\n")[2]?.trim()
    );

    // 检查缓存
    if (
      this.statusCache &&
      Date.now() - this.statusCache.timestamp < this.CACHE_DURATION
    ) {
      console.log("📋 使用缓存的集群状态");
      return this.statusCache.data;
    }

    if (USE_MOCK_DATA) {
      const result = await this.mockCheckClusterStatus();
      // 缓存结果
      this.statusCache = { data: result, timestamp: Date.now() };
      return result;
    }

    try {
      const result = await api.get<ClusterStatusResponse>('/cluster/status', {}, {
        skipAuth: true,
        showErrorMessage: false, // 检查状态不显示错误
      });

      if (result.success && result.data) {
        // 缓存结果
        this.statusCache = { data: result.data, timestamp: Date.now() };
        return result.data;
      }

      throw new Error("无法获取集群状态");
    } catch (error) {
      console.error("检查集群状态失败:", error);
      throw new Error("无法获取集群状态，请检查网络连接");
    }
  }

  /**
   * 验证一次性密码
   */
  async verifyOneTimePassword(
    password: string
  ): Promise<StandardResponse<{ token: string }>> {
    if (USE_MOCK_DATA) {
      const mockData = password === "testCluster" ? { token: `mock_token_${Date.now()}` } : { token: "" };
      return mockApi.post('/cluster/auth', { one_time_password: password }, {
        useMock: true,
        mockData,
        defaultSuccessMessage: password === "testCluster" ? "验证成功" : "一次性密码错误",
      }) as Promise<StandardResponse<{ token: string }>>;
    }

    const result = await api.post<{ token: string }>('/cluster/auth', {
      one_time_password: password,
    }, {
      skipAuth: true,
      defaultSuccessMessage: "验证成功",
      defaultErrorMessage: "验证失败，请稍后重试",
    });

    // 如果验证成功，保存token
    if (result.success && result.data && 'token' in result.data) {
      CookieUtils.set(this.AUTH_TOKEN_KEY, result.data.token);
    }

    return result;
  }

  /**
   * 创建集群
   */
  async createCluster(
    config: CreateClusterConfig,
    hostname: string
  ): Promise<StandardResponse<CreateClusterResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post('/cluster/create', config, {
        useMock: true,
        mockData: { message: "集群创建请求已提交" },
        defaultSuccessMessage: "集群创建请求已提交",
      }) as Promise<StandardResponse<CreateClusterResponse>>;
    }

    const requestPayload: CreateClusterRequest = {
      ip: config.selectedIp,
      hostname: hostname,
      disposable_secret_key: "moke_disposable_secret_key", // 模拟一次性密钥
    };

    return api.post<CreateClusterResponse>('/cluster/create', requestPayload, {
      skipAuth: true,
      defaultSuccessMessage: "集群创建请求已提交",
      defaultErrorMessage: "创建集群失败，请稍后重试",
    });
  }

  /**
   * 加入集群
   */
  async joinCluster(
    config: JoinClusterConfig
  ): Promise<StandardResponse<{ message: string }>> {
    if (USE_MOCK_DATA) {
      return mockApi.post('/cluster/join', config, {
        useMock: true,
        mockData: { message: "加入集群请求已提交" },
        defaultSuccessMessage: "加入集群请求已提交",
      }) as Promise<StandardResponse<{ message: string }>>;
    }

    // 获取一次性密钥
    const disposableKey = this.getAuthToken();
    if (!disposableKey) {
      return {
        success: false,
        message: "缺少一次性密钥，请先进行身份验证",
      };
    }

    const requestPayload: JoinClusterRequest = {
      ip: config.ip,
      hostname: config.hostname,
      pub_key: config.pub_key,
      disposable_secret_key: disposableKey,
    };

    return api.post<{ message: string }>('/cluster/join', requestPayload, {
      skipAuth: true,
      defaultSuccessMessage: "加入集群请求已提交",
      defaultErrorMessage: "加入集群失败，请稍后重试",
    });
  }

  /**
   * 解散集群
   */
  async dissolveCluster(): Promise<StandardResponse<DissolveClusterResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post('/cluster/dissolve', {}, {
        useMock: true,
        mockData: { message: "集群解散成功" },
        defaultSuccessMessage: "集群解散成功",
      }) as Promise<StandardResponse<DissolveClusterResponse>>;
    }

    return api.post<DissolveClusterResponse>('/cluster/dissolve', {}, {
      skipAuth: false,
      defaultSuccessMessage: "集群解散成功",
      defaultErrorMessage: "解散集群失败，请稍后重试",
    });
  }

  /**
   * 获取集群节点列表
   */
  async getClusterNodes(): Promise<StandardResponse<ClusterNodesResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.get('/cluster/nodes', {}, {
        useMock: true,
        mockData: this.getMockClusterNodes(),
        defaultSuccessMessage: "获取集群节点列表成功",
      });
    }

    return api.get<ClusterNodesResponse>('/cluster/nodes', {}, {
      skipAuth: false,
      defaultSuccessMessage: "获取集群节点列表成功",
      defaultErrorMessage: "获取集群节点列表失败，请检查网络连接",
    });
  }

  /**
   * 获取集群概览信息
   */
  async getClusterSummary(): Promise<StandardResponse<ClusterSummaryResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.get('/cluster/summary', {}, {
        useMock: true,
        mockData: this.getMockClusterSummary(),
        defaultSuccessMessage: "获取集群概览成功",
      });
    }

    return api.get<ClusterSummaryResponse>('/cluster/summary', {}, {
      skipAuth: false,
      defaultSuccessMessage: "获取集群概览成功",
      defaultErrorMessage: "获取集群概览失败，请检查网络连接",
    });
  }

  /**
   * 获取集群资源
   */
  async getClusterResources(): Promise<StandardResponse<ClusterResourcesResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.get('/cluster/resources', {}, {
        useMock: true,
        mockData: this.getMockClusterResources(),
        defaultSuccessMessage: "获取集群资源成功",
      });
    }

    return api.get<ClusterResourcesResponse>('/cluster/resources', {}, {
      skipAuth: false,
      defaultSuccessMessage: "获取集群资源成功",
      defaultErrorMessage: "获取集群资源失败",
    });
  }

  /**
   * 获取集群树结构
   */
  async getClusterTree(): Promise<StandardResponse<ClusterTreeResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.get('/cluster/tree', {}, {
        useMock: true,
        mockData: this.getMockClusterTree(),
        defaultSuccessMessage: "获取集群树成功",
      });
    }

    return api.get<ClusterTreeResponse>('/cluster/tree', {}, {
      skipAuth: false,
      defaultSuccessMessage: "获取集群树成功",
      defaultErrorMessage: "获取集群树失败，请检查网络连接",
    });
  }

  /**
   * 获取节点摘要信息
   */
  async getNodeSummary(hostname: string): Promise<StandardResponse<NodeSummaryResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post('/node/summary', { hostname }, {
        useMock: true,
        mockData: this.getMockNodeSummary(hostname),
        defaultSuccessMessage: "获取节点摘要成功",
      });
    }

    return api.post<NodeSummaryResponse>('/node/summary', { hostname }, {
      skipAuth: false,
      defaultSuccessMessage: "获取节点摘要成功",
      defaultErrorMessage: "获取节点摘要失败，请检查网络连接",
    });
  }

  /**
   * 获取认证token
   */
  getAuthToken(): string | null {
    return CookieUtils.get(this.AUTH_TOKEN_KEY);
  }

  /**
   * 清除认证token
   */
  clearAuthToken(): void {
    CookieUtils.remove(this.AUTH_TOKEN_KEY);
  }

  // ===== 模拟数据方法 =====
  private async mockCheckClusterStatus(): Promise<ClusterStatusResponse> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 模拟不同的状态，可以根据需要修改
    return {
      is_ready: false,
      is_creating: false,
      is_joining: false,
    };
  }

  private getMockClusterNodes(): ClusterNodesResponse {
    return {
      cluster_name: "uos_cluster",
      cluster_uuid: "e00529eda6f5412b8a881dedfdaf2271",
      nodes: [
        {
          name: "localhost.localdomain",
          node_id: "1",
          ip: "192.168.1.187",
          status: "online",
          is_dc: true,
          cpu_total: 8,
          mem_total: 16384,
          cpu_used: 2,
          mem_used: 4096,
          pub_key: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC/OnZXiXMbg5IZadg/ZvKxt++Q7k5nyThvuJ4ljm7R2nBmx+9i4THeEVB/gmAcsjanLm5bC6LgNECSlJbxh6ZUwQKP7XjBQ/VDv74M3HZS0mpoQa7eZkhtjx4+Ry04x760p/YvjFmv5vycbxIDrpF/cOneOnzDv95dhliJwfxTX5w7RBG7sxVT0uocfFUdndbAYmJnZvfT5l9PH/Ru7Z094p07SFckY9MGcVZG0QFfvQ/DiP5s/CGeAVTGN/yWxRt24V0R/u0g4BytzCjP8vNB7nsuiIjG1gJux1UJ7Ze2OdBHK5gQSOOHttMn7U8lBZXfccVLBT/NKBaUWs/bt249 root@localhost.localdomain"
        },
        {
          name: "node2.localdomain",
          node_id: "2",
          ip: "192.168.1.102",
          status: "online",
          is_dc: false,
          cpu_total: 8,
          mem_total: 16384,
          cpu_used: 1,
          mem_used: 2048,
          pub_key: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC8eR7fJ6GGN4iHl8cBVXVDCi9mQ2pQw3Qz5FjH8QnV7x0YzKf6nqWJtC2eE8dNhQWm5vR4KmVbL9tX3U7Yd6qJ9F8vG2kH3L0nE4tS6wQ9nP7mF3bD8xY5eR9fT6cK1nV3sM7jE9tQ2nG5kH8mF4dS7wY1eZ8qP6vN9tX2cL0uI5hE7fT3nY9kJ6mG1xS4wR8qP7eN5bH9tQ3cK0uJ6fL2nV7xY8dS5wG4kH1eM9tQ6bP3cF7nY0uI2hE8fT5kJ9vN1xS6wR4qP2eL7bH0tQ3cK9uJ5fG8nV4xY1dS7wM6kH3eT0qP9vN2bL5fH8tQ7cK4uJ1fG6nY3xS0wR9qP5eL2bH7tQ8cK3uJ6fG1nV9xY4dS2wM5kH8e root@node2.localdomain"
        },
        {
          name: "node3.localdomain", 
          node_id: "3",
          ip: "192.168.1.103",
          status: "standby",
          is_dc: false,
          cpu_total: 4,
          mem_total: 8192,
          cpu_used: null,
          mem_used: null,
          pub_key: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD1cF7nY0uI2hE8fT5kJ9vN1xS6wR4qP2eL7bH0tQ3cK9uJ5fG8nV4xY1dS7wM6kH3eT0qP9vN2bL5fH8tQ7cK4uJ1fG6nY3xS0wR9qP5eL2bH7tQ8cK3uJ6fG1nV9xY4dS2wM5kH8eR7fJ6GGN4iHl8cBVXVDCi9mQ2pQw3Qz5FjH8QnV7x0YzKf6nqWJtC2eE8dNhQWm5vR4KmVbL9tX3U7Yd6qJ9F8vG2kH3L0nE4tS6wQ9nP7mF3bD8xY5eR9fT6cK1nV3sM7jE9tQ2nG5kH8mF4dS7wY1eZ8qP6vN9tX2cL0u root@node3.localdomain"
        },
      ],
    };
  }

  private getMockClusterSummary(): ClusterSummaryResponse {
    return {
      cluster_name: "KR-Virt Cluster",
      stack: "corosync",
      dc_node: "localhost.localdomain",
      dc_version: "2.1.7",
      dc_quorum: "2",
      last_updated: "2025-06-13 14:30:15",
      last_change_time: "2025-06-13 14:25:30",
      last_change_user: "root",
      last_change_via: "crmsh",
      last_change_node: "localhost.localdomain",
      nodes_configured: 3,
      resources_configured: 5,
      nodes: [
        {
          name: "localhost.localdomain",
          status: "online",
        },
        {
          name: "node2.localdomain",
          status: "online",
        },
        {
          name: "node3.localdomain",
          status: "standby",
        },
      ],
      resources: [
        {
          name: "virtual-ip",
          type: "IPaddr2",
          status: "started",
          node: "localhost.localdomain",
        },
        {
          name: "storage-service",
          type: "Filesystem",
          status: "started",
          node: "node2.localdomain",
        },
        {
          name: "web-service",
          type: "systemd:httpd",
          status: "stopped",
          node: "localhost.localdomain",
        },
        {
          name: "database-service",
          type: "systemd:mysql",
          status: "started",
          node: "localhost.localdomain",
        },
        {
          name: "backup-service",
          type: "systemd:backup",
          status: "failed",
          node: "node3.localdomain",
        },
      ],
      daemons: {
        pacemaker: "active",
        corosync: "active",
        "pacemaker-remoted": "inactive",
        "dlm": "active",
      },
    };
  }

  private getMockClusterResources(): ClusterResourcesResponse {
    return {
      group: [
        {
          group: "web-services",
          resources: [
            {
              id: "nginx-service",
              class_: "ocf",
              provider: "heartbeat",
              type: "nginx",
              attributes: {
                config: "/etc/nginx/nginx.conf",
                pid: "/var/run/nginx.pid",
                port: "80",
              },
              operations: [
                {
                  name: "monitor",
                  interval: "30s",
                  timeout: "30s",
                },
                {
                  name: "start",
                  interval: "0s",
                  timeout: "60s",
                },
              ],
            },
          ],
        },
      ],
      resources: [
        {
          id: "virtual-ip-1",
          class_: "ocf",
          provider: "heartbeat",
          type: "IPaddr2",
          attributes: {
            ip: "192.168.1.100",
            cidr_netmask: "24",
            nic: "eth0",
          },
          operations: [
            {
              name: "monitor",
              interval: "10s",
              timeout: "20s",
            },
          ],
        },
      ],
    };
  }

  private getMockClusterTree(): ClusterTreeResponse {
    return {
      cluster_name: "uos_cluster",
      cluster_uuid: "e00529eda6f5412b8a881dedfdaf2271",
      nodes: [
        {
          name: "localhost.localdomain",
          status: "online",
          ip: "192.168.1.187",
          node_id: "1",
          is_dc: true,
        },
        {
          name: "node2.kr-virt.local", 
          status: "online",
          ip: "192.168.1.102",
          node_id: "node-002",
          is_dc: false,
        },
      ],
      networks: [
        {
          name: "br0",
          status: "active",
          type: "bridge",
        },
        {
          name: "virbr0",
          status: "active",
          type: "virtual",
        },
      ],
      storages: [
        {
          name: "local",
          status: "active",
          size: 1024000,
          used: 102400,
        },
        {
          name: "shared-storage",
          status: "active",
          size: 2048000,
          used: 512000,
        },
      ],
    };
  }

  private getMockNodeSummary(hostname: string): NodeSummaryResponse {
    return {
      cluster_name: "uos_cluster",
      node_name: hostname,
      running_time: 216000, // 60小时，单位为秒
      cpu_total: 8,
      mem_total: 16384,
      cpu_used: 2,
      mem_used: 4096,
      vms_num: 5,
      running_vm_num: 3,
      stopped_vm_num: 1,
      paused_vm_num: 0,
      suspended_vm_num: 1,
      error_vm_num: 0,
      other_vm_num: 0,
      storage_total: 2048,      // 2TB存储
      storage_used: 1024,       // 已用1TB
      network_throughput: 1000, // 1Gbps网络
      load_average: "0.8,1.2,1.5", // 系统负载
      vm_max_allowed: 50,       // 最大支持50台虚拟机
      power_state: "powered_on", // 电源状态
    };
  }
}

// 创建并导出集群初始化服务实例
export const clusterInitService = new ClusterInitService();

// 导出类型
export * from "./types";

// 导出类（用于测试或特殊需求）
export { ClusterInitService };

// 默认导出
export default clusterInitService;
