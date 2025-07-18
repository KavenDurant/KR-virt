/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-11 15:18:54
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-11 17:26:33
 * @FilePath: /KR-virt/src/pages/Network/components/TopologyData.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-11 15:18:54
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-11 15:29:55
 * @FilePath: /KR-virt/src/pages/Network/components/TopologyData.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from "react";
import {
  DeviceType,
  DeviceStatus,
  NetworkType,
  ConnectionType,
  type NetworkDevice,
  type NetworkSegment,
  type NetworkConnection,
  type TopologyData,
} from "./types";

/**
 * 默认网络拓扑数据
 * 包含基础的网络设备、网络段和连接关系
 */
export const getDefaultTopologyData = (): TopologyData => {
  // 默认设备数据
  const devices: NetworkDevice[] = [
    {
      id: "router",
      name: "主路由器",
      type: DeviceType.ROUTER,
      status: DeviceStatus.ONLINE,
      ip_address: "192.168.1.1",
      description: "网络核心路由设备",
      location: { x: 536, y: 124 },
    },
    {
      id: "switch-core",
      name: "核心交换机",
      type: DeviceType.SWITCH_CORE,
      status: DeviceStatus.ONLINE,
      ip_address: "192.168.1.10",
      description: "连接所有网络",
      location: { x: 408, y: 378 },
    },
    {
      id: "switch-prod",
      name: "生产交换机",
      type: DeviceType.SWITCH_CORE,
      status: DeviceStatus.ONLINE,
      ip_address: "192.168.1.11",
      description: "连接生产网络",
      location: { x: 536, y: 378 },
    },
    {
      id: "vm-web-01",
      name: "Web服务器-01",
      type: DeviceType.VIRTUAL_MACHINE,
      status: DeviceStatus.ONLINE,
      ip_address: "192.168.122.101",
      description: "前端Web服务器",
      location: { x: 202, y: 507 },
    },
    {
      id: "vm-db-02",
      name: "数据库服务器-02",
      type: DeviceType.VIRTUAL_MACHINE,
      status: DeviceStatus.ONLINE,
      ip_address: "10.0.0.102",
      description: "MySQL数据库服务器",
      location: { x: 438, y: 507 },
    },
    {
      id: "vm-db-03",
      name: "数据库服务器-03",
      type: DeviceType.VIRTUAL_MACHINE,
      status: DeviceStatus.WARNING,
      ip_address: "192.168.200.103",
      description: "PostgreSQL数据库服务器",
      location: { x: 848, y: 507 },
    },
    {
      id: "vm-test-04",
      name: "测试服务器-04",
      type: DeviceType.VIRTUAL_MACHINE,
      status: DeviceStatus.OFFLINE,
      ip_address: "172.16.0.104",
      description: "测试环境服务器",
      location: { x: 1158, y: 507 },
    },
  ];

  // 默认网络段数据
  const networks: NetworkSegment[] = [
    {
      id: "network-nat",
      name: "默认网络",
      type: NetworkType.NAT,
      cidr: "192.168.122.0/24",
      gateway: "192.168.122.1",
      status: "active",
      description: "NAT网络，用于虚拟机上网",
      location: { x: 177, y: 280 },
    },
    {
      id: "network-prod",
      name: "生产网络",
      type: NetworkType.BRIDGE,
      cidr: "10.0.0.0/24",
      gateway: "10.0.0.1",
      status: "active",
      description: "生产环境桥接网络",
      location: { x: 496, y: 280 },
    },
    {
      id: "network-isolated",
      name: "隔离网络",
      type: NetworkType.ISOLATED,
      cidr: "192.168.200.0/24",
      status: "active",
      description: "隔离网络，无外网访问",
      location: { x: 810, y: 280 },
    },
    {
      id: "network-direct",
      name: "直连网络",
      type: NetworkType.DIRECT,
      cidr: "172.16.0.0/24",
      gateway: "172.16.0.1",
      status: "inactive",
      description: "直连物理网络",
      location: { x: 1135, y: 280 },
    },
  ];

  // 默认连接关系数据
  const connections: NetworkConnection[] = [
    // 路由器到交换机的连接
    {
      id: "router-core",
      source_id: "router",
      target_id: "switch-core",
      connection_type: ConnectionType.PHYSICAL,
      status: "up",
      bandwidth: 1000,
      animated: true,
    },
    {
      id: "router-prod",
      source_id: "router",
      target_id: "switch-prod",
      connection_type: ConnectionType.PHYSICAL,
      status: "up",
      bandwidth: 1000,
      animated: true,
    },
    // 交换机到网络段的连接
    {
      id: "core-nat",
      source_id: "switch-core",
      target_id: "network-nat",
      connection_type: ConnectionType.LOGICAL,
      status: "up",
    },
    {
      id: "prod-bridge",
      source_id: "switch-prod",
      target_id: "network-prod",
      connection_type: ConnectionType.LOGICAL,
      status: "up",
    },
    {
      id: "core-isolated",
      source_id: "switch-core",
      target_id: "network-isolated",
      connection_type: ConnectionType.LOGICAL,
      status: "up",
    },
    {
      id: "core-direct",
      source_id: "switch-core",
      target_id: "network-direct",
      connection_type: ConnectionType.LOGICAL,
      status: "down",
    },
    // 网络段到虚拟机的连接
    {
      id: "nat-web01",
      source_id: "network-nat",
      target_id: "vm-web-01",
      connection_type: ConnectionType.VIRTUAL,
      status: "up",
    },
    {
      id: "prod-db02",
      source_id: "network-prod",
      target_id: "vm-db-02",
      connection_type: ConnectionType.VIRTUAL,
      status: "up",
    },
    {
      id: "isolated-db03",
      source_id: "network-isolated",
      target_id: "vm-db-03",
      connection_type: ConnectionType.VIRTUAL,
      status: "up",
    },
    {
      id: "direct-test04",
      source_id: "network-direct",
      target_id: "vm-test-04",
      connection_type: ConnectionType.VIRTUAL,
      status: "down",
    },
  ];

  return {
    devices,
    networks,
    connections,
  };
};

/**
 * 生成示例设备数据
 */
export const generateSampleDevices = (count: number = 5): NetworkDevice[] => {
  const devices: NetworkDevice[] = [];
  const deviceTypes = [
    DeviceType.VIRTUAL_MACHINE,
    DeviceType.PHYSICAL_HOST,
    DeviceType.SWITCH_ACCESS,
  ];
  const statuses = [
    DeviceStatus.ONLINE,
    DeviceStatus.OFFLINE,
    DeviceStatus.WARNING,
  ];

  for (let i = 0; i < count; i++) {
    devices.push({
      id: `device-${i + 1}`,
      name: `设备-${i + 1}`,
      type: deviceTypes[i % deviceTypes.length],
      status: statuses[i % statuses.length],
      ip_address: `192.168.1.${100 + i}`,
      description: `示例设备 ${i + 1}`,
      location: {
        x: 200 + (i % 3) * 200,
        y: 400 + Math.floor(i / 3) * 100,
      },
    });
  }

  return devices;
};

/**
 * 生成示例网络段数据
 */
export const generateSampleNetworks = (count: number = 3): NetworkSegment[] => {
  const networks: NetworkSegment[] = [];
  const networkTypes = [
    NetworkType.NAT,
    NetworkType.BRIDGE,
    NetworkType.ISOLATED,
  ];
  const baseIPs = ["192.168", "10.0", "172.16"];

  for (let i = 0; i < count; i++) {
    networks.push({
      id: `network-${i + 1}`,
      name: `网络-${i + 1}`,
      type: networkTypes[i % networkTypes.length],
      cidr: `${baseIPs[i % baseIPs.length]}.${i + 1}.0/24`,
      gateway: `${baseIPs[i % baseIPs.length]}.${i + 1}.1`,
      status: "active",
      description: `示例网络 ${i + 1}`,
      location: {
        x: 300 + i * 250,
        y: 280,
      },
    });
  }

  return networks;
};

/**
 * TopologyData 组件
 * 用于提供默认的拓扑数据和数据生成功能
 */
const TopologyData: React.FC<{
  children?: (data: TopologyData) => React.ReactNode;
}> = ({ children }) => {
  const defaultData = getDefaultTopologyData();

  if (children) {
    return <>{children(defaultData)}</>;
  }

  return null;
};

export default TopologyData;
