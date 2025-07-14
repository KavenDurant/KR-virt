/**
 * 树节点组件
 *
 * 统一的树节点渲染组件，根据节点类型和配置显示不同的内容
 */

import React from "react";
import { useTheme } from "@/hooks/useTheme";
import type { UnifiedNodeData, SidebarMode } from "../types";
import { getSidebarConfig, getStatusConfig, getNodeIcon } from "../config";
import ContextMenu from "./ContextMenu";

interface TreeNodeProps {
  node: UnifiedNodeData;
  mode: SidebarMode;
  onAction: (action: string, nodeData: UnifiedNodeData) => void;
}

/**
 * 获取节点副标题
 */
const getNodeSubtitle = (
  node: UnifiedNodeData,
  mode: SidebarMode,
): string | null => {
  const config = getSidebarConfig(mode);
  const nodeConfig = config.nodeConfigs[node.type];

  if (!nodeConfig.showSubtitle) {
    return null;
  }

  switch (node.type) {
    case "host":
      return node.ip || null;
    case "vm":
      return mode === "cluster" ? `@ ${node.hostname}` : null;
    case "network":
      return ((node.data as Record<string, unknown>)?.type as string) || null;
    case "storage":
      if (node.size && node.used) {
        const usagePercent = Math.round((node.used / node.size) * 100);
        return `${usagePercent}% 已用`;
      }
      return null;
    default:
      return null;
  }
};

/**
 * 获取节点状态显示
 */
const getStatusDisplay = (
  node: UnifiedNodeData,
): { color: string; label: string } => {
  const statusConfig = getStatusConfig(node.status);

  // 对特定状态进行本地化处理
  let label = statusConfig.label;
  if (node.type === "vm" && node.status === "shutoff") {
    label = "已停止";
  }

  return {
    color: statusConfig.color,
    label,
  };
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, mode, onAction }) => {
  const { actualTheme } = useTheme();
  const config = getSidebarConfig(mode);
  const nodeConfig = config.nodeConfigs[node.type];

  const IconComponent = getNodeIcon(node.type);
  const subtitle = getNodeSubtitle(node, mode);
  const statusDisplay = getStatusDisplay(node);

  const nodeContent = (
    <div
      className="tree-node-content"
      data-type={node.type}
      data-status={node.status}
    >
      {/* 节点图标 */}
      {nodeConfig.showIcon && (
        <span
          className={`tree-node-icon `}
          style={{
            color: nodeConfig.showStatus ? statusDisplay.color : undefined,
          }}
        >
          <IconComponent />
        </span>
      )}

      {/* 节点标题 */}
      <span className="tree-node-title">
        {node.name}
        {/* DC节点标识 */}
        {node.type === "host" && node.is_dc && (
          <span className="dc-badge" title="数据中心节点">
            DC
          </span>
        )}
      </span>

      {/* 节点副标题 */}
      {subtitle && (
        <span
          className="tree-node-subtitle"
          style={{
            fontSize: "11px",
            color: actualTheme === "dark" ? "#888" : "#999",
            marginLeft: "4px",
          }}
        >
          {subtitle}
        </span>
      )}

      {/* 节点状态 */}
      {nodeConfig.showStatus && (
        <div className="tree-node-status">
          <span
            className="status-dot"
            style={{ backgroundColor: statusDisplay.color }}
            title={`${
              node.type === "vm" ? "虚拟机" : node.type === "host" ? "主机" : ""
            }状态: ${statusDisplay.label}`}
          />
          <span className="status-text">{statusDisplay.label}</span>
        </div>
      )}
    </div>
  );

  return (
    <ContextMenu node={node} mode={mode} onAction={onAction}>
      {nodeContent}
    </ContextMenu>
  );
};

export default TreeNode;
