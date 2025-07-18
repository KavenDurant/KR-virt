import { useState, useEffect, useCallback } from "react";
import type { Node, VirtualMachine as VMData } from "@/services/mockData";

/**
 * 侧边栏选择的节点类型
 */
export type SidebarNodeType = "cluster" | "host" | "vm" | "network" | "storage";

/**
 * 侧边栏选择事件的详细信息
 */
export interface SidebarSelectionDetail {
  selectedKey: string;
  nodeType: SidebarNodeType;
  nodeData: unknown;
}

/**
 * 侧边栏选择状态
 */
export interface SidebarSelectionState {
  selectedCluster: unknown | null;
  selectedHost: Node | null;
  selectedVM: VMData | null;
  selectedNetwork: unknown | null;
  selectedStorage: unknown | null;
}

/**
 * 侧边栏选择操作
 */
export interface SidebarSelectionActions {
  clearSelection: () => void;
  selectCluster: (cluster: unknown) => void;
  selectHost: (host: Node) => void;
  selectVM: (vm: VMData) => void;
  selectNetwork: (network: unknown) => void;
  selectStorage: (storage: unknown) => void;
}

/**
 * useSidebarSelection Hook 返回值
 */
export interface UseSidebarSelectionReturn
  extends SidebarSelectionState,
    SidebarSelectionActions {
  isLoading: boolean;
}

/**
 * 自定义Hook：管理侧边栏选择状态和交互逻辑
 *
 * 这个Hook封装了侧边栏与主内容区域之间的通信逻辑，提供了：
 * 1. 统一的选择状态管理
 * 2. 清晰的选择操作接口
 * 3. 自动的事件监听和清理
 * 4. 类型安全的状态访问
 *
 * @returns {UseSidebarSelectionReturn} 包含选择状态和操作方法的对象
 */
export const useSidebarSelection = (): UseSidebarSelectionReturn => {
  // 选择状态管理
  const [selectedCluster, setSelectedCluster] = useState<unknown | null>(null);
  const [selectedHost, setSelectedHost] = useState<Node | null>(null);
  const [selectedVM, setSelectedVM] = useState<VMData | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<unknown | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 清空所有选择状态
   * 用于重置侧边栏选择，通常在切换模块或初始化时调用
   */
  const clearSelection = useCallback(() => {
    setSelectedCluster(null);
    setSelectedHost(null);
    setSelectedVM(null);
    setSelectedNetwork(null);
    setSelectedStorage(null);
  }, []);

  /**
   * 选择集群节点
   * @param cluster 集群数据对象
   */
  const selectCluster = useCallback(
    (cluster: unknown) => {
      clearSelection();
      setSelectedCluster(cluster);
    },
    [clearSelection],
  );

  /**
   * 将 UnifiedNodeData 转换为 Node 格式的适配函数
   */
  const adaptUnifiedNodeToNode = (unifiedNode: unknown): Node => {
    const nodeData = unifiedNode as Record<string, unknown>;

    // 尝试从不同的数据结构中提取信息
    const extractVMs = (): unknown[] => {
      // 如果有 children 字段且是数组，用作 vms
      if (nodeData.children && Array.isArray(nodeData.children)) {
        return nodeData.children;
      }

      // 如果有 data 字段
      if (nodeData.data && typeof nodeData.data === "object") {
        const data = nodeData.data as Record<string, unknown>;

        // 如果 data 有 vms 字段
        if (data.vms && Array.isArray(data.vms)) {
          return data.vms;
        }

        // 如果 data 本身就是数组（某些情况下）
        if (Array.isArray(data)) {
          return data;
        }
      }

      // 如果直接有 vms 字段
      if (nodeData.vms && Array.isArray(nodeData.vms)) {
        return nodeData.vms;
      }

      return [];
    };

    // 构建适配后的 Node 对象
    const adaptedNode: Node = {
      id: String(nodeData.id || nodeData.name || "unknown"),
      name: String(nodeData.name || nodeData.hostname || "unknown"),
      type: "node" as const,
      status: String(nodeData.status || "unknown") as
        | "online"
        | "offline"
        | "standby"
        | "maintenance",
      cpu: Number(nodeData.cpu || 0),
      memory: Number(nodeData.memory || 0),
      uptime: String(nodeData.uptime || "0"),
      vms: extractVMs() as VMData[], // 使用适配后的 VMs 数据
      ip: nodeData.ip ? String(nodeData.ip) : undefined,
      is_dc: Boolean(nodeData.is_dc),
    };

    return adaptedNode;
  };

  /**
   * 选择主机节点
   * @param host 主机数据对象
   */
  const selectHost = useCallback(
    (host: Node | unknown) => {
      clearSelection();
      // 如果传入的是 UnifiedNodeData，进行适配
      const hostData = host as Record<string, unknown>;
      const adaptedHost =
        typeof host === "object" &&
        host !== null &&
        "type" in host &&
        hostData.type === "host"
          ? adaptUnifiedNodeToNode(host)
          : (host as Node);
      setSelectedHost(adaptedHost);
    },
    [clearSelection],
  );

  /**
   * 选择虚拟机节点
   * @param vm 虚拟机数据对象
   */
  const selectVM = useCallback(
    (vm: VMData) => {
      clearSelection();
      setSelectedVM(vm);
    },
    [clearSelection],
  );

  /**
   * 选择网络节点
   * @param network 网络数据对象
   */
  const selectNetwork = useCallback(
    (network: unknown) => {
      clearSelection();
      setSelectedNetwork(network);
    },
    [clearSelection],
  );

  /**
   * 选择存储节点
   * @param storage 存储数据对象
   */
  const selectStorage = useCallback(
    (storage: unknown) => {
      clearSelection();
      setSelectedStorage(storage);
    },
    [clearSelection],
  );

  /**
   * 处理侧边栏选择事件
   * 根据节点类型调用相应的选择方法
   *
   * 特殊处理：集群选择不会设置 selectedCluster 状态
   * 这是为了保持与原有逻辑一致，选择集群时显示集群管理主页面而不是集群详情页面
   */
  const handleSidebarSelect = useCallback(
    (event: CustomEvent<SidebarSelectionDetail>) => {
      const { nodeType, nodeData } = event.detail;

      setIsLoading(true);

      // 根据节点类型执行相应的选择操作
      switch (nodeType) {
        case "cluster":
          // 特殊处理：选中集群时，清空所有选择状态，让页面显示默认的集群管理页面
          // 这保持了与重构前的行为一致
          clearSelection();
          console.log("集群选择事件：清空选择状态，显示集群管理主页面");
          break;
        case "host":
          selectHost(nodeData as Node);
          break;
        case "vm":
          selectVM(nodeData as VMData);
          break;
        case "network":
          selectNetwork(nodeData);
          break;
        case "storage":
          selectStorage(nodeData);
          break;
        default:
          console.warn(`未知的节点类型: ${nodeType}`);
          clearSelection();
      }

      setIsLoading(false);
    },
    [selectHost, selectVM, selectNetwork, selectStorage, clearSelection],
  );

  /**
   * 监听侧边栏选择事件
   * 自动注册和清理事件监听器
   */
  useEffect(() => {
    const eventListener = handleSidebarSelect as EventListener;

    window.addEventListener("hierarchical-sidebar-select", eventListener);

    return () => {
      window.removeEventListener("hierarchical-sidebar-select", eventListener);
    };
  }, [handleSidebarSelect]);

  return {
    // 选择状态
    selectedCluster,
    selectedHost,
    selectedVM,
    selectedNetwork,
    selectedStorage,
    isLoading,

    // 选择操作
    clearSelection,
    selectCluster,
    selectHost,
    selectVM,
    selectNetwork,
    selectStorage,
  };
};
