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
}

// 集群节点列表响应 - 实际接口返回格式
export interface ClusterNodesResponse {
  nodes: ClusterNode[];
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
