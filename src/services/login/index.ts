/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 11:30:00
 * @Description: 登录服务 - 整合模拟和真实API
 */

import request from "@/utils/request";
import type { RequestConfig } from "@/utils/request";
import type { AuthResponse, LoginData, UserInfo, MockUser } from "./types";

// ===== 配置区域 =====
const USE_MOCK_DATA = false; // true=使用模拟数据，false=使用真实API

// ===== 模拟用户数据 =====
const mockUsers: MockUser[] = [
  {
    username: "admin",
    password: "Admin123!@#",
    role: "administrator",
    permissions: ["*"],
    isFirstLogin: false,
  },
  {
    username: "test_user",
    password: "-p0-p0-p0",
    role: "administrator",
    permissions: ["*"],
    isFirstLogin: false,
  },
];

class LoginService {
  private readonly TOKEN_KEY = "kr_virt_token";
  private readonly USER_KEY = "kr_virt_user";

  /**
   * 统一登录入口
   */
  async login(data: LoginData): Promise<AuthResponse> {
    if (USE_MOCK_DATA) {
      return this.mockLogin(data);
    } else {
      return this.apiLogin(data);
    }
  }

  // ===== 模拟登录区域 =====
  /**
   * 模拟登录实现
   */
  private async mockLogin(data: LoginData): Promise<AuthResponse> {
    try {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 验证用户名密码
      const user = mockUsers.find(
        (u) => u.username === data.login_name && u.password === data.password
      );

      if (!user) {
        return {
          success: false,
          message: "用户名或密码错误",
        };
      }

      // 验证两步验证码（如果提供）
      if (data.two_factor && data.two_factor !== "123456") {
        return {
          success: false,
          message: "验证码错误",
        };
      }

      // 生成模拟token和用户信息
      const token = this.generateMockToken();
      const userInfo: UserInfo = {
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        lastLogin: new Date().toISOString(),
        isFirstLogin: user.isFirstLogin,
      };

      // 保存登录状态
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));

      return {
        success: true,
        message: "登录成功",
        token,
        user: userInfo,
      };
    } catch (error) {
      console.error("模拟登录失败:", error);
      return {
        success: false,
        message: "登录失败，请稍后重试",
      };
    }
  }

  /**
   * 生成模拟token
   */
  private generateMockToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const token = `kr_virt_mock_${timestamp}_${random}`;
    return btoa(token);
  }

  // ===== 真实API登录区域 =====
  /**
   * 真实API登录实现
   */
  private async apiLogin(data: LoginData): Promise<AuthResponse> {
    try {
      // 调用真实API，跳过Token认证
      const response = await request.post("/user/login", data, {
        skipAuth: true,
      } as RequestConfig);

      const result = response.data || response;

      // 适配后端响应格式
      if (result.access_token) {
        const userInfo: UserInfo = {
          username: data.login_name,
          role: this.parseUserRole(result.permission),
          permissions: this.parsePermissions(result.permission),
          lastLogin: new Date().toISOString(),
          isFirstLogin: result.is_first_time_login,
        };

        // 保存登录状态
        localStorage.setItem(this.TOKEN_KEY, result.access_token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));

        return {
          success: true,
          message: "登录成功",
          token: result.access_token,
          user: userInfo,
        };
      } else {
        return {
          success: false,
          message: "登录失败",
        };
      }
    } catch (error) {
      console.error("API登录失败:", error);
      return {
        success: false,
        message: "登录失败，请稍后重试",
      };
    }
  }

  /**
   * 解析权限信息
   */
  private parsePermissions(permission: unknown): string[] {
    if (!permission) return [];

    if (typeof permission === "object" && permission !== null) {
      return Object.keys(permission);
    }

    if (Array.isArray(permission)) {
      return permission;
    }

    return [];
  }

  /**
   * 解析用户角色
   */
  private parseUserRole(permission: unknown): string {
    if (!permission) return "user";

    if (typeof permission === "object" && permission !== null) {
      const keys = Object.keys(permission);
      if (keys.includes("admin") || keys.includes("*")) {
        return "administrator";
      }
    }

    return "user";
  }

  // ===== 工具方法区域 =====
  /**
   * 检查认证状态
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): UserInfo | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * 获取token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * 设置用户信息
   */
  setUser(user: UserInfo): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * 设置token
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * 登出 - 调用后端API并清除本地数据
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getToken();
      console.log("开始登出流程...");
      console.log(
        "当前token:",
        token ? `${token.substring(0, 20)}...` : "null"
      );

      // 如果有token，尝试调用后端登出API
      if (token) {
        try {
          console.log("正在调用登出API:", "/user/logout");
          console.log("请求配置: GET /user/logout");

          const response = await request.get("/user/logout");

          console.log("登出API调用成功:", response);
        } catch (error: unknown) {
          console.error("后端登出API调用失败:", error);

          // 详细记录错误信息
          if (error && typeof error === "object" && "response" in error) {
            const responseError = error as {
              response?: { status?: number; data?: unknown; headers?: unknown };
            };
            console.error("响应状态:", responseError.response?.status);
            console.error("响应数据:", responseError.response?.data);
            console.error("响应头:", responseError.response?.headers);
          } else if (error && typeof error === "object" && "request" in error) {
            const requestError = error as { request?: unknown };
            console.error("请求失败，没有收到响应:", requestError.request);
          } else if (error instanceof Error) {
            console.error("请求配置错误:", error.message);
          } else {
            console.error("未知错误:", error);
          }

          // 即使后端API失败，也要清除本地数据
        }
      } else {
        console.warn("没有找到token，跳过API调用");
      }

      // 清除本地存储的认证数据
      console.log("清除本地认证数据...");
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      console.log("本地数据清除完成");

      return {
        success: true,
        message: "登出成功",
      };
    } catch (error) {
      console.error("登出过程中发生未预期错误:", error);

      // 即使出错，也要清除本地数据
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);

      return {
        success: false,
        message: "登出时发生错误，但已清除本地数据",
      };
    }
  }

  /**
   * 同步登出 - 仅清除本地数据（兼容旧代码）
   */
  logoutSync(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * 清空所有认证数据
   */
  async clearAuthData(): Promise<{ success: boolean; message: string }> {
    return this.logout();
  }

  /**
   * 同步清空认证数据（兼容旧代码）
   */
  clearAuthDataSync(): void {
    this.logoutSync();
  }

  /**
   * 更新用户信息
   */
  updateUser(updates: Partial<UserInfo>): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const updatedUser = { ...currentUser, ...updates };
    this.setUser(updatedUser);
    return true;
  }

  /**
   * 检查用户权限
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // 管理员权限或包含所有权限
    if (user.permissions.includes("*")) return true;

    return user.permissions.includes(permission);
  }

  /**
   * 检查用户角色
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.role === role;
  }

  /**
   * 切换登录模式（仅用于开发调试）
   */
  static setUseMockData(useMock: boolean): void {
    console.warn(
      `切换登录模式为: ${useMock ? "模拟" : "真实API"}，请确保在开发环境中使用`
    );
    // 注意：这里不能直接修改常量，实际项目中应该通过环境变量控制
  }

  /**
   * 获取当前登录模式
   */
  static getLoginMode(): string {
    return USE_MOCK_DATA ? "Mock" : "API";
  }

  /**
   * 添加模拟用户（仅用于测试）
   */
  static addMockUser(user: MockUser): void {
    mockUsers.push(user);
  }

  /**
   * 获取模拟用户列表（仅用于测试）
   */
  static getMockUsers(): MockUser[] {
    return [...mockUsers];
  }
}

// 创建并导出登录服务实例
export const loginService = new LoginService();

// 导出类型
export * from "./types";

// 导出类（用于测试或特殊需求）
export { LoginService };

// 默认导出
export default loginService;
