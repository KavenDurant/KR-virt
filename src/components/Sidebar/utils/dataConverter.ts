/**
 * 数据转换工具
 * 
 * 将不同API格式的数据转换为统一的侧边栏数据格式
 */

import type { 
  ClusterTreeResponse, 
  ClusterTreeNode, 
  ClusterTreeNetwork, 
  ClusterTreeStorage 
} from "@/services/cluster/types";
import type { 
  VMTreeResponse, 
  VMTreeWithClusterResponse, 
  SidebarHostNode, 
  SidebarVMInfo 
} from "@/services/vm/types";
import type { 
  UnifiedNodeData, 
  SidebarDataSource, 
  SidebarMode 
} from "../types";

/**
 * 检查VM数据是否包含集群信息
 */
export const hasClusterInfo = (
  data: VMTreeResponse | VMTreeWithClusterResponse | null
): data is VMTreeWithClusterResponse => {
  return (
    data !== null &&
    typeof (data as VMTreeWithClusterResponse).cluster_name === "string" &&
    typeof (data as VMTreeWithClusterResponse).cluster_uuid === "string"
  );
};

/**
 * 转换集群树节点
 */
const convertClusterTreeNode = (node: ClusterTreeNode): UnifiedNodeData => ({
  id: node.node_id,
  name: node.name,
  type: "host",
  status: node.status,
  ip: node.ip,
  is_dc: node.is_dc,
  data: node,
  children: [], // 集群树中主机节点没有VM子节点
});

/**
 * 转换集群树网络节点
 */
const convertClusterTreeNetwork = (network: ClusterTreeNetwork): UnifiedNodeData => ({
  id: `network-${network.name}`,
  name: network.name,
  type: "network",
  status: network.status,
  data: network,
});

/**
 * 转换集群树存储节点
 */
const convertClusterTreeStorage = (storage: ClusterTreeStorage): UnifiedNodeData => ({
  id: `storage-${storage.name}`,
  name: storage.name,
  type: "storage",
  status: storage.status,
  size: storage.size,
  used: storage.used,
  data: storage,
});

/**
 * 转换VM树虚拟机节点
 */
const convertVMTreeVM = (vm: SidebarVMInfo): UnifiedNodeData => ({
  id: vm.uuid,
  name: vm.name,
  type: "vm",
  status: vm.status,
  hostname: vm.hostname,
  uuid: vm.uuid,
  cpu_count: vm.cpu_count,
  memory_gb: vm.memory_gb,
  data: vm,
});

/**
 * 转换VM树主机节点
 */
const convertVMTreeHost = (host: SidebarHostNode): UnifiedNodeData => ({
  id: `host-${host.hostname}`,
  name: host.hostname,
  type: "host",
  status: host.status,
  hostname: host.hostname,
  data: host,
  children: host.vms.map(convertVMTreeVM),
});

/**
 * 转换集群树数据
 */
const convertClusterTreeData = (data: ClusterTreeResponse): UnifiedNodeData[] => {
  const children: UnifiedNodeData[] = [
    // 添加主机节点
    ...data.nodes.map(convertClusterTreeNode),
    // 添加网络节点
    ...data.networks.map(convertClusterTreeNetwork),
    // 添加存储节点
    ...data.storages.map(convertClusterTreeStorage),
  ];

  return [
    {
      id: data.cluster_uuid,
      name: data.cluster_name,
      type: "cluster",
      status: "healthy", // 集群状态可以根据节点状态推断
      uuid: data.cluster_uuid,
      data: data,
      children,
    },
  ];
};

/**
 * 转换VM树数据（包含集群信息）
 */
const convertVMTreeWithClusterData = (data: VMTreeWithClusterResponse): UnifiedNodeData[] => {
  return [
    {
      id: `cluster-${data.cluster_uuid}`,
      name: data.cluster_name,
      type: "cluster",
      status: "healthy",
      uuid: data.cluster_uuid,
      data: data,
      children: data.nodes.map(convertVMTreeHost),
    },
  ];
};

/**
 * 转换VM树数据（不包含集群信息）
 */
const convertVMTreeData = (data: VMTreeResponse): UnifiedNodeData[] => {
  return data.nodes.map(convertVMTreeHost);
};

/**
 * 主转换函数：将API数据转换为统一格式
 */
export const convertToUnifiedFormat = (
  data: SidebarDataSource,
  mode: SidebarMode
): UnifiedNodeData[] => {
  if (!data) {
    return [];
  }

  try {
    if (mode === "cluster") {
      // 集群模式：转换集群树数据
      return convertClusterTreeData(data as ClusterTreeResponse);
    } else {
      // VM模式：根据数据格式选择转换方式
      if (hasClusterInfo(data as VMTreeResponse | VMTreeWithClusterResponse)) {
        return convertVMTreeWithClusterData(data as VMTreeWithClusterResponse);
      } else {
        return convertVMTreeData(data as VMTreeResponse);
      }
    }
  } catch (error) {
    console.error("数据转换失败:", error);
    return [];
  }
};

/**
 * 获取所有可展开的节点keys
 */
export const getAllExpandableKeys = (nodes: UnifiedNodeData[]): string[] => {
  const keys: string[] = [];

  const traverse = (nodeList: UnifiedNodeData[]) => {
    nodeList.forEach((node) => {
      if (node.children && node.children.length > 0) {
        keys.push(node.id);
        traverse(node.children);
      }
    });
  };

  traverse(nodes);
  return keys;
};

/**
 * 查找节点
 */
export const findNodeById = (
  nodes: UnifiedNodeData[], 
  id: string
): UnifiedNodeData | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

/**
 * 获取默认选中的节点
 */
export const getDefaultSelectedNode = (
  nodes: UnifiedNodeData[],
  mode: SidebarMode
): UnifiedNodeData | null => {
  if (nodes.length === 0) {
    return null;
  }

  if (mode === "cluster") {
    // 集群模式：默认选中第一个集群
    return nodes[0];
  } else {
    // VM模式：默认选中第一个集群或第一个主机
    const firstNode = nodes[0];
    if (firstNode.type === "cluster") {
      return firstNode;
    } else if (firstNode.type === "host") {
      return firstNode;
    }
  }

  return null;
};