/**
 * 统一侧边栏入口文件
 *
 * 导出统一侧边栏组件和相关类型
 */

export { default as UnifiedSidebar } from "./UnifiedSidebar";
export { default as ContextMenu } from "./components/ContextMenu";
export { default as TreeNode } from "./components/TreeNode";

// 导出类型
export type {
  SidebarMode,
  NodeType,
  UnifiedNodeData,
  UnifiedTreeNode,
  SidebarDataSource,
  UnifiedSidebarProps,
  MenuItemConfig,
  NodeConfig,
  SidebarConfig,
  StatusConfig,
  MenuActionCallback,
  SelectionEventDetail,
} from "./types";

// 导出配置和工具函数
export {
  getSidebarConfig,
  getStatusConfig,
  getNodeIcon,
  CLUSTER_SIDEBAR_CONFIG,
  VM_SIDEBAR_CONFIG,
} from "./config";

export {
  convertToUnifiedFormat,
  getAllExpandableKeys,
  findNodeById,
  getDefaultSelectedNode,
  hasClusterInfo,
} from "./utils/dataConverter";
