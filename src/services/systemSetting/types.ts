/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-18 18:51:18
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-11 10:37:39
 * @FilePath: /KR-virt/src/services/systemSetting/types.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 时间同步相关类型定义

// NTP服务器配置
export interface NtpServerConfig {
  address: string;
}

// NTP服务器状态
export interface NtpServerStatus {
  address: string;
  status: string;
}

// 节点时间同步状态
export interface NodeTimeSyncStatus {
  sync_service: string;
  service_status: string;
  ntp_server_list: NtpServerStatus[];
}

// 时间同步状态响应
export interface TimeSyncStatusResponse {
  nodes: Record<string, NodeTimeSyncStatus>;
}

// 时间同步执行请求
export interface TimeSyncExecuteRequest {
  node_ids?: string[];
}

// 时间同步执行响应
export interface TimeSyncExecuteResponse {
  task_id: string;
  status: string;
  message: string;
}

// 组件状态相关类型
export interface TimeSyncComponentState {
  ntpServer: string;
  syncStatus: TimeSyncStatusResponse | null;
  loading: boolean;
  refreshing: boolean;
  executing: boolean;
}

// ===== 许可证管理相关类型 =====

// 许可证信息
export interface LicenseInfo {
  device_code: string;
  expiry_date: string; // ISO 8601 格式
  active_status: string;
}

// 许可证上传响应
export interface LicenseUploadResponse {
  message: string;
  success: boolean;
}

// ===== 登录策略相关类型 =====

// 登录策略配置
export interface LoginPolicy {
  login_timeout_value: number; // 登录超时时间（分钟）
  login_max_retry_times: number; // 最大重试次数
  enable_two_factor_auth: boolean; // 是否启用双因子认证
}

// 登录策略更新请求
export type LoginPolicyUpdateRequest = LoginPolicy;

// 登录策略响应
export type LoginPolicyResponse = LoginPolicy;

// ===== 存储策略相关类型 =====

// 存储策略配置
export interface StoragePolicy {
  system_storage_id: number; // 系统存储ID
  storage_threshold: number; // 存储阈值（百分比，0-100）
  system_storage_threshold: number; // 系统存储阈值（百分比，0-100）
}

// 存储策略响应
export type StoragePolicyResponse = StoragePolicy;

// 存储阈值更新请求
export interface StorageThresholdUpdateRequest {
  storage_threshold: number; // 存储阈值（百分比，0-100）
  system_storage_threshold: number; // 系统存储阈值（百分比，0-100）
}

// 系统存储更新请求
export interface SystemStorageUpdateRequest {
  system_storage_id: number; // 系统存储ID
}

// 存储策略设置响应（包含消息）
export interface StoragePolicySetResponse {
  message?: string; // 后端返回的消息
}
