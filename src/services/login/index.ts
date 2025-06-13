/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 11:30:00
 * @Description: 登录服务 - 整合模拟和真实API
 */

import { http } from "@/utils/request";
import { CookieUtils } from "@/utils/cookies";
import type { RequestConfig } from "@/utils/request";
import type {
  AuthResponse,
  LoginData,
  UserInfo,
  MockUser,
  LoginApiResponse,
  RefreshTokenApiResponse,
} from "./types";

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
      CookieUtils.setToken(token);
      CookieUtils.setUser(userInfo);

      // 模拟登录成功后也启动Token自动刷新
      console.log("🚀 模拟登录成功，启动Token自动刷新");
      this.startGlobalTokenRefresh();

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
      const response = await http.post<LoginApiResponse>("/user/login", data, {
        skipAuth: true,
      } as RequestConfig);

      const result = response.data;

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
        CookieUtils.setToken(result.access_token);
        CookieUtils.setUser(userInfo);

        // 登录成功后立即启动Token自动刷新
        console.log("🚀 登录成功，启动Token自动刷新");
        this.startGlobalTokenRefresh();

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
   * 验证Token格式是否有效
   */
  private isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== "string") {
      return false;
    }

    // 检查JWT格式 (header.payload.signature)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return false;
    }

    // 检查每部分是否为有效的Base64编码
    try {
      for (const part of parts) {
        if (!part) return false;
        // 尝试解码Base64，如果失败说明格式无效
        atob(part.replace(/-/g, "+").replace(/_/g, "/"));
      }
      return true;
    } catch {
      return false;
    }
  }

  // ===== 自动刷新token区域 =====
  /**
   * 自动刷新token 接口地址为 http://192.168.1.187:8001/user/renew_access_token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        return {
          success: false,
          message: "未登录或token已过期",
        };
      }

      // 验证token格式
      if (!this.isValidTokenFormat(token)) {
        console.warn("Token格式无效，清除本地数据");
        this.clearAuthDataSync();
        return {
          success: false,
          message: "Token格式无效，请重新登录",
        };
      }

      // 调用后端API刷新token
      const response = await http.get<RefreshTokenApiResponse>(
        "/user/renew_access_token",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, // 添加 Bearer 前缀
          },
          skipAuth: true, // 跳过认证
        } as RequestConfig
      );

      const result = response.data;

      if (result.access_token) {
        // 更新本地存储的token
        this.setToken(result.access_token);
        return {
          success: true,
          message: "Token刷新成功",
          token: result.access_token,
        };
      } else {
        return {
          success: false,
          message: "Token刷新失败",
        };
      }
    } catch (error: unknown) {
      console.error("Token刷新失败:", error);

      // 如果是token格式错误，清除本地数据
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 400
      ) {
        console.warn("Token解码失败，清除本地认证数据");
        this.clearAuthDataSync();
        return {
          success: false,
          message: "Token已失效，请重新登录",
        };
      }

      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message.includes("DecodeError")
      ) {
        console.warn("Token解码失败，清除本地认证数据");
        this.clearAuthDataSync();
        return {
          success: false,
          message: "Token已失效，请重新登录",
        };
      }

      return {
        success: false,
        message: "Token刷新失败，请稍后重试",
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
    return CookieUtils.getUser<UserInfo>();
  }

  /**
   * 获取token
   */
  getToken(): string | null {
    return CookieUtils.getToken();
  }

  /**
   * 设置用户信息
   */
  setUser(user: UserInfo): void {
    CookieUtils.setUser(user);
  }

  /**
   * 设置token
   */
  setToken(token: string): void {
    CookieUtils.setToken(token);
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

          const response = await http.get("/user/logout");

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
      CookieUtils.clearAuth();

      // 停止Token自动刷新
      console.log("🛑 登出时停止Token自动刷新");
      this.stopGlobalTokenRefresh();

      console.log("本地数据清除完成");

      return {
        success: true,
        message: "登出成功",
      };
    } catch (error) {
      console.error("登出过程中发生未预期错误:", error);

      // 即使出错，也要清除本地数据
      CookieUtils.clearAuth();

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
    CookieUtils.clearAuth();
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

  /**
   * 调试Token信息（仅开发环境使用）
   */
  debugTokenInfo(): void {
    if (import.meta.env.DEV) {
      const token = this.getToken();
      console.group("🔍 Token调试信息");

      if (!token) {
        console.warn("❌ 没有找到Token");
        console.groupEnd();
        return;
      }

      console.log("📋 原始Token:", token);
      console.log("📏 Token长度:", token.length);
      console.log("✅ Token格式检查:", this.isValidTokenFormat(token));

      // 尝试解析JWT payload
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log("📦 Token Payload:", payload);
          console.log(
            "⏰ 过期时间:",
            payload.exp ? new Date(payload.exp * 1000).toLocaleString() : "未知"
          );
          console.log(
            "🕐 是否过期:",
            payload.exp ? payload.exp * 1000 < Date.now() : "未知"
          );
        }
      } catch (error) {
        console.error("❌ 解析Token失败:", error);
      }

      console.groupEnd();
    }
  }

  /**
   * 清理无效Token
   */
  cleanupInvalidToken(): boolean {
    const token = this.getToken();
    if (token && !this.isValidTokenFormat(token)) {
      console.warn("发现无效Token，正在清理...");
      this.clearAuthDataSync();
      return true;
    }
    return false;
  }

  /**
   * 启动全局Token自动刷新
   */
  startGlobalTokenRefresh(): void {
    const refreshManager = TokenRefreshManager.getInstance();
    refreshManager.setLoginService(this);
    refreshManager.startAutoRefresh();
  }

  /**
   * 停止全局Token自动刷新
   */
  stopGlobalTokenRefresh(): void {
    const refreshManager = TokenRefreshManager.getInstance();
    refreshManager.stopAutoRefresh();
  }

  /**
   * 获取自动刷新状态
   */
  getAutoRefreshStatus(): { isRunning: boolean; isRefreshing: boolean } {
    const refreshManager = TokenRefreshManager.getInstance();
    return refreshManager.getStatus();
  }

  /**
   * 检查用户是否为管理员
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === "administrator" : false;
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

// ===== Token自动刷新管理器 =====
class TokenRefreshManager {
  private static instance: TokenRefreshManager | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL = import.meta.env.DEV
    ? 30 * 1000
    : 3 * 60 * 1000; // 开发环境30秒，生产环境3分钟
  private isRefreshing = false;
  private loginServiceInstance: LoginService | null = null;

  private constructor() {}

  static getInstance(): TokenRefreshManager {
    if (!TokenRefreshManager.instance) {
      TokenRefreshManager.instance = new TokenRefreshManager();
    }
    return TokenRefreshManager.instance;
  }

  /**
   * 设置登录服务实例
   */
  setLoginService(service: LoginService): void {
    this.loginServiceInstance = service;
  }

  /**
   * 启动自动刷新
   */
  startAutoRefresh(): void {
    if (this.refreshTimer) {
      console.warn("Token自动刷新已经在运行中");
      return;
    }

    console.log(
      "🔄 启动Token自动刷新，间隔:",
      import.meta.env.DEV ? "30秒 (开发模式)" : "3分钟"
    );
    console.log(
      "⏰ 下次自动刷新将在",
      import.meta.env.DEV ? "30秒" : "3分钟",
      "后执行"
    );

    // 设置定时器 - 等待3分钟后开始第一次自动刷新
    this.refreshTimer = setInterval(() => {
      this.performRefresh();
    }, this.REFRESH_INTERVAL);

    console.log("✅ Token自动刷新定时器已设置");
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log("⏹️ Token自动刷新已停止");
    }
  }

  /**
   * 执行刷新操作
   */
  private async performRefresh(): Promise<void> {
    if (!this.loginServiceInstance) {
      console.warn("LoginService实例未设置，跳过token刷新");
      return;
    }

    // 检查是否已登录
    if (!this.loginServiceInstance.isAuthenticated()) {
      console.log("用户未登录，跳过token刷新");
      return;
    }

    // 防止并发刷新
    if (this.isRefreshing) {
      console.log("Token刷新正在进行中，跳过本次刷新");
      return;
    }

    this.isRefreshing = true;

    try {
      console.log("🔄 开始自动刷新Token...");
      const result = await this.loginServiceInstance.refreshToken();

      if (result.success) {
        console.log("✅ Token自动刷新成功");
      } else {
        console.warn("⚠️ Token自动刷新失败:", result.message);

        // 如果刷新失败且是认证相关错误，停止自动刷新并强制退出登录
        if (
          result.message.includes("重新登录") ||
          result.message.includes("已失效")
        ) {
          console.log("🛑 Token已失效，停止自动刷新");
          this.stopAutoRefresh();

          // 通知用户并强制退出登录
          this.handleAuthFailure(
            "Token自动刷新失败，为了您的账户安全，系统将自动退出登录"
          );
        }
      }
    } catch (error) {
      console.error("❌ Token自动刷新出错:", error);

      // 如果是网络错误或其他关键错误，也考虑强制退出登录
      if (error && typeof error === "object") {
        const errorObj = error as {
          status?: number;
          code?: string;
          message?: string;
        };

        // 401未授权或403禁止访问，直接强制退出
        if (errorObj.status === 401 || errorObj.status === 403) {
          console.log("🛑 收到认证错误响应，强制退出登录");
          this.handleAuthFailure("身份验证失败，系统将自动退出登录");
        }
        // Token相关错误
        else if (
          errorObj.message &&
          (errorObj.message.includes("token") ||
            errorObj.message.includes("unauthorized") ||
            errorObj.message.includes("expired"))
        ) {
          console.log("🛑 Token相关错误，强制退出登录");
          this.handleAuthFailure("Token验证失败，系统将自动退出登录");
        }
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * 检查刷新状态
   */
  getStatus(): { isRunning: boolean; isRefreshing: boolean } {
    return {
      isRunning: this.refreshTimer !== null,
      isRefreshing: this.isRefreshing,
    };
  }

  /**
   * 处理认证失败 - 通知用户并强制退出登录
   */
  private async handleAuthFailure(message: string): Promise<void> {
    try {
      console.error("🚨 认证失败，强制退出登录:", message);

      // 停止自动刷新
      this.stopAutoRefresh();

      // 清除本地认证数据
      if (this.loginServiceInstance) {
        this.loginServiceInstance.clearAuthDataSync();
      }

      // 显示通知
      if (typeof window !== "undefined") {
        // 尝试使用全局通知组件
        try {
          const globalWindow = window as unknown as {
            antd?: {
              message?: {
                error: (msg: string) => void;
              };
            };
          };

          if (globalWindow.antd && globalWindow.antd.message) {
            globalWindow.antd.message.error(message);
          } else {
            // 降级到浏览器原生alert
            alert(message);
          }
        } catch (notificationError) {
          console.warn("显示通知失败，使用alert:", notificationError);
          alert(message);
        }

        // 延迟后重定向到登录页面
        setTimeout(() => {
          if (
            window.location.pathname !== "/login" &&
            !window.location.hash.includes("/login")
          ) {
            console.log("🔄 重定向到登录页面");
            // 使用正确的Hash路由格式
            window.location.hash = "/login";
          }
        }, 2000);
      }
    } catch (error) {
      console.error("处理认证失败时出错:", error);
    }
  }
}

// 全局调试工具
if (import.meta.env.DEV) {
  // 扩展 window 对象类型以避免 TypeScript 错误
  interface WindowWithDebug extends Window {
    loginService: LoginService;
    TokenRefreshManager: typeof TokenRefreshManager;
    debugToken: {
      status: () => void;
      refresh: () => Promise<AuthResponse>;
      start: () => void;
      stop: () => void;
      clear: () => void;
    };
  }

  // 将 loginService 添加到全局 window 对象，方便在控制台中调试
  (window as unknown as WindowWithDebug).loginService = loginService;
  (window as unknown as WindowWithDebug).TokenRefreshManager =
    TokenRefreshManager;

  // 添加便捷的调试方法
  (window as unknown as WindowWithDebug).debugToken = {
    // 查看当前状态
    status: () => {
      console.log("=== Token 调试信息 ===");
      console.log("用户登录状态:", loginService.isAuthenticated());
      console.log("Token:", loginService.getToken());
      console.log("用户信息:", loginService.getCurrentUser());
      console.log("自动刷新状态:", loginService.getAutoRefreshStatus());
      loginService.debugTokenInfo();
    },

    // 立即刷新 Token
    refresh: async () => {
      console.log("🔄 手动触发Token刷新...");
      const result = await loginService.refreshToken();
      console.log("刷新结果:", result);
      return result;
    },

    // 启动自动刷新
    start: () => {
      console.log("🚀 手动启动Token自动刷新...");
      loginService.startGlobalTokenRefresh();
      console.log("自动刷新状态:", loginService.getAutoRefreshStatus());
    },

    // 停止自动刷新
    stop: () => {
      console.log("🛑 手动停止Token自动刷新...");
      loginService.stopGlobalTokenRefresh();
      console.log("自动刷新状态:", loginService.getAutoRefreshStatus());
    },

    // 清理 Token
    clear: () => {
      console.log("🧹 清理Token...");
      loginService.clearAuthDataSync();
      loginService.stopGlobalTokenRefresh();
    },
  };

  console.log("🛠️ Token调试工具已加载!");
  console.log("在控制台中使用以下命令:");
  console.log("- debugToken.status() - 查看当前状态");
  console.log("- debugToken.refresh() - 立即刷新Token");
  console.log("- debugToken.start() - 启动自动刷新");
  console.log("- debugToken.stop() - 停止自动刷新");
  console.log("- debugToken.clear() - 清理Token");
}

// 导出工具类
export { TokenRefreshManager };
