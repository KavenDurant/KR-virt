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
