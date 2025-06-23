/**
 * 测试数据生成工具
 */

import type {
  LoginData,
  UserInfo,
  LoginApiResponse,
  TokenRefreshResponse,
  TotpSecretResponse,
  TotpVerifyRequest,
  FirstTimePasswordChangeRequest,
} from "@/services/login/types";

// 生成测试用户信息
export const generateTestUserInfo = (overrides: Partial<UserInfo> = {}): UserInfo => ({
  username: "test_user",
  role: "user",
  permissions: ["read"],
  lastLogin: new Date().toISOString(),
  isFirstLogin: false,
  ...overrides,
});

// 生成测试登录数据
export const generateTestLoginData = (overrides: Partial<LoginData> = {}): LoginData => ({
  login_name: "test_user",
  password: "-p-p-p",
  two_factor: "123456",
  ...overrides,
});

// 生成测试Token
export const generateTestToken = (prefix = "test_token"): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${prefix}_${timestamp}_${random}`;
};

// 生成测试API响应
export const generateTestLoginApiResponse = (
  overrides: Partial<LoginApiResponse> = {}
): LoginApiResponse => ({
  access_token: generateTestToken("api"),
  permission: { user: true },
  exp: new Date(Date.now() + 3600000).toISOString(), // 1小时后过期
  is_first_time_login: false,
  ...overrides,
});

// 生成Token刷新响应
export const generateTestTokenRefreshResponse = (
  overrides: Partial<TokenRefreshResponse> = {}
): TokenRefreshResponse => ({
  access_token: generateTestToken("refresh"),
  expires_in: 3600,
  token_type: "Bearer",
  ...overrides,
});

// 生成TOTP密钥响应
export const generateTestTotpSecretResponse = (
  overrides: Partial<TotpSecretResponse> = {}
): TotpSecretResponse => ({
  totp_secret: "JBSWY3DPEHPK3PXP",
  ...overrides,
});

// 生成TOTP验证请求
export const generateTestTotpVerifyRequest = (
  overrides: Partial<TotpVerifyRequest> = {}
): TotpVerifyRequest => ({
  totp_code: "123456",
  ...overrides,
});

// 生成首次登录密码修改请求
export const generateTestPasswordChangeRequest = (
  overrides: Partial<FirstTimePasswordChangeRequest> = {}
): FirstTimePasswordChangeRequest => ({
  new_password: "NewPassword123!",
  ...overrides,
});

// 测试场景数据
export const testScenarios = {
  // 正常登录场景
  normalLogin: {
    loginData: generateTestLoginData(),
    apiResponse: generateTestLoginApiResponse(),
    expectedUserInfo: generateTestUserInfo(),
  },

  // 首次登录场景
  firstTimeLogin: {
    loginData: generateTestLoginData({ login_name: "first_user" }),
    apiResponse: generateTestLoginApiResponse({ is_first_time_login: true }),
    expectedUserInfo: generateTestUserInfo({ 
      username: "first_user", 
      isFirstLogin: true 
    }),
  },

  // 管理员登录场景
  adminLogin: {
    loginData: generateTestLoginData({ login_name: "admin" }),
    apiResponse: generateTestLoginApiResponse({ 
      permission: { admin: true, "*": true } 
    }),
    expectedUserInfo: generateTestUserInfo({ 
      username: "admin", 
      role: "administrator",
      permissions: ["admin", "*"]
    }),
  },

  // Token刷新场景
  tokenRefresh: {
    currentToken: generateTestToken("current"),
    refreshResponse: generateTestTokenRefreshResponse(),
    newToken: generateTestToken("new"),
  },

  // 2FA设置场景
  totpSetup: {
    secretResponse: generateTestTotpSecretResponse(),
    verifyRequest: generateTestTotpVerifyRequest(),
  },

  // 密码修改场景
  passwordChange: {
    changeRequest: generateTestPasswordChangeRequest(),
  },
};

// 错误场景数据
export const errorScenarios = {
  // 登录失败
  loginFailure: {
    invalidCredentials: generateTestLoginData({ password: "wrong_password" }),
    networkError: new Error("Network Error"),
    timeoutError: new Error("Request Timeout"),
    validationError: {
      status: 422,
      data: {
        errors: {
          login_name: ["用户名不能为空"],
          password: ["密码格式不正确"],
        },
      },
    },
  },

  // Token刷新失败
  tokenRefreshFailure: {
    expiredToken: "expired_token",
    invalidToken: "invalid_token",
    authError: { status: 401, message: "Unauthorized" },
    networkError: new Error("Network Error"),
  },

  // 2FA错误
  totpErrors: {
    invalidCode: generateTestTotpVerifyRequest({ totp_code: "000000" }),
    formatError: generateTestTotpVerifyRequest({ totp_code: "abc" }),
    networkError: new Error("Network Error"),
  },

  // 密码修改错误
  passwordChangeErrors: {
    weakPassword: generateTestPasswordChangeRequest({ new_password: "123" }),
    networkError: new Error("Network Error"),
    validationError: {
      status: 422,
      data: {
        errors: {
          new_password: ["密码强度不足"],
        },
      },
    },
  },
};

// 边界测试数据
export const boundaryTestData = {
  // 极长用户名
  longUsername: "a".repeat(255),
  
  // 极长密码
  longPassword: "P@ssw0rd!" + "a".repeat(1000),
  
  // 空字符串
  emptyString: "",
  
  // 特殊字符
  specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  
  // Unicode字符
  unicodeChars: "测试用户名🚀",
  
  // SQL注入尝试
  sqlInjection: "'; DROP TABLE users; --",
  
  // XSS尝试
  xssAttempt: "<script>alert('xss')</script>",
};

// 性能测试数据
export const performanceTestData = {
  // 大量并发登录请求
  concurrentLogins: Array.from({ length: 100 }, (_, i) => 
    generateTestLoginData({ login_name: `user_${i}` })
  ),
  
  // 频繁Token刷新
  frequentRefresh: {
    interval: 100, // 100ms间隔
    count: 50,     // 50次刷新
  },
};

// 时间相关测试数据
export const timeTestData = {
  // 过期时间
  expiredTime: new Date(Date.now() - 3600000).toISOString(), // 1小时前
  
  // 未来时间
  futureTime: new Date(Date.now() + 3600000).toISOString(), // 1小时后
  
  // 当前时间
  currentTime: new Date().toISOString(),
  
  // 时区测试
  timezones: [
    "2024-01-01T00:00:00Z",     // UTC
    "2024-01-01T08:00:00+08:00", // 北京时间
    "2024-01-01T00:00:00-05:00", // 美东时间
  ],
};

// 生成随机测试数据
export const generateRandomTestData = () => ({
  username: `user_${Math.random().toString(36).substring(2)}`,
  password: `Pass_${Math.random().toString(36).substring(2)}!`,
  token: generateTestToken("random"),
  timestamp: new Date().toISOString(),
});
