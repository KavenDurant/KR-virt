/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 11:30:00
 * @Description: 登录服务 - 优化版本，使用统一的API工具
 */

import { api } from "@/utils/apiHelper";
import { CookieUtils } from "@/utils/cookies";
import { EnvConfig } from "@/config/env";
import type {
  LoginData,
  AuthResponse,
  UserInfo,
  MockUser,
  LoginApiResponse,
  TokenRefreshResponse,
  TotpSecretResponse,
  TotpVerifyRequest,
  TotpVerifyResponse,
  FirstTimePasswordChangeRequest,
  FirstTimePasswordChangeResponse,
} from "./types";

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
  {
    username: "new_user",
    password: "NewUser123!",
    role: "user",
    permissions: ["read"],
    isFirstLogin: true,
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
      showErrorMessage: false, // 不自动显示错误，由登录页面处理
      defaultSuccessMessage: "登录成功",
      defaultErrorMessage: "登录失败，请稍后重试",
    });

    if (!result.success) {
      // 确保返回准确的错误信息
      let errorMessage = result.message || "登录失败，请检查用户名和密码";

      // 如果是常见的登录错误，提供更友好的提示
      if (errorMessage.includes("用户名或密码") ||
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("401")) {
        errorMessage = "用户名或密码不正确";
      }

      return {
        success: false,
        message: errorMessage,
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
        isFirstLogin: apiResponse.is_first_time_login || false,
      };
      // 保存登录状态
      CookieUtils.setToken(apiResponse.access_token);
      CookieUtils.setUser(userInfo);
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
   * Token自动刷新方法
   * 使用当前Token调用刷新接口获取新的Token
   */
  async refreshToken(): Promise<AuthResponse> {
    const currentToken = this.getToken();

    // 检查是否有有效的Token
    if (!currentToken) {
      return {
        success: false,
        message: "未找到有效的Token",
      };
    }

    // 验证Token格式
    if (!this.isValidTokenFormat(currentToken)) {
      this.clearAuthDataSync();
      return {
        success: false,
        message: "Token格式无效，已清除本地数据",
      };
    }

    try {
      // 调用Token刷新接口
      const result = await api.post<TokenRefreshResponse>(
        "/user/refresh_token", // 使用正确的刷新端点
        {}, // 空的请求体，Token通过Header传递
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          skipAuth: true, // 跳过自动添加认证头，我们手动添加
          showErrorMessage: false, // 不自动显示错误，由调用方处理
          defaultErrorMessage: "Token刷新失败",
        }
      );

      if (!result.success) {
        // 处理刷新失败的情况
        return this.handleRefreshFailure(result.message);
      }

      const refreshData = result.data;
      if (!refreshData?.access_token) {
        return {
          success: false,
          message: "Token刷新响应格式错误：缺少access_token",
        };
      }

      // 更新本地Token
      CookieUtils.setToken(refreshData.access_token);

      // 更新用户信息的最后登录时间
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const updatedUser: UserInfo = {
          ...currentUser,
          lastLogin: new Date().toISOString(),
        };
        CookieUtils.setUser(updatedUser);
      }

      return {
        success: true,
        message: "Token刷新成功",
        token: refreshData.access_token,
      };

    } catch (error) {
      console.error("Token刷新请求异常:", error);

      // 根据错误类型返回不同的错误信息
      if (error && typeof error === 'object' && 'message' in error) {
        return this.handleRefreshFailure(error.message as string);
      }

      return {
        success: false,
        message: "Token刷新请求失败，请检查网络连接",
      };
    }
  }

  /**
   * 处理Token刷新失败的情况
   */
  private handleRefreshFailure(errorMessage?: string): AuthResponse {
    const message = errorMessage || "Token刷新失败";

    // 检查是否是认证相关的错误，需要清除本地数据
    const authErrorKeywords = [
      "401", "403", "Unauthorized", "Forbidden",
      "invalid", "expired", "已失效", "无效",
      "DecodeError", "token"
    ];

    const isAuthError = authErrorKeywords.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isAuthError) {
      console.warn("检测到认证错误，清除本地Token数据");
      this.clearAuthDataSync();
      return {
        success: false,
        message: "Token已失效，请重新登录",
        requireReauth: true, // 标记需要重新认证
      };
    }

    return {
      success: false,
      message,
    };
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

    // 如果有token，尝试调用后端登出API
    if (token) {
      await api.post(
        "/user/logout",
        {},
        {
          skipAuth: false,
          showErrorMessage: false, // 登出不显示错误
          defaultErrorMessage: "登出失败",
        }
      );
    }

    // 清除本地存储的认证数据
    CookieUtils.clearAuth();

    // 停止Token自动刷新
    this.stopGlobalTokenRefresh();

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
        console.groupEnd();
        return;
      }

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

    // 先停止现有的刷新（如果有）
    refreshManager.stopAutoRefresh();

    // 启动新的刷新
    refreshManager.startAutoRefresh();

    // 验证启动状态
    setTimeout(() => {
      const status = refreshManager.getStatus();

      if (!status.isRunning) {
        console.error("❌ Token自动刷新启动失败，尝试重新启动...");
        refreshManager.startAutoRefresh();
      }
    }, 1000);
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
   * 强制重启Token自动刷新（用于调试）
   */
  forceRestartTokenRefresh(): void {
    console.log("🔄 强制重启Token自动刷新...");

    const refreshManager = TokenRefreshManager.getInstance();

    // 停止现有刷新
    refreshManager.stopAutoRefresh();

    // 等待一下确保清理完成
    setTimeout(() => {
      if (this.isAuthenticated()) {
        refreshManager.setLoginService(this);
        refreshManager.startAutoRefresh();

        // 验证重启结果
        setTimeout(() => {
          const status = refreshManager.getStatus();
          console.log("🔍 强制重启结果:", status);
        }, 1000);
      } else {
        console.log("❌ 用户未登录，跳过重启");
      }
    }, 500);
  }

  /**
   * 诊断Token自动刷新状态（用于调试）
   */
  diagnoseTokenRefresh(): void {
    console.group("🔍 Token自动刷新诊断");

    // 基本状态检查
    console.log("=== 基本状态 ===");
    console.log("用户认证状态:", this.isAuthenticated());
    console.log("Token存在:", !!this.getToken());
    console.log("用户信息存在:", !!this.getCurrentUser());

    // 刷新管理器状态
    const refreshManager = TokenRefreshManager.getInstance();
    const status = refreshManager.getStatus();
    console.log("=== 刷新管理器状态 ===");
    console.log("定时器运行中:", status.isRunning);
    console.log("正在刷新:", status.isRefreshing);

    // 详细定时器信息
    console.log("=== 定时器详情 ===");
    const timerExists = (refreshManager as unknown as { refreshTimer: NodeJS.Timeout | null }).refreshTimer !== null;
    const timerId = (refreshManager as unknown as { refreshTimer: NodeJS.Timeout | null }).refreshTimer;
    console.log("定时器对象存在:", timerExists);
    console.log("定时器ID:", timerId);
    console.log("定时器类型:", typeof timerId);

    // 环境信息
    console.log("=== 环境信息 ===");
    console.log("开发环境:", import.meta.env.DEV);
    console.log("当前URL:", window.location.href);
    console.log("页面可见:", !document.hidden);

    // 手动触发测试
    console.log("=== 手动测试 ===");
    console.log("即将进行手动刷新测试...");

    this.refreshToken().then(result => {
      console.log("手动刷新结果:", result);
      if (result.success) {
        console.log("✅ 刷新成功，新Token已保存");
      } else {
        console.warn("❌ 刷新失败:", result.message);
        if (result.requireReauth) {
          console.warn("🚨 需要重新认证");
        }
      }
      console.groupEnd();
    }).catch(error => {
      console.error("手动刷新异常:", error);
      console.groupEnd();
    });
  }

  /**
   * 检查用户是否为管理员
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === "administrator" : false;
  }

  // ===== 首次登录流程相关方法 =====

  /**
   * 生成2FA密钥
   */
  async generateTotpSecret(): Promise<{
    success: boolean;
    message: string;
    data?: TotpSecretResponse;
  }> {
    if (USE_MOCK_DATA) {
      // Mock实现
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        success: true,
        message: "2FA密钥生成成功",
        data: {
          totp_secret: "JBSWY3DPEHPK3PXP", // Mock密钥
        },
      };
    }

    const result = await api.post<TotpSecretResponse>(
      "/user/change_totp_secret",
      {},
      {
        defaultSuccessMessage: "2FA密钥生成成功",
        defaultErrorMessage: "2FA密钥生成失败，请稍后重试",
      }
    );

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  /**
   * 验证2FA代码（可选，因为没有验证接口）
   */
  async verifyTotpCode(
    request: TotpVerifyRequest
  ): Promise<TotpVerifyResponse> {
    if (USE_MOCK_DATA) {
      // Mock实现 - 简单验证
      await new Promise((resolve) => setTimeout(resolve, 300));
      const isValid =
        request.totp_code === "123456" || request.totp_code.length === 6;
      return {
        success: isValid,
        message: isValid ? "2FA验证成功" : "2FA验证码错误",
      };
    }

    // 由于没有验证接口，这里只做简单的格式验证
    const isValidFormat = /^\d{6}$/.test(request.totp_code);
    return {
      success: isValidFormat,
      message: isValidFormat
        ? "2FA代码格式正确"
        : "2FA代码格式错误，请输入6位数字",
    };
  }

  /**
   * 首次登录修改密码
   */
  async changePasswordFirstTime(
    request: FirstTimePasswordChangeRequest
  ): Promise<FirstTimePasswordChangeResponse> {
    if (USE_MOCK_DATA) {
      // Mock实现
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        success: true,
        message: "密码修改成功",
      };
    }

    const result = await api.post<void>("/user/change_password", request, {
      defaultSuccessMessage: "密码修改成功",
      defaultErrorMessage: "密码修改失败，请稍后重试",
    });

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * 检查是否为首次登录
   */
  isFirstTimeLogin(): boolean {
    const user = this.getCurrentUser();
    return user?.isFirstLogin || false;
  }

  /**
   * 更新首次登录状态
   */
  updateFirstTimeLoginStatus(isFirstTime: boolean): void {
    const user = this.getCurrentUser();
    if (user) {
      this.updateUser({ isFirstLogin: isFirstTime });
    }
  }




}

// ===== Token自动刷新管理器 =====
class TokenRefreshManager {
  private static instance: TokenRefreshManager | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private loginServiceInstance: LoginService | null = null;
  private retryCount = 0;
  private readonly MAX_RETRY = 3;
  private visibilityChangeHandler: (() => void) | null = null;

  private constructor() {
    // 监听页面可见性变化
    this.setupVisibilityListener();
  }

  static getInstance(): TokenRefreshManager {
    if (!TokenRefreshManager.instance) {
      TokenRefreshManager.instance = new TokenRefreshManager();
    }
    return TokenRefreshManager.instance;
  }

  /**
   * 设置页面可见性监听器
   */
  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    this.visibilityChangeHandler = () => {
      if (!document.hidden && this.loginServiceInstance?.isAuthenticated()) {
        // 页面变为可见且用户已登录时，检查刷新状态
        const status = this.getStatus();
        if (!status.isRunning) {
          this.startAutoRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  /**
   * 清理页面可见性监听器
   */
  private cleanupVisibilityListener(): void {
    if (this.visibilityChangeHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
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

    // 修复：统一使用30秒间隔，符合用户需求
    const interval = 30 * 1000; // 30秒

    console.log(`🚀 启动Token自动刷新，间隔: ${interval/1000}秒`);

    // 设置定时器 - 等待指定时间后开始第一次自动刷新
    this.refreshTimer = setInterval(() => {
      console.log("⏰ Token自动刷新定时器触发");
      this.performRefresh();
    }, interval);

    console.log(`✅ Token自动刷新定时器已设置，ID: ${this.refreshTimer}`);
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    // 清理页面可见性监听器
    this.cleanupVisibilityListener();
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
      this.retryCount = 0; // 重置重试计数
      return;
    }

    // 防止并发刷新
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;

    try {
      const result = await this.loginServiceInstance.refreshToken();

      if (result.success) {
        // 刷新成功，重置重试计数
        this.retryCount = 0;
        console.log("✅ Token自动刷新成功");
      } else {
        // 刷新失败，增加重试计数
        this.retryCount++;
        console.warn(`⚠️ Token刷新失败 (${this.retryCount}/${this.MAX_RETRY}):`, result.message);

        // 检查是否需要重新认证
        if (result.requireReauth) {
          console.warn("🚨 Token已失效，需要重新登录");
          await this.handleAuthFailure(result.message);
          return;
        }

        // 检查是否达到最大重试次数
        if (this.retryCount >= this.MAX_RETRY) {
          console.error("🚨 Token刷新达到最大重试次数，强制退出登录");
          await this.handleAuthFailure("Token刷新多次失败，请重新登录");
          return;
        }

        console.log(`🔄 将在下次定时刷新时重试 (${this.retryCount}/${this.MAX_RETRY})`);
      }
    } catch (error) {
      this.retryCount++;
      console.error(`❌ Token刷新异常 (${this.retryCount}/${this.MAX_RETRY}):`, error);

      // 检查是否达到最大重试次数
      if (this.retryCount >= this.MAX_RETRY) {
        console.error("🚨 Token刷新异常达到最大重试次数，强制退出登录");
        await this.handleAuthFailure("网络连接异常，请检查网络后重新登录");
        return;
      }

      console.log(`🔄 网络异常，将在下次刷新时重试 (${this.retryCount}/${this.MAX_RETRY})`);
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
   * 判断是否应该强制登出 - 暂时保留，待重新实现时使用
   */
  // private shouldForceLogout(message?: string): boolean {
  //   if (!message) return false;

  //   const logoutKeywords = [
  //     "已失效",
  //     "无效",
  //     "DecodeError",
  //     "401",
  //     "403",
  //     "Unauthorized",
  //     "Forbidden",
  //     "expired",
  //     "invalid",
  //   ];

  //   return logoutKeywords.some((keyword) =>
  //     message.toLowerCase().includes(keyword.toLowerCase())
  //   );
  // }

  /**
   * 处理认证失败 - 通知用户并强制退出登录
   */
  private async handleAuthFailure(reason?: string): Promise<void> {
    try {
      console.warn("🚨 Token认证失败:", reason || "未知原因");

      // 重置重试计数
      this.retryCount = 0;

      // 停止自动刷新
      this.stopAutoRefresh();

      // 显示用户友好的错误消息
      const errorMessage = this.getLogoutMessage(reason);

      // 尝试显示通知（如果可用）
      try {
        // 检查是否有Ant Design的message组件可用
        const globalWindow = window as unknown as {
          antd?: { message?: { error: (msg: string) => void } };
        };
        if (typeof window !== "undefined" && globalWindow.antd?.message) {
          globalWindow.antd.message.error(errorMessage);
        } else {
          // 降级到原生alert
          alert(errorMessage);
        }
      } catch (notificationError) {
        console.warn("显示错误通知失败:", notificationError);
        // 即使通知失败也要继续执行清理和跳转
      }

      // 清除认证数据
      if (this.loginServiceInstance) {
        await this.loginServiceInstance.clearAuthData();
      }

      // 延迟跳转到登录页，给用户时间看到错误消息
      setTimeout(() => {
        console.log("🔄 跳转到登录页面");
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("处理认证失败时发生错误:", error);
      // 即使出错也要尝试跳转到登录页
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    }
  }

  /**
   * 获取用户友好的登出消息
   */
  private getLogoutMessage(reason?: string): string {
    if (!reason) {
      return "身份验证失败，系统将自动退出登录";
    }

    if (reason.includes("网络")) {
      return "网络连接异常，为了您的账户安全，系统将自动退出登录";
    }

    if (reason.includes("已失效") || reason.includes("expired")) {
      return "登录状态已过期，系统将自动退出登录";
    }

    if (
      reason.includes("401") ||
      reason.includes("403") ||
      reason.includes("Unauthorized")
    ) {
      return "身份验证失败，系统将自动退出登录";
    }

    return "Token验证失败，系统将自动退出登录";
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
      restart: () => void;
      detailedStatus: () => void;
      diagnose: () => void;
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

    // 强制重启自动刷新
    restart: () => {
      console.log("🔄 强制重启Token自动刷新...");
      loginService.forceRestartTokenRefresh();
    },

    // 详细状态检查
    detailedStatus: () => {
      console.log("=== 详细Token状态检查 ===");
      console.log("用户登录状态:", loginService.isAuthenticated());
      console.log("Token:", loginService.getToken());
      console.log("用户信息:", loginService.getCurrentUser());

      const status = loginService.getAutoRefreshStatus();
      console.log("自动刷新状态:", status);

      // 检查定时器状态
      const refreshManager = TokenRefreshManager.getInstance();
      console.log("刷新管理器状态:", refreshManager.getStatus());

      loginService.debugTokenInfo();
    },

    // 诊断Token自动刷新
    diagnose: () => {
      loginService.diagnoseTokenRefresh();
    },
  };

  console.log("🛠️ Token调试工具已加载!");
  console.log("在控制台中使用以下命令:");
  console.log("- debugToken.status() - 查看当前状态");
  console.log("- debugToken.detailedStatus() - 查看详细状态");
  console.log("- debugToken.diagnose() - 诊断自动刷新问题");
  console.log("- debugToken.refresh() - 立即刷新Token");
  console.log("- debugToken.start() - 启动自动刷新");
  console.log("- debugToken.stop() - 停止自动刷新");
  console.log("- debugToken.restart() - 强制重启自动刷新");
  console.log("- debugToken.clear() - 清理Token");
}
