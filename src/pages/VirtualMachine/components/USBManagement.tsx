import React, { useState, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Alert,
  Popconfirm,
  Typography,
  Radio,
} from "antd";
import {
  UsbOutlined,
  PlusOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  DisconnectOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  ApiOutlined,
  WarningOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { vmService } from "@/services/vm";
import type {
  VMUSBMountRequest,
  VMUSBUnmountRequest,
  VMUSBUnplugRequest,
} from "@/services/vm/types";

const { Text } = Typography;

// 实际API返回的USB设备数据结构
interface VMConfigUSBDevice {
  device_id: string;
  vendor_id: string;
  product_id: string;
  bus_id: string;
}

// 扩展的USB设备信息（用于显示）
interface DisplayUSBDevice extends VMConfigUSBDevice {
  id: string;
  device_name: string;
  mounted: boolean;
  connected: boolean;
}

interface USBManagementProps {
  vmName: string;
  hostname: string;
  vmStatus: string; // 虚拟机状态：running, shutoff, paused等
  usbDevices?: VMConfigUSBDevice[]; // 使用实际API返回的数据结构
  onUSBChange?: () => void;
  message: typeof message;
  loading?: boolean; // 添加loading状态
  error?: string | null; // 添加错误状态
}

const USBManagement: React.FC<USBManagementProps> = ({
  vmName,
  hostname,
  vmStatus,
  usbDevices = [],
  onUSBChange,
  message: messageApi,
  loading: vmDataLoading = false,
  error = null,
}) => {
  const [operationLoading, setOperationLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 判断虚拟机状态
  const isVMRunning = vmStatus === "运行中" || vmStatus === "running";
  const isVMShutoff = vmStatus === "已关闭" || vmStatus === "shutoff";
  const isSpecialState = !isVMRunning && !isVMShutoff;

  // 转换API数据为显示数据
  const convertToDisplayData = (
    apiDevices: VMConfigUSBDevice[]
  ): DisplayUSBDevice[] => {
    return apiDevices.map((device, index) => ({
      ...device,
      id: device.device_id || `usb-${index}`,
      device_name: device.device_id || `USB设备 ${index + 1}`,
      mounted: true, // API返回的都是已挂载的设备
      connected: true,
    }));
  };

  // 冷卸载USB设备（虚拟机关机状态）
  const handleColdUnmountUSB = useCallback(
    async (device: DisplayUSBDevice) => {
      setOperationLoading(true);
      try {
        const request: VMUSBUnmountRequest = {
          hostname,
          vm_name: vmName,
          vendor_id: device.vendor_id,
          product_id: device.product_id,
          bus: device.bus_id,
          device: device.device_id,
        };

        const result = await vmService.unmountUSB(request);
        if (result.success) {
          messageApi.success(result.message || "USB设备冷卸载成功");
          onUSBChange?.();
        } else {
          messageApi.error(result.message || "USB设备冷卸载失败");
        }
      } catch (error) {
        console.error("USB设备冷卸载失败:", error);
        messageApi.error("USB设备冷卸载失败");
      } finally {
        setOperationLoading(false);
      }
    },
    [hostname, vmName, messageApi, onUSBChange]
  );

  // 热卸载USB设备（虚拟机运行状态）
  const handleHotUnmountUSB = useCallback(
    async (device: DisplayUSBDevice) => {
      setOperationLoading(true);
      try {
        const request: VMUSBUnplugRequest = {
          hostname,
          vm_name: vmName,
          vendor_id: device.vendor_id,
          product_id: device.product_id,
          bus: device.bus_id,
          device: device.device_id,
        };

        const result = await vmService.unplugUSB(request);
        if (result.success) {
          messageApi.success(result.message || "USB设备热卸载成功");
          onUSBChange?.();
        } else {
          messageApi.error(result.message || "USB设备热卸载失败");
        }
      } catch (error) {
        console.error("USB设备热卸载失败:", error);
        messageApi.error("USB设备热卸载失败");
      } finally {
        setOperationLoading(false);
      }
    },
    [hostname, vmName, messageApi, onUSBChange]
  );

  // 处理USB设备挂载
  const handleMountUSB = useCallback(
    async (
      values: Omit<VMUSBMountRequest, "hostname" | "vm_name">,
      isHotPlug: boolean
    ) => {
      setOperationLoading(true);
      try {
        const request = {
          hostname,
          vm_name: vmName,
          ...values,
        };

        const result = isHotPlug
          ? await vmService.plugUSB(request)
          : await vmService.mountUSB(request);

        if (result.success) {
          messageApi.success(`USB设备${isHotPlug ? "热加载" : "冷加载"}成功`);
          setModalVisible(false);
          form.resetFields();
          onUSBChange?.();
        } else {
          messageApi.error(
            result.message || `USB设备${isHotPlug ? "热加载" : "冷加载"}失败`
          );
        }
      } catch (error) {
        console.error("USB设备挂载失败:", error);
        messageApi.error("USB设备挂载失败");
      } finally {
        setOperationLoading(false);
      }
    },
    [hostname, vmName, messageApi, onUSBChange, form]
  );

  // 处理表单提交
  const handleFormSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      const { mountType, ...usbParams } = values as {
        mountType: "hot" | "cold";
      } & Omit<VMUSBMountRequest, "hostname" | "vm_name">;

      await handleMountUSB(usbParams, mountType === "hot");
    },
    [handleMountUSB]
  );

  // 获取显示数据
  const displayUSBDevices = convertToDisplayData(usbDevices);

  // USB设备表格列定义
  const columns = [
    {
      title: "USB设备信息",
      key: "device_info",
      render: (_: unknown, record: DisplayUSBDevice) => (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            <ApiOutlined style={{ marginRight: "6px", color: "#1890ff" }} />
            {record.device_name}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            <UsbOutlined style={{ marginRight: "4px", color: "#8c8c8c" }} />
            设备ID: {record.device_id}
          </div>
          <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
            <InfoCircleOutlined
              style={{ marginRight: "4px", color: "#8c8c8c" }}
            />
            厂商ID: {record.vendor_id} | 产品ID: {record.product_id}
          </div>
        </div>
      ),
    },
    {
      title: "总线信息",
      key: "bus_info",
      render: (_: unknown, record: DisplayUSBDevice) => (
        <div>
          <div>
            <LinkOutlined style={{ marginRight: "4px", color: "#8c8c8c" }} />
            总线: <Text code>{record.bus_id}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "状态",
      key: "status",
      render: () => (
        <Space direction="vertical" size={4}>
          <Tag icon={<CheckCircleOutlined />} color="success">
            已挂载
          </Tag>
          <Tag icon={<LinkOutlined />} color="processing">
            已连接
          </Tag>
        </Space>
      ),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: unknown, record: DisplayUSBDevice) => (
        <Space direction="vertical" size={4}>
          {/* 根据虚拟机状态显示不同的卸载按钮 */}
          {/* 运行状态：只显示热卸载按钮 */}
          {isVMRunning && (
            <Popconfirm
              title="确认热卸载USB设备"
              description={
                <div>
                  <p>虚拟机正在运行，将执行热卸载操作。</p>
                  <p style={{ color: "#fa8c16", fontSize: "12px" }}>
                    <WarningOutlined style={{ marginRight: "4px" }} />
                    热卸载可能会影响虚拟机中正在使用此设备的应用程序
                  </p>
                </div>
              }
              onConfirm={() => handleHotUnmountUSB(record)}
              okText="确认热卸载"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button
                size="small"
                danger
                icon={<ThunderboltOutlined />}
                loading={operationLoading}
                title="热卸载USB设备"
              >
                热卸载
              </Button>
            </Popconfirm>
          )}

          {/* 关机状态：只显示冷卸载按钮 */}
          {isVMShutoff && (
            <Popconfirm
              title="确认冷卸载USB设备"
              description={
                <div>
                  <p>虚拟机已停止，将执行冷卸载操作。</p>
                  <p style={{ color: "#52c41a", fontSize: "12px" }}>
                    <SafetyOutlined style={{ marginRight: "4px" }} />
                    冷卸载是安全操作，不会影响虚拟机运行
                  </p>
                </div>
              }
              onConfirm={() => handleColdUnmountUSB(record)}
              okText="确认冷卸载"
              cancelText="取消"
            >
              <Button
                size="small"
                danger
                icon={<DisconnectOutlined />}
                loading={operationLoading}
                title="冷卸载USB设备"
              >
                冷卸载
              </Button>
            </Popconfirm>
          )}

          {/* 特殊状态：显示两个按钮 */}
          {isSpecialState && (
            <>
              <Popconfirm
                title="确认热卸载USB设备"
                description={
                  <div>
                    <p>确定要执行热卸载操作吗？</p>
                    <p style={{ color: "#fa8c16", fontSize: "12px" }}>
                      <WarningOutlined style={{ marginRight: "4px" }} />
                      热卸载可能会影响虚拟机中正在使用此设备的应用程序
                    </p>
                  </div>
                }
                onConfirm={() => handleHotUnmountUSB(record)}
                okText="确认热卸载"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button
                  size="small"
                  danger
                  icon={<ThunderboltOutlined />}
                  loading={operationLoading}
                  title="热卸载USB设备"
                >
                  热卸载
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确认冷卸载USB设备"
                description={
                  <div>
                    <p>确定要执行冷卸载操作吗？</p>
                    <p style={{ color: "#52c41a", fontSize: "12px" }}>
                      <SafetyOutlined style={{ marginRight: "4px" }} />
                      冷卸载是安全操作，不会影响虚拟机运行
                    </p>
                  </div>
                }
                onConfirm={() => handleColdUnmountUSB(record)}
                okText="确认冷卸载"
                cancelText="取消"
              >
                <Button
                  size="small"
                  danger
                  icon={<DisconnectOutlined />}
                  loading={operationLoading}
                  title="冷卸载USB设备"
                >
                  冷卸载
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  // 渲染内容
  const renderContent = () => {
    if (vmDataLoading) {
      return (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <LoadingOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
          <div style={{ marginTop: "16px", color: "#666" }}>
            加载USB设备数据中...
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          message="获取USB设备数据失败"
          description={error}
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          action={
            <Button size="small" onClick={() => onUSBChange?.()}>
              重试
            </Button>
          }
        />
      );
    }

    if (displayUSBDevices.length === 0) {
      return (
        <Alert
          message="暂无USB设备"
          description="该虚拟机当前没有挂载USB设备。点击添加USB设备按钮可以挂载新的USB设备。"
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      );
    }

    return (
      <Table
        dataSource={displayUSBDevices}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        loading={operationLoading}
      />
    );
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <UsbOutlined style={{ fontSize: "16px", color: "#1890ff" }} />
            <span>USB设备管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<SyncOutlined spin={vmDataLoading} />}
              onClick={() => onUSBChange?.()}
              loading={vmDataLoading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
              disabled={vmDataLoading}
            >
              添加USB设备
            </Button>
          </Space>
        }
      >
        {renderContent()}
      </Card>

      {/* 添加USB设备模态框 */}
      <Modal
        title={
          <Space>
            <UsbOutlined />
            添加USB设备
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        centered
        footer={null}
        destroyOnClose
        width={700}
      >
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleFormSubmit}
          initialValues={{
            mountType: isSpecialState ? "hot" : "cold",
          }}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
        >
          {/* 状态说明提示 */}
          {isSpecialState && (
            <Alert
              message="USB设备加载方式说明"
              description={
                <div>
                  <p>
                    <ThunderboltOutlined
                      style={{ color: "#fa8c16", marginRight: "4px" }}
                    />
                    热加载：虚拟机特殊状态下动态添加USB设备，可能会影响虚拟机
                  </p>
                  <p>
                    <SafetyOutlined
                      style={{ color: "#52c41a", marginRight: "4px" }}
                    />
                    冷加载：虚拟机关机状态下添加USB设备，更安全但需要虚拟机处于关机状态
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: "24px" }}
            />
          )}

          <Form.Item
            name="mountType"
            label="加载方式"
            rules={[{ required: true, message: "请选择加载方式" }]}
          >
            <Radio.Group>
              <Space>
                {isSpecialState && (
                  <Radio value="hot">
                    <Space>
                      <ThunderboltOutlined style={{ color: "#fa8c16" }} />
                      热加载
                    </Space>
                  </Radio>
                )}
                <Radio value="cold">
                  <Space>
                    <SafetyOutlined style={{ color: "#52c41a" }} />
                    冷加载
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="设备ID"
            name="device"
            rules={[{ required: true, message: "请输入设备ID" }]}
          >
            <Input placeholder="请输入USB设备ID" />
          </Form.Item>

          <Form.Item
            label="总线ID"
            name="bus"
            rules={[{ required: true, message: "请输入总线ID" }]}
          >
            <Input placeholder="请输入USB总线ID" />
          </Form.Item>

          <Form.Item
            label="厂商ID"
            name="vendor_id"
            rules={[{ required: true, message: "请输入厂商ID" }]}
          >
            <Input placeholder="请输入USB厂商ID" />
          </Form.Item>

          <Form.Item
            label="产品ID"
            name="product_id"
            rules={[{ required: true, message: "请输入产品ID" }]}
          >
            <Input placeholder="请输入USB产品ID" />
          </Form.Item>

          <Form.Item
            style={{ marginBottom: 0, textAlign: "right" }}
            wrapperCol={{ offset: 4, span: 20 }}
          >
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={operationLoading}
              >
                确认添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default USBManagement;
