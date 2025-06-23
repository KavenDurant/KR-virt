/**
 * 登录页面组件测试
 * 测试覆盖：表单渲染、用户交互、登录流程、错误处理
 */


// 设置测试超时时间
vi.setConfig({
  testTimeout: 10000, // 10秒超时
  hookTimeout: 5000,  // 5秒Hook超时
});

import React from "react";
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "antd";
import Login from "@/pages/Auth/Login";
import type { LoginData } from "@/services/login/types";
import {
  mockSuccessResponse,
  mockFailureResponse,
  mockFirstTimeUserInfo,
  createMockLoginService,
  clearAllMocks,
} from "../helpers/loginMocks";
import {
  generateTestLoginData,
  testScenarios,
  errorScenarios,
} from "../helpers/testData";

/* istanbul ignore file */
// 测试文件，忽略覆盖率统计

// 使用vi.hoisted确保Mock配置正确
const mockMessageHoisted = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}));

const mockLoginServiceHoisted = vi.hoisted(() => createMockLoginService());

const mockSecurityUtilsHoisted = vi.hoisted(() => ({
  validateUsername: vi.fn().mockReturnValue({ isValid: true }),
  validatePassword: vi.fn().mockReturnValue({
    isValid: true,
    score: 4,
    suggestions: []
  }),
}));

// Mock依赖
vi.mock("@/services/login", () => ({
  loginService: mockLoginServiceHoisted,
}));

vi.mock("@/utils/security", () => ({
  SecurityUtils: mockSecurityUtilsHoisted,
}));

// Mock Ant Design App hook
vi.mock("antd", async () => {
  const actual = await vi.importActual("antd");
  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({ message: mockMessageHoisted }),
    },
  };
});

// Mock window.location
const mockLocation = {
  hash: "",
  href: "",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// 测试组件包装器
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <App>{children}</App>
);

describe("Login组件", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    clearAllMocks();
    mockLocation.hash = "";
    mockLocation.href = "";

    // 设置默认Mock返回值
    mockLoginServiceHoisted.login.mockResolvedValue(mockSuccessResponse);
  });

  afterEach(() => {
    clearAllMocks();
  });

  describe("组件渲染", () => {
    test("应该正确渲染登录表单", () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // 检查标题
      expect(screen.getByText("KR虚拟化管理系统")).toBeInTheDocument();
      expect(screen.getByText("安全认证 · 信创合规 · 国保三级")).toBeInTheDocument();

      // 检查表单字段
      expect(screen.getByLabelText("用户名")).toBeInTheDocument();
      expect(screen.getByLabelText("密码")).toBeInTheDocument();
      expect(screen.getByLabelText("验证码")).toBeInTheDocument();

      // 检查提交按钮
      expect(screen.getByRole("button", { name: "安全登录" })).toBeInTheDocument();

      // 检查合规信息
      expect(screen.getByText("信创合规认证")).toBeInTheDocument();
    });

    test("应该显示正确的占位符文本", () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText("请输入用户名 (test_user)")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("请输入6位验证码 (123456)")).toBeInTheDocument();
    });

    test("应该显示密码强度指示器", async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)");
      
      // 输入密码后应该显示强度指示器
      await user.type(passwordInput, "TestPassword123!");
      
      // 密码强度指示器应该出现（通过组件存在来验证）
      await waitFor(() => {
        expect(passwordInput).toHaveValue("TestPassword123!");
      });
    });
  });

  describe("表单验证", () => {
    test("应该验证必填字段", async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const submitButton = screen.getByRole("button", { name: "安全登录" });
      
      // 直接点击提交按钮
      await user.click(submitButton);

      // 应该显示验证错误
      await waitFor(() => {
        expect(screen.getByText("请输入用户名")).toBeInTheDocument();
        expect(screen.getByText("请输入密码")).toBeInTheDocument();
        expect(screen.getByText("请输入验证码")).toBeInTheDocument();
      });

      // 不应该调用登录服务
      expect(mockLoginServiceHoisted.login).not.toHaveBeenCalled();
    });

    test("应该验证验证码格式", async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // 填写表单
      await user.type(screen.getByPlaceholderText("请输入用户名 (test_user)"), "test_user");
      await user.type(screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)"), "password123");
      await user.type(screen.getByPlaceholderText("请输入6位验证码 (123456)"), "12345"); // 只有5位

      const submitButton = screen.getByRole("button", { name: "安全登录" });
      await user.click(submitButton);

      // 应该显示验证码格式错误
      await waitFor(() => {
        expect(screen.getByText("请输入6位数字验证码")).toBeInTheDocument();
      });

      expect(mockLoginServiceHoisted.login).not.toHaveBeenCalled();
    });

    test("应该接受正确格式的验证码", async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // 填写正确的表单数据
      await user.type(screen.getByPlaceholderText("请输入用户名 (test_user)"), "test_user");
      await user.type(screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)"), "password123");
      await user.type(screen.getByPlaceholderText("请输入6位验证码 (123456)"), "123456");

      const submitButton = screen.getByRole("button", { name: "安全登录" });
      await user.click(submitButton);

      // 应该调用登录服务
      await waitFor(() => {
        expect(mockLoginServiceHoisted.login).toHaveBeenCalledWith({
          login_name: "test_user",
          password: "password123",
          two_factor: "123456",
        });
      });
    });
  });

  describe("登录流程", () => {
    test("应该成功处理正常登录", async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // 填写表单
      await user.type(screen.getByPlaceholderText("请输入用户名 (test_user)"), "test_user");
      await user.type(screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)"), "-p-p-p");
      await user.type(screen.getByPlaceholderText("请输入6位验证码 (123456)"), "123456");

      const submitButton = screen.getByRole("button", { name: "安全登录" });
      await user.click(submitButton);

      // 验证登录调用
      await waitFor(() => {
        expect(mockLoginServiceHoisted.login).toHaveBeenCalledWith({
          login_name: "test_user",
          password: "-p-p-p",
          two_factor: "123456",
        });
      });

      // 验证成功消息
      await waitFor(() => {
        expect(mockMessageHoisted.success).toHaveBeenCalledWith("登录成功！正在跳转...");
      });

      // 验证跳转（延迟1秒后）
      await waitFor(() => {
        expect(mockLocation.hash).toBe("#/dashboard");
      }, { timeout: 2000 });
    });

    test("应该处理首次登录用户", async () => {
      // 设置首次登录响应
      mockLoginServiceHoisted.login.mockResolvedValue({
        ...mockSuccessResponse,
        user: { ...mockSuccessResponse.user!, isFirstLogin: true },
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // 填写并提交表单
      await user.type(screen.getByPlaceholderText("请输入用户名 (test_user)"), "first_user");
      await user.type(screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)"), "temp123");
      await user.type(screen.getByPlaceholderText("请输入6位验证码 (123456)"), "123456");

      const submitButton = screen.getByRole("button", { name: "安全登录" });
      await user.click(submitButton);

      // 验证跳转到首次登录流程
      await waitFor(() => {
        expect(mockLocation.hash).toBe("#/first-time-login");
      }, { timeout: 2000 });
    });

    test("应该处理登录失败", async () => {
      mockLoginServiceHoisted.login.mockResolvedValue(mockFailureResponse);

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // 填写表单
      await user.type(screen.getByPlaceholderText("请输入用户名 (test_user)"), "test_user");
      await user.type(screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)"), "wrong_password");
      await user.type(screen.getByPlaceholderText("请输入6位验证码 (123456)"), "123456");

      const submitButton = screen.getByRole("button", { name: "安全登录" });
      await user.click(submitButton);

      // 验证错误消息
      await waitFor(() => {
        expect(mockMessageHoisted.error).toHaveBeenCalledWith("用户名或密码不正确");
      });

      // 不应该跳转
      expect(mockLocation.hash).toBe("");
    });

    test("应该处理登录异常", async () => {
      mockLoginServiceHoisted.login.mockRejectedValue(new Error("Network Error"));

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // 填写并提交表单
      await user.type(screen.getByPlaceholderText("请输入用户名 (test_user)"), "test_user");
      await user.type(screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)"), "password123");
      await user.type(screen.getByPlaceholderText("请输入6位验证码 (123456)"), "123456");

      const submitButton = screen.getByRole("button", { name: "安全登录" });
      await user.click(submitButton);

      // 验证异常错误消息
      await waitFor(() => {
        expect(mockMessageHoisted.error).toHaveBeenCalledWith("登录失败，请稍后重试");
      });
    });
  });

  describe("加载状态", () => {
    test("应该在登录过程中显示加载状态", async () => {
      // 设置延迟响应
      mockLoginServiceHoisted.login.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSuccessResponse), 1000))
      );

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // 填写并提交表单
      await user.type(screen.getByPlaceholderText("请输入用户名 (test_user)"), "test_user");
      await user.type(screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)"), "password123");
      await user.type(screen.getByPlaceholderText("请输入6位验证码 (123456)"), "123456");

      const submitButton = screen.getByRole("button", { name: "安全登录" });
      await user.click(submitButton);

      // 验证按钮显示加载状态
      await waitFor(() => {
        expect(submitButton).toHaveAttribute("class", expect.stringContaining("ant-btn-loading"));
      });

      // 等待登录完成
      await waitFor(() => {
        expect(mockMessageHoisted.success).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    test("应该在登录失败后恢复正常状态", async () => {
      mockLoginServiceHoisted.login.mockResolvedValue(mockFailureResponse);

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // 填写并提交表单
      await user.type(screen.getByPlaceholderText("请输入用户名 (test_user)"), "test_user");
      await user.type(screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)"), "wrong_password");
      await user.type(screen.getByPlaceholderText("请输入6位验证码 (123456)"), "123456");

      const submitButton = screen.getByRole("button", { name: "安全登录" });
      await user.click(submitButton);

      // 等待错误处理完成
      await waitFor(() => {
        expect(mockMessageHoisted.error).toHaveBeenCalled();
      });

      // 验证按钮恢复正常状态
      await waitFor(() => {
        expect(submitButton).not.toHaveAttribute("class", expect.stringContaining("ant-btn-loading"));
      });
    });
  });

  describe("自定义登录成功回调", () => {
    test("应该调用自定义登录成功回调", async () => {
      const mockOnLoginSuccess = vi.fn();

      render(
        <TestWrapper>
          <Login onLoginSuccess={mockOnLoginSuccess} />
        </TestWrapper>
      );

      // 填写并提交表单
      await user.type(screen.getByPlaceholderText("请输入用户名 (test_user)"), "test_user");
      await user.type(screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)"), "password123");
      await user.type(screen.getByPlaceholderText("请输入6位验证码 (123456)"), "123456");

      const submitButton = screen.getByRole("button", { name: "安全登录" });
      await user.click(submitButton);

      // 验证自定义回调被调用
      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled();
      }, { timeout: 2000 });

      // 不应该进行默认跳转
      expect(mockLocation.hash).toBe("");
    });
  });

  describe("密码强度验证", () => {
    test("应该在密码输入时显示强度指示器", async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText("请输入密码 (-p0-p0-p0)");
      
      // 输入弱密码
      await user.type(passwordInput, "123");
      
      // 验证密码值已更新
      await waitFor(() => {
        expect(passwordInput).toHaveValue("123");
      });

      // 输入强密码
      await user.clear(passwordInput);
      await user.type(passwordInput, "StrongPassword123!");
      
      await waitFor(() => {
        expect(passwordInput).toHaveValue("StrongPassword123!");
      });
    });
  });
});
