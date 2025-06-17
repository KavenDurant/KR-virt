/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 11:30:00
 * @Description: 登录服务 - 优化版本，使用统一的API工具
 */

import { api } from '@/utils/apiHelper';
import { CookieUtils } from '@/utils/cookies';
import { EnvConfig } from '@/config/env';
import type {
  LoginData,
  AuthResponse,
  UserInfo,
  MockUser,
  LoginApiResponse,
  RefreshTokenApiResponse,
} from './types';

// ===== 配置区域 =====
const USE_MOCK_DATA = EnvConfig.ENABLE_MOCK; // 通过环境变量控制是否使用模拟数据

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
          message: "两步验证码错误",
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
    const result = await api.post<LoginApiResponse>("/user/login", data, {
      skipAuth: true,
      defaultSuccessMessage: "登录成功",
      defaultErrorMessage: "登录失败，请稍后重试",
    });

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    const apiResponse = result.data!;

    // 适配后端响应格式
    if (apiResponse.access_token) {
      const userInfo: UserInfo = {
        username: data.login_name,
        role: this.parseUserRole(apiResponse.permission),
        permissions: this.parsePermissions(apiResponse.permission),
        lastLogin: new Date().toISOString(),
        isFirstLogin: false,
      };

      // 保存登录状态
      CookieUtils.setToken(apiResponse.access_token);
      CookieUtils.setUser(userInfo);

      // 启动Token自动刷新
      console.log("🚀 API登录成功，启动Token自动刷新");
      this.startGlobalTokenRefresh();

      return {
        success: true,
        message: "登录成功",
        token: apiResponse.access_token,
        user: userInfo,
      };
    } else {
      return {
        success: false,
        message: "登录响应格式错误",
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
        atob(part);
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
    const token = this.getToken();
    if (!token) {
      return {
        success: false,
        message: "未找到有效的Token",
      };
    }

    // 验证token格式
    if (!this.isValidTokenFormat(token)) {
      this.clearAuthDataSync();
      return {
        success: false,
        message: "Token格式无效，已清除本地数据",
      };
    }

    const result = await api.get<RefreshTokenApiResponse>(
      "/user/renew_access_token",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        skipAuth: true,
        showErrorMessage: false, // 刷新token不显示错误
        defaultErrorMessage: "Token刷新失败",
      }
    );

    if (!result.success) {
      // 如果是token格式错误，清除本地数据
      if (result.message?.includes("DecodeError") || result.message?.includes("400")) {
        this.clearAuthDataSync();
        return {
          success: false,
          message: "Token已失效，已清除本地数据",
        };
      }

      return {
        success: false,
        message: result.message,
      };
    }

    const refreshResponse = result.data!;

    if (refreshResponse.access_token) {
      // 更新token
      CookieUtils.setToken(refreshResponse.access_token);

      // 更新用户信息（如果有）
      if (refreshResponse.permission) {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          const updatedUser: UserInfo = {
            ...currentUser,
            role: this.parseUserRole(refreshResponse.permission),
            permissions: this.parsePermissions(refreshResponse.permission),
            lastLogin: new Date().toISOString(),
          };
          CookieUtils.setUser(updatedUser);
        }
      }

      return {
        success: true,
        message: "Token刷新成功",
        token: refreshResponse.access_token,
      };
    } else {
      return {
        success: false,
        message: "Token刷新失败：响应格式错误",
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
    const token = this.getToken();
    console.log("开始登出流程...");
    console.log(
      "当前token:",
      token ? `${token.substring(0, 20)}...` : "null"
    );

    // 如果有token，尝试调用后端登出API
    if (token) {
      const result = await api.post("/user/logout", {}, {
        skipAuth: false,
        showErrorMessage: false, // 登出不显示错误
        defaultErrorMessage: "登出失败",
      });

      if (result.success) {
        console.log("后端登出API调用成功");
      } else {
        console.log("后端登出API调用失败，但继续清除本地数据");
      }
    } else {
      console.log("无token，直接清除本地数据");
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
        console.log("❌ 未找到Token");
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
          console.log("📄 Token Payload:", payload);
          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            console.log("⏰ Token过期时间:", expDate.toLocaleString());
            console.log("⌛ 是否已过期:", Date.now() > payload.exp * 1000);
          }
        }
      } catch (error) {
        console.log("❌ Token解析失败:", error);
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

    const isDev = import.meta.env.DEV;
    const devMode = import.meta.env.MODE;
    const interval = isDev ? 30 * 1000 : 3 * 60 * 1000;
    
    console.log("🔧 环境检测信息:");
    console.log("  - import.meta.env.DEV:", isDev);
    console.log("  - import.meta.env.MODE:", devMode);
    console.log("  - 刷新间隔:", interval / 1000, "秒");

    console.log(
      "🔄 启动Token自动刷新，间隔:",
      isDev ? "30秒 (开发模式)" : "3分钟"
    );
    console.log(
      "⏰ 下次自动刷新将在",
      isDev ? "30秒" : "3分钟",
      "后执行"
    );

    // 设置定时器 - 等待指定时间后开始第一次自动刷新
    this.refreshTimer = setInterval(() => {
      console.log("⏰ 触发自动刷新定时器");
      this.performRefresh();
    }, this.REFRESH_INTERVAL);

    console.log("✅ Token自动刷新定时器已设置");
    console.log("✅ 定时器ID:", this.refreshTimer);
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
        console.log("❌ Token自动刷新失败:", result.message);
        
        // 如果刷新失败，可能需要重新登录
        if (result.message?.includes("已失效") || result.message?.includes("无效")) {
          console.log("🚨 Token已失效，准备强制退出登录");
          await this.handleAuthFailure();
        }
      }
    } catch (error) {
      console.error("❌ Token自动刷新异常:", error);
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
  private async handleAuthFailure(): Promise<void> {
    try {
      // 停止自动刷新
      this.stopAutoRefresh();
      
      // 清除认证数据
      if (this.loginServiceInstance) {
        await this.loginServiceInstance.clearAuthData();
      }
      
      // 跳转到登录页
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
      
    } catch (error) {
      console.error("处理认证失败时发生错误:", error);
    }
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

// 导出工具类
export { TokenRefreshManager };

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
