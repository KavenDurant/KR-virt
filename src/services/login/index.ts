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
   * 登出
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * 清空所有认证数据
   */
  clearAuthData(): void {
    this.logout();
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
