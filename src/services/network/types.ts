/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-01-29 14:30:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-09 15:16:14
 * @FilePath: /KR-virt/src/services/network/types.ts
 * @Description: 网络管理模块类型定义
 */

// 网络配置信息
export interface NetworkConfig {
  net_name: string;
  hostname: string;
  mac: string;
  driver: string;
  net_type: string;
  bridge: string;
  vlan_id: number | null;
  ip_addr: string;
  netmask: string;
  dhcp_start: string;
  dhcp_end: string;
}

// UI层网络接口类型（用于页面显示）
export interface Network {
  net_name: string;
  hostname: string;
  mac: string;
  driver: string;
  net_type: string;
  bridge: string;
  vlan_id: number | null;
  ip_addr: string;
  netmask: string;
  dhcp_start: string;
  dhcp_end: string;
}

// IP详情接口类型
export interface IPDetail {
  ip: string;
  networkId: string;
  status: string;
  macAddress: string | null;
  hostname: string | null;
  vmId: string | null;
  description: string;
}

// 路由接口类型
export interface Route {
  id: string;
  destination: string;
  nextHop: string;
  interface: string;
  metric: number;
  type: string;
}

// 安全组规则类型
export interface SecurityRule {
  id: string;
  name: string;
  direction: string;
  protocol: string;
  portRange: string;
  source: string;
  action: string;
  priority: number;
}

// 获取网络配置列表响应
export interface NetworkConfigListResponse {
  networks: NetworkConfig[];
}

// 创建网络请求参数
export interface CreateNetworkRequest {
  hostname: string;
  net_name: string;
  forward: "isolated" | "nat" | "bridge";
  bridge_name?: string | null;
  vlan_id?: number | null;
  ip_addr: string;
  netmask: string;
  dhcp_start: string;
  dhcp_end: string;
}

// IP地址信息
export interface IPAddress {
  index: number;
  value: string;
}

// DNS信息
export interface DNSInfo {
  index: number;
  value: string;
}

// 路由信息
export interface RouteInfo {
  dst: string;
  nh: string;
  mt: number;
}

// 节点网络信息
export interface NodeNetwork {
  is_physical: boolean;
  device: string;
  type: "bridge" | "tun" | "ethernet" | "loopback";
  slave: string | null;
  mac: string;
  mtu: number;
  state: string;
  connection: string;
  ip4_addresses: IPAddress[];
  ip4_gateway: string;
  ip4_dns: DNSInfo[];
  ip4_routes: RouteInfo[];
  ip6_addresses: IPAddress[];
  ip6_gateway: string;
  ip6_routes: RouteInfo[];
  ip6_dns: DNSInfo[];
}

// 获取节点网络列表响应
export interface NodeNetworkListResponse {
  hostname: string;
  networks: NodeNetwork[];
}

// 删除网络请求参数
export interface DeleteNetworkRequest {
  hostname: string;
  net_name: string;
}

// 网络操作响应
export interface NetworkOperationResponse {
  message: string;
}

// API响应基础接口
export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// 网络类型常量
export const NETWORK_TYPE = {
  NAT: "nat",
  BRIDGE: "bridge",
  ISOLATED: "isolated",
} as const;

export type NetworkType = (typeof NETWORK_TYPE)[keyof typeof NETWORK_TYPE];

// 网络类型映射
export const NETWORK_TYPE_MAP = {
  nat: "NAT",
  bridge: "桥接",
  isolated: "隔离",
} as const;

// 驱动类型常量
export const DRIVER_TYPE = {
  VIRTIO: "virtio",
  E1000: "e1000",
  RTL8139: "rtl8139",
} as const;

export type DriverType = (typeof DRIVER_TYPE)[keyof typeof DRIVER_TYPE];

// 驱动类型映射
export const DRIVER_TYPE_MAP = {
  virtio: "VirtIO",
  e1000: "E1000",
  rtl8139: "RTL8139",
} as const;

// Forward模式常量
export const FORWARD_MODE = {
  NAT: "nat",
  BRIDGE: "bridge",
  ISOLATED: "isolated",
} as const;

export type ForwardMode = (typeof FORWARD_MODE)[keyof typeof FORWARD_MODE];

// Forward模式映射
export const FORWARD_MODE_MAP = {
  nat: "NAT",
  bridge: "桥接",
  isolated: "隔离",
} as const;

// API错误响应
export interface NetworkErrorResponse {
  detail: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}
