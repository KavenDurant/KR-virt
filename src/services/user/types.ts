/**
 * 用户管理相关的类型定义
 */

// 用户类型枚举
export type UserType = "system_admin" | "security_admin" | "security_auditor";

// 创建用户请求参数
export interface CreateUserRequest {
  login_name: string;
  user_name: string;
  user_type: UserType;
}

// 创建用户响应
export interface CreateUserResponse {
  login_name: string;
  password: string;
}

// 用户信息（根据API返回结构定义）
export interface User {
  id: number;
  user_type: UserType;
  login_name: string;
  user_name: string;
  created_at: string;
  updated_at: string;
  is_first_time_login: boolean;
  login_retry_times: number;
  // 以下字段用于前端显示和编辑，可能不在API返回中
  email?: string;
  phone?: string;
  department?: string;
  status?: "active" | "disabled" | "locked";
  last_login?: string;
}

// API返回的用户列表响应结构
export interface UserListApiResponse {
  user_list: User[];
}

// 用户列表响应（适配前端使用）
export interface UserListResponse {
  users: User[];
  total: number;
}

// 用户查询参数
export interface UserQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  user_type?: UserType | "all";
  status?: "active" | "disabled" | "locked" | "all";
}

// 更新用户请求参数
export interface UpdateUserRequest {
  user_name?: string;
  user_type?: UserType;
  email?: string;
  phone?: string;
  department?: string;
  status?: "active" | "disabled" | "locked";
}
