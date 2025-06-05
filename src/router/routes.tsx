/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-04 13:29:52
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-05 11:18:28
 * @FilePath: /KR-virt/src/router/routes.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from "react";
import {
  DesktopOutlined,
  ClusterOutlined,
  GlobalOutlined,
  HddOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
  AuditOutlined,
} from "@ant-design/icons";

// 导入页面组件
import VirtualMachineManagement from "../pages/VirtualMachine";
import ClusterManagement from "../pages/Cluster";
import NetworkManagement from "../pages/Network";
import StorageManagement from "../pages/Storage";
import UserManagement from "../pages/User";
import SystemSettings from "../pages/System";
import Dashboard from "../pages/Dashboard";
import AuditManagement from "../pages/Audit";

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
    path: "/audit",
    name: "审计管理",
    element: <AuditManagement />,
    icon: <AuditOutlined />,
  },
  {
    path: "/system",
    name: "系统设置",
    element: <SystemSettings />,
    icon: <SettingOutlined />,
  },
];

export default routes;
