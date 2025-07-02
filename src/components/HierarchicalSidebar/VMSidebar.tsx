import React, { useState, useEffect } from "react";
import { Tree, Dropdown } from "antd";
import type { TreeDataNode, MenuProps } from "antd";
import {
  PlayCircleOutlined,
  PoweroffOutlined,
  StopOutlined,
  ReloadOutlined,
  MonitorOutlined,
  HddOutlined,
  ClusterOutlined,
  PauseOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/hooks/useTheme";
import type {
  SidebarVMInfo,
  SidebarHostNode,
  VMTreeResponse,
  VMTreeWithClusterResponse,
} from "@/services/vm/types";
import type {
  VirtualMachine as LegacyVirtualMachine,
  Node as LegacyNode,
  Cluster as LegacyCluster,
} from "@/services/mockData";
import { getStatusColor, getStatusIcon } from "@/services/mockData";
import "./HierarchicalSidebar.css";

export interface VMSidebarProps {
  data: VMTreeResponse | VMTreeWithClusterResponse | null;
  onSelect?: (selectedKeys: string[], info: Record<string, unknown>) => void;
}

interface TreeNodeData extends TreeDataNode {
  type: "cluster" | "host" | "vm";
  status?: string;
  data?: SidebarHostNode | SidebarVMInfo | VMTreeWithClusterResponse;
}

const VMSidebar: React.FC<VMSidebarProps> = ({ data, onSelect }) => {
  const { actualTheme } = useTheme();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // 检查数据是否包含集群信息
  const hasClusterInfo = (
    data: VMTreeResponse | VMTreeWithClusterResponse | null
  ): data is VMTreeWithClusterResponse => {
    return (
      data !== null &&
      typeof (data as VMTreeWithClusterResponse).cluster_name === "string" &&
      typeof (data as VMTreeWithClusterResponse).cluster_uuid === "string"
    );
  };

  // 数据转换函数：将API格式转换为兼容的旧格式
  const convertToLegacyVM = (vm: SidebarVMInfo): LegacyVirtualMachine => {
    // 安全地处理UUID生成vmid
    const safeVmid =
      vm.uuid && vm.uuid.length >= 4
        ? parseInt(vm.uuid.slice(-4), 16) % 10000
        : Math.floor(Math.random() * 9999) + 1;

    return {
      id: vm.uuid || `vm-${vm.name}`,
      name: vm.name || "未知虚拟机",
      status:
        (vm.status as "running" | "stopped" | "suspended" | "error") ||
        "stopped",
      type: "qemu", // 默认类型
      vmid: safeVmid,
      cpu: vm.cpu_count || 1,
      memory: vm.memory_gb || 1,
      diskSize: 50, // 默认磁盘大小，API中没有此信息
      node: vm.hostname || "未知主机",
      uptime: vm.status === "running" ? "运行中" : undefined,
    };
  };

  const convertToLegacyHost = (host: SidebarHostNode): LegacyNode => {
    return {
      id: `host-${host.hostname || "unknown"}`,
      name: host.hostname || "未知主机",
      type: "node" as const,
      status:
        (host.status as "online" | "offline" | "standby" | "maintenance") ||
        "offline",
      cpu: 0, // API中没有CPU使用率信息
      memory: 0, // API中没有内存使用率信息
      uptime: host.status === "online" ? "在线" : "离线",
      vms: (host.vms || []).map(convertToLegacyVM),
    };
  };

  const convertToLegacyCluster = (
    clusterData: VMTreeWithClusterResponse
  ): LegacyCluster => {
    return {
      id: clusterData.cluster_uuid,
      name: clusterData.cluster_name,
      type: "cluster" as const,
      status: "healthy", // 修改为正确的状态类型
      nodes: clusterData.nodes.map(convertToLegacyHost),
      networks: [],
      storages: [],
    };
  };

  // 虚拟机操作处理函数
  const handleVMAction = (action: string, vm: SidebarVMInfo) => {
    // 发送自定义事件到虚拟机页面进行真实API调用
    const event = new CustomEvent("hierarchical-sidebar-vm-action", {
      detail: {
        action,
        vmName: vm.name,
        hostname: vm.hostname,
        vmData: vm,
      },
    });
    window.dispatchEvent(event);
  };

  // 物理机操作处理函数

  // 集群操作处理函数
  const handleClusterAction = (
    action: string,
    clusterData: VMTreeWithClusterResponse
  ) => {
    // 发送自定义事件到虚拟机页面进行真实API调用
    const event = new CustomEvent("hierarchical-sidebar-cluster-action", {
      detail: {
        action,
        clusterName: clusterData.cluster_name,
        clusterUuid: clusterData.cluster_uuid,
        clusterData: clusterData,
      },
    });
    window.dispatchEvent(event);
  };

  // 获取虚拟机右键菜单项
  const getVMContextMenu = (vm: SidebarVMInfo): MenuProps["items"] => {
    const isRunning = vm.status === "running";
    const isStopped = vm.status === "shutoff" || vm.status === "stopped";
    const isPaused = vm.status === "paused" || vm.status === "suspended";

    return [
      {
        key: "start",
        icon: <PlayCircleOutlined />,
        label: (
          <span>
            启动
            {isStopped && (
              <span
                style={{ color: "#52c41a", marginLeft: 8, fontSize: "11px" }}
              >
                可用
              </span>
            )}
          </span>
        ),
        disabled: isRunning || isPaused,
        onClick: (e) => {
          e?.domEvent?.stopPropagation();
          handleVMAction("start", vm);
        },
      },
      {
        key: "shutdown",
        icon: <PoweroffOutlined />,
        label: <span>关机</span>,
        disabled: isStopped,
        onClick: (e) => {
          e?.domEvent?.stopPropagation();
          handleVMAction("shutdown", vm);
        },
      },
      {
        key: "restart",
        icon: <ReloadOutlined />,
        label: "重启",
        disabled: !isRunning,
        onClick: (e) => {
          e?.domEvent?.stopPropagation();
          handleVMAction("restart", vm);
        },
      },
      {
        key: "pause",
        icon: <PauseOutlined />,
        label: (
          <span>
            挂起
            {isRunning && (
              <span
                style={{ color: "#faad14", marginLeft: 8, fontSize: "11px" }}
              >
                可用
              </span>
            )}
          </span>
        ),
        disabled: !isRunning,
        onClick: (e) => {
          e?.domEvent?.stopPropagation();
          handleVMAction("pause", vm);
        },
      },
      {
        key: "resume",
        icon: <CaretRightOutlined />,
        label: (
          <span>
            恢复
            {isPaused && (
              <span
                style={{ color: "#1890ff", marginLeft: 8, fontSize: "11px" }}
              >
                可用
              </span>
            )}
          </span>
        ),
        disabled: !isPaused,
        onClick: (e) => {
          e?.domEvent?.stopPropagation();
          handleVMAction("resume", vm);
        },
      },
      {
        key: "destroy",
        icon: <StopOutlined />,
        label: "强制停止",
        disabled: isStopped,
        onClick: (e) => {
          e?.domEvent?.stopPropagation();
          handleVMAction("destroy", vm);
        },
      },
      { type: "divider" },
      {
        key: "console",
        icon: <MonitorOutlined />,
        label: "打开控制台",
        onClick: (e) => {
          e?.domEvent?.stopPropagation();
          handleVMAction("console", vm);
        },
      },
    ];
  };

  // 获取集群右键菜单项
  const getClusterContextMenu = (
    clusterData: VMTreeWithClusterResponse
  ): MenuProps["items"] => [
    {
      key: "info",
      icon: <ClusterOutlined />,
      label: "集群信息",
      onClick: () => handleClusterAction("info", clusterData),
    },
    {
      key: "performance",
      icon: <MonitorOutlined />,
      label: "性能监控",
      onClick: () => handleClusterAction("performance", clusterData),
    },
    { type: "divider" },
    {
      key: "settings",
      icon: <StopOutlined />,
      label: "集群设置",
      onClick: () => handleClusterAction("settings", clusterData),
    },
  ];

  // 获取所有可展开的keys
  const getAllExpandableKeys = (
    data: VMTreeResponse | VMTreeWithClusterResponse
  ): string[] => {
    const keys: string[] = [];

    if (hasClusterInfo(data)) {
      // 如果有集群信息，添加集群key
      keys.push(`cluster-${data.cluster_uuid}`);

      // 添加主机keys
      data.nodes.forEach((host) => {
        keys.push(`host-${host.hostname}`);
      });
    } else {
      // 传统格式，只添加主机keys
      data.nodes.forEach((host) => {
        keys.push(`host-${host.hostname}`);
      });
    }

    return keys;
  };

  // 初始化展开所有节点
  useEffect(() => {
    if (data) {
      const allKeys = getAllExpandableKeys(data);
      setExpandedKeys(allKeys);

      // 自动选择逻辑
      if (hasClusterInfo(data)) {
        // 如果有集群信息，默认选中集群
        const clusterKey = `cluster-${data.cluster_uuid}`;
        setSelectedKeys([clusterKey]);

        // 触发选择事件，传递转换后的集群数据
        const convertedCluster = convertToLegacyCluster(data);
        onSelect?.([clusterKey], {
          node: {
            key: clusterKey,
            data: convertedCluster,
            type: "cluster",
          },
        });

        // 发送自定义事件
        const event = new CustomEvent("hierarchical-sidebar-select", {
          detail: {
            selectedKeys: [clusterKey],
            nodeKey: clusterKey,
            nodeType: "cluster",
            nodeData: convertedCluster,
          },
        });
        window.dispatchEvent(event);
      } else if (data.nodes.length > 0 && selectedKeys.length === 0) {
        // 传统逻辑：选中第一个主机
        const firstHost = data.nodes[0];
        if (firstHost) {
          setSelectedKeys([`host-${firstHost.hostname}`]);
          // 触发选择事件，传递转换后的数据
          const convertedHost = convertToLegacyHost(firstHost);
          onSelect?.([`host-${firstHost.hostname}`], {
            node: {
              key: `host-${firstHost.hostname}`,
              data: convertedHost,
              type: "host",
            },
          });

          // 发送自定义事件
          const event = new CustomEvent("hierarchical-sidebar-select", {
            detail: {
              selectedKeys: [`host-${firstHost.hostname}`],
              nodeKey: `host-${firstHost.hostname}`,
              nodeType: "host",
              nodeData: convertedHost,
            },
          });
          window.dispatchEvent(event);
        }
      }
    }
  }, [data, onSelect, selectedKeys.length]);

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
  const createVMNode = (vm: SidebarVMInfo): TreeNodeData => {
    const statusColor = getStatusColor(vm.status);
    const statusIcon = getStatusIcon("qemu"); // 默认使用qemu图标

    return {
      key: vm.uuid,
      title: (
        <Dropdown
          menu={{ items: getVMContextMenu(vm) }}
          trigger={["contextMenu"]}
          overlayClassName="vm-context-menu"
        >
          <div className="tree-node-content">
            <span className="tree-node-icon" style={{ color: statusColor }}>
              {statusIcon}
            </span>
            <span className="tree-node-title">{vm.name}</span>

            <div className="tree-node-status">
              <span
                className="status-dot"
                style={{ backgroundColor: statusColor }}
              />
              <span className="status-text">
                {vm.status === "shutoff" ? "已停止" : vm.status}
              </span>
            </div>
          </div>
        </Dropdown>
      ),
      type: "vm",
      status: vm.status,
      data: vm,
      isLeaf: true,
    };
  };

  // 创建物理机节点
  const createHostNode = (host: SidebarHostNode): TreeNodeData => {
    const statusColor = getStatusColor(host.status);

    return {
      key: `host-${host.hostname}`,
      title: (
        <div
          className="tree-node-content"
          data-type="host"
          data-status={host.status}
        >
          <span className="tree-node-icon" style={{ color: statusColor }}>
            <HddOutlined />
          </span>
          <span className="tree-node-title">{host.hostname}</span>
        </div>
      ),
      type: "host",
      status: host.status,
      data: host,
      children: host.vms.map(createVMNode),
      className: "host-node",
    };
  };

  // 创建集群节点
  const createClusterNode = (
    clusterData: VMTreeWithClusterResponse
  ): TreeNodeData => {
    return {
      key: `cluster-${clusterData.cluster_uuid}`,
      title: (
        <Dropdown
          menu={{ items: getClusterContextMenu(clusterData) }}
          trigger={["contextMenu"]}
          overlayClassName="cluster-context-menu"
        >
          <div className="tree-node-content">
            <span className="tree-node-icon">
              <ClusterOutlined />
            </span>
            <span className="tree-node-title">{clusterData.cluster_name}</span>
          </div>
        </Dropdown>
      ),
      type: "cluster",
      status: "healthy",
      data: clusterData,
      children: clusterData.nodes.map(createHostNode),
      className: "cluster-node",
    };
  };

  // 处理节点选择
  const handleSelect = (
    newSelectedKeys: React.Key[],
    info: Record<string, unknown>
  ) => {
    const selectedKeysAsStrings = newSelectedKeys.map(String);
    setSelectedKeys(selectedKeysAsStrings);

    // 触发外部回调
    onSelect?.(selectedKeysAsStrings, info);

    // 发送选择事件
    const { node } = info as {
      node?: { key: string; data?: unknown; type?: string };
    };
    if (node) {
      let convertedData = node.data;

      // 根据节点类型转换数据格式
      if (node.type === "vm" && convertedData) {
        convertedData = convertToLegacyVM(convertedData as SidebarVMInfo);
      } else if (node.type === "host" && convertedData) {
        convertedData = convertToLegacyHost(convertedData as SidebarHostNode);
      } else if (node.type === "cluster" && convertedData) {
        convertedData = convertToLegacyCluster(
          convertedData as VMTreeWithClusterResponse
        );
      }

      const eventDetail = {
        selectedKeys: selectedKeysAsStrings,
        nodeKey: node.key,
        nodeType: node.type || "unknown",
        nodeData: convertedData,
      };

      const event = new CustomEvent("hierarchical-sidebar-select", {
        detail: eventDetail,
      });
      window.dispatchEvent(event);
    }
  };

  // 处理节点展开
  const handleExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys.map(String));
  };

  // 构建树数据
  let treeData: TreeNodeData[];

  if (hasClusterInfo(data)) {
    // 有集群信息时，创建集群节点
    treeData = [createClusterNode(data)];
  } else {
    // 传统格式，直接显示主机节点
    treeData = data.nodes.map(createHostNode);
  }

  return (
    <div
      style={{
        height: "100%",
        background: actualTheme === "dark" ? "#1f1f1f" : "#fafafa",
      }}
    >
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
        虚拟机资源树
      </div>
      <Tree
        className="resource-tree"
        treeData={treeData}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        onSelect={handleSelect}
        onExpand={handleExpand}
        blockNode
        showIcon={false}
        style={{
          background: "transparent",
          fontSize: "12px",
        }}
      />
    </div>
  );
};

export default VMSidebar;
