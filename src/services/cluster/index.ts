/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群初始化服务
 */

import request from "@/utils/request";
import type { RequestConfig } from "@/utils/request";
import type {
  ClusterStatusResponse,
  CreateClusterConfig,
  JoinClusterConfig,
} from "./types";

// 配置区域
const CLUSTER_API_BASE = "http://192.168.1.187:8001";
const USE_MOCK_DATA = true; // 开发时可以设置为true使用模拟数据

class ClusterInitService {
  private readonly AUTH_TOKEN_KEY = "kr_virt_cluster_auth_token";

  /**
   * 检查集群状态
   */
  async checkClusterStatus(): Promise<ClusterStatusResponse> {
    if (USE_MOCK_DATA) {
      return this.mockCheckClusterStatus();
    }

    try {
      const response = await request.get(`/cluster/status`, {
        skipAuth: true,
      } as RequestConfig);

      return response.data || response;
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
        localStorage.setItem(this.AUTH_TOKEN_KEY, result.token);
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
    config: CreateClusterConfig
  ): Promise<{ success: boolean; message: string }> {
    if (USE_MOCK_DATA) {
      return this.mockCreateCluster(config);
    }

    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error("缺少认证token");
      }

      const response = await request.post(
        `${CLUSTER_API_BASE}/cluster/create`,
        config,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          skipAuth: true,
        } as RequestConfig
      );

      const result = response.data || response;
      return {
        success: result.success || true,
        message: result.message || "集群创建请求已提交",
      };
    } catch (error) {
      console.error("创建集群失败:", error);
      return {
        success: false,
        message: "创建集群失败，请稍后重试",
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
      const token = this.getAuthToken();
      if (!token) {
        throw new Error("缺少认证token");
      }

      const response = await request.post(
        `${CLUSTER_API_BASE}/cluster/join`,
        config,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          skipAuth: true,
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
    return localStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  /**
   * 清除认证token
   */
  clearAuthToken(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
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
      localStorage.setItem(this.AUTH_TOKEN_KEY, token);
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
}

// 创建并导出集群初始化服务实例
export const clusterInitService = new ClusterInitService();

// 导出类型
export * from "./types";

// 导出类（用于测试或特殊需求）
export { ClusterInitService };

// 默认导出
export default clusterInitService;
