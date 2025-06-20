/**
 * 用户管理服务
 */

import { api, mockApi, type StandardResponse } from "../../utils/apiHelper";
import type {
  CreateUserRequest,
  CreateUserResponse,
  User,
  UserListResponse,
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
    if (!USE_MOCK_DATA) {
      return mockApi.get(`${this.BASE_URL}/list`, params, {
        useMock: true,
        mockData: this.getMockUserList(),
        defaultSuccessMessage: "获取用户列表成功",
      });
    }

    return api.get<UserListResponse>(`${this.BASE_URL}/list`, params, {
      defaultSuccessMessage: "获取用户列表成功",
      defaultErrorMessage: "获取用户列表失败，请稍后重试",
    });
  }

  /**
   * 更新用户信息
   */
  async updateUser(
    userId: string,
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
  async deleteUser(userId: string): Promise<StandardResponse<void>> {
    if (USE_MOCK_DATA) {
      return mockApi.delete(`${this.BASE_URL}/${userId}`, {
        useMock: true,
        mockData: undefined,
        defaultSuccessMessage: "用户删除成功",
      });
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
    userId: string,
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
        id: "1",
        login_name: "admin",
        user_name: "系统管理员",
        user_type: "system_admin",
        email: "admin@example.com",
        phone: "13800138000",
        department: "信息技术部",
        status: "active",
        last_login: "2025-05-26 10:30:00",
        create_time: "2025-01-01 00:00:00",
      },
      {
        id: "2",
        login_name: "operator1",
        user_name: "运维员",
        user_type: "operator",
        email: "operator1@example.com",
        phone: "13800138001",
        department: "运维部",
        status: "active",
        last_login: "2025-05-26 09:15:00",
        create_time: "2025-02-15 00:00:00",
      },
      {
        id: "3",
        login_name: "user1",
        user_name: "普通用户",
        user_type: "user",
        email: "user1@example.com",
        phone: "13800138002",
        department: "业务部",
        status: "disabled",
        last_login: "2025-05-25 16:45:00",
        create_time: "2025-03-10 00:00:00",
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
