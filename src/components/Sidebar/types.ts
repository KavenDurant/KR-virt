/**
 * 统一侧边栏类型定义
 * 
 * 这个文件定义了统一侧边栏组件使用的所有类型，
 * 支持集群管理和虚拟机管理两种模式
 */

import type { TreeDataNode } from "antd";
import type { ClusterTreeResponse } from "@/services/cluster/types";
import type { VMTreeResponse, VMTreeWithClusterResponse } from "@/services/vm/types";

// 侧边栏模式
export type SidebarMode = 'cluster' | 'vm';

// 节点类型
export type NodeType = 'cluster' | 'host' | 'vm' | 'network' | 'storage';

// 统一的节点数据接口
export interface UnifiedNodeData {
  id: string;
  name: string;
  type: NodeType;
  status: string;
  data: unknown; // 原始数据
  children?: UnifiedNodeData[];
  // 可选的扩展信息
  ip?: string;
  hostname?: string;
  uuid?: string;
  cpu_count?: number;
  memory_gb?: number;
  is_dc?: boolean;
  size?: number;
  used?: number;
}

// 扩展的树节点数据
export interface UnifiedTreeNode extends TreeDataNode {
  type: NodeType;
  status?: string;
  data?: unknown;
  nodeData?: UnifiedNodeData;
}

// 侧边栏数据源类型
export type SidebarDataSource = ClusterTreeResponse | VMTreeResponse | VMTreeWithClusterResponse | null;

// 侧边栏属性接口
export interface UnifiedSidebarProps {
  mode: SidebarMode;
  data: SidebarDataSource;
  onSelect?: (selectedKeys: string[], info: Record<string, unknown>) => void;
  loading?: boolean;
  error?: string | null;
}

// 右键菜单项配置
export interface MenuItemConfig {
  key: string;
  icon?: React.ComponentType;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

// 节点配置
export interface NodeConfig {
  showIcon?: boolean;
  showStatus?: boolean;
  showSubtitle?: boolean;
  contextMenu?: MenuItemConfig[];
}

// 侧边栏配置
export interface SidebarConfig {
  title: string;
  showNetworks: boolean;
  showStorages: boolean;
  defaultExpandAll: boolean;
  nodeConfigs: Record<NodeType, NodeConfig>;
}

// 状态配置
export interface StatusConfig {
  label: string;
  color: string;
  icon?: string;
}

// 菜单操作回调类型
export type MenuActionCallback = (action: string, nodeData: UnifiedNodeData) => void;

// 选择事件详情
export interface SelectionEventDetail {
  selectedKeys: string[];
  nodeKey: string;
  nodeType: NodeType;
  nodeData: UnifiedNodeData;
}