import React, { useState, useEffect } from "react";
import { Tree } from "antd";
import type { TreeDataNode } from "antd";
import { DesktopOutlined, ClusterOutlined } from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";
import type {
  DataCenter,
  Cluster,
  VirtualMachine,
} from "../../services/mockData";
import { getStatusColor, getStatusIcon } from "../../services/mockData";
import "./HierarchicalSidebar.css";

export interface HierarchicalSidebarProps {
  data: DataCenter | null;
  onSelect?: (selectedKeys: string[], info: Record<string, unknown>) => void;
}

interface TreeNodeData extends TreeDataNode {
  type: "cluster" | "vm";
  status?: string;
  data?: Cluster | VirtualMachine;
}

const HierarchicalSidebar: React.FC<HierarchicalSidebarProps> = ({
  data,
  onSelect,
}) => {
  const { actualTheme } = useTheme();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // 当数据加载时，默认选中第一个集群
  useEffect(() => {
    if (data && data.clusters.length > 0) {
      const firstCluster = data.clusters[0];
      setSelectedKeys([firstCluster.id]);
      setExpandedKeys([firstCluster.id]);

      // 触发默认选择回调
      if (onSelect) {
        onSelect([firstCluster.id], {
          node: {
            key: firstCluster.id,
            data: firstCluster,
            type: "cluster",
          },
        });
      }
    }
  }, [data, onSelect]);

  if (!data) {
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
  // 创建虚拟机节点
  const createVMNode = (vm: VirtualMachine): TreeNodeData => {
    const statusColor = getStatusColor(vm.status);
    const statusIcon = getStatusIcon(vm.type);

    return {
      key: vm.id,
      title: (
        <div className="tree-node-content">
          <span className="tree-node-icon" style={{ color: statusColor }}>
            {statusIcon}
          </span>
          <span className="tree-node-title">
            {vm.name} ({vm.vmid})
          </span>
          <span
            className="tree-node-subtitle"
            style={{
              fontSize: "11px",
              color: actualTheme === "dark" ? "#888" : "#999",
              marginLeft: "4px",
            }}
          >
            @ {vm.node}
          </span>
          <div className="tree-node-status">
            <span
              className="status-dot"
              style={{ backgroundColor: statusColor }}
            />
            <span className="status-text">{vm.status}</span>
          </div>
        </div>
      ),
      type: "vm",
      status: vm.status,
      data: vm,
      isLeaf: true,
      icon: <DesktopOutlined style={{ color: statusColor }} />,
    };
  };

  // 创建集群节点 - 直接包含所有虚拟机
  const createClusterNode = (cluster: Cluster): TreeNodeData => {
    const statusColor = getStatusColor(cluster.status);
    const statusIcon = getStatusIcon(cluster.type);

    // 收集集群下所有节点的虚拟机
    const allVMs: VirtualMachine[] = [];
    cluster.nodes.forEach((node) => {
      allVMs.push(...node.vms);
    });

    return {
      key: cluster.id,
      title: (
        <div className="tree-node-content">
          <span className="tree-node-icon" style={{ color: statusColor }}>
            {statusIcon}
          </span>
          <span className="tree-node-title">{cluster.name}</span>
          <div className="tree-node-status">
            <span
              className="status-dot"
              style={{ backgroundColor: statusColor }}
            />
            <span className="status-text">{cluster.status}</span>
          </div>
        </div>
      ),
      type: "cluster",
      status: cluster.status,
      data: cluster,
      children: allVMs.map(createVMNode),
      icon: <ClusterOutlined style={{ color: statusColor }} />,
    };
  };

  // 创建树数据 - 直接显示集群列表
  const treeData: TreeNodeData[] = data.clusters.map(createClusterNode);
  const handleSelect = (
    selectedKeys: React.Key[],
    info: Record<string, unknown>
  ) => {
    const newSelectedKeys = selectedKeys.map(String);
    setSelectedKeys(newSelectedKeys);

    if (onSelect) {
      onSelect(newSelectedKeys, info);
    }
  };

  const handleExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys.map(String));
  };

  return (
    <div className="hierarchical-sidebar">
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
        资源树
      </div>
      <Tree
        className="resource-tree"
        treeData={treeData}
        expandedKeys={expandedKeys}
        selectedKeys={selectedKeys}
        onExpand={handleExpand}
        onSelect={handleSelect}
        showIcon
        blockNode
        style={{
          backgroundColor: "transparent",
          color: actualTheme === "dark" ? "#cccccc" : "#333333",
        }}
      />
    </div>
  );
};

export default HierarchicalSidebar;
