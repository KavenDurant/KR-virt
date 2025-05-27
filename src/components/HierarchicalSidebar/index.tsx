import React, { useState } from 'react';
import { Tree, Tooltip } from 'antd';
import type { TreeDataNode } from 'antd';
import { 
  FolderOpenOutlined, 
  DesktopOutlined,
  ClusterOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../hooks/useTheme';
import type { 
  DataCenter, 
  Cluster, 
  Node, 
  VirtualMachine 
} from '../../services/mockData';
import { 
  getStatusColor, 
  getStatusIcon 
} from '../../services/mockData';
import './HierarchicalSidebar.css';

export interface HierarchicalSidebarProps {
  data: DataCenter | null;
  onSelect?: (selectedKeys: string[], info: Record<string, unknown>) => void;
}

interface TreeNodeData extends TreeDataNode {
  type: 'datacenter' | 'cluster' | 'node' | 'vm';
  status?: string;
  data?: DataCenter | Cluster | Node | VirtualMachine;
}

const HierarchicalSidebar: React.FC<HierarchicalSidebarProps> = ({ 
  data, 
  onSelect 
}) => {
  const { actualTheme } = useTheme();
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['datacenter-1', 'cluster-1']);

  if (!data) {
    return (
      <div 
        style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: actualTheme === 'dark' ? '#cccccc' : '#666666'
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
          <div className="tree-node-status">
            <span 
              className="status-dot" 
              style={{ backgroundColor: statusColor }}
            />
            <span className="status-text">{vm.status}</span>
          </div>
        </div>
      ),
      type: 'vm',
      status: vm.status,
      data: vm,
      isLeaf: true,
      icon: <DesktopOutlined style={{ color: statusColor }} />
    };
  };

  // 创建节点
  const createNodeNode = (node: Node): TreeNodeData => {
    const statusColor = getStatusColor(node.status);
    const statusIcon = getStatusIcon(node.type);
    
    return {
      key: node.id,
      title: (
        <div className="tree-node-content">
          <span className="tree-node-icon" style={{ color: statusColor }}>
            {statusIcon}
          </span>
          <Tooltip
            title={`CPU: ${node.cpu}% | 内存: ${node.memory}% | 运行时间: ${node.uptime}`}
            placement="right"
          >
            <span className="tree-node-title">{node.name}</span>
          </Tooltip>
          <div className="tree-node-status">
            <span 
              className="status-dot" 
              style={{ backgroundColor: statusColor }}
            />
            <span className="status-text">{node.status}</span>
          </div>
        </div>
      ),
      type: 'node',
      status: node.status,
      data: node,
      children: node.vms.map(createVMNode),
      icon: <DatabaseOutlined style={{ color: statusColor }} />
    };
  };

  // 创建集群节点
  const createClusterNode = (cluster: Cluster): TreeNodeData => {
    const statusColor = getStatusColor(cluster.status);
    const statusIcon = getStatusIcon(cluster.type);
    
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
      type: 'cluster',
      status: cluster.status,
      data: cluster,
      children: cluster.nodes.map(createNodeNode),
      icon: <ClusterOutlined style={{ color: statusColor }} />
    };
  };

  // 创建数据中心根节点
  const treeData: TreeNodeData[] = [
    {
      key: data.id,
      title: (
        <div className="tree-node-content">
          <span className="tree-node-icon">🏢</span>
          <span className="tree-node-title">{data.name}</span>
        </div>
      ),
      type: 'datacenter',
      data: data,
      children: data.clusters.map(createClusterNode),
      icon: <FolderOpenOutlined />
    }
  ];

  const handleSelect = (selectedKeys: React.Key[], info: Record<string, unknown>) => {
    if (onSelect) {
      onSelect(selectedKeys.map(String), info);
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
          padding: '8px 16px',
          borderBottom: `1px solid ${actualTheme === 'dark' ? '#434343' : '#f0f0f0'}`,
          color: actualTheme === 'dark' ? '#cccccc' : '#666666',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        资源树
      </div>
      <Tree
        className="resource-tree"
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={handleExpand}
        onSelect={handleSelect}
        showIcon
        blockNode
        style={{
          backgroundColor: 'transparent',
          color: actualTheme === 'dark' ? '#cccccc' : '#333333'
        }}
      />
    </div>
  );
};

export default HierarchicalSidebar;
