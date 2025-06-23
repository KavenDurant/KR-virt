/**
 * 用户管理服务
 */

import { api, mockApi, type StandardResponse } from "../../utils/apiHelper";
import type {
  CreateUserRequest,
  CreateUserResponse,
  User,
  UserListResponse,
  UserListApiResponse,
  UserQueryParams,
  UpdateUserRequest,
} from "./types";
import { EnvConfig } from "@/config/env";
// 是否使用Mock数据
const USE_MOCK_DATA = EnvConfig.ENABLE_MOCK; // 通过环境变量控制是否使用模拟数据

class UserService {
  private readonly BASE_URL = "/user";

  /**
   * 创建用户
   */
  async createUser(
    userData: CreateUserRequest
  ): Promise<StandardResponse<CreateUserResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post(`${this.BASE_URL}/create`, userData, {
        useMock: true,
        mockData: {
          login_name: userData.login_name,
          password: this.generateRandomPassword(),
        },
        defaultSuccessMessage: "用户创建成功",
      });
    }

    return api.post<CreateUserResponse>(`${this.BASE_URL}/create`, userData, {
      defaultSuccessMessage: "用户创建成功",
      defaultErrorMessage: "用户创建失败，请稍后重试",
    });
  }

  /**
   * 获取用户列表
   */
  async getUserList(
    params?: UserQueryParams
  ): Promise<StandardResponse<UserListResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.get(`${this.BASE_URL}/list`, params as Record<string, unknown>, {
        useMock: true,
        mockData: this.getMockUserList(),
        defaultSuccessMessage: "获取用户列表成功",
      });
    }

    // 调用真实API
    const response = await api.get<UserListApiResponse>(`${this.BASE_URL}/list`, params as Record<string, unknown>, {
      defaultSuccessMessage: "获取用户列表成功",
      defaultErrorMessage: "获取用户列表失败，请稍后重试",
    });

    // 适配API响应格式到前端期望的格式
    if (response.success && response.data) {
      const adaptedData: UserListResponse = {
        users: response.data.user_list.map(user => ({
          ...user,
          // 为前端显示添加默认状态
          status: user.is_first_time_login ? "disabled" : "active",
          last_login: user.updated_at,
        })),
        total: response.data.user_list.length,
      };

      return {
        ...response,
        data: adaptedData,
      };
    }

    return {
      success: false,
      message: response.message || "获取用户列表失败",
    } as StandardResponse<UserListResponse>;
  }

  /**
   * 更新用户信息
   */
  async updateUser(
    userId: number,
    userData: UpdateUserRequest
  ): Promise<StandardResponse<void>> {
    if (USE_MOCK_DATA) {
      return mockApi.put(`${this.BASE_URL}/${userId}`, userData, {
        useMock: true,
        mockData: undefined,
        defaultSuccessMessage: "用户信息更新成功",
      });
    }

    return api.put<void>(`${this.BASE_URL}/${userId}`, userData, {
      defaultSuccessMessage: "用户信息更新成功",
      defaultErrorMessage: "用户信息更新失败，请稍后重试",
    });
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: number): Promise<StandardResponse<void>> {
    if (USE_MOCK_DATA) {
      // MockableApiHelper doesn't have a delete method, use regular api with mock simulation
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      return {
        success: true,
        message: "用户删除成功",
      };
    }

    return api.delete<void>(`${this.BASE_URL}/${userId}`, {
      defaultSuccessMessage: "用户删除成功",
      defaultErrorMessage: "用户删除失败，请稍后重试",
    });
  }

  /**
   * 切换用户状态
   */
  async toggleUserStatus(
    userId: number,
    status: "active" | "disabled"
  ): Promise<StandardResponse<void>> {
    if (USE_MOCK_DATA) {
      return mockApi.put(
        `${this.BASE_URL}/${userId}/status`,
        { status },
        {
          useMock: true,
          mockData: undefined,
          defaultSuccessMessage: `用户已${
            status === "active" ? "启用" : "禁用"
          }`,
        }
      );
    }

    return api.put<void>(
      `${this.BASE_URL}/${userId}/status`,
      { status },
      {
        defaultSuccessMessage: `用户已${status === "active" ? "启用" : "禁用"}`,
        defaultErrorMessage: "用户状态更新失败，请稍后重试",
      }
    );
  }

  /**
   * 生成随机密码
   */
  private generateRandomPassword(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * 获取Mock用户列表数据
   */
  private getMockUserList(): UserListResponse {
    const mockUsers: User[] = [
      {
        id: 1,
        login_name: "admin",
        user_name: "系统管理员",
        user_type: "system_admin",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-05-26T10:30:00Z",
        is_first_time_login: false,
        login_retry_times: 0,
        email: "admin@example.com",
        phone: "13800138000",
        department: "信息技术部",
        status: "active",
        last_login: "2025-05-26 10:30:00",
      },
      {
        id: 2,
        login_name: "security_admin",
        user_name: "安全保密管理员",
        user_type: "security_admin",
        created_at: "2025-02-15T00:00:00Z",
        updated_at: "2025-05-26T09:15:00Z",
        is_first_time_login: false,
        login_retry_times: 0,
        email: "security_admin@example.com",
        phone: "13800138001",
        department: "安全保密部",
        status: "active",
        last_login: "2025-05-26 09:15:00",
      },
      {
        id: 3,
        login_name: "auditor",
        user_name: "安全审计员",
        user_type: "security_auditor",
        created_at: "2025-03-10T00:00:00Z",
        updated_at: "2025-05-25T16:45:00Z",
        is_first_time_login: false,
        login_retry_times: 0,
        email: "auditor@example.com",
        phone: "13800138002",
        department: "审计部",
        status: "active",
        last_login: "2025-05-25 16:45:00",
      },
      {
        id: 4,
        login_name: "new_auditor",
        user_name: "新审计员",
        user_type: "security_auditor",
        created_at: "2025-04-01T00:00:00Z",
        updated_at: "2025-04-01T00:00:00Z",
        is_first_time_login: true,
        login_retry_times: 0,
        email: "new_auditor@example.com",
        phone: "13800138003",
        department: "审计部",
        status: "disabled",
        last_login: undefined,
      },
    ];

    return {
      users: mockUsers,
      total: mockUsers.length,
    };
  }
}

// 创建并导出用户服务实例
export const userService = new UserService();

// 导出类型
export * from "./types";

// 导出类（用于测试或特殊需求）
export { UserService };

// 默认导出
export default userService;
