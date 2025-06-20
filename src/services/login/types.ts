/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 11:30:00
 * @Description: 登录相关类型定义
 */

// 用户信息接口
export interface UserInfo {
  username: string;
  role: string;
  permissions: string[];
  lastLogin: string;
  isFirstLogin?: boolean; // 是否第一次登录
}

// 认证响应接口
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserInfo;
  requireReauth?: boolean; // 标记是否需要重新认证
}

// 登录数据接口
export interface LoginData {
  login_name: string; // 后端期望的字段名
  password: string;
  two_factor?: string; // TOTP验证码
}

// 密码修改响应接口
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

// 密码修改数据接口
export interface ChangePasswordData {
  username: string;
  oldPassword: string;
  newPassword: string;
}

// 模拟用户数据接口
export interface MockUser {
  username: string;
  password: string;
  role: string;
  permissions: string[];
  isFirstLogin: boolean;
}

// API 响应类型定义
export interface LoginApiResponse {
  access_token: string;
  permission: unknown;
  exp: string;
  is_first_time_login: boolean;
  [key: string]: unknown;
}

// Token刷新相关类型定义
export interface TokenRefreshRequest {
  // 根据实际API需求定义请求参数
}

export interface TokenRefreshResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
  [key: string]: unknown;
}

// 2FA相关类型定义
export interface TotpSecretResponse {
  totp_secret: string;
}

export interface TotpVerifyRequest {
  totp_code: string;
}

export interface TotpVerifyResponse {
  success: boolean;
  message: string;
}

// 首次登录密码修改类型定义
export interface FirstTimePasswordChangeRequest {
  new_password: string;
}

export interface FirstTimePasswordChangeResponse {
  success: boolean;
  message: string;
}

// 首次登录流程状态
export interface FirstTimeLoginState {
  isFirstTime: boolean;
  totpSetupRequired: boolean;
  passwordChangeRequired: boolean;
  totpSecret?: string;
  currentStep: 'totp' | 'password' | 'complete';
}
