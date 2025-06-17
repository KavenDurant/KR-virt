/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群初始化服务
 */

import request from "@/utils/request";
import { CookieUtils } from "@/utils/cookies";
import { EnvConfig } from "@/config/env";
import type { RequestConfig } from "@/utils/request";
import type {
  ClusterStatusResponse,
  CreateClusterConfig,
  JoinClusterConfig,
  CreateClusterRequest,
  JoinClusterRequest,
  CreateClusterResponse,
  ValidationErrorResponse,
  HostnameResponse,
  IpAddressesResponse,
  DissolveClusterResponse,
  DissolveClusterErrorResponse,
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
  async getNodeHostname(): Promise<{
    success: boolean;
    hostname?: string;
    message: string;
  }> {
    if (USE_MOCK_DATA) {
      return this.mockGetNodeHostname();
    }

    try {
      const response = await request.get<HostnameResponse>(`/node/hostname`, {
        skipAuth: true,
        showErrorMessage: false,
      } as RequestConfig);

      const result = response.data;
      return {
        success: true,
        hostname: result.hostname,
        message: "获取主机名成功",
      };
    } catch (error) {
      console.error("获取节点主机名失败:", error);
      return {
        success: false,
        message: "获取主机名失败，请稍后重试",
      };
    }
  }

  /**
   * 获取节点IP地址列表
   */
  async getNodeIpAddresses(): Promise<{
    success: boolean;
    ipAddresses?: string[];
    message: string;
  }> {
    if (USE_MOCK_DATA) {
      return this.mockGetNodeIpAddresses();
    }

    try {
      const response = await request.get<IpAddressesResponse>(`/node/ips`, {
        skipAuth: true,
        showErrorMessage: false,
      } as RequestConfig);

      const result = response.data;
      return {
        success: true,
        ipAddresses: result.ip_addresses,
        message: "获取IP地址列表成功",
      };
    } catch (error) {
      console.error("获取节点IP地址失败:", error);
      return {
        success: false,
        message: "获取IP地址列表失败，请稍后重试",
      };
    }
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
      const response = await request.get(`/cluster/status`, {
        skipAuth: true,
      } as RequestConfig);

      const result = response.data || response;
      // 缓存结果
      this.statusCache = { data: result, timestamp: Date.now() };
      return result;
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
  ): Promise<{ success: boolean; message: string; token?: string }> {
    if (USE_MOCK_DATA) {
      return this.mockVerifyOneTimePassword(password);
    }

    try {
      const response = await request.post(
        `/cluster/auth`,
        {
          one_time_password: password,
        },
        {
          skipAuth: true,
        } as RequestConfig
      );

      const result = response.data || response;

      if (result.success && result.token) {
        // 保存认证token
        CookieUtils.set(this.AUTH_TOKEN_KEY, result.token);
        return {
          success: true,
          message: "验证成功",
          token: result.token,
        };
      } else {
        return {
          success: false,
          message: result.message || "验证失败",
        };
      }
    } catch (error) {
      console.error("验证一次性密码失败:", error);
      return {
        success: false,
        message: "验证失败，请稍后重试",
      };
    }
  }

  /**
   * 创建集群
   */
  async createCluster(
    config: CreateClusterConfig,
    hostname: string
  ): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK_DATA) {
      return this.mockCreateCluster(config);
    }

    try {
      // 获取一次性密钥（从localStorage）
      const requestPayload: CreateClusterRequest = {
        ip: config.selectedIp,
        hostname: hostname,
        disposable_secret_key: "moke_disposable_secret_key", // 模拟一次性密钥
      };

      const response = await request.post<CreateClusterResponse>(
        `/cluster/create`,
        requestPayload,
        {
          skipAuth: true, // 不需要token认证
          showErrorMessage: false, // 手动处理错误
        } as RequestConfig
      );

      const result = response.data;
      return {
        success: true,
        message: result.message || "集群创建请求已提交",
      };
    } catch (error: unknown) {
      console.error("创建集群失败:", error);

      // 处理422验证错误
      if (error && typeof error === "object" && "response" in error) {
        const httpError = error as {
          response?: { status?: number; data?: unknown };
        };
        if (httpError.response?.status === 422) {
          const validationError = httpError.response
            .data as ValidationErrorResponse;
          const errorMessages = validationError.detail
            .map((err) => `${err.loc.join(".")}: ${err.msg}`)
            .join("; ");

          return {
            success: false,
            message: `数据验证失败: ${errorMessages}`,
          };
        }
      }

      // 处理其他错误
      let errorMessage = "创建集群失败，请稍后重试";

      if (error && typeof error === "object") {
        if ("response" in error) {
          const httpError = error as {
            response?: { data?: { message?: string } };
          };
          errorMessage = httpError.response?.data?.message || errorMessage;
        } else if ("message" in error) {
          const messageError = error as { message: string };
          errorMessage = messageError.message;
        }
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * 加入集群
   */
  async joinCluster(
    config: JoinClusterConfig
  ): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK_DATA) {
      return this.mockJoinCluster(config);
    }

    try {
      // 获取一次性密钥（从localStorage）
      const disposableKey = this.getAuthToken();
      if (!disposableKey) {
        throw new Error("缺少一次性密钥，请先进行身份验证");
      }

      const requestPayload: JoinClusterRequest = {
        ip: config.ip,
        hostname: config.hostname,
        pub_key: config.pub_key,
        disposable_secret_key: disposableKey,
      };

      const response = await request.post(`/cluster/join`, requestPayload, {
        skipAuth: true, // 不需要token认证
        showErrorMessage: false, // 手动处理错误
      } as RequestConfig);

      const result = response.data || response;
      return {
        success: result.success || true,
        message: result.message || "加入集群请求已提交",
      };
    } catch (error) {
      console.error("加入集群失败:", error);
      return {
        success: false,
        message: "加入集群失败，请稍后重试",
      };
    }
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

  /**
   * 解散集群
   */
  async dissolveCluster(): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK_DATA) {
      return this.mockDissolveCluster();
    }

    try {
      console.log("调用解散集群API: POST /cluster/dissolve");
      const response = await request.post<DissolveClusterResponse>(
        `/cluster/dissolve`,
        {},
        {
          skipAuth: false, // 需要认证
          showErrorMessage: false, // 手动处理错误
        } as RequestConfig
      );

      console.log("解散集群API响应成功:", response);
      return {
        success: true,
        message: response.data.message || "集群解散成功",
      };
    } catch (error: unknown) {
      console.error("解散集群API调用失败:", error);

      // 处理500错误
      if (error && typeof error === "object" && "response" in error) {
        const httpError = error as {
          response?: { status?: number; data?: DissolveClusterErrorResponse };
        };

        console.log("HTTP错误状态码:", httpError.response?.status);
        console.log("HTTP错误数据:", httpError.response?.data);

        if (httpError.response?.status === 500) {
          const errorData = httpError.response.data;
          const errorMessage = errorData?.detail || "解散集群失败";
          console.log("处理500错误，返回消息:", errorMessage);
          return {
            success: false,
            message: errorMessage,
          };
        }
      }

      // 处理其他错误
      let errorMessage = "解散集群失败，请稍后重试";
      if (error && typeof error === "object") {
        if ("message" in error) {
          const messageError = error as { message: string };
          errorMessage = messageError.message;
        }
      }

      console.log("处理其他错误，返回消息:", errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * 获取集群节点列表
   */
  async getClusterNodes(): Promise<{
    success: boolean;
    data?: ClusterNodesResponse;
    message: string;
  }> {
    if (USE_MOCK_DATA) {
      return this.mockGetClusterNodes();
    }

    try {
      console.log("调用集群节点列表API: GET /cluster/nodes");
      const response = await request.get<ClusterNodesResponse>(
        `/cluster/nodes`,
        {
          skipAuth: false, // 需要认证
          showErrorMessage: false, // 手动处理错误
        } as RequestConfig
      );

      console.log("集群节点列表API响应成功:", response);
      const data = response.data || response;

      return {
        success: true,
        data: data,
        message: "获取集群节点列表成功",
      };
    } catch (error: unknown) {
      console.error("获取集群节点列表API调用失败:", error);

      // 处理不同的HTTP错误状态码
      if (error && typeof error === "object" && "response" in error) {
        const httpError = error as {
          response?: { status?: number; data?: Record<string, unknown> };
        };

        console.log("HTTP错误状态码:", httpError.response?.status);
        console.log("HTTP错误数据:", httpError.response?.data);

        switch (httpError.response?.status) {
          case 401:
            return {
              success: false,
              message: "认证失败，请重新登录",
            };
          case 403:
            return {
              success: false,
              message: "权限不足，无法访问集群信息",
            };
          case 404:
            return {
              success: false,
              message: "集群服务不可用",
            };
          case 500: {
            const errorData = httpError.response.data;
            const errorMessage =
              (errorData?.detail as string) ||
              (errorData?.message as string) ||
              "服务器内部错误";
            return {
              success: false,
              message: errorMessage,
            };
          }
          default:
            return {
              success: false,
              message: "获取集群节点列表失败",
            };
        }
      }

      // 处理网络错误等其他错误
      let errorMessage = "获取集群节点列表失败，请检查网络连接";
      if (error && typeof error === "object") {
        if ("message" in error) {
          const messageError = error as { message: string };
          errorMessage = messageError.message;
        }
      }

      console.log("处理其他错误，返回消息:", errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * 获取集群概览信息
   */
  async getClusterSummary(): Promise<{
    success: boolean;
    data?: ClusterSummaryResponse;
    message: string;
  }> {
    if (USE_MOCK_DATA) {
      return this.mockGetClusterSummary();
    }

    try {
      console.log("调用集群概览API: GET /cluster/summary");
      const response = await request.get<ClusterSummaryResponse>(
        `/cluster/summary`,
        {
          skipAuth: false, // 需要认证
          showErrorMessage: false, // 手动处理错误
        } as RequestConfig
      );

      console.log("集群概览API响应成功:", response);
      const data = response.data || response;

      return {
        success: true,
        data: data,
        message: "获取集群概览成功",
      };
    } catch (error: unknown) {
      console.error("获取集群概览API调用失败:", error);

      // 处理不同的HTTP错误状态码
      if (error && typeof error === "object" && "response" in error) {
        const httpError = error as {
          response?: { status?: number; data?: Record<string, unknown> };
        };

        console.log("HTTP错误状态码:", httpError.response?.status);
        console.log("HTTP错误数据:", httpError.response?.data);

        switch (httpError.response?.status) {
          case 401:
            return {
              success: false,
              message: "认证失败，请重新登录",
            };
          case 403:
            return {
              success: false,
              message: "权限不足，无法访问集群信息",
            };
          case 404:
            return {
              success: false,
              message: "集群服务不可用",
            };
          case 500: {
            const errorData = httpError.response.data;
            const errorMessage =
              (errorData?.detail as string) ||
              (errorData?.message as string) ||
              "服务器内部错误";
            return {
              success: false,
              message: errorMessage,
            };
          }
          default:
            return {
              success: false,
              message: "获取集群概览失败",
            };
        }
      }

      // 处理网络错误等其他错误
      let errorMessage = "获取集群概览失败，请检查网络连接";
      if (error && typeof error === "object") {
        if ("message" in error) {
          const messageError = error as { message: string };
          errorMessage = messageError.message;
        }
      }

      console.log("处理其他错误，返回消息:", errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * 获取集群资源
   */
  async getClusterResources(): Promise<{
    success: boolean;
    data?: ClusterResourcesResponse;
    message: string;
  }> {
    if (USE_MOCK_DATA) {
      return this.mockGetClusterResources();
    }    try {
      const response = await request.get<ClusterResourcesResponse>(`/cluster/resources`);
      
      if (response?.data) {
        return {
          success: true,
          data: response.data,
          message: "获取集群资源成功",
        };
      } else {
        return {
          success: false,
          message: "获取集群资源失败：无响应数据",
        };
      }
    } catch (error: unknown) {
      console.error("获取集群资源异常:", error);
      const errorMessage = error instanceof Error ? error.message : "获取集群资源失败";
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * 获取集群树结构
   */
  async getClusterTree(): Promise<{
    success: boolean;
    data?: ClusterTreeResponse;
    message: string;
  }> {
    if (USE_MOCK_DATA) {
      return this.mockGetClusterTree();
    }

    try {
      console.log("调用集群树API: GET /cluster/tree");
      const response = await request.get<ClusterTreeResponse>(
        `/cluster/tree`,
        {
          skipAuth: false, // 需要认证
          showErrorMessage: false, // 手动处理错误
        } as RequestConfig
      );

      console.log("集群树API响应成功:", response);
      const data = response.data || response;

      return {
        success: true,
        data: data,
        message: "获取集群树成功",
      };
    } catch (error: unknown) {
      console.error("获取集群树API调用失败:", error);

      // 处理不同的HTTP错误状态码
      if (error && typeof error === "object" && "response" in error) {
        const httpError = error as {
          response?: { status?: number; data?: Record<string, unknown> };
        };

        console.log("HTTP错误状态码:", httpError.response?.status);
        console.log("HTTP错误数据:", httpError.response?.data);

        switch (httpError.response?.status) {
          case 401:
            return {
              success: false,
              message: "认证失败，请重新登录",
            };
          case 403:
            return {
              success: false,
              message: "权限不足，无法访问集群信息",
            };
          case 404:
            return {
              success: false,
              message: "集群服务不可用",
            };
          case 500: {
            const errorData = httpError.response.data;
            const errorMessage =
              (errorData?.detail as string) ||
              (errorData?.message as string) ||
              "服务器内部错误";
            return {
              success: false,
              message: errorMessage,
            };
          }
          default:
            return {
              success: false,
              message: "获取集群树失败",
            };
        }
      }

      // 处理网络错误等其他错误
      let errorMessage = "获取集群树失败，请检查网络连接";
      if (error && typeof error === "object") {
        if ("message" in error) {
          const messageError = error as { message: string };
          errorMessage = messageError.message;
        }
      }

      console.log("处理其他错误，返回消息:", errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * 获取节点摘要信息
   */
  async getNodeSummary(hostname: string): Promise<{
    success: boolean;
    data?: NodeSummaryResponse;
    message: string;
  }> {
    if (USE_MOCK_DATA) {
      return this.mockGetNodeSummary(hostname);
    }

    try {
      console.log(`调用节点摘要API: POST /node/summary, hostname: ${hostname}`);
      const response = await request.post<NodeSummaryResponse>(
        `/node/summary`,
        { hostname },
        {
          skipAuth: false, // 需要认证
          showErrorMessage: false, // 手动处理错误
        } as RequestConfig
      );

      console.log("节点摘要API响应成功:", response);
      const data = response.data || response;

      return {
        success: true,
        data: data,
        message: "获取节点摘要成功",
      };
    } catch (error: unknown) {
      console.error("获取节点摘要API调用失败:", error);

      // 处理不同的HTTP错误状态码
      if (error && typeof error === "object" && "response" in error) {
        const httpError = error as {
          response?: { status?: number; data?: Record<string, unknown> };
        };

        console.log("HTTP错误状态码:", httpError.response?.status);
        console.log("HTTP错误数据:", httpError.response?.data);

        switch (httpError.response?.status) {
          case 401:
            return {
              success: false,
              message: "认证失败，请重新登录",
            };
          case 403:
            return {
              success: false,
              message: "权限不足，无法访问节点信息",
            };
          case 404:
            return {
              success: false,
              message: "节点不存在或服务不可用",
            };
          case 422:
            return {
              success: false,
              message: "请求参数错误，请检查主机名",
            };
          case 500: {
            const errorData = httpError.response.data;
            const errorMessage =
              (errorData?.detail as string) ||
              (errorData?.message as string) ||
              "服务器内部错误";
            return {
              success: false,
              message: errorMessage,
            };
          }
          default:
            return {
              success: false,
              message: "获取节点摘要失败",
            };
        }
      }

      // 处理网络错误等其他错误
      let errorMessage = "获取节点摘要失败，请检查网络连接";
      if (error && typeof error === "object") {
        if ("message" in error) {
          const messageError = error as { message: string };
          errorMessage = messageError.message;
        }
      }

      console.log("处理其他错误，返回消息:", errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
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

  private async mockVerifyOneTimePassword(
    password: string
  ): Promise<{ success: boolean; message: string; token?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (password === "testCluster") {
      const token = `mock_token_${Date.now()}`;
      CookieUtils.set(this.AUTH_TOKEN_KEY, token);
      return {
        success: true,
        message: "验证成功",
        token,
      };
    } else {
      return {
        success: false,
        message: "一次性密码错误",
      };
    }
  }

  private async mockCreateCluster(
    config: CreateClusterConfig
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("模拟创建集群:", config);
    return {
      success: true,
      message: "集群创建请求已提交",
    };
  }

  private async mockJoinCluster(
    config: JoinClusterConfig
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("模拟加入集群:", config);
    return {
      success: true,
      message: "加入集群请求已提交",
    };
  }

  private async mockGetNodeHostname(): Promise<{
    success: boolean;
    hostname?: string;
    message: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      hostname: "cluster-master-node",
      message: "获取主机名成功",
    };
  }

  private async mockGetNodeIpAddresses(): Promise<{
    success: boolean;
    ipAddresses?: string[];
    message: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      ipAddresses: ["192.168.1.100", "192.168.1.101", "10.0.0.100"],
      message: "获取IP地址列表成功",
    };
  }

  private async mockDissolveCluster(): Promise<{
    success: boolean;
    message: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // 90%成功率，10%失败率来模拟真实场景
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      return {
        success: true,
        message: "集群解散成功",
      };
    } else {
      return {
        success: false,
        message: "服务端失败信息",
      };
    }
  }

  private async mockGetClusterNodes(): Promise<{
    success: boolean;
    data?: ClusterNodesResponse;
    message: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // 模拟集群节点数据 - 匹配新的实际接口格式
    const mockData: ClusterNodesResponse = {
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

    return {
      success: true,
      data: mockData,
      message: "获取集群节点列表成功",
    };
  }

  private async mockGetClusterSummary(): Promise<{
    success: boolean;
    data?: ClusterSummaryResponse;
    message: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // 模拟集群概览数据 - 匹配实际接口格式
    const mockData: ClusterSummaryResponse = {
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

    return {
      success: true,
      data: mockData,
      message: "获取集群概览成功",
    };
  }

  private async mockGetClusterResources(): Promise<{
    success: boolean;
    data?: ClusterResourcesResponse;
    message: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 模拟集群资源数据 - 参考PVE、vSphere等平台的资源展示
    const mockData: ClusterResourcesResponse = {
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
            {
              id: "apache-service",
              class_: "ocf",
              provider: "heartbeat",
              type: "apache",
              attributes: {
                config: "/etc/httpd/conf/httpd.conf",
                port: "8080",
              },
              operations: [
                {
                  name: "monitor",
                  interval: "30s",
                  timeout: "30s",
                },
              ],
            },
          ],
        },
        {
          group: "database-services",
          resources: [
            {
              id: "mysql-master",
              class_: "ocf",
              provider: "heartbeat",
              type: "mysql",
              attributes: {
                config: "/etc/mysql/my.cnf",
                datadir: "/var/lib/mysql",
                user: "mysql",
              },
              operations: [
                {
                  name: "monitor",
                  interval: "20s",
                  timeout: "30s",
                },
                {
                  name: "start",
                  interval: "0s",
                  timeout: "120s",
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
            {
              name: "start",
              interval: "0s",
              timeout: "20s",
            },
            {
              name: "stop",
              interval: "0s",
              timeout: "20s",
            },
          ],
        },
        {
          id: "shared-storage",
          class_: "ocf",
          provider: "heartbeat",
          type: "Filesystem",
          attributes: {
            device: "/dev/sdb1",
            directory: "/mnt/shared",
            fstype: "ext4",
          },
          operations: [
            {
              name: "monitor",
              interval: "20s",
              timeout: "40s",
            },
            {
              name: "start",
              interval: "0s",
              timeout: "60s",
            },
          ],
        },
        {
          id: "dlm-service",
          class_: "ocf",
          provider: "pacemaker",
          type: "controld",
          attributes: {
            allow_stonith_disabled: "true",
          },
          operations: [
            {
              name: "monitor",
              interval: "60s",
              timeout: "30s",
            },
          ],
        },
        {
          id: "fence-device",
          class_: "stonith",
          provider: "fence_vmware_soap",
          type: "external/vmware",
          attributes: {
            ipaddr: "192.168.1.50",
            login: "admin",
            passwd: "******",
          },
          operations: [
            {
              name: "monitor",
              interval: "60s",
              timeout: "20s",
            },
          ],
        },
      ],
    };

    return {
      success: true,
      data: mockData,
      message: "获取集群资源成功",
    };
  }

  private async mockGetClusterTree(): Promise<{
    success: boolean;
    data?: ClusterTreeResponse;
    message: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 模拟集群树数据 - 匹配新的API格式
    const mockData: ClusterTreeResponse = {
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
        {
          name: "node3.kr-virt.local",
          status: "standby",
          ip: "192.168.1.103", 
          node_id: "node-003",
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
        {
          name: "br1",
          status: "inactive",
          type: "bridge",
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
        {
          name: "backup-storage",
          status: "inactive",
          size: 4096000,
          used: 0,
        },
      ],
    };

    return {
      success: true,
      data: mockData,
      message: "获取集群树成功",
    };
  }

  private async mockGetNodeSummary(hostname: string): Promise<{
    success: boolean;
    data?: NodeSummaryResponse;
    message: string;
  }> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 模拟节点摘要数据 - 匹配实际接口返回结构
    const mockData: NodeSummaryResponse = {
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
    };

    return {
      success: true,
      data: mockData,
      message: "获取节点摘要成功",
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
