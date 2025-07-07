/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-07 09:41:57
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-07 10:56:23
 * @FilePath: /KR-virt/src/services/storage/types.ts
 * @Description: 存储管理模块类型定义
 */

// 添加存储请求参数
export interface AddStorageRequest {
  name: string;
  fstype: string;
  device: string;
  directory: string;
  set_options: string;
}

// 移除存储请求参数
export interface RemoveStorageRequest {
  storage_id: number;
}

// 后端返回的存储项数据结构（API原始格式）
export interface StorageApiInfo {
  id: number;
  name: string;
  fstype: string;
  device: string;
  directory: string;
  options: string;
  status: "fake" | "healthy" | "warning" | "error" | "offline";
  total: number; // 总容量（GB）
  used: number; // 已使用容量（GB）
}

// 前端使用的存储数据结构（UI适配格式）
export interface StorageInfo {
  id: number;
  name: string;
  fstype: string;
  device: string;
  directory: string;
  options: string;
  status: "fake" | "healthy" | "warning" | "error" | "offline";
  total: number; // 总容量（GB）
  used: number; // 已使用容量（GB）
  // 计算字段
  available: number; // 可用容量
  usagePercent: number; // 使用率百分比
  // 显示用的额外字段
  createTime?: string;
  lastCheck?: string;
}

// 存储列表响应（API原始格式）
export interface StorageListResponse {
  storage_list: StorageApiInfo[];
}

// 存储列表响应（UI适配格式）
export interface StorageListUIResponse {
  storage_list: StorageInfo[];
}

// 添加存储响应
export interface AddStorageResponse {
  id: number;
  name: string;
}

// 移除存储响应
export interface RemoveStorageResponse {
  id: number;
  name: string;
  fstype: string;
  device: string;
  directory: string;
  set_options: string;
}

// 存储操作响应
export interface StorageOperationResponse {
  message: string;
}

// API响应基础接口
export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// 存储状态常量
export const STORAGE_STATUS = {
  FAKE: "fake",
  HEALTHY: "healthy",
  WARNING: "warning",
  ERROR: "error",
  OFFLINE: "offline",
} as const;

export type StorageStatusType =
  (typeof STORAGE_STATUS)[keyof typeof STORAGE_STATUS];

// 存储状态映射
export const STORAGE_STATUS_MAP = {
  fake: "模拟",
  healthy: "健康",
  warning: "警告",
  error: "错误",
  offline: "离线",
} as const;

// 文件系统类型常量
export const STORAGE_FS_TYPE = {
  SMB: "smb",
  EXT4: "ext4",
  XFS: "xfs",
  NFS: "nfs",
  ISCSI: "iscsi",
  CEPH: "ceph",
  BTRFS: "btrfs",
} as const;

export type StorageFsType =
  (typeof STORAGE_FS_TYPE)[keyof typeof STORAGE_FS_TYPE];

// 文件系统类型映射
export const STORAGE_FS_TYPE_MAP = {
  smb: "SMB/CIFS",
  ext4: "EXT4",
  xfs: "XFS",
  nfs: "NFS",
  iscsi: "iSCSI",
  ceph: "Ceph",
  btrfs: "Btrfs",
} as const;

// API错误响应
export interface StorageErrorResponse {
  detail: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

// 向后兼容（后续可以移除）
export type Storage = StorageInfo;
export type StorageItem = StorageApiInfo;
