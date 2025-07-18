import React from "react";
import {
  DeviceType,
  DeviceStatus,
  NetworkType,
  ConnectionType,
  type NetworkDevice,
  type NetworkSegment,
  type NetworkConnection,
  type TopologyNode,
  type TopologyEdge,
  type DeviceLocation,
  type LayoutConfig,
  type TopologyData,
  type NetworkTopologyResponse,
} from "./types";

// 默认布局配置
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  canvas_width: 1200,
  canvas_height: 800,
  horizontal_spacing: 180,
  vertical_spacing: 150,
  margin: 80,
  layer_configs: {
    network: {
      y_position: 124,
      types: [DeviceType.ROUTER, DeviceType.FIREWALL],
    },
    switch: {
      y_position: 378,
      types: [DeviceType.SWITCH_CORE, DeviceType.SWITCH_ACCESS],
    },
    application: {
      y_position: 507,
      types: [DeviceType.VIRTUAL_MACHINE, DeviceType.PHYSICAL_HOST],
    },
  },
};

// 设备类型颜色映射
export const DEVICE_COLORS = {
  [DeviceType.ROUTER]: "#1890ff",
  [DeviceType.SWITCH_CORE]: "#52c41a",
  [DeviceType.SWITCH_ACCESS]: "#52c41a",
  [DeviceType.FIREWALL]: "#ff7875",
  [DeviceType.VIRTUAL_MACHINE]: "#1890ff",
  [DeviceType.PHYSICAL_HOST]: "#722ed1",
  [DeviceType.LOAD_BALANCER]: "#fa8c16",
  [DeviceType.INTERFACE]: "#13c2c2",
  [DeviceType.VM_INTERFACE]: "#eb2f96",
};

// 网络类型颜色映射
export const NETWORK_COLORS = {
  [NetworkType.NAT]: "#722ed1",
  [NetworkType.BRIDGE]: "#1890ff",
  [NetworkType.ISOLATED]: "#fa8c16",
  [NetworkType.DIRECT]: "#13c2c2",
  [NetworkType.VLAN]: "#eb2f96",
  [NetworkType.PUBLIC]: "#52c41a",
};

// 设备状态颜色映射
export const STATUS_COLORS = {
  [DeviceStatus.ONLINE]: {
    background: "#f6ffed",
    border: "#b7eb8f",
  },
  [DeviceStatus.OFFLINE]: {
    background: "#fff2e8",
    border: "#ffbb96",
  },
  [DeviceStatus.WARNING]: {
    background: "#fffbe6",
    border: "#ffe58f",
  },
  [DeviceStatus.ERROR]: {
    background: "#fff2f0",
    border: "#ffccc7",
  },
  [DeviceStatus.MAINTENANCE]: {
    background: "#f0f5ff",
    border: "#adc6ff",
  },
};

// 连接类型样式映射
export const CONNECTION_STYLES = {
  [ConnectionType.PHYSICAL]: {
    stroke: "#1890ff",
    strokeWidth: 2,
    animated: true,
  },
  [ConnectionType.LOGICAL]: {
    stroke: "#722ed1",
    strokeWidth: 2,
    strokeDasharray: "5,5",
    animated: false,
  },
  [ConnectionType.VIRTUAL]: {
    stroke: "#52c41a",
    strokeWidth: 1,
    animated: false,
  },
  [ConnectionType.WIRELESS]: {
    stroke: "#fa8c16",
    strokeWidth: 1,
    strokeDasharray: "3,3",
    animated: true,
  },
  [ConnectionType.INTERFACE_BOND]: {
    stroke: "#1890ff",
    strokeWidth: 3,
    animated: false,
  },
  [ConnectionType.HOST_INTERFACE]: {
    stroke: "#13c2c2",
    strokeWidth: 2,
    animated: false,
  },
  [ConnectionType.HOST_VM]: {
    stroke: "#722ed1",
    strokeWidth: 2,
    animated: false,
  },
  [ConnectionType.VM_INTERFACE]: {
    stroke: "#eb2f96",
    strokeWidth: 1,
    animated: false,
  },
  [ConnectionType.VM_BRIDGE]: {
    stroke: "#52c41a",
    strokeWidth: 1,
    strokeDasharray: "2,2",
    animated: false,
  },
  [ConnectionType.VM_LINK]: {
    stroke: "#fa8c16",
    strokeWidth: 2,
    strokeDasharray: "3,1",
    animated: true,
  },
};

/**
 * 根据设备类型和状态获取节点样式
 */
export const getDeviceStyle = (type: DeviceType, status: DeviceStatus) => {
  const baseColor = DEVICE_COLORS[type] || "#666";
  const statusStyle =
    STATUS_COLORS[status] || STATUS_COLORS[DeviceStatus.OFFLINE];

  return {
    background: statusStyle.background,
    border: `2px solid ${statusStyle.border}`,
    borderRadius: "8px",
    padding: "10px",
    width: type === DeviceType.ROUTER ? 120 : 100,
    height: type === DeviceType.ROUTER ? 80 : 70,
    color: baseColor,
  };
};

/**
 * 根据网络类型获取网络节点样式
 */
export const getNetworkStyle = (
  type: NetworkType,
  status: "active" | "inactive" | "error" = "active",
) => {
  const baseColor = NETWORK_COLORS[type] || "#666";
  let borderColor = baseColor;
  let backgroundColor = "#fff";

  if (status === "inactive") {
    borderColor = "#d9d9d9";
    backgroundColor = "#f5f5f5";
  } else if (status === "error") {
    borderColor = "#ff7875";
    backgroundColor = "#fff2f0";
  }

  return {
    background: backgroundColor,
    border: `1px solid ${borderColor}`,
    borderRadius: "6px",
    padding: "6px",
    width: 120,
    height: 60,
    color: borderColor,
  };
};

/**
 * 根据连接类型获取边样式
 */
export const getConnectionStyle = (
  type: ConnectionType,
  status: "up" | "down" | "degraded" = "up",
) => {
  const baseStyle =
    CONNECTION_STYLES[type] || CONNECTION_STYLES[ConnectionType.LOGICAL];

  let strokeColor = baseStyle.stroke;
  if (status === "down") {
    strokeColor = "#ff7875";
  } else if (status === "degraded") {
    strokeColor = "#fa8c16";
  }

  return {
    ...baseStyle,
    stroke: strokeColor,
  };
};

/**
 * 计算自动布局位置
 */
export const calculateAutoLayout = (
  devices: NetworkDevice[],
  networks: NetworkSegment[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG,
): Record<string, DeviceLocation> => {
  const positions: Record<string, DeviceLocation> = {};

  // 按类型分组设备
  const devicesByLayer: Record<string, NetworkDevice[]> = {};

  devices.forEach((device) => {
    const layer =
      Object.keys(config.layer_configs).find((layerName) =>
        config.layer_configs[layerName].types.includes(device.type),
      ) || "application";

    if (!devicesByLayer[layer]) {
      devicesByLayer[layer] = [];
    }
    devicesByLayer[layer].push(device);
  });

  // 为每层设备计算位置
  Object.entries(devicesByLayer).forEach(([layerName, layerDevices]) => {
    const layerConfig = config.layer_configs[layerName];
    if (!layerConfig) return;

    const y = layerConfig.y_position;
    const totalWidth = (layerDevices.length - 1) * config.horizontal_spacing;
    const startX = (config.canvas_width - totalWidth) / 2;

    layerDevices.forEach((device, index) => {
      positions[device.id] = {
        x: startX + index * config.horizontal_spacing,
        y,
        layer: layerName,
      };
    });
  });

  // 为网络段计算位置（放在switch层和application层之间）
  if (networks.length > 0) {
    const networkY = 280; // 网络段固定Y位置
    const totalWidth = (networks.length - 1) * config.horizontal_spacing;
    const startX = (config.canvas_width - totalWidth) / 2;

    networks.forEach((network, index) => {
      positions[network.id] = {
        x: startX + index * config.horizontal_spacing,
        y: networkY,
        layer: "network_segment",
      };
    });
  }

  return positions;
};

/**
 * 将设备数据转换为拓扑图节点
 */
export const convertDevicesToNodes = (
  devices: NetworkDevice[],
  positions?: Record<string, DeviceLocation>,
): TopologyNode[] => {
  return devices.map((device) => {
    const position = positions?.[device.id] ||
      device.location || { x: 0, y: 0 };

    return {
      id: device.id,
      type: "default",
      position,
      data: {
        label: createDeviceLabel(device),
        device,
      },
      style: getDeviceStyle(device.type, device.status),
    };
  });
};

/**
 * 将网络段数据转换为拓扑图节点
 */
export const convertNetworksToNodes = (
  networks: NetworkSegment[],
  positions?: Record<string, DeviceLocation>,
): TopologyNode[] => {
  return networks.map((network) => {
    const position = positions?.[network.id] ||
      network.location || { x: 0, y: 0 };

    return {
      id: network.id,
      type: "default",
      position,
      data: {
        label: createNetworkLabel(network),
        network,
      },
      style: getNetworkStyle(network.type, network.status),
    };
  });
};

/**
 * 将连接数据转换为拓扑图边
 */
export const convertConnectionsToEdges = (
  connections: NetworkConnection[],
): TopologyEdge[] => {
  return connections.map((connection) => ({
    id: connection.id,
    source: connection.source_id,
    target: connection.target_id,
    type: "default",
    style: getConnectionStyle(connection.connection_type, connection.status),
    animated:
      connection.animated ??
      CONNECTION_STYLES[connection.connection_type]?.animated,
    connection,
  }));
};

/**
 * 创建设备标签组件
 */
export const createDeviceLabel = (device: NetworkDevice): React.ReactNode => {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "20px", marginBottom: "4px" }}>
        {getDeviceIcon(device.type)}
      </div>
      <div style={{ fontWeight: "bold", fontSize: "12px" }}>{device.name}</div>
      {device.ip_address && (
        <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>
          IP: {device.ip_address}
        </div>
      )}
      {device.description && (
        <div style={{ fontSize: "10px", color: "#666" }}>
          {device.description}
        </div>
      )}
    </div>
  );
};

/**
 * 创建网络段标签组件
 */
export const createNetworkLabel = (
  network: NetworkSegment,
): React.ReactNode => {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "16px", marginBottom: "2px" }}>📡</div>
      <div style={{ fontWeight: "bold", fontSize: "11px" }}>{network.name}</div>
      <div style={{ fontSize: "9px", color: "#666" }}>
        {network.type.toUpperCase()} | {network.cidr}
      </div>
    </div>
  );
};

/**
 * 根据设备类型获取图标
 */
export const getDeviceIcon = (type: DeviceType): string => {
  const iconMap = {
    [DeviceType.ROUTER]: "🌐",
    [DeviceType.SWITCH_CORE]: "🔗",
    [DeviceType.SWITCH_ACCESS]: "🔗",
    [DeviceType.FIREWALL]: "🛡️",
    [DeviceType.VIRTUAL_MACHINE]: "💻",
    [DeviceType.PHYSICAL_HOST]: "🖥️",
    [DeviceType.LOAD_BALANCER]: "⚖️",
    [DeviceType.INTERFACE]: "🔌",
    [DeviceType.VM_INTERFACE]: "🔗",
  };

  return iconMap[type] || "📦";
};

/**
 * 验证拓扑数据的完整性
 */
export const validateTopologyData = (
  devices: NetworkDevice[],
  networks: NetworkSegment[],
  connections: NetworkConnection[],
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const allEntityIds = new Set([
    ...devices.map((d) => d.id),
    ...networks.map((n) => n.id),
  ]);

  // 检查连接的源和目标是否存在
  connections.forEach((conn) => {
    if (!allEntityIds.has(conn.source_id)) {
      errors.push(`连接 ${conn.id} 的源节点 ${conn.source_id} 不存在`);
    }
    if (!allEntityIds.has(conn.target_id)) {
      errors.push(`连接 ${conn.id} 的目标节点 ${conn.target_id} 不存在`);
    }
  });

  // 检查ID重复
  const allIds = [...devices.map((d) => d.id), ...networks.map((n) => n.id)];
  const duplicateIds = allIds.filter(
    (id, index) => allIds.indexOf(id) !== index,
  );
  if (duplicateIds.length > 0) {
    errors.push(`发现重复的ID: ${duplicateIds.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ======================== API数据转换函数 ========================

/**
 * 将API节点类型转换为内部设备类型
 */
export const mapApiNodeTypeToDeviceType = (apiType: string): DeviceType => {
  switch (apiType) {
    case "host":
      return DeviceType.PHYSICAL_HOST;
    case "interface":
      return DeviceType.INTERFACE;
    case "vm":
      return DeviceType.VIRTUAL_MACHINE;
    case "vm-interface":
      return DeviceType.VM_INTERFACE;
    default:
      return DeviceType.PHYSICAL_HOST;
  }
};

/**
 * 将API边类型转换为内部连接类型
 */
export const mapApiEdgeTypeToConnectionType = (
  apiType: string,
): ConnectionType => {
  switch (apiType) {
    case "interface-bond":
      return ConnectionType.INTERFACE_BOND;
    case "host-interface":
      return ConnectionType.HOST_INTERFACE;
    case "host-vm":
      return ConnectionType.HOST_VM;
    case "vm-interface":
      return ConnectionType.VM_INTERFACE;
    case "vm-bridge":
      return ConnectionType.VM_BRIDGE;
    case "vm-link":
      return ConnectionType.VM_LINK;
    default:
      return ConnectionType.LOGICAL;
  }
};

/**
 * 将API拓扑数据转换为内部拓扑数据格式
 */
export const convertApiDataToTopologyData = (
  apiData: NetworkTopologyResponse,
): TopologyData => {
  const devices: NetworkDevice[] = [];
  const networks: NetworkSegment[] = [];
  const connections: NetworkConnection[] = [];

  // 转换节点
  apiData.nodes.forEach((apiNode) => {
    const deviceType = mapApiNodeTypeToDeviceType(apiNode.type);

    let name = "";
    let ipAddress = "";
    let macAddress = "";
    let description = "";

    // 根据节点类型提取不同的数据
    switch (apiNode.type) {
      case "host": {
        const hostData = apiNode.data as unknown as Record<string, unknown>;
        name = (hostData.name as string) || apiNode.id;
        description = `接口: ${(hostData.interfaces as unknown[])?.length || 0}个`;
        break;
      }
      case "interface": {
        const interfaceData = apiNode.data as unknown as Record<
          string,
          unknown
        >;
        name = (interfaceData.device as string) || apiNode.id;
        macAddress = (interfaceData.mac as string) || "";
        ipAddress = Array.isArray(interfaceData.ip4_addresses)
          ? (interfaceData.ip4_addresses[0] as string) || ""
          : "";
        description = `${interfaceData.is_physical ? "物理" : "虚拟"}接口`;
        break;
      }
      case "vm": {
        const vmData = apiNode.data as unknown as Record<string, unknown>;
        name = (vmData.vm_name as string) || apiNode.id;
        description = `虚拟机 - ${vmData.host as string}`;
        break;
      }
      case "vm-interface": {
        const vmInterfaceData = apiNode.data as unknown as Record<
          string,
          unknown
        >;
        name = (vmInterfaceData.net_name as string) || apiNode.id;
        macAddress = (vmInterfaceData.mac as string) || "";
        ipAddress = (vmInterfaceData.ip_addr as string) || "";
        description = `${vmInterfaceData.vm_name as string} 接口`;
        break;
      }
    }

    const device: NetworkDevice = {
      id: apiNode.id,
      name,
      type: deviceType,
      status: DeviceStatus.ONLINE, // 默认在线状态
      ip_address: ipAddress,
      mac_address: macAddress,
      description,
      location: {
        x: apiNode.position.x,
        y: apiNode.position.y,
      },
    };

    devices.push(device);
  });

  // 转换边
  apiData.edges.forEach((apiEdge) => {
    const connectionType = mapApiEdgeTypeToConnectionType(apiEdge.type);

    const connection: NetworkConnection = {
      id: apiEdge.id,
      source_id: apiEdge.source_id,
      target_id: apiEdge.target_id,
      connection_type: connectionType,
      status: "up", // 默认状态
      animated: connectionType === ConnectionType.VM_LINK,
    };

    connections.push(connection);
  });

  return {
    devices,
    networks,
    connections,
  };
};

/**
 * 将API数据转换为ReactFlow格式的节点和边
 */
export const convertApiDataToReactFlowFormat = (
  apiData: NetworkTopologyResponse,
): {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
} => {
  const topologyData = convertApiDataToTopologyData(apiData);

  const nodes = convertDevicesToNodes(topologyData.devices);
  const edges = convertConnectionsToEdges(topologyData.connections);

  return { nodes, edges };
};
