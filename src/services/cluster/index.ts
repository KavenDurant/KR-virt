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
        disposable_secret_key: 'moke_disposable_secret_key', // 模拟一次性密钥
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

      const response = await request.post(
        `/cluster/join`,
        requestPayload,
        {
          skipAuth: true, // 不需要token认证
          showErrorMessage: false, // 手动处理错误
        } as RequestConfig
      );

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
}

// 创建并导出集群初始化服务实例
export const clusterInitService = new ClusterInitService();

// 导出类型
export * from "./types";

// 导出类（用于测试或特殊需求）
export { ClusterInitService };

// 默认导出
export default clusterInitService;
