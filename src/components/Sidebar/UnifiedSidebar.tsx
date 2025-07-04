/**
 * 统一侧边栏组件
 *
 * 这是重构后的统一侧边栏组件，支持集群管理和虚拟机管理两种模式
 * 替代了原来的 HierarchicalSidebar 和 VMSidebar 组件
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Tree } from "antd";
import { useTheme } from "@/hooks/useTheme";
import type {
  UnifiedSidebarProps,
  UnifiedTreeNode,
  UnifiedNodeData,
  SelectionEventDetail,
} from "./types";
import { getSidebarConfig } from "./config";
import {
  convertToUnifiedFormat,
  getAllExpandableKeys,
  getDefaultSelectedNode,
} from "./utils/dataConverter";
import TreeNode from "./components/TreeNode";
import "./Sidebar.css";

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  mode,
  data,
  onSelect,
  loading = false,
  error = null,
}) => {
  const { actualTheme } = useTheme();
  const config = getSidebarConfig(mode);

  // 状态管理
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // 转换数据为统一格式
  const unifiedData = useMemo(() => {
    return convertToUnifiedFormat(data, mode);
  }, [data, mode]);

  // 处理节点操作（右键菜单）
  const handleNodeAction = useCallback(
    (action: string, nodeData: UnifiedNodeData) => {
      console.log("节点操作:", { action, nodeData });

      // 发送自定义事件，让页面组件处理具体的操作
      const eventName = `hierarchical-sidebar-${nodeData.type}-action`;
      const eventDetail = {
        action,
        nodeData,
        // 为了兼容现有代码，保留原有的字段格式
        ...(nodeData.type === "vm" && {
          vmName: nodeData.name,
          hostname: nodeData.hostname,
          vmData: nodeData.data,
        }),
        ...(nodeData.type === "host" && {
          hostname: nodeData.name,
          hostData: nodeData.data,
        }),
        ...(nodeData.type === "cluster" && {
          clusterName: nodeData.name,
          clusterUuid: nodeData.uuid,
          clusterData: nodeData.data,
        }),
      };

      const event = new CustomEvent(eventName, { detail: eventDetail });
      window.dispatchEvent(event);
    },
    []
  );

  // 转换为Ant Design Tree所需的格式
  const treeData = useMemo((): UnifiedTreeNode[] => {
    const convertToTreeNode = (node: UnifiedNodeData): UnifiedTreeNode => {
      return {
        key: node.id,
        title: <TreeNode node={node} mode={mode} onAction={handleNodeAction} />,
        type: node.type,
        status: node.status,
        data: node.data,
        nodeData: node,
        children: node.children?.map(convertToTreeNode),
        isLeaf: !node.children || node.children.length === 0,
        className: `${node.type}-node`,
      };
    };

    return unifiedData.map(convertToTreeNode);
  }, [unifiedData, mode, handleNodeAction]);

  // 处理节点选择
  const handleSelect = useCallback(
    (newSelectedKeys: React.Key[], info: Record<string, unknown>) => {
      const selectedKeysAsStrings = newSelectedKeys.map(String);

      // 检查是否尝试取消选择当前已选中的节点（重复点击相同节点）
      if (selectedKeysAsStrings.length === 0 && selectedKeys.length > 0) {
        // 忽略这次操作，保持当前选择
        return;
      }

      setSelectedKeys(selectedKeysAsStrings);

      // 触发外部回调
      if (onSelect) {
        onSelect(selectedKeysAsStrings, info);
      }

      // 发送选择事件
      const { node } = info as { node?: UnifiedTreeNode };
      if (node?.nodeData) {
        const eventDetail: SelectionEventDetail = {
          selectedKeys: selectedKeysAsStrings,
          nodeKey: node.key as string,
          nodeType: node.nodeData.type,
          nodeData: node.nodeData,
        };

        const event = new CustomEvent("hierarchical-sidebar-select", {
          detail: eventDetail,
        });
        window.dispatchEvent(event);
      }
    },
    [selectedKeys, onSelect]
  );

  // 处理节点展开
  const handleExpand = useCallback((expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys.map(String));
  }, []);

  // 数据变化时的初始化逻辑
  useEffect(() => {
    if (unifiedData.length > 0) {
      // 获取所有可展开的keys
      const allExpandableKeys = getAllExpandableKeys(unifiedData);

      if (config.defaultExpandAll) {
        setExpandedKeys(allExpandableKeys);
      }

      // 设置默认选中的节点
      if (selectedKeys.length === 0) {
        const defaultNode = getDefaultSelectedNode(unifiedData, mode);
        if (defaultNode) {
          const defaultKeys = [defaultNode.id];
          setSelectedKeys(defaultKeys);

          // 触发默认选择事件
          if (onSelect) {
            onSelect(defaultKeys, {
              node: {
                key: defaultNode.id,
                data: defaultNode.data,
                type: defaultNode.type,
                nodeData: defaultNode,
              },
            });
          }

          // 发送默认选择事件
          const eventDetail: SelectionEventDetail = {
            selectedKeys: defaultKeys,
            nodeKey: defaultNode.id,
            nodeType: defaultNode.type,
            nodeData: defaultNode,
          };

          const event = new CustomEvent("hierarchical-sidebar-select", {
            detail: eventDetail,
          });
          window.dispatchEvent(event);
        }
      }
    }
  }, [
    unifiedData,
    mode,
    config.defaultExpandAll,
    selectedKeys.length,
    onSelect,
  ]);

  // 加载状态
  if (loading) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: actualTheme === "dark" ? "#cccccc" : "#666666",
        }}
      >
        正在加载{config.title}...
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: actualTheme === "dark" ? "#ff6b6b" : "#ff4d4f",
        }}
      >
        <div style={{ marginBottom: "10px" }}>❌</div>
        <div>{error}</div>
      </div>
    );
  }

  // 无数据状态
  if (unifiedData.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: actualTheme === "dark" ? "#cccccc" : "#666666",
        }}
      >
        暂无数据
      </div>
    );
  }

  return (
    <div className="hierarchical-sidebar">
      {/* 侧边栏标题 */}
      <div
        className="sidebar-header"
        style={{
          padding: "8px 16px",
          borderBottom: `1px solid ${
            actualTheme === "dark" ? "#434343" : "#f0f0f0"
          }`,
          color: actualTheme === "dark" ? "#cccccc" : "#666666",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        {config.title}
      </div>

      {/* 树组件 */}
      <Tree
        className="resource-tree"
        treeData={treeData}
        expandedKeys={expandedKeys}
        selectedKeys={selectedKeys}
        onExpand={handleExpand}
        onSelect={handleSelect}
        showIcon={false} // 图标由TreeNode组件内部处理
        blockNode
        style={{
          backgroundColor: "transparent",
          color: actualTheme === "dark" ? "#cccccc" : "#333333",
        }}
      />
    </div>
  );
};

export default UnifiedSidebar;
