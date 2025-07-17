/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-01 14:04:19
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-17 09:45:22
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
export interface VMMessageResponse {
  message: string;
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
  driver: string;
  net_type: string;
  bridge?: string; // 桥接网络的网桥名，可选
}

// 虚拟机光驱配置（API返回格式）
export interface VMCDRomConfig {
  name: string; // 设备名，如 'hdc', 'hdd'
  bus_type: string; // 总线类型，如 'sata', 'ide'
  path: string; // ISO文件路径
  format: string; // 格式，如 'raw'
}

// 虚拟机元数据
export interface VMMetadata {
  digested: string;
  digesting: string;
  updated_at: string;
}

// 虚拟机引导设备配置项
export interface VMBootOrderItem {
  name: string;
  type: string; 
  order: string | null; 
}

// 虚拟机详细配置
export interface VMDetailConfig {
  cpu_num: number;
  memory_gb: number;
  boot: string[];
  boot_order?: VMBootOrderItem[]; // 局部引导设备配置
  disk: VMDiskConfig[];
  cdrom: VMCDRomConfig[];
  net: VMNetConfig[];
  usb: unknown[];
  pci: unknown[];
  metadata: VMMetadata;
}

// 实际API返回的虚拟机信息
export interface VMApiInfo {
  vm_name: string;
  hostname: string;
  status: string; // 虚拟机实际运行状态：running, shutoff, paused等
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

// 虚拟机网络管理相关接口
export interface VMNetworkMountRequest {
  hostname: string;
  vm_name: string;
  net_name: string;
  model?: string;
  mac_addr?: string | null;
}

// 虚拟机网卡热插拔接口
export interface VMNetworkPlugRequest {
  hostname: string;
  vm_name: string;
  net_name: string;
  model?: string; // 网卡型号，默认为virtio高性能虚拟化驱动
  mac_addr?: string;
}

export interface VMNetworkUnplugRequest {
  hostname: string;
  vm_name: string;
  net_name: string;
  mac_addr: string;
}

export interface VMNATMountRequest {
  hostname: string;
  vm_name: string;
  net_name: string;
  bridge_name?: string | null;
  ip_addr: string;
  netmask: string;
  dhcp_start: string;
  dhcp_end: string;
}

export interface VMVLANMountRequest {
  hostname: string;
  vm_name: string;
  net_name: string;
  forward: "isolated" | "bridge";
  vlan_id?: number | null;
  ip_addr?: string | null;
  netmask?: string | null;
  dhcp_start?: string | null;
  dhcp_end?: string | null;
}

export interface VMNetworkUnmountRequest {
  hostname: string;
  vm_name: string;
  net_name?: string | null;
  mac?: string | null;
}

export interface NetworkDeviceInfo {
  id: string;
  name: string;
  model: string;
  bridge: string;
  mac: string;
  enabled: boolean;
  type: "bridge" | "nat" | "vlan";
  vlan_id?: number;
  ip_addr?: string;
  netmask?: string;
}

// 虚拟机光驱管理相关接口
export interface VMCDRomMountRequest {
  hostname: string;
  vm_name: string;
  iso_path: string;
}

export interface VMCDRomUnmountRequest {
  hostname: string;
  vm_name: string;
  target_dev?: string | null; // 要移除的目标光驱设备名（如 'hdc'），不指定时默认移除所有挂载的ISO
  iso_path?: string | null; // 指定要卸载的ISO路径（可选）
}

export interface CDRomDeviceInfo {
  id: string;
  name: string; // 设备名，如 'hdc', 'hdd'
  iso_path: string | null; // 当前挂载的ISO路径
  mounted: boolean; // 是否已挂载ISO
  bus_type: string; // 总线类型，如 'ide', 'sata'
  format?: string; // 格式，如 'raw'
}

// ============ 新增：USB设备管理相关接口 ============

// USB设备挂载请求
export interface VMUSBMountRequest {
  hostname: string;
  vm_name: string;
  vendor_id: string;
  product_id: string;
  bus: string;
  device: string;
}

// USB设备卸载请求
export interface VMUSBUnmountRequest {
  hostname: string;
  vm_name: string;
  vendor_id: string;
  product_id: string;
  bus: string;
  device: string;
}

// USB设备热插拔请求
export interface VMUSBPlugRequest {
  hostname: string;
  vm_name: string;
  vendor_id: string;
  product_id: string;
  bus: string;
  device: string;
}

// USB设备热拔出请求
export interface VMUSBUnplugRequest {
  hostname: string;
  vm_name: string;
  vendor_id: string;
  product_id: string;
  bus: string;
  device: string;
}

// USB设备信息
export interface VMUSBDeviceInfo {
  id: string;
  vendor_id: string;
  product_id: string;
  vendor_name: string;
  product_name: string;
  bus: string;
  device: string;
  mounted: boolean; // 是否已挂载到虚拟机
  connected: boolean; // 是否在物理主机上连接
}

// ============ 新增：磁盘设备管理相关接口 ============

// 磁盘挂载请求
export interface VMDiskMountRequest {
  hostname: string;
  vm_name: string;
  disk_dir: string;
  disk_name: string;
  disk_size_gb: number;
  bus: string; // 默认 'virtio'
}

// 磁盘卸载请求
export interface VMDiskUnmountRequest {
  hostname: string;
  vm_name: string;
  disk_path: string;
  dev: string; // 设备名，如 'vdb', 'vdc'
  delete_disk: boolean; // 是否删除磁盘文件
}

// 磁盘设备信息
export interface VMDiskDeviceInfo {
  id: string;
  name: string; // 设备名，如 'vda', 'vdb'
  path: string; // 磁盘文件路径
  size_gb: number; // 磁盘大小（GB）
  bus_type: string; // 总线类型，如 'virtio', 'ide', 'scsi'
  format: string; // 磁盘格式，如 'qcow2', 'raw'
  mounted: boolean; // 是否已挂载
  readonly: boolean; // 是否只读
}
// 快照磁盘list
export interface VMSnapshotDisk {
  name: string; // 磁盘名称
  snapshot: string; // 快照名称
}

// 快照列表
export interface VMSnapshot {
  name: string; // 快照名称
  state: string; // 快照状态
  disks: VMSnapshotDisk[]; // 快照时的磁盘配置
  describe: string; // 快照描述
  created_at: string; // 创建时间
  is_current: boolean; // 是否为当前快照
  parent: string; // 父快照名称（如果有）
  has_memory: boolean; // 是否包含内存状态
}

// 创建快照请求参数
export interface CreateSnapshotRequest {
  hostname: string;
  vm_name: string;
  snapshot_name: string;
  description?: string; // 快照描述，可选
  has_memory: boolean; // 是否包含内存状态，必填参数
}

// 应用快照请求参数
export interface RevertSnapshotRequest {
  hostname: string;
  vm_name: string;
  snapshot_name: string;
}

// 删除快照请求参数
export interface DeleteSnapshotRequest {
  hostname: string;
  vm_name: string;
  snapshot_name: string;
  delete_children?: boolean; // 是否删除子快照，默认false
}

// 快照操作响应
export interface SnapshotOperationResponse {
  message: string;
  success: boolean;
}
// 虚拟机设置全局启动优先级
export interface VMSetBootPriorityRequest {
  hostname: string; // 主机名
  vm_name: string; // 虚拟机名
  boot_devs: string[]; // 启动设备列表，按优先级顺序排列
}
// 虚拟机设置局部启动优先级
export interface VMSetBootOrderRequest {
  hostname: string; // 主机名
  vm_name: string; // 虚拟机名
  boot_orders: {
    name: string; // 设备名称，如 'hd', 'cdrom', 'network', 'usb'
    type: string; // 设备类型，如 'disk', 'cdrom', 'network', 'usb'
    order: string; // 启动顺序，如 '1', '2', '3'
  }[];
  dev_model: boolean; // 是否同时保留启用全局配置，默认为true
}

// 虚拟机更新网络MAC地址请求
export interface VMUpdateMacRequest {
  hostname: string;
  vm_name: string;
  net_name: string;
  mac_addr: string;
}

// 虚拟机更新网络MAC地址响应
export interface VMUpdateMacResponse {
  message: string;
}

// 获取随机MAC地址响应
export interface VMRandomMacResponse {
  mac: string;
}

// 虚拟机修改CPU数请求
export interface VMCpuUpdateRequest {
  hostname: string;
  vm_name: string;
  cpu_num: number;
}
// 虚拟机修改内存请求
export interface VMMemoryUpdateRequest {
  hostname: string;
  vm_name: string;
  memory_gb: number;
}