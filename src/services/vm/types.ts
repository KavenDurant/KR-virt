/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-01 14:04:19
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-03 18:16:26
 * @FilePath: /KR-virt/src/services/vm/types.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 虚拟机模块类型定义

// 创建虚拟机请求参数
export interface CreateVMRequest {
  vm_name: string;
  hostname: string;
  memory_gb: number;
  cpu_num: number;
  disk_size_gb: number;
  disk_dir: string;
  iso_file_path: string | null;
}

// 虚拟机操作请求参数
export interface VMOperationRequest {
  vm_name: string;
  hostname: string;
}

// 删除虚拟机请求参数
export interface DeleteVMRequest extends VMOperationRequest {
  delete_disk: boolean;
}

// 虚拟机磁盘配置
export interface VMDiskConfig {
  name: string;
  bus_type: string;
  path: string;
  format: string;
}

// 虚拟机网络配置
export interface VMNetConfig {
  name: string;
  mac: string;
  bridge: string;
}

// 虚拟机元数据
export interface VMMetadata {
  digested: string;
  digesting: string;
  updated_at: string;
}

// 虚拟机详细配置
export interface VMDetailConfig {
  cpu_num: number;
  memory_gb: number;
  boot: string[];
  disk: VMDiskConfig[];
  cdrom: unknown[];
  net: VMNetConfig[];
  usb: unknown[];
  pci: unknown[];
  metadata: VMMetadata;
}

// 实际API返回的虚拟机信息
export interface VMApiInfo {
  vm_name: string;
  hostname: string;
  config_status: boolean;
  config: VMDetailConfig;
  error: string | null;
}

// 适配后的虚拟机信息（用于UI显示）
export interface VMInfo {
  vm_name: string;
  hostname: string;
  uuid: string;
  status: string;
  cpu_count: number;
  memory_gb: number;
  config_status?: boolean;
  error?: string | null;
  // 新增：详细配置信息
  config?: VMDetailConfig;
  boot_order?: string[];
  disk_info?: VMDiskConfig[];
  network_info?: VMNetConfig[];
  metadata?: VMMetadata;
  created_at?: string;
  updated_at?: string;
}

// 虚拟机列表响应（API原始格式）
export interface VMListResponse {
  vms: VMApiInfo[];
}

// 虚拟机列表响应（UI适配格式）
export interface VMListUIResponse {
  vms: VMInfo[];
}

// 创建虚拟机响应
export interface CreateVMResponse {
  success: boolean;
  message: string;
  data?: {
    vm_uuid: string;
    vm_name: string;
  };
}

// API 响应基础接口
export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// 虚拟机操作响应
export interface VMOperationResponse {
  message: string;
}

// 虚拟机状态常量
export const VM_STATUS = {
  RUNNING: "running",
  STOPPED: "stopped",
  SUSPENDED: "suspended",
  PAUSED: "paused",
  CREATING: "creating",
  ERROR: "error",
} as const;

export type VMStatusType = (typeof VM_STATUS)[keyof typeof VM_STATUS];

// 虚拟机状态映射
export const VM_STATUS_MAP = {
  running: "运行中",
  stopped: "已停止",
  shutoff: "已停止",
  suspended: "已挂起",
  paused: "已暂停",
  creating: "创建中",
  error: "错误",
} as const;

// 侧边栏树形结构相关类型
export interface SidebarVMInfo {
  name: string;
  hostname: string;
  uuid: string;
  status: string;
  cpu_count: number;
  memory_gb: number;
}

export interface SidebarHostNode {
  hostname: string;
  status: string;
  vms: SidebarVMInfo[];
}

// 新增：侧边栏集群数据结构
export interface SidebarClusterInfo {
  cluster_name: string;
  cluster_uuid: string;
  nodes: SidebarHostNode[];
}

export interface VMTreeResponse {
  nodes: SidebarHostNode[];
}

// 新增：包含集群信息的VM树响应
export interface VMTreeWithClusterResponse {
  cluster_name: string;
  cluster_uuid: string;
  nodes: SidebarHostNode[];
}
