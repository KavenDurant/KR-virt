/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群服务类型定义
 */

// 集群状态响应
export interface ClusterStatusResponse {
  is_ready: boolean;
  is_creating: boolean;
  is_joining: boolean;
}

// 集群初始化状态
export type ClusterInitStep =
  | "checking" // 检查集群状态
  | "auth" // 输入一次性密码
  | "config" // 配置集群（创建或加入）
  | "processing" // 处理中（创建中或加入中）
  | "ready"; // 完成

// 集群配置类型
export type ClusterConfigType = "create" | "join";

// 创建集群配置 - 简化版，只需要选择IP
export interface CreateClusterConfig {
  selectedIp: string; // 选择的IP地址
}

// 加入集群配置 - 用户需要填写的字段
export interface JoinClusterConfig {
  ip: string; // 节点IP地址
  hostname: string; // 节点主机名
  pub_key: string; // 公钥
}

// === 接口类型定义 ===

// 创建集群请求参数
export interface CreateClusterRequest {
  ip: string;
  hostname: string;
  disposable_secret_key: string;
}

// 加入集群请求参数
export interface JoinClusterRequest {
  ip: string;
  hostname: string;
  pub_key: string;
  disposable_secret_key: string;
}

// 添加节点请求参数
export interface AddNodeRequest {
  join_ip: string;
  join_hostname: string;
}

// 添加节点响应
export interface AddNodeResponse {
  message: string;
  node_id?: string;
  status?: string;
}

// 移除节点请求参数
export interface RemoveNodeRequest {
  hostname: string;
}

// 移除节点响应
export interface RemoveNodeResponse {
  message: string;
}

// 创建集群响应
export interface CreateClusterResponse {
  message: string;
}

// 422 验证错误响应
export interface ValidationErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

export interface ValidationErrorResponse {
  detail: ValidationErrorDetail[];
}

// 获取主机名响应
export interface HostnameResponse {
  hostname: string;
}

// 获取IP地址响应
export interface IpAddressesResponse {
  ip_addresses: string[];
}

// 解散集群响应
export interface DissolveClusterResponse {
  message: string;
}

// 解散集群错误响应 (500)
export interface DissolveClusterErrorResponse {
  detail: string;
  error: string;
}

// 集群初始化状态
export interface ClusterInitState {
  step: ClusterInitStep;
  status: ClusterStatusResponse | null;
  configType: ClusterConfigType;
  createConfig: CreateClusterConfig | null;
  joinConfig: JoinClusterConfig | null;
  isLoading: boolean;
  error: string | null;
  authToken: string | null;
}

// === 集群节点列表相关类型 ===

// 集群节点信息 - 根据实际接口返回格式
export interface ClusterNode {
  name: string;
  node_id: string;
  ip: string;
  status: string; // 节点状态：online/offline等
  is_dc: boolean; // 是否为DC节点
  cpu_total: number | null; // CPU总量
  mem_total: number | null; // 内存总量
  cpu_used: number | null; // CPU使用量
  mem_used: number | null; // 内存使用量
  pub_key: string; // 公钥
}

// 集群节点列表响应 - 实际接口返回格式
export interface ClusterNodesResponse {
  cluster_name: string; // 集群名称
  cluster_uuid: string; // 集群UUID
  nodes: ClusterNode[]; // 节点列表
}

// === 集群概览相关类型 ===

// 集群概览节点信息
export interface ClusterSummaryNode {
  name: string;
  status: string;
}

// 集群概览资源信息
export interface ClusterSummaryResource {
  name: string;
  type: string;
  status: string;
  node: string;
}

// 集群概览响应
export interface ClusterSummaryResponse {
  cluster_name: string;
  stack: string;
  dc_node: string;
  dc_version: string;
  dc_quorum: string;
  last_updated: string;
  last_change_time: string;
  last_change_user: string;
  last_change_via: string;
  last_change_node: string;
  nodes_configured: number;
  resources_configured: number;
  nodes: ClusterSummaryNode[];
  resources: ClusterSummaryResource[];
  daemons: Record<string, string>;
}

// 集群资源操作定义
export interface ResourceOperation {
  name: string;
  interval: string;
  timeout: string;
}

// 集群资源定义
export interface ClusterResource {
  id: string;
  class_: string;
  provider: string;
  type: string;
  attributes: Record<string, string>;
  operations: ResourceOperation[];
}

// 集群资源组定义
export interface ClusterResourceGroup {
  group: string;
  resources: ClusterResource[];
}

// 集群资源响应
export interface ClusterResourcesResponse {
  group: ClusterResourceGroup[];
  resources: ClusterResource[];
}

// === 集群树结构相关类型 ===

// 集群树节点信息 - 新的API格式
export interface ClusterTreeNode {
  name: string;
  status: string;
  ip: string;
  node_id: string;
  is_dc: boolean;
}

// 集群树网络信息
export interface ClusterTreeNetwork {
  name: string;
  status: string;
  type: string;
}

// 集群树存储信息
export interface ClusterTreeStorage {
  name: string;
  status: string;
  size: number;
  used: number;
}

// 集群树响应 - 新的API格式
export interface ClusterTreeResponse {
  cluster_name: string;
  cluster_uuid: string;
  nodes: ClusterTreeNode[];
  networks: ClusterTreeNetwork[];
  storages: ClusterTreeStorage[];
}

// === 节点摘要相关类型 ===

// 节点摘要请求参数
export interface NodeSummaryRequest {
  hostname: string;
}

// 节点摘要响应
export interface NodeSummaryResponse {
  cluster_name: string;
  node_name: string;
  running_time: number;
  cpu_total: number;
  mem_total: number;
  disk_total?: number; // 物理机系统盘总容量（GB）
  disk_used?: number; // 物理机系统盘已用容量（GB）
  cpu_used: number;
  mem_used: number;
  vms_num: number;
  running_vm_num: number;
  stopped_vm_num: number;
  paused_vm_num: number;
  suspended_vm_num: number;
  error_vm_num: number;
  other_vm_num: number;
  // TODO 新增字段
  storage_total?: number; // 存储总容量（GB）
  storage_used?: number; // 存储已用容量（GB）
  network_throughput?: number; // 网络吞吐量（Mbps）
  load_average?: string; // 系统负载（格式: "0.8,1.2,1.5"）
  vm_max_allowed?: number; // 最大可创建虚拟机数量
  power_state?: string; // 电源状态
}

// === 节点操作相关类型 ===

// 节点操作请求参数
export interface NodeOperationRequest {
  hostname: string;
}

// 节点操作响应
export interface NodeOperationResponse {
  message: string;
}

// 节点状态检查响应
export interface NodeStatusResponse {
  hostname: string;
  status: string;
  running_vms: number;
  stopped_vms: number;
  maintenance_mode: boolean;
  power_state: string;
}

// 虚拟机迁移请求参数
export interface VMigrationRequest {
  vm_id: string;
  source_node: string;
  target_node: string;
  live_migration?: boolean; // 是否为在线迁移
}

// 虚拟机迁移响应
export interface VMigrationResponse {
  message: string;
  task_id?: string; // 迁移任务ID
}

// === 物理机硬件信息相关类型 ===

// PCI设备信息 - 修正字段名
export interface NodePCIDevice {
  slot: string; // PCI插槽位置，如 "0000:00:1f.2"
  vendor_name: string; // 厂商名称
  device_name: string; // 设备名称
  device_type: string; // 设备类别，如 "Mass storage controller"
  iommu_group?: number; // IOMMU组
  subsystem_vendor?: string; // 子系统厂商
  subsystem_device?: string; // 子系统设备
  driver?: string; // 驱动程序
  vendor_id: string; // 厂商ID，如 "8086"
  device_id: string; // 设备ID，如 "2922"
  revision?: string; // 版本号
  numa_node?: number; // NUMA节点
}

// 物理机PCI设备列表请求参数
export interface NodePCIRequest {
  hostname: string;
}

// 物理机PCI设备列表响应
export interface NodePCIResponse {
  hostname: string;
  devices: NodePCIDevice[];
}

// 物理机磁盘设备列表请求参数
export interface NodeDisksRequest {
  hostname: string;
}

// 物理机磁盘设备列表响应
export interface NodeDisksResponse {
  devices: NodeDiskDeviceActual[];
}

// 磁盘设备信息 - 根据mock数据调整
export interface NodeDiskDeviceActual {
  name: string; // 设备名称，如 "/dev/sda"
  major_minor: string; // 主次设备号，如 "8:0"
  removable: boolean; // 是否可移动
  size_gb: number; // 容量（GB）
  read_only: boolean; // 是否只读
  device_type: "disk" | "part" | "rom"; // 设备类型
  mount_point: string; // 挂载点
  parent: string; // 父设备
  filesystem: string; // 文件系统
  total_size_gb: number; // 总容量（GB）
  used_size_gb: number; // 已用容量（GB）
  available_size_gb: number; // 可用容量（GB）
  percentage_value: number; // 使用百分比
}
