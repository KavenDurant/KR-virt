/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群初始化服务 - 优化版本，使用统一的API工具
 */

import { api, mockApi, type StandardResponse } from "@/utils/apiHelper";
import { CookieUtils } from "@/utils/cookies";
import { EnvConfig } from "@/config/env";
import type {
  ClusterStatusResponse,
  CreateClusterConfig,
  JoinClusterConfig,
  CreateClusterRequest,
  JoinClusterRequest,
  CreateClusterResponse,
  AddNodeRequest,
  AddNodeResponse,
  RemoveNodeRequest,
  RemoveNodeResponse,
  HostnameResponse,
  IpAddressesResponse,
  DissolveClusterResponse,
  ClusterNodesResponse,
  ClusterSummaryResponse,
  ClusterResourcesResponse,
  ClusterTreeResponse,
  NodeSummaryResponse,
  NodeOperationResponse,
  NodeStatusResponse,
  VMigrationRequest,
  VMigrationResponse,
  NodePCIResponse,
  NodeDisksResponse,
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
      return mockApi.get(
        "/node/hostname",
        {},
        {
          useMock: true,
          mockData: { hostname: "cluster-master-node" },
          defaultSuccessMessage: "获取主机名成功",
        }
      );
    }

    return api.get<HostnameResponse>(
      "/node/hostname",
      {},
      {
        skipAuth: true,
        defaultSuccessMessage: "获取主机名成功",
        defaultErrorMessage: "获取主机名失败，请稍后重试",
      }
    );
  }

  /**
   * 获取节点IP地址列表
   */
  async getNodeIpAddresses(): Promise<
    StandardResponse<{ ip_addresses: string[] }>
  > {
    if (USE_MOCK_DATA) {
      return mockApi.get(
        "/node/ips",
        {},
        {
          useMock: true,
          mockData: {
            ip_addresses: ["192.168.1.100", "192.168.1.101", "10.0.0.100"],
          },
          defaultSuccessMessage: "获取IP地址列表成功",
        }
      );
    }

    return api.get<IpAddressesResponse>(
      "/node/ips",
      {},
      {
        skipAuth: true,
        defaultSuccessMessage: "获取IP地址列表成功",
        defaultErrorMessage: "获取IP地址列表失败，请稍后重试",
      }
    );
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
      const result = await api.get<ClusterStatusResponse>(
        "/cluster/status",
        {},
        {
          skipAuth: true,
          showErrorMessage: false, // 检查状态不显示错误
        }
      );

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
      const mockData =
        password === "testCluster"
          ? { token: `mock_token_${Date.now()}` }
          : { token: "" };
      return mockApi.post(
        "/cluster/auth",
        { one_time_password: password },
        {
          useMock: true,
          mockData,
          defaultSuccessMessage:
            password === "testCluster" ? "验证成功" : "一次性密码错误",
        }
      ) as Promise<StandardResponse<{ token: string }>>;
    }

    const result = await api.post<{ token: string }>(
      "/cluster/auth",
      {
        one_time_password: password,
      },
      {
        skipAuth: true,
        defaultSuccessMessage: "验证成功",
        defaultErrorMessage: "验证失败，请稍后重试",
      }
    );

    // 如果验证成功，保存token
    if (result.success && result.data && "token" in result.data) {
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
      return mockApi.post("/cluster/create", config, {
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

    return api.post<CreateClusterResponse>("/cluster/create", requestPayload, {
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
      return mockApi.post("/cluster/join", config, {
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

    return api.post<{ message: string }>("/cluster/join", requestPayload, {
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
      return mockApi.post(
        "/cluster/dissolve",
        {},
        {
          useMock: true,
          mockData: { message: "集群解散成功" },
          defaultSuccessMessage: "集群解散成功",
        }
      ) as Promise<StandardResponse<DissolveClusterResponse>>;
    }

    return api.post<DissolveClusterResponse>(
      "/cluster/dissolve",
      {},
      {
        skipAuth: false,
        defaultSuccessMessage: "集群解散成功",
        defaultErrorMessage: "解散集群失败，请稍后重试",
      }
    );
  }

  /**
   * 添加节点到集群
   */
  async addNode(
    nodeData: AddNodeRequest
  ): Promise<StandardResponse<AddNodeResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/cluster/approve", nodeData, {
        useMock: true,
        mockData: {
          message: `节点 ${nodeData.join_hostname} (${nodeData.join_ip}) 添加成功`,
          node_id: `node-${Date.now()}`,
          status: "approved",
        },
        defaultSuccessMessage: "节点添加成功",
      }) as Promise<StandardResponse<AddNodeResponse>>;
    }

    return api.post<AddNodeResponse>("/cluster/approve", nodeData, {
      skipAuth: false,
      defaultSuccessMessage: "节点添加成功",
      defaultErrorMessage: "添加节点失败，请检查节点信息",
    });
  }

  /**
   * 移除节点从集群
   */
  async removeNode(
    nodeData: RemoveNodeRequest
  ): Promise<StandardResponse<RemoveNodeResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/cluster/remove", nodeData, {
        useMock: true,
        mockData: {
          message: `节点 ${nodeData.hostname} 已成功从集群中移除`,
        },
        defaultSuccessMessage: "节点移除成功",
      }) as Promise<StandardResponse<RemoveNodeResponse>>;
    }

    return api.post<RemoveNodeResponse>("/cluster/remove", nodeData, {
      skipAuth: false,
      defaultSuccessMessage: "节点移除成功",
      defaultErrorMessage: "移除节点失败，请检查节点状态",
    });
  }

  /**
   * 获取集群节点列表
   */
  async getClusterNodes(): Promise<StandardResponse<ClusterNodesResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.get(
        "/cluster/nodes",
        {},
        {
          useMock: true,
          mockData: this.getMockClusterNodes(),
          defaultSuccessMessage: "获取集群节点列表成功",
        }
      );
    }

    return api.get<ClusterNodesResponse>(
      "/cluster/nodes",
      {},
      {
        skipAuth: false,
        defaultSuccessMessage: "获取集群节点列表成功",
        defaultErrorMessage: "获取集群节点列表失败，请检查网络连接",
      }
    );
  }

  /**
   * 获取集群概览信息
   */
  async getClusterSummary(): Promise<StandardResponse<ClusterSummaryResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.get(
        "/cluster/summary",
        {},
        {
          useMock: true,
          mockData: this.getMockClusterSummary(),
          defaultSuccessMessage: "获取集群概览成功",
        }
      );
    }

    return api.get<ClusterSummaryResponse>(
      "/cluster/summary",
      {},
      {
        skipAuth: false,
        defaultSuccessMessage: "获取集群概览成功",
        defaultErrorMessage: "获取集群概览失败，请检查网络连接",
      }
    );
  }

  /**
   * 获取集群资源
   */
  async getClusterResources(): Promise<
    StandardResponse<ClusterResourcesResponse>
  > {
    if (USE_MOCK_DATA) {
      return mockApi.get(
        "/cluster/resources",
        {},
        {
          useMock: true,
          mockData: this.getMockClusterResources(),
          defaultSuccessMessage: "获取集群资源成功",
        }
      );
    }

    return api.get<ClusterResourcesResponse>(
      "/cluster/resources",
      {},
      {
        skipAuth: false,
        defaultSuccessMessage: "获取集群资源成功",
        defaultErrorMessage: "获取集群资源失败",
      }
    );
  }

  /**
   * 获取集群树结构
   */
  async getClusterTree(): Promise<StandardResponse<ClusterTreeResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.get(
        "/cluster/tree",
        {},
        {
          useMock: true,
          mockData: this.getMockClusterTree(),
          defaultSuccessMessage: "获取集群树成功",
        }
      );
    }

    return api.get<ClusterTreeResponse>(
      "/cluster/tree",
      {},
      {
        skipAuth: false,
        defaultSuccessMessage: "获取集群树成功",
        defaultErrorMessage: "获取集群树失败，请检查网络连接",
      }
    );
  }

  /**
   * 获取节点摘要信息
   */
  async getNodeSummary(
    hostname: string
  ): Promise<StandardResponse<NodeSummaryResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/node/summary",
        { hostname },
        {
          useMock: true,
          mockData: this.getMockNodeSummary(hostname),
          defaultSuccessMessage: "获取节点摘要成功",
        }
      );
    }

    return api.post<NodeSummaryResponse>(
      "/node/summary",
      { hostname },
      {
        skipAuth: false,
        defaultSuccessMessage: "获取节点摘要成功",
        defaultErrorMessage: "获取节点摘要失败，请检查网络连接",
      }
    );
  }

  /**
   * 获取物理机PCI设备列表
   */
  async getNodePCIDevices(
    hostname: string
  ): Promise<StandardResponse<NodePCIResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/node/pcis",
        { hostname },
        {
          useMock: true,
          mockData: this.getMockNodePCIDevices(hostname),
          defaultSuccessMessage: "获取PCI设备列表成功",
        }
      );
    }

    return api.post<NodePCIResponse>(
      "/node/pcis",
      { hostname },
      {
        skipAuth: false,
        defaultSuccessMessage: "获取PCI设备列表成功",
        defaultErrorMessage: "获取PCI设备列表失败，请检查网络连接",
      }
    );
  }

  /**
   * 获取物理机硬盘设备列表
   */
  async getNodeDiskDevices(
    hostname: string
  ): Promise<StandardResponse<NodeDisksResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/node/disks",
        { hostname },
        {
          useMock: true,
          mockData: this.getMockNodeDiskDevices(hostname),
          defaultSuccessMessage: "获取硬盘设备列表成功",
        }
      );
    }

    return api.post<NodeDisksResponse>(
      "/node/disks",
      { hostname },
      {
        skipAuth: false,
        defaultSuccessMessage: "获取硬盘设备列表成功",
        defaultErrorMessage: "获取硬盘设备列表失败，请检查网络连接",
      }
    );
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

  // ===== 节点操作方法 =====

  /**
   * 检查节点状态，包括虚拟机运行情况
   * 注意：此接口暂不可用，请使用getNodeSummary获取节点信息
   */
  async checkNodeStatus(
    hostname: string
  ): Promise<StandardResponse<NodeStatusResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.get(
        "/node/status",
        { hostname },
        {
          useMock: true,
          mockData: this.getMockNodeStatus(hostname),
          defaultSuccessMessage: "获取节点状态成功",
        }
      );
    }

    // 返回接口不可用的错误信息
    return Promise.resolve({
      success: false,
      message:
        "checkNodeStatus接口暂不可用，请使用getNodeSummary接口获取节点详细信息",
    });
  }

  /**
   * 关机节点
   */
  async stopNode(
    hostname: string
  ): Promise<StandardResponse<NodeOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/node/stop",
        { hostname },
        {
          useMock: true,
          mockData: {
            message: `节点 ${hostname} 关机指令已发送`,
            success: true,
          },
          defaultSuccessMessage: "节点关机指令已发送",
        }
      );
    }

    return api.post<NodeOperationResponse>(
      "/node/stop",
      { hostname },
      {
        skipAuth: false,
        defaultSuccessMessage: "节点关机指令已发送",
        defaultErrorMessage: "节点关机失败，请稍后重试",
      }
    );
  }

  /**
   * 重启节点
   */
  async rebootNode(
    hostname: string
  ): Promise<StandardResponse<NodeOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/node/reboot",
        { hostname },
        {
          useMock: true,
          mockData: {
            message: `节点 ${hostname} 重启指令已发送`,
            success: true,
          },
          defaultSuccessMessage: "节点重启指令已发送",
        }
      );
    }

    return api.post<NodeOperationResponse>(
      "/node/reboot",
      { hostname },
      {
        skipAuth: false,
        defaultSuccessMessage: "节点重启指令已发送",
        defaultErrorMessage: "节点重启失败，请稍后重试",
      }
    );
  }

  /**
   * 进入维护模式
   */
  async enterMaintenanceMode(
    hostname: string
  ): Promise<StandardResponse<NodeOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/node/enter_maintenance",
        { hostname },
        {
          useMock: true,
          mockData: {
            message: `节点 ${hostname} 已进入维护模式`,
            success: true,
          },
          defaultSuccessMessage: "节点已进入维护模式",
        }
      );
    }

    return api.post<NodeOperationResponse>(
      "/node/enter_maintenance",
      { hostname },
      {
        skipAuth: false,
        defaultSuccessMessage: "节点已进入维护模式",
        defaultErrorMessage: "进入维护模式失败，请稍后重试",
      }
    );
  }

  /**
   * 退出维护模式
   */
  async exitMaintenanceMode(
    hostname: string
  ): Promise<StandardResponse<NodeOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/node/exit_maintenance",
        { hostname },
        {
          useMock: true,
          mockData: {
            message: `节点 ${hostname} 已退出维护模式`,
            success: true,
          },
          defaultSuccessMessage: "节点已退出维护模式",
        }
      );
    }

    return api.post<NodeOperationResponse>(
      "/node/exit_maintenance",
      { hostname },
      {
        skipAuth: false,
        defaultSuccessMessage: "节点已退出维护模式",
        defaultErrorMessage: "退出维护模式失败，请稍后重试",
      }
    );
  }

  /**
   * 迁移虚拟机 (暂时只返回占位实现)
   */
  async migrateVM(
    vmMigrationData: VMigrationRequest
  ): Promise<StandardResponse<VMigrationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/migrate", vmMigrationData, {
        useMock: true,
        mockData: {
          message: `虚拟机 ${vmMigrationData.vm_id} 迁移任务已创建`,
          task_id: `migration_${Date.now()}`,
        },
        defaultSuccessMessage: "虚拟机迁移任务已创建",
      });
    }

    // TODO: 实际API实现，暂时返回未实现消息
    return Promise.resolve({
      success: false,
      message: "虚拟机迁移功能暂未实现",
    });
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
          pub_key:
            "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC/OnZXiXMbg5IZadg/ZvKxt++Q7k5nyThvuJ4ljm7R2nBmx+9i4THeEVB/gmAcsjanLm5bC6LgNECSlJbxh6ZUwQKP7XjBQ/VDv74M3HZS0mpoQa7eZkhtjx4+Ry04x760p/YvjFmv5vycbxIDrpF/cOneOnzDv95dhliJwfxTX5w7RBG7sxVT0uocfFUdndbAYmJnZvfT5l9PH/Ru7Z094p07SFckY9MGcVZG0QFfvQ/DiP5s/CGeAVTGN/yWxRt24V0R/u0g4BytzCjP8vNB7nsuiIjG1gJux1UJ7Ze2OdBHK5gQSOOHttMn7U8lBZXfccVLBT/NKBaUWs/bt249 root@localhost.localdomain",
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
          pub_key:
            "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC8eR7fJ6GGN4iHl8cBVXVDCi9mQ2pQw3Qz5FjH8QnV7x0YzKf6nqWJtC2eE8dNhQWm5vR4KmVbL9tX3U7Yd6qJ9F8vG2kH3L0nE4tS6wQ9nP7mF3bD8xY5eR9fT6cK1nV3sM7jE9tQ2nG5kH8mF4dS7wY1eZ8qP6vN9tX2cL0uI5hE7fT3nY9kJ6mG1xS4wR8qP7eN5bH9tQ3cK0uJ6fL2nV7xY8dS5wG4kH1eM9tQ6bP3cF7nY0uI2hE8fT5kJ9vN1xS6wR4qP2eL7bH0tQ3cK9uJ5fG8nV4xY1dS7wM6kH3eT0qP9vN2bL5fH8tQ7cK4uJ1fG6nY3xS0wR9qP5eL2bH7tQ8cK3uJ6fG1nV9xY4dS2wM5kH8e root@node2.localdomain",
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
          pub_key:
            "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD1cF7nY0uI2hE8fT5kJ9vN1xS6wR4qP2eL7bH0tQ3cK9uJ5fG8nV4xY1dS7wM6kH3eT0qP9vN2bL5fH8tQ7cK4uJ1fG6nY3xS0wR9qP5eL2bH7tQ8cK3uJ6fG1nV9xY4dS2wM5kH8eR7fJ6GGN4iHl8cBVXVDCi9mQ2pQw3Qz5FjH8QnV7x0YzKf6nqWJtC2eE8dNhQWm5vR4KmVbL9tX3U7Yd6qJ9F8vG2kH3L0nE4tS6wQ9nP7mF3bD8xY5eR9fT6cK1nV3sM7jE9tQ2nG5kH8mF4dS7wY1eZ8qP6vN9tX2cL0u root@node3.localdomain",
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
        dlm: "active",
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
      disk_total: 512, // 物理机系统盘总容量512GB
      disk_used: 256, // 物理机系统盘已用容量256GB
      cpu_used: 2,
      mem_used: 4096,
      vms_num: 5,
      running_vm_num: 3,
      stopped_vm_num: 1,
      paused_vm_num: 0,
      suspended_vm_num: 1,
      error_vm_num: 0,
      other_vm_num: 0,
      storage_total: 2048, // 2TB存储
      storage_used: 1024, // 已用1TB
      network_throughput: 1000, // 1Gbps网络
      load_average: "0.8,1.2,1.5", // 系统负载
      vm_max_allowed: 50, // 最大支持50台虚拟机
      power_state: "powered_on", // 电源状态
    };
  }

  /**
   * 获取模拟节点状态
   */
  private getMockNodeStatus(hostname: string): NodeStatusResponse {
    return {
      hostname: hostname,
      status: "online",
      running_vms: 3,
      stopped_vms: 2,
      maintenance_mode: false,
      power_state: "powered_on",
    };
  }

  /**
   * 获取模拟PCI设备列表
   */
  private getMockNodePCIDevices(hostname: string): NodePCIResponse {
    return {
      hostname,
      devices: [
        {
          slot: "0000:00:1f.2",
          vendor_id: "8086",
          device_id: "2922",
          vendor_name: "Intel Corporation",
          device_name:
            "6 Series/C200 Series Chipset Family SATA AHCI Controller",
          device_type: "SATA controller",
          iommu_group: 15,
        },
        {
          slot: "0000:00:02.0",
          vendor_id: "8086",
          device_id: "0126",
          vendor_name: "Intel Corporation",
          device_name:
            "2nd Generation Core Processor Family Integrated Graphics Controller",
          device_type: "VGA compatible controller",
          iommu_group: 1,
        },
        {
          slot: "0000:00:1a.0",
          vendor_id: "8086",
          device_id: "1c2d",
          vendor_name: "Intel Corporation",
          device_name:
            "6 Series/C200 Series Chipset Family USB Enhanced Host Controller #2",
          device_type: "USB controller",
          iommu_group: 12,
        },
        {
          slot: "0000:02:00.0",
          vendor_id: "14e4",
          device_id: "165f",
          vendor_name: "Broadcom Inc. and subsidiaries",
          device_name: "NetXtreme BCM5720 Gigabit Ethernet PCIe",
          device_type: "Ethernet controller",
          iommu_group: 18,
        },
        {
          slot: "0000:03:00.0",
          vendor_id: "1000",
          device_id: "0072",
          vendor_name: "LSI Logic / Symbios Logic",
          device_name: "SAS2008 PCI-Express Fusion-MPT SAS-2 [Falcon]",
          device_type: "Serial Attached SCSI controller",
          iommu_group: 19,
        },
      ],
    };
  }

  /**
   * 获取模拟硬盘设备列表
   */
  private getMockNodeDiskDevices(_hostname: string): NodeDisksResponse {
    return {
      devices: [
        {
          name: "/dev/sda",
          major_minor: "8:0",
          removable: false,
          size_gb: 500,
          read_only: false,
          device_type: "disk",
          mount_point: "",
          parent: "",
          filesystem: "",
          total_size_gb: 500,
          used_size_gb: 250,
          available_size_gb: 250,
          percentage_value: 50,
        },
        {
          name: "/dev/sda1",
          major_minor: "8:1",
          removable: false,
          size_gb: 1,
          read_only: false,
          device_type: "part",
          mount_point: "/boot",
          parent: "/dev/sda",
          filesystem: "ext4",
          total_size_gb: 1,
          used_size_gb: 0.2,
          available_size_gb: 0.8,
          percentage_value: 20,
        },
        {
          name: "/dev/sda2",
          major_minor: "8:2",
          removable: false,
          size_gb: 499,
          read_only: false,
          device_type: "part",
          mount_point: "/",
          parent: "/dev/sda",
          filesystem: "ext4",
          total_size_gb: 499,
          used_size_gb: 249.8,
          available_size_gb: 249.2,
          percentage_value: 50,
        },
        {
          name: "/dev/sdb",
          major_minor: "8:16",
          removable: false,
          size_gb: 1000,
          read_only: false,
          device_type: "disk",
          mount_point: "/var/lib/virt",
          parent: "",
          filesystem: "ext4",
          total_size_gb: 1000,
          used_size_gb: 300,
          available_size_gb: 700,
          percentage_value: 30,
        },
        {
          name: "/dev/sr0",
          major_minor: "11:0",
          removable: true,
          size_gb: 0,
          read_only: true,
          device_type: "rom",
          mount_point: "",
          parent: "",
          filesystem: "",
          total_size_gb: 0,
          used_size_gb: 0,
          available_size_gb: 0,
          percentage_value: 0,
        },
      ],
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
