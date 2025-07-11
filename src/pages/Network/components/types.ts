import React from "react";
import type { Node, Edge } from "reactflow";
import type { 
  TopologyNode as ApiTopologyNode, 
  TopologyEdge as ApiTopologyEdge,
  NetworkTopologyResponse 
} from "@/services/network/types";

// 设备类型枚举
export enum DeviceType {
  ROUTER = "router",
  SWITCH_CORE = "switch_core",
  SWITCH_ACCESS = "switch_access",
  FIREWALL = "firewall",
  VIRTUAL_MACHINE = "vm",
  PHYSICAL_HOST = "host",
  LOAD_BALANCER = "lb",
  INTERFACE = "interface",
  VM_INTERFACE = "vm-interface",
}

// 设备状态枚举
export enum DeviceStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  WARNING = "warning",
  ERROR = "error",
  MAINTENANCE = "maintenance",
}

// 网络类型枚举
export enum NetworkType {
  NAT = "nat",
  BRIDGE = "bridge",
  ISOLATED = "isolated",
  DIRECT = "direct",
  VLAN = "vlan",
  PUBLIC = "public",
}

// 连接类型枚举
export enum ConnectionType {
  PHYSICAL = "physical",
  LOGICAL = "logical",
  VIRTUAL = "virtual",
  WIRELESS = "wireless",
  INTERFACE_BOND = "interface-bond",
  HOST_INTERFACE = "host-interface",
  HOST_VM = "host-vm",
  VM_INTERFACE = "vm-interface",
  VM_BRIDGE = "vm-bridge",
  VM_LINK = "vm-link",
}

// 设备位置信息
export interface DeviceLocation {
  x: number;
  y: number;
  layer?: string;
  zone?: string;
}

// 网络设备基础接口
export interface NetworkDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ip_address?: string;
  mac_address?: string;
  description?: string;
  location?: DeviceLocation;
  properties?: Record<string, unknown>;
}

// 网络段信息
export interface NetworkSegment {
  id: string;
  name: string;
  type: NetworkType;
  cidr: string;
  gateway?: string;
  vlan_id?: number;
  status: "active" | "inactive" | "error";
  description?: string;
  location?: DeviceLocation;
}

// 网络连接关系
export interface NetworkConnection {
  id: string;
  source_id: string;
  target_id: string;
  connection_type: ConnectionType;
  status: "up" | "down" | "degraded";
  bandwidth?: number;
  latency?: number;
  animated?: boolean;
}

// 拓扑图数据
export interface TopologyData {
  devices: NetworkDevice[];
  networks: NetworkSegment[];
  connections: NetworkConnection[];
}

// 拓扑图节点数据
export interface TopologyNodeData {
  label: React.ReactNode;
  device?: NetworkDevice;
  network?: NetworkSegment;
  apiNode?: ApiTopologyNode; // 添加API节点数据的引用
}

// 拓扑图节点
export type TopologyNode = Node & {
  data: TopologyNodeData;
};

// 拓扑图边
export type TopologyEdge = Edge & {
  connection?: NetworkConnection;
  apiEdge?: ApiTopologyEdge; // 添加API边数据的引用
};

// 拓扑图布局配置
export interface LayoutConfig {
  canvas_width: number;
  canvas_height: number;
  horizontal_spacing: number;
  vertical_spacing: number;
  margin: number;
  layer_configs: Record<
    string,
    {
      y_position: number;
      types: DeviceType[];
    }
  >;
}

// 拓扑图组件属性
export interface NetworkTopologyProps {
  data?: TopologyData;
  apiData?: NetworkTopologyResponse; // 添加API数据属性
  loading?: boolean;
  onNodeClick?: (node: TopologyNode) => void;
  onEdgeClick?: (edge: TopologyEdge) => void;
  onNodesChange?: (nodes: TopologyNode[]) => void;
  height?: number | string;
  className?: string;
}

// 导出API相关类型
export type { 
  ApiTopologyNode, 
  ApiTopologyEdge, 
  NetworkTopologyResponse 
};
