/**
 * 登录服务层测试
 * 测试覆盖：用户登录、认证状态、用户管理等核心功能
 */


// 设置测试超时时间
vi.setConfig({
  testTimeout: 10000, // 10秒超时
  hookTimeout: 5000,  // 5秒Hook超时
});

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { LoginService } from "@/services/login";
import type { LoginData, AuthResponse, UserInfo } from "@/services/login/types";
import {
  mockUsers,
  mockTokens,
  mockApiResponses,
  mockUserInfo,
  mockFirstTimeUserInfo,
  mockLoginData,
  mockSuccessResponse,
  mockFailureResponse,
  mockApiHelperSuccess,
  mockApiHelperError,
  mockCookieUtils,
  mockApiHelper,
  clearAllMocks,
  setupMockEnv,
  restoreEnv,
  delay,
} from "../../helpers/loginMocks";
import {
  testScenarios,
  errorScenarios,
  generateTestUserInfo,
  generateTestLoginData,
  generateTestToken,
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

describe("LoginService", () => {
  let loginService: LoginService;

  beforeEach(() => {
    // 创建新的登录服务实例
    loginService = new LoginService();

    // 清理所有Mock
    clearAllMocks();

    // 设置默认Mock返回值
    mockCookieUtilsHoisted.getToken.mockReturnValue(null);
    mockCookieUtilsHoisted.getUser.mockReturnValue(null);
    mockCookieUtilsHoisted.exists.mockReturnValue(false);
    mockCookieUtilsHoisted.isTokenExpired.mockReturnValue(true);
  });

  afterEach(() => {
    clearAllMocks();
    restoreEnv();
  });

  describe("用户登录功能", () => {
    test("应该成功登录并返回用户信息", async () => {
      // 设置Mock API响应
      mockApiHelperHoisted.post.mockResolvedValue(
        mockApiHelperSuccess(mockApiResponses.loginSuccess)
      );

      const result = await loginService.login(mockLoginData);

      expect(result.success).toBe(true);
      expect(result.message).toBe("登录成功");
      expect(result.token).toBe(mockTokens.validToken);
      expect(result.user).toMatchObject({
        username: mockLoginData.login_name,
        role: "user",
        permissions: expect.any(Array),
        lastLogin: expect.any(String),
        isFirstLogin: false,
      });

      // 验证Token和用户信息已保存
      expect(mockCookieUtilsHoisted.setToken).toHaveBeenCalledWith(mockTokens.validToken);
      expect(mockCookieUtilsHoisted.setUser).toHaveBeenCalledWith(expect.any(Object));
    });

    test("应该处理首次登录用户", async () => {
      // 设置首次登录响应
      mockApiHelperHoisted.post.mockResolvedValue(
        mockApiHelperSuccess(mockApiResponses.loginSuccessFirstTime)
      );

      const firstTimeLoginData = generateTestLoginData({ login_name: "first_user" });
      const result = await loginService.login(firstTimeLoginData);

      expect(result.success).toBe(true);
      expect(result.user?.isFirstLogin).toBe(true);
      expect(result.user?.username).toBe("first_user");
    });

    test("应该处理登录失败", async () => {
      // 设置API失败响应
      mockApiHelperHoisted.post.mockResolvedValue(
        mockApiHelperError("用户名或密码不正确")
      );

      const result = await loginService.login(mockLoginData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("用户名或密码不正确");
      expect(result.token).toBeUndefined();
      expect(result.user).toBeUndefined();

      // 验证没有保存任何认证信息
      expect(mockCookieUtilsHoisted.setToken).not.toHaveBeenCalled();
      expect(mockCookieUtilsHoisted.setUser).not.toHaveBeenCalled();
    });

    test("应该处理网络错误", async () => {
      // 设置网络错误
      mockApiHelperHoisted.post.mockRejectedValue(new Error("Network Error"));

      const result = await loginService.login(mockLoginData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("登录失败");
    });

    test("应该处理422验证错误", async () => {
      // 设置422验证错误
      const validationError = {
        status: 422,
        data: {
          errors: {
            login_name: ["用户名不能为空"],
            password: ["密码格式不正确"],
          },
        },
      };

      mockApiHelperHoisted.post.mockRejectedValue(validationError);

      const result = await loginService.login(mockLoginData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("登录失败");
    });
  });

  describe("Mock模式登录", () => {
    beforeEach(() => {
      setupMockEnv(true);
    });

    test("应该在Mock模式下成功登录", async () => {
      const result = await loginService.login(mockLoginData);

      expect(result.success).toBe(true);
      expect(result.message).toBe("登录成功");
      expect(result.token).toBeDefined();
      expect(result.user).toMatchObject({
        username: mockLoginData.login_name,
        role: expect.any(String),
        permissions: expect.any(Array),
      });
    });

    test("应该在Mock模式下处理无效凭据", async () => {
      const invalidData = generateTestLoginData({ password: "wrong_password" });
      const result = await loginService.login(invalidData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("用户名或密码");
    });
  });

  describe("认证状态管理", () => {
    test("应该正确检查认证状态 - 已认证", () => {
      mockCookieUtilsHoisted.getToken.mockReturnValue(mockTokens.validToken);
      mockCookieUtilsHoisted.getUser.mockReturnValue(mockUserInfo);

      const isAuthenticated = loginService.isAuthenticated();

      expect(isAuthenticated).toBe(true);
    });

    test("应该正确检查认证状态 - 未认证", () => {
      mockCookieUtilsHoisted.getToken.mockReturnValue(null);
      mockCookieUtilsHoisted.getUser.mockReturnValue(null);

      const isAuthenticated = loginService.isAuthenticated();

      expect(isAuthenticated).toBe(false);
    });

    test("应该正确获取当前用户信息", () => {
      mockCookieUtilsHoisted.getUser.mockReturnValue(mockUserInfo);

      const user = loginService.getCurrentUser();

      expect(user).toEqual(mockUserInfo);
    });

    test("应该正确获取Token", () => {
      mockCookieUtilsHoisted.getToken.mockReturnValue(mockTokens.validToken);

      const token = loginService.getToken();

      expect(token).toBe(mockTokens.validToken);
    });
  });

  describe("用户信息管理", () => {
    test("应该成功设置用户信息", () => {
      loginService.setUser(mockUserInfo);

      expect(mockCookieUtilsHoisted.setUser).toHaveBeenCalledWith(mockUserInfo);
    });

    test("应该成功设置Token", () => {
      loginService.setToken(mockTokens.validToken);

      expect(mockCookieUtilsHoisted.setToken).toHaveBeenCalledWith(mockTokens.validToken);
    });

    test("应该成功更新用户信息", () => {
      mockCookieUtilsHoisted.getUser.mockReturnValue(mockUserInfo);

      const updates = { role: "admin" };
      const result = loginService.updateUser(updates);

      expect(result).toBe(true);
      expect(mockCookieUtilsHoisted.setUser).toHaveBeenCalledWith({
        ...mockUserInfo,
        ...updates,
      });
    });

    test("应该处理更新不存在用户的情况", () => {
      mockCookieUtilsHoisted.getUser.mockReturnValue(null);

      const updates = { role: "admin" };
      const result = loginService.updateUser(updates);

      expect(result).toBe(false);
      expect(mockCookieUtilsHoisted.setUser).not.toHaveBeenCalled();
    });
  });

  describe("权限检查", () => {
    test("应该正确检查用户权限", () => {
      const userWithPermissions = generateTestUserInfo({
        permissions: ["read", "write"],
      });
      mockCookieUtilsHoisted.getUser.mockReturnValue(userWithPermissions);

      expect(loginService.hasPermission("read")).toBe(true);
      expect(loginService.hasPermission("write")).toBe(true);
      expect(loginService.hasPermission("delete")).toBe(false);
    });

    test("应该正确处理管理员权限", () => {
      const adminUser = generateTestUserInfo({
        permissions: ["*"],
      });
      mockCookieUtilsHoisted.getUser.mockReturnValue(adminUser);

      expect(loginService.hasPermission("any_permission")).toBe(true);
    });

    test("应该正确检查用户角色", () => {
      const adminUser = generateTestUserInfo({
        role: "administrator",
      });
      mockCookieUtilsHoisted.getUser.mockReturnValue(adminUser);

      expect(loginService.hasRole("administrator")).toBe(true);
      expect(loginService.hasRole("user")).toBe(false);
    });

    test("应该处理未登录用户的权限检查", () => {
      mockCookieUtilsHoisted.getUser.mockReturnValue(null);

      expect(loginService.hasPermission("read")).toBe(false);
      expect(loginService.hasRole("user")).toBe(false);
    });
  });

  describe("登出功能", () => {
    test("应该成功登出并清除数据", async () => {
      mockCookieUtilsHoisted.getToken.mockReturnValue(mockTokens.validToken);
      mockApiHelperHoisted.post.mockResolvedValue(mockApiHelperSuccess({}));

      const result = await loginService.logout();

      expect(result.success).toBe(true);
      expect(result.message).toBe("登出成功");
      expect(mockApiHelperHoisted.post).toHaveBeenCalledWith(
        "/user/logout",
        {},
        expect.any(Object)
      );
      expect(mockCookieUtilsHoisted.clearAuth).toHaveBeenCalled();
    });

    test("应该处理没有Token的登出", async () => {
      mockCookieUtilsHoisted.getToken.mockReturnValue(null);

      const result = await loginService.logout();

      expect(result.success).toBe(true);
      expect(mockApiHelperHoisted.post).not.toHaveBeenCalled();
      expect(mockCookieUtilsHoisted.clearAuth).toHaveBeenCalled();
    });

    test("应该处理登出API失败", async () => {
      mockCookieUtilsHoisted.getToken.mockReturnValue(mockTokens.validToken);
      mockApiHelperHoisted.post.mockRejectedValue(new Error("Network Error"));

      const result = await loginService.logout();

      // 即使API失败，也应该清除本地数据
      expect(result.success).toBe(true);
      expect(mockCookieUtilsHoisted.clearAuth).toHaveBeenCalled();
    });
  });

  describe("首次登录状态管理", () => {
    test("应该正确检查首次登录状态", () => {
      mockCookieUtilsHoisted.getUser.mockReturnValue(mockFirstTimeUserInfo);

      const isFirstTime = loginService.isFirstTimeLogin();

      expect(isFirstTime).toBe(true);
    });

    test("应该正确更新首次登录状态", () => {
      mockCookieUtilsHoisted.getUser.mockReturnValue(mockFirstTimeUserInfo);

      loginService.updateFirstTimeLoginStatus(false);

      expect(mockCookieUtilsHoisted.setUser).toHaveBeenCalledWith({
        ...mockFirstTimeUserInfo,
        isFirstLogin: false,
      });
    });
  });
});
