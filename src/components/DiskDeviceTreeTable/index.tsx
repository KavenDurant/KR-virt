import React, { useMemo } from "react";
import { Table, Tag, Progress, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { HddOutlined, FolderOutlined, FileOutlined } from "@ant-design/icons";
import type { NodeDiskDeviceActual } from "@/services/cluster/types";

const { Text } = Typography;

// 扩展的磁盘设备接口，用于树形表格
interface DiskDeviceTreeNode extends NodeDiskDeviceActual {
  key: string;
  children?: DiskDeviceTreeNode[];
  level?: number; // 层级深度，用于样式控制
}

interface DiskDeviceTreeTableProps {
  devices: NodeDiskDeviceActual[];
  loading?: boolean;
}

/**
 * 磁盘设备分层树表组件
 *
 * 功能特性：
 * 1. 将平面的磁盘设备数据转换为树形结构
 * 2. 基于parent字段建立父子关系
 * 3. 支持展开/折叠功能
 * 4. 保持原有的设备信息显示
 * 5. 遵循项目现有的样式约定
 */
const DiskDeviceTreeTable: React.FC<DiskDeviceTreeTableProps> = ({
  devices,
  loading = false,
}) => {
  // 将平面数据转换为树形结构
  const treeData = useMemo(() => {
    if (!devices || devices.length === 0) {
      return [];
    }

    // 创建设备映射表
    const deviceMap = new Map<string, DiskDeviceTreeNode>();
    const rootDevices: DiskDeviceTreeNode[] = [];

    // 第一步：创建所有节点
    devices.forEach((device, index) => {
      const node: DiskDeviceTreeNode = {
        ...device,
        key: device.name || `device-${index}`,
        children: [],
        level: 0,
      };
      deviceMap.set(device.name, node);
    });

    // 第二步：建立父子关系
    devices.forEach((device) => {
      const currentNode = deviceMap.get(device.name);
      if (!currentNode) return;

      if (
        device.parent &&
        device.parent.trim() !== "" &&
        device.parent !== "null"
      ) {
        // 有父设备，添加到父设备的children中
        const parentNode = deviceMap.get(device.parent);
        if (parentNode) {
          currentNode.level = (parentNode.level || 0) + 1;
          parentNode.children = parentNode.children || [];
          parentNode.children.push(currentNode);
        } else {
          // 父设备不存在，作为根节点
          console.warn(
            `父设备 ${device.parent} 不存在，将 ${device.name} 作为根节点`
          );
          rootDevices.push(currentNode);
        }
      } else {
        // 没有父设备，作为根节点
        rootDevices.push(currentNode);
      }
    });

    // 第三步：对每个层级的设备进行排序
    const sortDevices = (devices: DiskDeviceTreeNode[]) => {
      devices.sort((a, b) => {
        // 按设备类型排序：disk > part > rom
        const typeOrder = { disk: 0, part: 1, rom: 2 };
        const aOrder = typeOrder[a.device_type] ?? 3;
        const bOrder = typeOrder[b.device_type] ?? 3;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        // 同类型按名称排序（自然排序，处理数字）
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });

      // 递归排序子设备
      devices.forEach((device) => {
        if (device.children && device.children.length > 0) {
          sortDevices(device.children);
        }
      });
    };

    sortDevices(rootDevices);

    // 第四步：清理空的children数组
    const cleanEmptyChildren = (devices: DiskDeviceTreeNode[]) => {
      devices.forEach((device) => {
        if (device.children && device.children.length === 0) {
          delete device.children;
        } else if (device.children && device.children.length > 0) {
          cleanEmptyChildren(device.children);
        }
      });
    };

    cleanEmptyChildren(rootDevices);
    return rootDevices;
  }, [devices]);

  // 获取设备类型图标
  const getDeviceIcon = (deviceType: string, hasChildren: boolean) => {
    if (hasChildren) {
      return <FolderOutlined style={{ color: "#1890ff" }} />;
    }

    switch (deviceType) {
      case "disk":
        return <HddOutlined style={{ color: "#52c41a" }} />;
      case "part":
        return <FileOutlined style={{ color: "#faad14" }} />;
      case "rom":
        return <FileOutlined style={{ color: "#722ed1" }} />;
      default:
        return <FileOutlined style={{ color: "#8c8c8c" }} />;
    }
  };

  // 获取设备类型标签颜色
  const getDeviceTypeColor = (deviceType: string) => {
    switch (deviceType) {
      case "disk":
        return "green";
      case "part":
        return "orange";
      case "rom":
        return "purple";
      default:
        return "default";
    }
  };

  // 获取使用率进度条颜色
  const getUsageColor = (percentage: number) => {
    if (percentage > 80) return "#ff4d4f"; // 红色：危险
    if (percentage > 60) return "#faad14"; // 橙色：警告
    return "#52c41a"; // 绿色：正常
  };

  // 表格列定义
  const columns: ColumnsType<DiskDeviceTreeNode> = [
    {
      title: "设备名称",
      dataIndex: "name",
      key: "name",
      width: "26%",
      render: (name: string, record: DiskDeviceTreeNode) => {
        const hasChildren = !!(record.children && record.children.length > 0);

        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            {getDeviceIcon(record.device_type, hasChildren)}
            <Tag color="blue" style={{ marginLeft: "8px" }}>
              {name}
            </Tag>
            {record.major_minor && (
              <Text
                style={{ marginLeft: "8px", fontSize: "11px", color: "#999" }}
              >
                ({record.major_minor})
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "大小",
      dataIndex: "size_gb",
      key: "size_gb",
      width: "12%",
      render: (size: number) => (
        <Text>{size > 0 ? `${size.toFixed(2)} GB` : "-"}</Text>
      ),
    },
    {
      title: "类型",
      dataIndex: "device_type",
      key: "device_type",
      width: "15%",
      render: (type: string, record: DiskDeviceTreeNode) => (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            alignItems: "center",
          }}
        >
          <Tag color={getDeviceTypeColor(type)}>{type.toUpperCase()}</Tag>
          {record.read_only && (
            <Tag color="red" style={{ fontSize: "10px", padding: "0 4px" }}>
              只读
            </Tag>
          )}
          {record.removable && (
            <Tag color="orange" style={{ fontSize: "10px", padding: "0 4px" }}>
              可移动
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "挂载点",
      dataIndex: "mount_point",
      key: "mount_point",
      width: "15%",
      render: (mountPoint: string) => (
        <Text
          code={!!mountPoint}
          style={{
            fontSize: "12px",
            lineHeight: "20px",
            display: "inline-block",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={mountPoint || "-"}
        >
          {mountPoint || "-"}
        </Text>
      ),
    },
    {
      title: "使用率",
      key: "usage",
      width: "20%",
      render: (_, record: DiskDeviceTreeNode) => {
        if (record.total_size_gb <= 0 || record.percentage_value <= 0) {
          return (
            <div
              style={{ height: "32px", display: "flex", alignItems: "center" }}
            >
              <Text style={{ color: "#999" }}>-</Text>
            </div>
          );
        }

        return (
          <div
            style={{
              height: "32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                lineHeight: "14px",
                marginBottom: "2px",
              }}
            >
              <Text style={{ color: "#666" }}>
                {record.used_size_gb.toFixed(1)}GB /{" "}
                {record.total_size_gb.toFixed(1)}GB
              </Text>
            </div>
            <Progress
              percent={Math.round(record.percentage_value)}
              strokeColor={getUsageColor(record.percentage_value)}
              size="small"
              format={(percent) => `${percent}%`}
              style={{ margin: 0 }}
            />
          </div>
        );
      },
    },
    {
      title: "文件系统",
      dataIndex: "filesystem",
      key: "filesystem",
      width: "12%",
      render: (filesystem: string) => (
        <div style={{ height: "32px", display: "flex", alignItems: "center" }}>
          {filesystem ? (
            <Tag
              color="cyan"
              style={{
                fontSize: "11px",
                lineHeight: "16px",
                margin: 0,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={filesystem}
            >
              {filesystem}
            </Tag>
          ) : (
            <Text style={{ color: "#999" }}>-</Text>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table<DiskDeviceTreeNode>
      columns={columns}
      dataSource={treeData}
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      size="small"
      scroll={{ x: 800 }}
      expandable={{
        defaultExpandAllRows: true, // 默认展开所有行
        indentSize: 20, // 设置缩进大小
        childrenColumnName: "children", // 指定子节点字段名
      }}
      rowKey="key"
      style={
        {
          // 自定义表格样式
          "--table-row-height": "40px",
        } as React.CSSProperties
      }
      className="disk-device-tree-table"
    />
  );
};

export default DiskDeviceTreeTable;
