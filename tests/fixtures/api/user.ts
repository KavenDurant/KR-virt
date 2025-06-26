/**
 * 用户相关测试数据
 * 提供用户管理功能的标准测试数据
 */

import type { UserType } from "@/types";

// 用户类型定义
export const userTypes: UserType[] = [
  "system_admin",
  "security_admin",
  "security_auditor",
];

// 模拟用户数据
export const mockUsers = [
  {
    id: 1,
    login_name: "admin",
    user_name: "系统管理员",
    user_type: "system_admin" as UserType,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    is_first_time_login: false,
    login_retry_times: 0,
  },
  {
    id: 2,
    login_name: "security_admin",
    user_name: "安全保密管理员",
    user_type: "security_admin" as UserType,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    is_first_time_login: true,
    login_retry_times: 0,
  },
  {
    id: 3,
    login_name: "auditor",
    user_name: "安全审计员",
    user_type: "security_auditor" as UserType,
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
    is_first_time_login: false,
    login_retry_times: 1,
  },
];

// 用户创建请求数据
export const createUserRequest = {
  login_name: "new_user",
  user_name: "新用户",
  user_type: "security_auditor" as UserType,
};

// 用户创建响应数据
export const createUserResponse = {
  login_name: "new_user",
  password: "temp_password_123",
};

// 用户列表响应数据
export const userListResponse = {
  user_list: mockUsers,
};

// 用户类型配置
export const userTypeConfig = {
  system_admin: { label: "系统管理员", color: "red" },
  security_admin: { label: "安全保密管理员", color: "orange" },
  security_auditor: { label: "安全审计员", color: "blue" },
};
