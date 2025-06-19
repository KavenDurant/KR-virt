/**
 * 用户管理相关的类型定义
 */

// 用户类型枚举
export type UserType = "system_admin" | "operator" | "user";

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

// 用户信息
export interface User {
  id: string;
  login_name: string;
  user_name: string;
  user_type: UserType;
  email?: string;
  phone?: string;
  department?: string;
  status: "active" | "disabled" | "locked";
  last_login?: string;
  create_time: string;
}

// 用户列表响应
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
