import React from "react";
import {
  DesktopOutlined,
  ClusterOutlined,
  SaveOutlined,
  GlobalOutlined,
  HddOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
} from "@ant-design/icons";

// 导入页面组件
import VirtualMachineManagement from "../pages/VirtualMachine";
import ClusterManagement from "../pages/Cluster";
import PhysicalMachineManagement from "../pages/PhysicalMachine";
import NetworkManagement from "../pages/Network";
import StorageManagement from "../pages/Storage";
import UserManagement from "../pages/User";
import SystemSettings from "../pages/System";
import Dashboard from "../pages/Dashboard";

// 定义路由
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  icon?: React.ReactNode;
  name: string;
  children?: RouteConfig[];
  caseSensitive?: boolean;
  index?: boolean;
  id?: string;
  handle?: Record<string, unknown>;
  loader?: (args: Record<string, unknown>) => Promise<unknown> | unknown;
  action?: (args: Record<string, unknown>) => Promise<unknown> | unknown;
  errorElement?: React.ReactNode;
}

// 主路由配置
const routes: RouteConfig[] = [
  {
    path: "/dashboard",
    name: "仪表盘",
    element: <Dashboard />,
    icon: <DashboardOutlined />,
  },
  {
    path: "/virtual-machine",
    name: "虚拟机管理",
    element: <VirtualMachineManagement />,
    icon: <DesktopOutlined />,
  },
  {
    path: "/cluster",
    name: "集群管理",
    element: <ClusterManagement />,
    icon: <ClusterOutlined />,
  },
  {
    path: "/physical-machine",
    name: "物理机管理",
    element: <PhysicalMachineManagement />,
    icon: <SaveOutlined />,
  },
  {
    path: "/network",
    name: "网络管理",
    element: <NetworkManagement />,
    icon: <GlobalOutlined />,
  },
  {
    path: "/storage",
    name: "存储管理",
    element: <StorageManagement />,
    icon: <HddOutlined />,
  },
  {
    path: "/user",
    name: "用户管理",
    element: <UserManagement />,
    icon: <UserOutlined />,
  },
  {
    path: "/system",
    name: "系统设置",
    element: <SystemSettings />,
    icon: <SettingOutlined />,
  },
];

export default routes;
