/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群初始化服务
 */

import request from "@/utils/request";
import { CookieUtils } from "@/utils/cookies";
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
} from "./types";

// 配置区域
const USE_MOCK_DATA = false; // 开发时可以设置为true使用模拟数据

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
    // 模拟集群节点数据 - 匹配实际接口格式
    const mockData: ClusterNodesResponse = {
      nodes: [
        {
          name: "localhost.localdomain",
          node_id: "node-001",
          ip: "192.168.1.101",
        },
        {
          name: "node2.localdomain",
          node_id: "node-002",
          ip: "192.168.1.102",
        },
        {
          name: "node3.localdomain",
          node_id: "node-003",
          ip: "192.168.1.103",
        },
      ],
    };

    return {
      success: true,
      data: mockData,
      message: "获取集群节点列表成功",
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
