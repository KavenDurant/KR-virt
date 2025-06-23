/**
 * Token刷新功能测试
 * 测试覆盖：Token刷新、自动刷新管理、错误处理等
 */


// 设置测试超时时间
vi.setConfig({
  testTimeout: 10000, // 10秒超时
  hookTimeout: 5000,  // 5秒Hook超时
});

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { LoginService, TokenRefreshManager } from "@/services/login";
import type { TokenRefreshResponse } from "@/services/login/types";
import {
  mockTokens,
  mockApiResponses,
  mockUserInfo,
  mockApiHelperSuccess,
  mockApiHelperError,
  mockCookieUtils,
  mockApiHelper,
  clearAllMocks,
  delay,
} from "../../helpers/loginMocks";
import {
  testScenarios,
  errorScenarios,
  generateTestToken,
  generateTestTokenRefreshResponse,
} from "../../helpers/testData";

/* istanbul ignore file */
// 测试文件，忽略覆盖率统计

// 使用vi.hoisted确保Mock配置正确
const mockCookieUtilsHoisted = vi.hoisted(() => ({
  setToken: vi.fn(),
  getToken: vi.fn(),
  removeToken: vi.fn(),
  setUser: vi.fn(),
  getUser: vi.fn(),
  removeUser: vi.fn(),
  clearAuth: vi.fn(),
  isTokenExpired: vi.fn(),
  exists: vi.fn(),
}));

const mockApiHelperHoisted = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

// Mock依赖
vi.mock("@/utils/cookies", () => ({
  CookieUtils: mockCookieUtilsHoisted,
}));

vi.mock("@/utils/apiHelper", () => ({
  api: mockApiHelperHoisted,
}));

// Mock环境配置
vi.mock("@/config/env", () => ({
  EnvConfig: {
    USE_MOCK_DATA: false,
  },
}));

describe("Token刷新功能", () => {
  let loginService: LoginService;

  beforeEach(() => {
    loginService = new LoginService();
    clearAllMocks();

    // 设置默认Mock状态
    mockCookieUtilsHoisted.getToken.mockReturnValue(mockTokens.validToken);
    mockCookieUtilsHoisted.getUser.mockReturnValue(mockUserInfo);
  });

  afterEach(() => {
    clearAllMocks();
  });

  describe("refreshToken方法", () => {
    test("应该成功刷新Token", async () => {
      const refreshResponse = generateTestTokenRefreshResponse();
      mockApiHelperHoisted.get.mockResolvedValue(
        mockApiHelperSuccess(refreshResponse)
      );

      const result = await loginService.refreshToken();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Token刷新成功");
      expect(result.token).toBe(refreshResponse.access_token);

      // 验证API调用
      expect(mockApiHelperHoisted.get).toHaveBeenCalledWith(
        "/user/renew_access_token",
        {},
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockTokens.validToken}`,
          },
          skipAuth: true,
          showErrorMessage: false,
        })
      );

      // 验证Token已更新
      expect(mockCookieUtilsHoisted.setToken).toHaveBeenCalledWith(refreshResponse.access_token);
      
      // 验证用户信息已更新
      expect(mockCookieUtilsHoisted.setUser).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockUserInfo,
          lastLogin: expect.any(String),
        })
      );
    });

    test("应该处理没有Token的情况", async () => {
      mockCookieUtilsHoisted.getToken.mockReturnValue(null);

      const result = await loginService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe("未找到有效的Token");
      expect(mockApiHelperHoisted.get).not.toHaveBeenCalled();
    });

    test("应该处理Token格式无效的情况", async () => {
      mockCookieUtilsHoisted.getToken.mockReturnValue("");

      const result = await loginService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Token格式无效，已清除本地数据");
      expect(mockCookieUtilsHoisted.clearAuth).toHaveBeenCalled();
    });

    test("应该处理API刷新失败", async () => {
      mockApiHelperHoisted.get.mockResolvedValue(
        mockApiHelperError("Token已过期")
      );

      const result = await loginService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Token已失效，请重新登录");
      expect(result.requireReauth).toBe(true);
      expect(mockCookieUtilsHoisted.clearAuth).toHaveBeenCalled();
    });

    test("应该处理网络错误", async () => {
      mockApiHelperHoisted.get.mockRejectedValue(new Error("Network Error"));

      const result = await loginService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Token刷新请求失败，请检查网络连接");
    });

    test("应该处理401认证错误", async () => {
      const authError = { status: 401, message: "Unauthorized" };
      mockApiHelperHoisted.get.mockRejectedValue(authError);

      const result = await loginService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Token已失效，请重新登录");
      expect(result.requireReauth).toBe(true);
      expect(mockCookieUtilsHoisted.clearAuth).toHaveBeenCalled();
    });

    test("应该处理响应格式错误", async () => {
      // 返回没有access_token的响应
      mockApiHelperHoisted.get.mockResolvedValue(
        mockApiHelperSuccess({ invalid: "response" })
      );

      const result = await loginService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Token刷新响应格式错误：缺少access_token");
    });
  });

  describe("Token格式验证", () => {
    test("应该验证有效的Token格式", () => {
      // 通过私有方法测试，这里我们通过refreshToken间接测试
      mockApiHelperHoisted.get.mockResolvedValue(
        mockApiHelperSuccess(generateTestTokenRefreshResponse())
      );

      // 有效Token应该通过验证
      expect(loginService.refreshToken()).resolves.toMatchObject({
        success: true,
      });
    });

    test("应该拒绝空Token", async () => {
      mockCookieUtilsHoisted.getToken.mockReturnValue("");

      const result = await loginService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Token格式无效，已清除本地数据");
    });

    test("应该拒绝null Token", async () => {
      mockCookieUtilsHoisted.getToken.mockReturnValue(null);

      const result = await loginService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe("未找到有效的Token");
    });
  });

  describe("错误处理机制", () => {
    test("应该识别认证相关错误", async () => {
      const authErrors = [
        "401",
        "403", 
        "Unauthorized",
        "Forbidden",
        "invalid",
        "expired",
        "已失效",
        "无效",
        "DecodeError",
        "token"
      ];

      for (const errorKeyword of authErrors) {
        mockApiHelperHoisted.get.mockResolvedValue(
          mockApiHelperError(`Error: ${errorKeyword}`)
        );

        const result = await loginService.refreshToken();

        expect(result.success).toBe(false);
        expect(result.requireReauth).toBe(true);
        expect(mockCookieUtilsHoisted.clearAuth).toHaveBeenCalled();

        // 重置Mock
        mockCookieUtilsHoisted.clearAuth.mockClear();
      }
    });

    test("应该处理非认证相关错误", async () => {
      mockApiHelperHoisted.get.mockResolvedValue(
        mockApiHelperError("Server maintenance")
      );

      const result = await loginService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.requireReauth).toBeUndefined();
      expect(mockCookieUtilsHoisted.clearAuth).not.toHaveBeenCalled();
    });
  });

  describe("用户信息更新", () => {
    test("应该在刷新成功后更新用户最后登录时间", async () => {
      const refreshResponse = generateTestTokenRefreshResponse();
      mockApiHelperHoisted.get.mockResolvedValue(
        mockApiHelperSuccess(refreshResponse)
      );

      const beforeTime = Date.now();
      await loginService.refreshToken();
      const afterTime = Date.now();

      expect(mockCookieUtilsHoisted.setUser).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockUserInfo,
          lastLogin: expect.any(String),
        })
      );

      // 验证时间戳在合理范围内
      const savedUser = mockCookieUtilsHoisted.setUser.mock.calls[0][0] as any;
      const lastLoginTime = new Date(savedUser.lastLogin).getTime();
      expect(lastLoginTime).toBeGreaterThanOrEqual(beforeTime);
      expect(lastLoginTime).toBeLessThanOrEqual(afterTime);
    });

    test("应该处理没有用户信息的情况", async () => {
      mockCookieUtilsHoisted.getUser.mockReturnValue(null);
      
      const refreshResponse = generateTestTokenRefreshResponse();
      mockApiHelperHoisted.get.mockResolvedValue(
        mockApiHelperSuccess(refreshResponse)
      );

      const result = await loginService.refreshToken();

      expect(result.success).toBe(true);
      expect(mockCookieUtilsHoisted.setToken).toHaveBeenCalledWith(refreshResponse.access_token);
      // 没有用户信息时不应该尝试更新
      expect(mockCookieUtilsHoisted.setUser).not.toHaveBeenCalled();
    });
  });
});

describe("TokenRefreshManager", () => {
  let refreshManager: TokenRefreshManager;
  let loginService: LoginService;

  beforeEach(() => {
    refreshManager = TokenRefreshManager.getInstance();
    loginService = new LoginService();
    clearAllMocks();
    
    // 设置默认认证状态
    mockCookieUtilsHoisted.getToken.mockReturnValue(mockTokens.validToken);
    mockCookieUtilsHoisted.getUser.mockReturnValue(mockUserInfo);
  });

  afterEach(() => {
    refreshManager.stopAutoRefresh();
    clearAllMocks();
  });

  describe("单例模式", () => {
    test("应该返回同一个实例", () => {
      const instance1 = TokenRefreshManager.getInstance();
      const instance2 = TokenRefreshManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("自动刷新管理", () => {
    test("应该启动自动刷新", () => {
      refreshManager.setLoginService(loginService);
      refreshManager.startAutoRefresh();

      const status = refreshManager.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.isRefreshing).toBe(false);
    });

    test("应该停止自动刷新", () => {
      refreshManager.setLoginService(loginService);
      refreshManager.startAutoRefresh();
      refreshManager.stopAutoRefresh();

      const status = refreshManager.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.isRefreshing).toBe(false);
    });

    test("应该防止重复启动", () => {
      refreshManager.setLoginService(loginService);
      refreshManager.startAutoRefresh();
      
      // 尝试再次启动
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      refreshManager.startAutoRefresh();
      
      expect(consoleSpy).toHaveBeenCalledWith("Token自动刷新已经在运行中");
      consoleSpy.mockRestore();
    });
  });

  describe("状态检查", () => {
    test("应该正确报告运行状态", () => {
      refreshManager.setLoginService(loginService);
      
      // 初始状态
      let status = refreshManager.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.isRefreshing).toBe(false);

      // 启动后状态
      refreshManager.startAutoRefresh();
      status = refreshManager.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.isRefreshing).toBe(false);

      // 停止后状态
      refreshManager.stopAutoRefresh();
      status = refreshManager.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.isRefreshing).toBe(false);
    });
  });
});
