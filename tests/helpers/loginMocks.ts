/**
 * 登录相关Mock数据和工具函数
 */

import { vi } from "vitest";
import type {
  LoginData,
  AuthResponse,
  UserInfo,
  LoginApiResponse,
  TokenRefreshResponse,
  TotpSecretResponse,
  TotpVerifyResponse,
  FirstTimePasswordChangeResponse,
} from "@/services/login/types";

// Mock用户数据
export const mockUsers = {
  normalUser: {
    username: "test_user",
    password: "-p-p-p",
    role: "user",
    permissions: ["read"],
    isFirstLogin: false,
  },
  firstTimeUser: {
    username: "first_user",
    password: "temp123",
    role: "user",
    permissions: ["read"],
    isFirstLogin: true,
  },
  adminUser: {
    username: "admin",
    password: "admin123",
    role: "administrator",
    permissions: ["*"],
    isFirstLogin: false,
  },
};

// Mock Token数据
export const mockTokens = {
  validToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  expiredToken: "expired_token_123",
  invalidToken: "invalid_token",
  refreshedToken: "new_refreshed_token_456",
};

// Mock API响应数据
export const mockApiResponses = {
  loginSuccess: {
    access_token: mockTokens.validToken,
    permission: { user: true },
    exp: "2024-12-31T23:59:59Z",
    is_first_time_login: false,
  } as LoginApiResponse,

  loginSuccessFirstTime: {
    access_token: mockTokens.validToken,
    permission: { user: true },
    exp: "2024-12-31T23:59:59Z",
    is_first_time_login: true,
  } as LoginApiResponse,

  tokenRefreshSuccess: {
    access_token: mockTokens.refreshedToken,
    expires_in: 3600,
    token_type: "Bearer",
  } as TokenRefreshResponse,

  totpSecretSuccess: {
    totp_secret: "JBSWY3DPEHPK3PXP",
  } as TotpSecretResponse,
};

// Mock用户信息
export const mockUserInfo: UserInfo = {
  username: "test_user",
  role: "user",
  permissions: ["read"],
  lastLogin: "2024-01-01T00:00:00Z",
  isFirstLogin: false,
};

export const mockFirstTimeUserInfo: UserInfo = {
  username: "first_user",
  role: "user",
  permissions: ["read"],
  lastLogin: "2024-01-01T00:00:00Z",
  isFirstLogin: true,
};

// Mock登录请求数据
export const mockLoginData: LoginData = {
  login_name: "test_user",
  password: "-p-p-p",
  two_factor: "123456",
};

// Mock成功响应
export const mockSuccessResponse: AuthResponse = {
  success: true,
  message: "登录成功",
  token: mockTokens.validToken,
  user: mockUserInfo,
};

// Mock失败响应
export const mockFailureResponse: AuthResponse = {
  success: false,
  message: "用户名或密码不正确",
};

// Mock API Helper响应
export const mockApiHelperSuccess = <T>(data: T) => ({
  success: true,
  data,
  message: "操作成功",
});

export const mockApiHelperError = (message: string) => ({
  success: false,
  message,
});

// Mock Cookie工具
export const mockCookieUtils = {
  setToken: vi.fn(),
  getToken: vi.fn(),
  removeToken: vi.fn(),
  setUser: vi.fn(),
  getUser: vi.fn(),
  removeUser: vi.fn(),
  clearAuth: vi.fn(),
  isTokenExpired: vi.fn(),
  exists: vi.fn(),
};

// Mock API Helper
export const mockApiHelper = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

// 创建Mock登录服务
export const createMockLoginService = () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
  generateTotpSecret: vi.fn(),
  verifyTotpCode: vi.fn(),
  changePasswordFirstTime: vi.fn(),
  isAuthenticated: vi.fn(),
  getCurrentUser: vi.fn(),
  getToken: vi.fn(),
  setUser: vi.fn(),
  setToken: vi.fn(),
  logout: vi.fn(),
  logoutSync: vi.fn(),
  clearAuthData: vi.fn(),
  clearAuthDataSync: vi.fn(),
  updateUser: vi.fn(),
  hasPermission: vi.fn(),
  hasRole: vi.fn(),
  isFirstTimeLogin: vi.fn(),
  updateFirstTimeLoginStatus: vi.fn(),
  startGlobalTokenRefresh: vi.fn(),
  stopGlobalTokenRefresh: vi.fn(),
  getAutoRefreshStatus: vi.fn(),
});

// 网络错误Mock
export const mockNetworkError = new Error("Network Error");
export const mockTimeoutError = new Error("Request Timeout");

// 422验证错误Mock
export const mock422Error = {
  status: 422,
  data: {
    errors: {
      login_name: ["用户名不能为空"],
      password: ["密码格式不正确"],
    },
  },
};

// 401认证错误Mock
export const mock401Error = {
  status: 401,
  message: "Unauthorized",
};

// 测试延迟工具
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 清理所有Mock
export const clearAllMocks = () => {
  vi.clearAllMocks();
  Object.values(mockCookieUtils).forEach(mock => mock.mockClear());
  Object.values(mockApiHelper).forEach(mock => mock.mockClear());
};

// 设置Mock环境变量
export const setupMockEnv = (useMock = true) => {
  vi.stubEnv('VITE_USE_MOCK_DATA', useMock ? 'true' : 'false');
};

// 恢复环境变量
export const restoreEnv = () => {
  vi.unstubAllEnvs();
};
