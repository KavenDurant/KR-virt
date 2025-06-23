/**
 * 首次登录流程测试
 * 测试覆盖：2FA设置、密码修改、首次登录状态管理
 */


// 设置测试超时时间
vi.setConfig({
  testTimeout: 10000, // 10秒超时
  hookTimeout: 5000,  // 5秒Hook超时
});

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { LoginService } from "@/services/login";
import type {
  TotpSecretResponse,
  TotpVerifyRequest,
  TotpVerifyResponse,
  FirstTimePasswordChangeRequest,
  FirstTimePasswordChangeResponse,
} from "@/services/login/types";
import {
  mockApiResponses,
  mockFirstTimeUserInfo,
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
  generateTestTotpSecretResponse,
  generateTestTotpVerifyRequest,
  generateTestPasswordChangeRequest,
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

describe("首次登录流程", () => {
  let loginService: LoginService;

  beforeEach(() => {
    loginService = new LoginService();
    clearAllMocks();

    // 设置首次登录用户状态
    mockCookieUtilsHoisted.getUser.mockReturnValue(mockFirstTimeUserInfo);
  });

  afterEach(() => {
    clearAllMocks();
    restoreEnv();
  });

  describe("2FA密钥生成", () => {
    test("应该成功生成2FA密钥", async () => {
      const secretResponse = generateTestTotpSecretResponse();
      mockApiHelperHoisted.post.mockResolvedValue(
        mockApiHelperSuccess(secretResponse)
      );

      const result = await loginService.generateTotpSecret();

      expect(result.success).toBe(true);
      expect(result.message).toBe("2FA密钥生成成功");
      expect(result.data).toEqual(secretResponse);

      // 验证API调用
      expect(mockApiHelperHoisted.post).toHaveBeenCalledWith(
        "/user/change_totp_secret",
        {},
        expect.objectContaining({
          defaultSuccessMessage: "2FA密钥生成成功",
          defaultErrorMessage: "2FA密钥生成失败，请稍后重试",
        })
      );
    });

    test("应该处理2FA密钥生成失败", async () => {
      mockApiHelperHoisted.post.mockResolvedValue(
        mockApiHelperError("服务器错误")
      );

      const result = await loginService.generateTotpSecret();

      expect(result.success).toBe(false);
      expect(result.message).toBe("服务器错误");
      expect(result.data).toBeUndefined();
    });

    test("应该处理网络错误", async () => {
      mockApiHelperHoisted.post.mockRejectedValue(new Error("Network Error"));

      const result = await loginService.generateTotpSecret();

      expect(result.success).toBe(false);
      expect(result.message).toContain("2FA密钥生成失败");
    });
  });

  describe("Mock模式2FA密钥生成", () => {
    beforeEach(() => {
      setupMockEnv(true);
    });

    test("应该在Mock模式下生成2FA密钥", async () => {
      const result = await loginService.generateTotpSecret();

      expect(result.success).toBe(true);
      expect(result.message).toBe("2FA密钥生成成功");
      expect(result.data).toEqual({
        totp_secret: "JBSWY3DPEHPK3PXP",
      });

      // Mock模式不应该调用真实API
      expect(mockApiHelperHoisted.post).not.toHaveBeenCalled();
    });
  });

  describe("2FA代码验证", () => {
    test("应该验证有效的2FA代码格式", async () => {
      const validRequest = generateTestTotpVerifyRequest({ totp_code: "123456" });
      
      const result = await loginService.verifyTotpCode(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe("2FA代码格式正确");
    });

    test("应该拒绝无效的2FA代码格式", async () => {
      const invalidRequests = [
        generateTestTotpVerifyRequest({ totp_code: "12345" }),  // 太短
        generateTestTotpVerifyRequest({ totp_code: "1234567" }), // 太长
        generateTestTotpVerifyRequest({ totp_code: "12345a" }),  // 包含字母
        generateTestTotpVerifyRequest({ totp_code: "12-345" }),  // 包含特殊字符
      ];

      for (const request of invalidRequests) {
        const result = await loginService.verifyTotpCode(request);
        
        expect(result.success).toBe(false);
        expect(result.message).toBe("2FA代码格式错误，请输入6位数字");
      }
    });
  });

  describe("Mock模式2FA验证", () => {
    beforeEach(() => {
      setupMockEnv(true);
    });

    test("应该在Mock模式下验证正确的2FA代码", async () => {
      const validRequest = generateTestTotpVerifyRequest({ totp_code: "123456" });
      
      const result = await loginService.verifyTotpCode(validRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe("2FA验证成功");
    });

    test("应该在Mock模式下拒绝错误的2FA代码", async () => {
      const invalidRequest = generateTestTotpVerifyRequest({ totp_code: "000000" });
      
      const result = await loginService.verifyTotpCode(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe("2FA验证码错误");
    });

    test("应该在Mock模式下接受6位数字代码", async () => {
      const validCodes = ["123456", "000000", "999999", "654321"];
      
      for (const code of validCodes) {
        const request = generateTestTotpVerifyRequest({ totp_code: code });
        const result = await loginService.verifyTotpCode(request);
        
        // Mock模式下，任何6位数字都应该被接受（除了特殊的000000）
        if (code !== "000000") {
          expect(result.success).toBe(true);
        }
      }
    });
  });

  describe("首次登录密码修改", () => {
    test("应该成功修改密码", async () => {
      mockApiHelperHoisted.post.mockResolvedValue(
        mockApiHelperSuccess(undefined)
      );

      const changeRequest = generateTestPasswordChangeRequest();
      const result = await loginService.changePasswordFirstTime(changeRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe("密码修改成功");

      // 验证API调用
      expect(mockApiHelperHoisted.post).toHaveBeenCalledWith(
        "/user/change_password",
        changeRequest,
        expect.objectContaining({
          defaultSuccessMessage: "密码修改成功",
          defaultErrorMessage: "密码修改失败，请稍后重试",
        })
      );
    });

    test("应该处理密码修改失败", async () => {
      mockApiHelperHoisted.post.mockResolvedValue(
        mockApiHelperError("密码强度不足")
      );

      const changeRequest = generateTestPasswordChangeRequest();
      const result = await loginService.changePasswordFirstTime(changeRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe("密码强度不足");
    });

    test("应该处理422验证错误", async () => {
      const validationError = {
        status: 422,
        data: {
          errors: {
            new_password: ["密码必须包含大小写字母、数字和特殊字符"],
          },
        },
      };
      
      mockApiHelperHoisted.post.mockRejectedValue(validationError);

      const changeRequest = generateTestPasswordChangeRequest();
      const result = await loginService.changePasswordFirstTime(changeRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain("密码修改失败");
    });

    test("应该处理网络错误", async () => {
      mockApiHelperHoisted.post.mockRejectedValue(new Error("Network Error"));

      const changeRequest = generateTestPasswordChangeRequest();
      const result = await loginService.changePasswordFirstTime(changeRequest);

      expect(result.success).toBe(false);
      expect(result.message).toContain("密码修改失败");
    });
  });

  describe("Mock模式密码修改", () => {
    beforeEach(() => {
      setupMockEnv(true);
    });

    test("应该在Mock模式下成功修改密码", async () => {
      const changeRequest = generateTestPasswordChangeRequest();
      const result = await loginService.changePasswordFirstTime(changeRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe("密码修改成功");

      // Mock模式不应该调用真实API
      expect(mockApiHelperHoisted.post).not.toHaveBeenCalled();
    });

    test("应该在Mock模式下模拟网络延迟", async () => {
      const startTime = Date.now();
      
      const changeRequest = generateTestPasswordChangeRequest();
      await loginService.changePasswordFirstTime(changeRequest);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Mock模式应该有800ms的模拟延迟
      expect(duration).toBeGreaterThanOrEqual(800);
      expect(duration).toBeLessThan(1000); // 允许一些误差
    });
  });

  describe("首次登录状态管理", () => {
    test("应该正确检查首次登录状态", () => {
      // 首次登录用户
      mockCookieUtilsHoisted.getUser.mockReturnValue(mockFirstTimeUserInfo);
      expect(loginService.isFirstTimeLogin()).toBe(true);

      // 非首次登录用户
      mockCookieUtilsHoisted.getUser.mockReturnValue({
        ...mockFirstTimeUserInfo,
        isFirstLogin: false,
      });
      expect(loginService.isFirstTimeLogin()).toBe(false);

      // 没有用户信息
      mockCookieUtilsHoisted.getUser.mockReturnValue(null);
      expect(loginService.isFirstTimeLogin()).toBe(false);
    });

    test("应该正确更新首次登录状态", () => {
      mockCookieUtilsHoisted.getUser.mockReturnValue(mockFirstTimeUserInfo);

      // 更新为非首次登录
      loginService.updateFirstTimeLoginStatus(false);

      expect(mockCookieUtilsHoisted.setUser).toHaveBeenCalledWith({
        ...mockFirstTimeUserInfo,
        isFirstLogin: false,
      });
    });

    test("应该处理没有用户信息时的状态更新", () => {
      mockCookieUtilsHoisted.getUser.mockReturnValue(null);

      // 尝试更新状态
      loginService.updateFirstTimeLoginStatus(false);

      // 没有用户信息时不应该调用setUser
      expect(mockCookieUtilsHoisted.setUser).not.toHaveBeenCalled();
    });
  });

  describe("首次登录完整流程", () => {
    test("应该完成完整的首次登录流程", async () => {
      setupMockEnv(true);

      // 1. 生成2FA密钥
      const secretResult = await loginService.generateTotpSecret();
      expect(secretResult.success).toBe(true);

      // 2. 验证2FA代码
      const verifyRequest = generateTestTotpVerifyRequest();
      const verifyResult = await loginService.verifyTotpCode(verifyRequest);
      expect(verifyResult.success).toBe(true);

      // 3. 修改密码
      const changeRequest = generateTestPasswordChangeRequest();
      const changeResult = await loginService.changePasswordFirstTime(changeRequest);
      expect(changeResult.success).toBe(true);

      // 4. 更新首次登录状态
      loginService.updateFirstTimeLoginStatus(false);
      expect(mockCookieUtilsHoisted.setUser).toHaveBeenCalledWith({
        ...mockFirstTimeUserInfo,
        isFirstLogin: false,
      });
    });

    test("应该处理流程中的错误", async () => {
      // 模拟2FA生成失败
      mockApiHelperHoisted.post.mockResolvedValue(
        mockApiHelperError("2FA服务不可用")
      );

      const secretResult = await loginService.generateTotpSecret();
      expect(secretResult.success).toBe(false);

      // 即使2FA失败，其他步骤仍应该可以继续
      const verifyRequest = generateTestTotpVerifyRequest();
      const verifyResult = await loginService.verifyTotpCode(verifyRequest);
      expect(verifyResult.success).toBe(true); // 格式验证仍然有效
    });
  });

  describe("边界情况测试", () => {
    test("应该处理空的2FA代码", async () => {
      const emptyRequest = generateTestTotpVerifyRequest({ totp_code: "" });
      const result = await loginService.verifyTotpCode(emptyRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe("2FA代码格式错误，请输入6位数字");
    });

    test("应该处理空的新密码", async () => {
      const emptyRequest = generateTestPasswordChangeRequest({ new_password: "" });
      
      setupMockEnv(true);
      const result = await loginService.changePasswordFirstTime(emptyRequest);

      // Mock模式下应该成功（实际验证由前端表单处理）
      expect(result.success).toBe(true);
    });

    test("应该处理极长的密码", async () => {
      const longPassword = "P@ssw0rd!" + "a".repeat(1000);
      const longRequest = generateTestPasswordChangeRequest({ 
        new_password: longPassword 
      });
      
      setupMockEnv(true);
      const result = await loginService.changePasswordFirstTime(longRequest);

      expect(result.success).toBe(true);
    });
  });
});
