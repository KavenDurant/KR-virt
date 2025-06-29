import React, { useState, useEffect } from "react";
import { Tree, Dropdown, message } from "antd";
import type { TreeDataNode, MenuProps } from "antd";
import {
  PlayCircleOutlined,
  PoweroffOutlined,
  StopOutlined,
  ReloadOutlined,
  MonitorOutlined,
  HddOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/hooks/useTheme";
import type {
  DataCenter,
  Cluster,
  Node,
  VirtualMachine,
  Network,
  Storage,
} from "@/services/mockData";
import { getStatusColor, getStatusIcon, getNodeStatusConfig } from "@/services/mockData";
import "./HierarchicalSidebar.css";

export interface HierarchicalSidebarProps {
  data: DataCenter | null;
  onSelect?: (selectedKeys: string[], info: Record<string, unknown>) => void;
}

interface TreeNodeData extends TreeDataNode {
  type: "cluster" | "host" | "vm" | "network" | "storage";
  status?: string;
  data?: Cluster | Node | VirtualMachine | Network | Storage;
}

const HierarchicalSidebar: React.FC<HierarchicalSidebarProps> = ({
  data,
  onSelect,
}) => {
  const { actualTheme } = useTheme();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // 虚拟机操作处理函数
  const handleVMAction = (action: string, vm: VirtualMachine) => {
    const statusMap = {
      running: "运行中",
      stopped: "已停止",
      suspended: "已挂起",
      error: "错误",
    };

    const currentStatus = statusMap[vm.status] || vm.status;

    switch (action) {
      case "start":
        if (vm.status === "running") {
          message.warning(`虚拟机 ${vm.name} 已经在运行中`);
          return;
        }
        message.loading({
          content: `正在启动虚拟机 ${vm.name}...`,
          key: "vm-action",
          duration: 2,
        });
        setTimeout(() => {
          message.success({
            content: `虚拟机 ${vm.name} 启动成功`,
            key: "vm-action",
            duration: 2,
          });
        }, 2000);
        break;
      case "shutdown":
        if (vm.status === "stopped") {
          message.warning(`虚拟机 ${vm.name} 已经是停止状态`);
          return;
        }
        message.loading({
          content: `正在关机虚拟机 ${vm.name}...`,
          key: "vm-action",
          duration: 2,
        });
        setTimeout(() => {
          message.success({
            content: `虚拟机 ${vm.name} 关机成功`,
            key: "vm-action",
            duration: 2,
          });
        }, 2000);
        break;
      case "stop":
        if (vm.status === "stopped") {
          message.warning(`虚拟机 ${vm.name} 已经是停止状态`);
          return;
        }
        message.loading({
          content: `正在强制停止虚拟机 ${vm.name}...`,
          key: "vm-action",
          duration: 1,
        });
        setTimeout(() => {
          message.success({
            content: `虚拟机 ${vm.name} 强制停止成功`,
            key: "vm-action",
            duration: 2,
          });
        }, 1000);
        break;
      case "restart":
        if (vm.status === "stopped") {
          message.warning(`虚拟机 ${vm.name} 当前是停止状态，无法重启`);
          return;
        }
        message.loading({
          content: `正在重启虚拟机 ${vm.name}...`,
          key: "vm-action",
          duration: 3,
        });
        setTimeout(() => {
          message.success({
            content: `虚拟机 ${vm.name} 重启成功`,
            key: "vm-action",
            duration: 2,
          });
        }, 3000);
        break;
      case "console":
        message.loading({
          content: `正在连接虚拟机 ${vm.name} 控制台...`,
          key: "vm-action",
          duration: 1,
        });
        setTimeout(() => {
          message.success({
            content: `虚拟机 ${vm.name} 控制台已打开`,
            key: "vm-action",
            duration: 2,
          });
          // 这里可以实际打开控制台窗口
        }, 1000);
        break;
      default:
        message.info(`执行操作: ${action} - ${vm.name} (${currentStatus})`);
    }
  };

  // 获取虚拟机右键菜单项
  const getVMContextMenu = (vm: VirtualMachine): MenuProps["items"] => {
    const isRunning = vm.status === "running";
    const isStopped = vm.status === "stopped";
    const isError = vm.status === "error";

    return [
      {
        key: "start",
        icon: <PlayCircleOutlined />,
        label: (
          <span>
            开机
            {isStopped && (
              <span
                style={{ color: "#52c41a", marginLeft: 8, fontSize: "11px" }}
              >
                可用
              </span>
            )}
          </span>
        ),
        disabled: isRunning,
        onClick: () => handleVMAction("start", vm),
      },
      {
        key: "shutdown",
        icon: <PoweroffOutlined />,
        label: (
          <span>
            关机
            {isRunning && (
              <span
                style={{ color: "#faad14", marginLeft: 8, fontSize: "11px" }}
              >
                推荐
              </span>
            )}
          </span>
        ),
        disabled: isStopped,
        onClick: () => handleVMAction("shutdown", vm),
      },
      {
        key: "stop",
        icon: <StopOutlined />,
        label: (
          <span>
            强制停止
            {isError && (
              <span
                style={{ color: "#ff4d4f", marginLeft: 8, fontSize: "11px" }}
              >
                可用
              </span>
            )}
          </span>
        ),
        disabled: isStopped,
        onClick: () => handleVMAction("stop", vm),
      },
      {
        key: "restart",
        icon: <ReloadOutlined />,
        label: "重启",
        disabled: isStopped,
        onClick: () => handleVMAction("restart", vm),
      },
      {
        type: "divider",
      },
      {
        key: "console",
        icon: <MonitorOutlined />,
        label: (
          <span>
            打开控制台
            <span style={{ color: "#722ed1", marginLeft: 8, fontSize: "11px" }}>
              {isRunning ? "VNC" : "SPICE"}
            </span>
          </span>
        ),
        onClick: () => handleVMAction("console", vm),
      },
    ];
  };

  // 物理机操作处理函数
  const handleHostAction = (action: string, host: Node) => {
    // 发送自定义事件到集群页面进行真实API调用
    const event = new CustomEvent("hierarchical-sidebar-host-action", {
      detail: {
        action,
        hostname: host.name,
        hostData: host,
      },
    });
    window.dispatchEvent(event);
  };

  // 获取物理机右键菜单项
  const getHostContextMenu = (host: Node): MenuProps["items"] => {
    const isOnline = host.status === "online";
    const hasVMs = host.vms.length > 0;

    return [
      {
        key: "reboot",
        icon: <ReloadOutlined />,
        label: (
          <span>
            重启主机
            {hasVMs && (
              <span
                style={{ color: "#faad14", marginLeft: 8, fontSize: "11px" }}
              >
                需先迁移VM
              </span>
            )}
          </span>
        ),
        disabled: !isOnline,
        onClick: () => handleHostAction("reboot", host),
      },
      {
        key: "shutdown",
        icon: <PoweroffOutlined />,
        label: (
          <span>
            关闭主机
            {hasVMs && (
              <span
                style={{ color: "#ff4d4f", marginLeft: 8, fontSize: "11px" }}
              >
                需先迁移VM
              </span>
            )}
          </span>
        ),
        disabled: !isOnline,
        onClick: () => handleHostAction("shutdown", host),
      },
      {
        type: "divider",
      },
      {
        key: "maintenance",
        icon: <StopOutlined />,
        label: "进入维护模式",
        disabled: !isOnline,
        onClick: () => handleHostAction("maintenance", host),
      },
      {
        key: "migrate",
        icon: <PlayCircleOutlined />,
        label: (
          <span>
            迁移虚拟机
            {!hasVMs && (
              <span style={{ color: "#999", marginLeft: 8, fontSize: "11px" }}>
                无虚拟机
              </span>
            )}
          </span>
        ),
        disabled: !hasVMs || !isOnline,
        onClick: () => handleHostAction("migrate", host),
      },
      {
        type: "divider",
      },
    ];
  };

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
        <Dropdown
          menu={{ items: getVMContextMenu(vm) }}
          trigger={["contextMenu"]}
          overlayClassName="vm-context-menu"
        >
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
        </Dropdown>
      ),
      type: "vm",
      status: vm.status,
      data: vm,
      isLeaf: true,
    };
  };

  // 创建物理机（主机）节点
  const createHostNode = (node: Node): TreeNodeData => {
    const statusConfig = getNodeStatusConfig(node.status);
    const statusColor = statusConfig.color;

    return {
      key: node.id,
      title: (
        <Dropdown
          menu={{ items: getHostContextMenu(node) }}
          trigger={["contextMenu"]}
          overlayClassName="host-context-menu"
        >
          <div className="tree-node-content" data-type="node" data-status={node.status}>
            <span className="tree-node-icon" style={{ color: statusColor }}>
              <HddOutlined />
            </span>
            <span className="tree-node-title">
              {node.name}
              {node.is_dc && (
                <span className="dc-badge" title="数据中心节点">
                  DC
                </span>
              )}
            </span>
            {node.ip && (
              <span className="tree-node-subtitle">
                {node.ip}
              </span>
            )}
            <div className="tree-node-status">
              <span
                className="status-dot"
                style={{ backgroundColor: statusColor }}
                title={`节点状态: ${statusConfig.label}`}
              />
              <span className="status-text">{statusConfig.label}</span>
            </div>
          </div>
        </Dropdown>
      ),
      type: "host",
      status: node.status,
      data: node,
      children: node.vms.map(createVMNode),
      className: "host-node",
    };
  };

  // 创建网络节点
  const createNetworkNode = (network: Network): TreeNodeData => {
    const statusColor = getStatusColor(network.status);

    return {
      key: network.id,
      title: (
        <div className="tree-node-content">
          <span className="tree-node-icon" style={{ color: statusColor }}>
            <GlobalOutlined />
          </span>
          <span className="tree-node-title">{network.name}</span>
          <span
            className="tree-node-subtitle"
            style={{
              fontSize: "11px",
              color: actualTheme === "dark" ? "#888" : "#999",
              marginLeft: "4px",
            }}
          >
            ({network.networkType})
          </span>
          <div className="tree-node-status">
            <span
              className="status-dot"
              style={{ backgroundColor: statusColor }}
            />
            <span className="status-text">{network.status}</span>
          </div>
        </div>
      ),
      type: "network",
      status: network.status,
      data: network,
      className: "network-node",
    };
  };

  // 创建存储节点
  const createStorageNode = (storage: Storage): TreeNodeData => {
    const statusColor = getStatusColor(storage.status);
    const usagePercent =
      storage.size > 0 ? Math.round((storage.used / storage.size) * 100) : 0;

    return {
      key: storage.id,
      title: (
        <div className="tree-node-content">
          <span className="tree-node-icon" style={{ color: statusColor }}>
            <HddOutlined />
          </span>
          <span className="tree-node-title">{storage.name}</span>
          <span
            className="tree-node-subtitle"
            style={{
              fontSize: "11px",
              color: actualTheme === "dark" ? "#888" : "#999",
              marginLeft: "4px",
            }}
          >
            ({usagePercent}% 已用)
          </span>
          <div className="tree-node-status">
            <span
              className="status-dot"
              style={{ backgroundColor: statusColor }}
            />
            <span className="status-text">{storage.status}</span>
          </div>
        </div>
      ),
      type: "storage",
      status: storage.status,
      data: storage,
      className: "storage-node",
    };
  };

  // 创建集群节点 - 包含物理机节点、网络和存储
  const createClusterNode = (cluster: Cluster): TreeNodeData => {
    const statusColor = getStatusColor(cluster.status);
    const statusIcon = getStatusIcon(cluster.type);

    // 创建子节点数组，包含节点、网络和存储
    const children: TreeNodeData[] = [
      ...cluster.nodes.map(createHostNode),
      ...(cluster.networks || []).map(createNetworkNode),
      ...(cluster.storages || []).map(createStorageNode),
    ];

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
      children: children,
    };
  };

  // 创建树数据 - 直接显示集群列表
  const treeData: TreeNodeData[] = data.clusters.map(createClusterNode);
  const handleSelect = (
    newSelectedKeys: React.Key[],
    info: Record<string, unknown>,
  ) => {
    const selectedKeysAsStrings = newSelectedKeys.map(String);

    // 检查是否尝试取消选择当前已选中的节点（重复点击相同节点）
    if (selectedKeysAsStrings.length === 0 && selectedKeys.length > 0) {
      // 如果新的选择为空但之前有选择，说明用户点击了已选中的节点
      // 忽略这次操作，保持当前选择
      return;
    }

    setSelectedKeys(selectedKeysAsStrings);

    if (onSelect) {
      onSelect(selectedKeysAsStrings, info);
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
