/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-01 14:04:19
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-02 14:18:02
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
  iso_file_path: string | null; // 修改此行
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

// 虚拟机信息
export interface VMInfo {
  name: string;
  hostname: string;
  uuid: string;
  status: string;
  cpu_count: number;
  memory_gb: number;
}

// 虚拟机列表响应
export interface VMListResponse {
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
