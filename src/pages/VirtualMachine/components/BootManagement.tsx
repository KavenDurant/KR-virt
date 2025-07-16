/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-16 20:00:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-16 17:42:29
 * @FilePath: /KR-virt/src/pages/VirtualMachine/components/BootManagement.tsx
 * @Description: 虚拟机引导设置管理组件
 */

import React, { useState, useEffect } from "react";
import {
  Modal,
  Tabs,
  Form,
  Button,
  Space,
  Table,
  Switch,
  Tag,
  Row,
  Col,
  App,
} from "antd";
import {
  MenuOutlined,
  SettingOutlined,
  SortAscendingOutlined,
  SaveOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { vmService } from "@/services/vm";
import type { VMInfo, VMBootOrderItem } from "@/services/vm/types";

// 可拖拽的表格行组件
interface DraggableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  "data-row-key": string;
  children?: React.ReactNode;
}

const DraggableRow: React.FC<DraggableRowProps> = ({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 9999 } : {}),
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes}>
      {React.Children.map(children, (child, index) => {
        if (index === 1) {
          // 第二列显示拖拽句柄（第一列是 rowSelection 复选框）
          const childElement = child as React.ReactElement<
            React.HTMLProps<HTMLElement>
          >;
          return React.cloneElement(childElement, {
            children: (
              <HolderOutlined
                style={{
                  touchAction: "none",
                  cursor: "grab",
                  color: "#999",
                }}
                {...listeners}
              />
            ),
          });
        }
        return child;
      })}
    </tr>
  );
};

interface BootManagementProps {
  visible: boolean;
  onCancel: () => void;
  vmInfo?: VMInfo;
  onSuccess?: () => void;
}

interface GlobalBootDevice {
  key: string;
  device: string;
  label: string;
  description: string;
  priority: number;
  enabled: boolean; // 新增：是否启用该设备
}

interface PartialBootDevice {
  key: string;
  name: string;
  type: string;
  order: number;
  label: string;
  description: string;
  enabled: boolean;
}

const BootManagement: React.FC<BootManagementProps> = ({
  visible,
  onCancel,
  vmInfo,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<string>("global");
  const [globalForm] = Form.useForm();
  const [partialForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [globalBootDevices, setGlobalBootDevices] = useState<
    GlobalBootDevice[]
  >([]);
  const [partialBootDevices, setPartialBootDevices] = useState<
    PartialBootDevice[]
  >([]);
  const [devModel, setDevModel] = useState(true);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = globalBootDevices.findIndex(
        (item) => item.key === active.id
      );
      const newIndex = globalBootDevices.findIndex(
        (item) => item.key === over?.id
      );

      const newDevices = arrayMove(globalBootDevices, oldIndex, newIndex);

      // 重新分配优先级
      newDevices.forEach((device, idx) => {
        device.priority = idx + 1;
      });

      handleGlobalOrderChange(newDevices);
    }
  };

  // 全局引导设备选项
  const globalBootOptions = React.useMemo(
    () => [
      { value: "hd", label: "硬盘", description: "从硬盘启动（推荐）" },
      { value: "cdrom", label: "光驱", description: "从CD/DVD光驱启动" },
      { value: "network", label: "网络", description: "从网络PXE启动" },
      { value: "usb", label: "USB", description: "从USB设备启动" },
      { value: "floppy", label: "软盘", description: "从软盘启动（已过时）" },
    ],
    []
  );

  // 初始化数据
  const initializeData = React.useCallback(() => {
    // 获取虚拟机当前的引导顺序配置
    const currentBootOrder = vmInfo?.config?.boot || ["hd"];
    console.log("虚拟机当前引导顺序:", currentBootOrder);
    console.log("虚拟机boot_order配置:", vmInfo?.config?.boot_order);

    // 初始化全局引导设备列表 - 基于当前配置和可用选项
    const globalDevices = globalBootOptions.map((option, index) => ({
      key: option.value,
      device: option.value,
      label: option.label,
      description: option.description,
      priority: currentBootOrder.includes(option.value)
        ? currentBootOrder.indexOf(option.value) + 1
        : index + 10, // 未配置的设备排在后面
      enabled: currentBootOrder.includes(option.value), // 新增：基于当前引导顺序设置启用状态
    }));

    // 按优先级排序
    globalDevices.sort((a, b) => a.priority - b.priority);
    setGlobalBootDevices(globalDevices);

    // 初始化局部引导设备列表 - 基于 boot_order 配置
    const partialDevices: PartialBootDevice[] = [];

    // 如果有 boot_order 配置，使用它来生成设备列表
    if (vmInfo?.config?.boot_order && vmInfo.config.boot_order.length > 0) {
      vmInfo.config.boot_order.forEach(
        (bootItem: VMBootOrderItem, index: number) => {
          // 根据 order 是否为 null 来决定是否启用
          const isEnabled = bootItem.order !== null;
          const deviceOrder = isEnabled
            ? parseInt(bootItem.order as string)
            : index + 1;

          let deviceLabel = "";
          let deviceDescription = "";

          // 根据设备类型和名称生成标签和路径信息
          switch (bootItem.type) {
            case "disk": {
              // 查找对应的磁盘配置
              const diskConfig = vmInfo.config?.disk?.find(
                (d) => d.name === bootItem.name
              );
              deviceLabel = `磁盘 ${bootItem.name}`;
              deviceDescription = diskConfig?.path || "";
              break;
            }
            case "cdrom": {
              // 查找对应的光驱配置
              const cdromConfig = vmInfo.config?.cdrom?.find(
                (c) => c.name === bootItem.name
              );
              deviceLabel = `光驱 ${bootItem.name}`;
              deviceDescription = cdromConfig?.path || "";
              break;
            }
            case "net": {
              // 查找对应的网络配置
              const netConfig = vmInfo.config?.net?.find(
                (n) => n.name === bootItem.name
              );
              deviceLabel = `网络 ${bootItem.name}`;
              deviceDescription = netConfig?.bridge || "";
              break;
            }
            case "usb": {
              deviceLabel = `USB ${bootItem.name}`;
              deviceDescription = "";
              break;
            }
            default: {
              deviceLabel = `${bootItem.type} ${bootItem.name}`;
              deviceDescription = "";
              break;
            }
          }

          partialDevices.push({
            key: `${bootItem.type}_${bootItem.name}`,
            name: bootItem.name,
            type: bootItem.type,
            order: deviceOrder,
            label: deviceLabel,
            description: deviceDescription,
            enabled: isEnabled,
          });
        }
      );
    } else {
      // 如果没有 boot_order 配置，从其他配置生成默认设备列表
      let orderIndex = 1;

      // 添加磁盘设备
      if (vmInfo?.config?.disk && vmInfo.config.disk.length > 0) {
        vmInfo.config.disk.forEach((disk) => {
          partialDevices.push({
            key: `disk_${disk.name}`,
            name: disk.name,
            type: "disk",
            order: orderIndex++,
            label: `磁盘 ${disk.name}`,
            description: `${disk.format || "unknown"} 格式, ${
              disk.bus_type || "unknown"
            } 总线`,
            enabled: currentBootOrder.includes("hd"),
          });
        });
      }

      // 添加光驱设备
      if (vmInfo?.config?.cdrom && vmInfo.config.cdrom.length > 0) {
        vmInfo.config.cdrom.forEach((cdrom) => {
          partialDevices.push({
            key: `cdrom_${cdrom.name}`,
            name: cdrom.name,
            type: "cdrom",
            order: orderIndex++,
            label: `光驱 ${cdrom.name}`,
            description: cdrom.path
              ? `已挂载: ${cdrom.path.split("/").pop()}`
              : "未挂载ISO",
            enabled: currentBootOrder.includes("cdrom"),
          });
        });
      }

      // 添加网络设备
      if (vmInfo?.config?.net && vmInfo.config.net.length > 0) {
        vmInfo.config.net.forEach((net) => {
          partialDevices.push({
            key: `network_${net.name}`,
            name: net.name,
            type: "network",
            order: orderIndex++,
            label: `网络 ${net.name}`,
            description: `${net.net_type || "bridge"} 模式, MAC: ${
              net.mac || "auto"
            }`,
            enabled: currentBootOrder.includes("network"),
          });
        });
      }
    }

    // 按启动顺序排序，启用的设备在前
    partialDevices.sort((a, b) => {
      if (a.enabled && !b.enabled) return -1;
      if (!a.enabled && b.enabled) return 1;
      return a.order - b.order;
    });

    setPartialBootDevices(partialDevices);

    // 设置表单初始值
    globalForm.setFieldsValue({
      boot_devs: currentBootOrder,
    });

    partialForm.setFieldsValue({
      dev_model: true,
      devices: partialDevices,
    });
  }, [vmInfo?.config, globalForm, partialForm, globalBootOptions]);

  useEffect(() => {
    if (visible && vmInfo) {
      initializeData();
    }
  }, [visible, vmInfo, initializeData]);

  // 处理全局引导顺序改变
  const handleGlobalOrderChange = (newDevices: GlobalBootDevice[]) => {
    setGlobalBootDevices(newDevices);
    // 只包含启用的设备，按优先级排序
    const bootOrder = newDevices
      .filter((device) => device.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map((device) => device.device);
    globalForm.setFieldsValue({ boot_devs: bootOrder });
  };

  // 处理局部引导设备顺序改变
  // 处理局部引导设备变更
  const handlePartialDeviceChange = (devices: PartialBootDevice[]) => {
    // 重新计算启用设备的顺序
    const enabledDevices = devices.filter((device) => device.enabled);
    enabledDevices.sort((a, b) => a.order - b.order);

    // 为启用的设备重新分配连续的启动顺序号
    enabledDevices.forEach((device, index) => {
      device.order = index + 1;
    });

    // 更新状态
    setPartialBootDevices(devices);
    partialForm.setFieldsValue({ devices });
  };

  // 切换局部设备启用状态 - 通过 rowSelection 处理
  const handlePartialRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    const newDevices = partialBootDevices.map((device) => ({
      ...device,
      enabled: selectedRowKeys.includes(device.key),
    }));

    // 为启用的设备重新分配启动顺序
    const enabledDevices = newDevices.filter((device) => device.enabled);
    enabledDevices.forEach((device, index) => {
      device.order = index + 1;
    });

    // 为未启用的设备分配较高的顺序号
    const disabledDevices = newDevices.filter((device) => !device.enabled);
    disabledDevices.forEach((device, index) => {
      device.order = enabledDevices.length + index + 1;
    });

    handlePartialDeviceChange(newDevices);
  };

  // 处理局部引导顺序拖拽结束事件
  const handlePartialDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = partialBootDevices.findIndex(
        (item) => item.key === active.id
      );
      const newIndex = partialBootDevices.findIndex(
        (item) => item.key === over?.id
      );

      const newDevices = arrayMove(partialBootDevices, oldIndex, newIndex);

      // 重新分配启动顺序
      const enabledDevices = newDevices.filter((device) => device.enabled);
      enabledDevices.forEach((device, idx) => {
        device.order = idx + 1;
      });

      handlePartialDeviceChange(newDevices);
    }
  };

  // 切换全局设备启用状态 - 通过 rowSelection 处理
  const handleGlobalRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    const newDevices = globalBootDevices.map((device) => ({
      ...device,
      enabled: selectedRowKeys.includes(device.key),
    }));

    // 为启用的设备重新分配优先级
    const enabledDevices = newDevices.filter((device) => device.enabled);
    enabledDevices.forEach((device, index) => {
      device.priority = index + 1;
    });

    // 为未启用的设备分配较低的优先级
    const disabledDevices = newDevices.filter((device) => !device.enabled);
    disabledDevices.forEach((device, index) => {
      device.priority = enabledDevices.length + index + 1;
    });

    handleGlobalOrderChange(newDevices);
  };

  // 提交全局引导设置
  const handleGlobalBootSubmit = async () => {
    if (!vmInfo) return;

    // 从当前启用的设备生成 boot_devs 数组
    const bootDevs = globalBootDevices
      .filter((device) => device.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map((device) => device.device);

    setLoading(true);
    try {
      console.log("提交全局引导顺序:", bootDevs);
      const response = await vmService.setVMBootOrder({
        hostname: vmInfo.hostname,
        vm_name: vmInfo.vm_name,
        boot_devs: bootDevs,
      });

      if (response.success) {
        message.success("全局引导顺序设置成功");
        onSuccess?.();
        onCancel();
      } else {
        message.error(response.message || "设置失败");
      }
    } catch (error) {
      message.error("设置引导顺序时发生错误");
      console.error("设置全局引导顺序失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 提交局部引导设置
  const handlePartialBootSubmit = async (values: {
    dev_model: boolean;
    devices: PartialBootDevice[];
  }) => {
    if (!vmInfo) return;

    setLoading(true);
    try {
      const bootOrders = partialBootDevices
        .filter((device) => device.enabled)
        .map((device) => ({
          name: device.name,
          type: device.type,
          order: device.order.toString(),
        }));

      const response = await vmService.setVMBootOrderPartial({
        hostname: vmInfo.hostname,
        vm_name: vmInfo.vm_name,
        boot_orders: bootOrders,
        dev_model: values.dev_model,
      });

      if (response.success) {
        message.success("局部引导顺序设置成功");
        onSuccess?.();
        onCancel();
      } else {
        message.error(response.message || "设置失败");
      }
    } catch (error) {
      message.error("设置引导顺序时发生错误");
      console.error("设置局部引导顺序失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 全局引导设备表格列定义
  const globalColumns = [
    {
      title: "",
      dataIndex: "priority",
      key: "priority",
      width: 50,
      render: () => null, // 拖拽句柄在 DraggableRow 组件中处理
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority_display",
      width: 80,
      render: (priority: number, record: GlobalBootDevice) =>
        record.enabled ? (
          <Tag color={priority <= 3 ? "blue" : "default"}>{priority}</Tag>
        ) : (
          <Tag color="default">-</Tag>
        ),
    },
    {
      title: "设备类型",
      dataIndex: "label",
      key: "label",
      render: (label: string, record: GlobalBootDevice) => (
        <Space>
          <strong>{label}</strong>
          <span style={{ color: "#666", fontSize: "12px" }}>
            ({record.device})
          </span>
        </Space>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
    },
  ];

  // 局部引导设备表格列定义
  const partialColumns = [
    {
      title: "",
      dataIndex: "order",
      key: "drag_handle",
      width: 50,
      render: () => null, // 拖拽句柄在 DraggableRow 组件中处理
    },
    {
      title: "启动顺序",
      dataIndex: "order",
      key: "order",
      width: 120,
      render: (order: number, record: PartialBootDevice) =>
        record.enabled ? (
          <Tag color="green">#{order}</Tag>
        ) : (
          <Tag color="default">未启用</Tag>
        ),
    },
    {
      title: "设备名称",
      dataIndex: "label",
      key: "label",
      render: (label: string, record: PartialBootDevice) => (
        <Space>
          {/* <strong>{label}</strong> */}
          <span style={{ color: "#666", fontSize: "12px" }}>
            ({record.name})
          </span>
        </Space>
      ),
    },
    {
      title: "设备类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "路径",
      dataIndex: "description",
      key: "path",
      render: (path: string) =>
        path ? (
          <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
            {path}
          </span>
        ) : (
          <span style={{ color: "#999" }}>-</span>
        ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <MenuOutlined />
          <span>虚拟机引导设置</span>
          {vmInfo && (
            <Tag color="blue">
              {vmInfo.vm_name}@{vmInfo.hostname}
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnHidden
      centered
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "global",
            label: (
              <Space>
                <SortAscendingOutlined />
                全局引导顺序
              </Space>
            ),
            children: (
              <Form form={globalForm} layout="vertical">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={globalBootDevices.map((item) => item.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Table
                      dataSource={globalBootDevices}
                      columns={globalColumns}
                      pagination={false}
                      size="small"
                      rowKey="key"
                      rowSelection={{
                        type: "checkbox",
                        selectedRowKeys: globalBootDevices
                          .filter((device) => device.enabled)
                          .map((device) => device.key),
                        onChange: handleGlobalRowSelectionChange,
                        columnWidth: 50,
                        hideSelectAll: true, // 隐藏全选功能
                      }}
                      components={{
                        body: {
                          row: DraggableRow,
                        },
                      }}
                    />
                  </SortableContext>
                </DndContext>
                <div style={{ textAlign: "right", marginTop: 16 }}>
                  <Space>
                    <Button onClick={onCancel}>取消</Button>
                    <Button
                      type="primary"
                      loading={loading}
                      icon={<SaveOutlined />}
                      onClick={handleGlobalBootSubmit}
                    >
                      保存全局设置
                    </Button>
                  </Space>
                </div>
              </Form>
            ),
          },
          {
            key: "partial",
            label: (
              <Space>
                <SettingOutlined />
                局部引导顺序
              </Space>
            ),
            children: (
              <Form
                form={partialForm}
                layout="vertical"
                onFinish={handlePartialBootSubmit}
                initialValues={{ dev_model: true }}
              >
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={24}>
                    <Form.Item
                      name="dev_model"
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Switch
                        checked={devModel}
                        onChange={setDevModel}
                        checkedChildren="保留全局配置"
                        unCheckedChildren="仅使用局部配置"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handlePartialDragEnd}
                >
                  <SortableContext
                    items={partialBootDevices.map((item) => item.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Table
                      dataSource={partialBootDevices}
                      columns={partialColumns}
                      pagination={false}
                      size="small"
                      rowKey="key"
                      rowSelection={{
                        type: "checkbox",
                        selectedRowKeys: partialBootDevices
                          .filter((device) => device.enabled)
                          .map((device) => device.key),
                        onChange: handlePartialRowSelectionChange,
                        columnWidth: 50,
                        hideSelectAll: true, // 隐藏全选功能
                      }}
                      components={{
                        body: {
                          row: DraggableRow,
                        },
                      }}
                    />
                  </SortableContext>
                </DndContext>
                <div style={{ textAlign: "right", marginTop: 16 }}>
                  <Space>
                    <Button onClick={onCancel}>取消</Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<SaveOutlined />}
                    >
                      保存局部设置
                    </Button>
                  </Space>
                </div>
              </Form>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default BootManagement;
