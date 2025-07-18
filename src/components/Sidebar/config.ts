/**
 * 侧边栏配置文件
 *
 * 定义了集群管理和虚拟机管理两种模式的差异化配置
 */

import {
  PlayCircleOutlined,
  PoweroffOutlined,
  StopOutlined,
  ReloadOutlined,
  MonitorOutlined,
  ClusterOutlined,
  PauseOutlined,
  CaretRightOutlined,
  HddOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import type { SidebarConfig, StatusConfig, MenuItemConfig } from "./types";

// 状态配置映射
export const STATUS_CONFIGS: Record<string, StatusConfig> = {
  // 运行状态
  running: { label: "运行中", color: "#52c41a", icon: "🟢" },
  online: { label: "在线", color: "#52c41a", icon: "🟢" },
  healthy: { label: "健康", color: "#52c41a", icon: "🟢" },
  active: { label: "活跃", color: "#52c41a", icon: "🟢" },
  started: { label: "已启动", color: "#52c41a", icon: "🟢" },

  // 停止状态
  stopped: { label: "已停止", color: "#8c8c8c", icon: "⚫" },
  shutoff: { label: "已停止", color: "#8c8c8c", icon: "⚫" },
  offline: { label: "离线", color: "#8c8c8c", icon: "⚫" },
  inactive: { label: "未激活", color: "#8c8c8c", icon: "⚫" },

  // 警告状态
  suspended: { label: "已挂起", color: "#faad14", icon: "🟡" },
  paused: { label: "已暂停", color: "#faad14", icon: "🟡" },
  warning: { label: "警告", color: "#faad14", icon: "🟡" },
  standby: { label: "待机", color: "#faad14", icon: "🟡" },

  // 维护状态
  maintenance: { label: "维护模式", color: "#ff7a00", icon: "🟠" },

  // 错误状态
  error: { label: "错误", color: "#ff4d4f", icon: "🔴" },
  failed: { label: "失败", color: "#ff4d4f", icon: "🔴" },

  // 默认状态
  default: { label: "未知", color: "#d9d9d9", icon: "⚪" },
};

// 获取状态配置
export const getStatusConfig = (status: string): StatusConfig => {
  return STATUS_CONFIGS[status] || STATUS_CONFIGS.default;
};

// 虚拟机菜单配置
const VM_MENU_ITEMS: MenuItemConfig[] = [
  {
    key: "start",
    icon: PlayCircleOutlined,
    label: "启动",
  },
  {
    key: "shutdown",
    icon: PoweroffOutlined,
    label: "关机",
  },
  {
    key: "restart",
    icon: ReloadOutlined,
    label: "重启",
  },
  {
    key: "pause",
    icon: PauseOutlined,
    label: "挂起",
  },
  {
    key: "resume",
    icon: CaretRightOutlined,
    label: "恢复",
  },
  {
    key: "destroy",
    icon: StopOutlined,
    label: "强制停止",
  },
  {
    key: "divider",
    label: "",
    divider: true,
  },
  {
    key: "console",
    icon: MonitorOutlined,
    label: "打开控制台",
  },
];

// 主机菜单配置
const HOST_MENU_ITEMS: MenuItemConfig[] = [
  {
    key: "reboot",
    icon: ReloadOutlined,
    label: "重启主机",
  },
  {
    key: "shutdown",
    icon: PoweroffOutlined,
    label: "关闭主机",
  },
  {
    key: "divider",
    label: "",
    divider: true,
  },
  {
    key: "maintenance",
    icon: StopOutlined,
    label: "进入维护模式",
  },
  {
    key: "migrate",
    icon: PlayCircleOutlined,
    label: "迁移虚拟机",
  },
];

// 集群菜单配置
const CLUSTER_MENU_ITEMS: MenuItemConfig[] = [
  {
    key: "info",
    icon: InfoCircleOutlined,
    label: "集群信息",
  },
  {
    key: "performance",
    icon: MonitorOutlined,
    label: "性能监控",
  },
  {
    key: "divider",
    label: "",
    divider: true,
  },
  {
    key: "settings",
    icon: SettingOutlined,
    label: "集群设置",
  },
];

// 集群管理模式配置
export const CLUSTER_SIDEBAR_CONFIG: SidebarConfig = {
  title: "资源树",
  showNetworks: true,
  showStorages: true,
  defaultExpandAll: true,
  nodeConfigs: {
    cluster: {
      showIcon: true,
      showStatus: true,
      showSubtitle: false,
      contextMenu: CLUSTER_MENU_ITEMS,
    },
    host: {
      showIcon: true,
      showStatus: true,
      showSubtitle: true, // 显示IP地址
      contextMenu: HOST_MENU_ITEMS,
    },
    vm: {
      showIcon: true,
      showStatus: true,
      showSubtitle: true, // 显示主机名
      contextMenu: VM_MENU_ITEMS,
    },
    network: {
      showIcon: true,
      showStatus: true,
      showSubtitle: true, // 显示网络类型
      contextMenu: [],
    },
    storage: {
      showIcon: true,
      showStatus: true,
      showSubtitle: true, // 显示使用率
      contextMenu: [],
    },
  },
};

// 虚拟机管理模式配置
export const VM_SIDEBAR_CONFIG: SidebarConfig = {
  title: "虚拟机资源树",
  showNetworks: false,
  showStorages: false,
  defaultExpandAll: true,
  nodeConfigs: {
    cluster: {
      showIcon: true,
      showStatus: false,
      showSubtitle: false,
      contextMenu: CLUSTER_MENU_ITEMS,
    },
    host: {
      showIcon: true,
      showStatus: true, // 在VM模式下也显示主机状态，便于识别在线状态
      showSubtitle: false,
      contextMenu: [], // VM模式下主机操作较少
    },
    vm: {
      showIcon: true,
      showStatus: true,
      showSubtitle: false,
      contextMenu: VM_MENU_ITEMS,
    },
    network: {
      showIcon: false,
      showStatus: false,
      showSubtitle: false,
      contextMenu: [],
    },
    storage: {
      showIcon: false,
      showStatus: false,
      showSubtitle: false,
      contextMenu: [],
    },
  },
};

// 获取侧边栏配置
export const getSidebarConfig = (mode: "cluster" | "vm"): SidebarConfig => {
  return mode === "cluster" ? CLUSTER_SIDEBAR_CONFIG : VM_SIDEBAR_CONFIG;
};

// 图标映射
export const ICON_MAPPING = {
  cluster: ClusterOutlined,
  host: HddOutlined,
  vm: MonitorOutlined,
  network: GlobalOutlined,
  storage: HddOutlined,
};

// 获取节点图标
export const getNodeIcon = (type: string) => {
  const IconComponent = ICON_MAPPING[type as keyof typeof ICON_MAPPING];
  return IconComponent || HddOutlined;
};
