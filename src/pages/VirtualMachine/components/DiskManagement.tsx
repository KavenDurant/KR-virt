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
  Select,
  InputNumber,
  Alert,
  Popconfirm,
  Typography,
  Row,
  Col,
  Progress,
  Tooltip,
  Switch,
  App,
} from "antd";
import {
  HddOutlined,
  PlusOutlined,
  DeleteOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  FolderOutlined,
  SwapOutlined,
  PlusSquareOutlined,
} from "@ant-design/icons";
import { vmService } from "@/services/vm";
import type {
  VMDiskMountRequest,
  VMDiskUnmountRequest,
  VMDiskDeviceInfo,
  VMDiskConfig,
} from "@/services/vm/types";

const { Text } = Typography;
const { Option } = Select;

interface DiskManagementProps {
  vmName: string;
  hostname: string;
  diskDevices?: (VMDiskDeviceInfo | VMDiskConfig)[];
  onDiskChange?: () => void;
  message: ReturnType<typeof App.useApp>["message"];
  loading?: boolean; // 添加loading状态
}

// 磁盘总线类型选项
const BUS_TYPE_OPTIONS = [
  { value: "virtio", label: "VirtIO (推荐)", description: "高性能虚拟化磁盘" },
  { value: "ide", label: "IDE", description: "兼容性好，性能较低" },
  { value: "scsi", label: "SCSI", description: "适合企业级应用" },
  { value: "sata", label: "SATA", description: "模拟物理SATA接口" },
];

// 模拟磁盘设备数据接口
interface MockDiskDevice extends VMDiskDeviceInfo {
  actual_size_gb?: number;
  usage_percent?: number;
}

const DiskManagement: React.FC<DiskManagementProps> = ({
  vmName,
  hostname,
  diskDevices = [],
  onDiskChange,
  message: messageApi,
  loading: vmDataLoading = false,
}) => {
  const { modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const [migrateModalVisible, setMigrateModalVisible] = useState(false);
  const [resizeModalVisible, setResizeModalVisible] = useState(false);
  const [migrateForm] = Form.useForm();
  const [resizeForm] = Form.useForm();
  const [migrateLoading, setMigrateLoading] = useState(false);
  const [resizeLoading, setResizeLoading] = useState(false);
  const [currentDisk, setCurrentDisk] = useState<MockDiskDevice | null>(null);

  // 挂载磁盘设备
  const handleMountDisk = useCallback(
    async (values: Omit<VMDiskMountRequest, "hostname" | "vm_name">) => {
      setLoading(true);
      try {
        const request: VMDiskMountRequest = {
          hostname,
          vm_name: vmName,
          ...values,
          bus: values.bus || "virtio", // 默认使用 virtio
        };

        const result = await vmService.mountDisk(request);
        if (result.success) {
          messageApi.success(result.message || "磁盘挂载成功");
          setModalVisible(false);
          form.resetFields();
          onDiskChange?.();
        } else {
          messageApi.error(result.message || "磁盘挂载失败");
        }
      } catch (error) {
        console.error("磁盘挂载失败:", error);
        messageApi.error("磁盘挂载失败");
      } finally {
        setLoading(false);
      }
    },
    [hostname, vmName, messageApi, onDiskChange, form]
  );

  // 卸载磁盘设备
  const handleUnmountDisk = useCallback(
    async (device: VMDiskDeviceInfo, deleteDisk: boolean = false) => {
      setLoading(true);
      try {
        const request: VMDiskUnmountRequest = {
          hostname,
          vm_name: vmName,
          disk_path: device.path,
          dev: device.name,
          delete_disk: deleteDisk,
        };

        const result = await vmService.unmountDisk(request);
        if (result.success) {
          messageApi.success(result.message || "磁盘卸载成功");
          onDiskChange?.();
        } else {
          messageApi.error(result.message || "磁盘卸载失败");
        }
      } catch (error) {
        console.error("磁盘卸载失败:", error);
        messageApi.error("磁盘卸载失败");
      } finally {
        setLoading(false);
      }
    },
    [hostname, vmName, messageApi, onDiskChange]
  );

  // 处理表单提交
  const handleFormSubmit = useCallback(
    async (values: Record<string, unknown>) => {
      await handleMountDisk(
        values as Omit<VMDiskMountRequest, "hostname" | "vm_name">
      );
    },
    [handleMountDisk]
  );

  // 格式化磁盘大小显示
  const formatDiskSize = (sizeGB: number): string => {
    if (sizeGB >= 1024) {
      return `${(sizeGB / 1024).toFixed(1)} TB`;
    }
    return `${sizeGB} GB`;
  };

  // 获取磁盘类型标签颜色
  const getDiskTypeColor = (busType: string): string => {
    switch (busType.toLowerCase()) {
      case "virtio":
        return "green";
      case "scsi":
        return "blue";
      case "ide":
        return "orange";
      case "sata":
        return "purple";
      default:
        return "default";
    }
  };

  // 转换磁盘设备数据格式
  const convertDiskDevices = (): MockDiskDevice[] => {
    return diskDevices.map((device, index) => {
      // 判断是否为 VMDiskConfig 格式
      if ("bus_type" in device) {
        const diskConfig = device as VMDiskConfig;
        return {
          id: `disk-${index}`,
          name: diskConfig.name,
          path: diskConfig.path,
          size_gb: 50, // 默认大小，实际应该从API获取
          bus_type: diskConfig.bus_type,
          format: diskConfig.format,
          mounted: true,
          readonly: false,
          actual_size_gb: 30,
          usage_percent: 60,
        } as MockDiskDevice;
      } else {
        return device as VMDiskDeviceInfo;
      }
    });
  };

  // 模拟磁盘设备数据（如果没有真实数据）
  const mockDiskDevices: MockDiskDevice[] = [
    {
      id: "disk1",
      name: "vda",
      path: "/var/lib/libvirt/images/vm-system.qcow2",
      size_gb: 50,
      bus_type: "virtio",
      format: "qcow2",
      mounted: true,
      readonly: false,
      actual_size_gb: 30,
      usage_percent: 60,
    },
    {
      id: "disk2",
      name: "vdb",
      path: "/var/lib/libvirt/images/vm-data.qcow2",
      size_gb: 100,
      bus_type: "virtio",
      format: "qcow2",
      mounted: true,
      readonly: false,
      actual_size_gb: 75,
      usage_percent: 75,
    },
  ];

  const displayDiskDevices =
    diskDevices.length > 0 ? convertDiskDevices() : mockDiskDevices;

  // 磁盘设备表格列定义
  const columns = [
    {
      title: "磁盘信息",
      key: "disk_info",
      width: "200px",
      fixed: "left",
      render: (_: unknown, record: MockDiskDevice) => (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            <HddOutlined style={{ marginRight: "6px", color: "#1890ff" }} />
            {record.name}
            {record.readonly && (
              <Tag color="orange" style={{ marginLeft: "8px" }}>
                只读
              </Tag>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            格式: {record.format} | 总线: {record.bus_type}
          </div>
          <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>
            路径: {record.path}
          </div>
        </div>
      ),
    },
    {
      title: "容量信息",
      key: "capacity",
      render: (_: unknown, record: MockDiskDevice) => (
        <div>
          <div style={{ marginBottom: "8px" }}>
            <Text strong>{formatDiskSize(record.size_gb)}</Text>
            <span style={{ color: "#666", marginLeft: "8px" }}>总容量</span>
          </div>
          {record.actual_size_gb && record.usage_percent && (
            <div>
              <div style={{ fontSize: "12px", marginBottom: "4px" }}>
                已使用: {formatDiskSize(record.actual_size_gb)} (
                {record.usage_percent}%)
              </div>
              <Progress
                percent={record.usage_percent}
                size="small"
                strokeColor={
                  record.usage_percent > 80
                    ? "#ff4d4f"
                    : record.usage_percent > 60
                    ? "#faad14"
                    : "#52c41a"
                }
              />
            </div>
          )}
        </div>
      ),
    },
    {
      title: "设备类型",
      key: "type",
      render: (_: unknown, record: MockDiskDevice) => (
        <Space direction="vertical" size={4}>
          <Tag color={getDiskTypeColor(record.bus_type)}>
            {record.bus_type.toUpperCase()}
          </Tag>
          <Tag color="blue">{record.format}</Tag>
          <Tag
            icon={
              record.mounted ? (
                <CheckCircleOutlined />
              ) : (
                <ExclamationCircleOutlined />
              )
            }
            color={record.mounted ? "success" : "default"}
          >
            {record.mounted ? "已挂载" : "未挂载"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: "320px",
      fixed: "right",
      render: (_: unknown, record: MockDiskDevice) => (
        <Space direction="horizontal" size={4}>
          <Popconfirm
            title="确认卸载磁盘"
            description={
              <div>
                <div>卸载后虚拟机将无法访问此磁盘</div>
                <div style={{ marginTop: "8px" }}>
                  <Switch
                    size="small"
                    onChange={() => {
                      // 可以保存用户选择，在确认时使用
                    }}
                  />{" "}
                  <span style={{ fontSize: "12px" }}>同时删除磁盘文件</span>
                </div>
              </div>
            }
            onConfirm={() => handleUnmountDisk(record, false)} // 根据用户选择决定是否删除文件
            okText="确认卸载"
            cancelText="取消"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={loading}
            >
              卸载磁盘
            </Button>
          </Popconfirm>
          <Tooltip title="查看磁盘详细信息">
            <Button
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                modal.info({
                  title: `磁盘详情 - ${record.name}`,
                  width: 600,
                  content: (
                    <div style={{ marginTop: "16px" }}>
                      <Row gutter={[16, 8]}>
                        <Col span={8}>
                          <Text strong>设备名:</Text>
                        </Col>
                        <Col span={16}>{record.name}</Col>

                        <Col span={8}>
                          <Text strong>文件路径:</Text>
                        </Col>
                        <Col span={16}>
                          <Text copyable style={{ fontSize: "12px" }}>
                            {record.path}
                          </Text>
                        </Col>

                        <Col span={8}>
                          <Text strong>总容量:</Text>
                        </Col>
                        <Col span={16}>{formatDiskSize(record.size_gb)}</Col>

                        <Col span={8}>
                          <Text strong>已使用:</Text>
                        </Col>
                        <Col span={16}>
                          {record.actual_size_gb
                            ? formatDiskSize(record.actual_size_gb)
                            : "N/A"}
                        </Col>

                        <Col span={8}>
                          <Text strong>总线类型:</Text>
                        </Col>
                        <Col span={16}>{record.bus_type}</Col>

                        <Col span={8}>
                          <Text strong>磁盘格式:</Text>
                        </Col>
                        <Col span={16}>{record.format}</Col>

                        <Col span={8}>
                          <Text strong>只读模式:</Text>
                        </Col>
                        <Col span={16}>{record.readonly ? "是" : "否"}</Col>

                        <Col span={8}>
                          <Text strong>挂载状态:</Text>
                        </Col>
                        <Col span={16}>
                          <Tag color={record.mounted ? "success" : "default"}>
                            {record.mounted ? "已挂载" : "未挂载"}
                          </Tag>
                        </Col>
                      </Row>
                    </div>
                  ),
                });
              }}
            >
              详情
            </Button>
          </Tooltip>

          {/* 迁移按钮 */}
          <Tooltip title="迁移磁盘到其他目录">
            <Button
              size="small"
              icon={<SwapOutlined />}
              onClick={() => {
                setCurrentDisk(record);
                migrateForm.setFieldsValue({
                  target_dir: "",
                  disk_path: record.path,
                  dev: record.name,
                });
                setMigrateModalVisible(true);
              }}
            >
              迁移
            </Button>
          </Tooltip>

          {/* 扩容按钮 */}
          <Tooltip title="扩容磁盘容量">
            <Button
              size="small"
              icon={<PlusSquareOutlined />}
              onClick={() => {
                setCurrentDisk(record);
                resizeForm.setFieldsValue({
                  new_size_gb: record.size_gb,
                  disk_path: record.path,
                  dev: record.name,
                });
                setResizeModalVisible(true);
              }}
            >
              扩容
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>磁盘设备管理</span>
            <Tag color="blue">{displayDiskDevices.length} 个磁盘</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<SyncOutlined />}
              onClick={() => onDiskChange?.()}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              添加磁盘
            </Button>
          </Space>
        }
      >
        {displayDiskDevices.length === 0 ? (
          <Alert
            message="暂无磁盘设备"
            description="点击添加磁盘按钮为虚拟机创建新的磁盘设备"
            type="info"
            showIcon
          />
        ) : (
          <Table
            dataSource={displayDiskDevices}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            loading={vmDataLoading || loading}
            scroll={{ x: 1200 }}
            style={{ minWidth: "100%" }}
          />
        )}
      </Card>

      {/* 添加磁盘设备模态框 */}
      <Modal
        title="添加磁盘设备"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Alert
          message="磁盘设备创建说明"
          description="为虚拟机创建新的磁盘设备。磁盘将作为独立文件存储，可以随时挂载或卸载。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          autoComplete="off"
          initialValues={{
            bus: "virtio",
            disk_size_gb: 20,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="磁盘目录"
                name="disk_dir"
                rules={[{ required: true, message: "请输入磁盘存储目录" }]}
                extra="磁盘文件存储的目录路径"
              >
                <Input
                  placeholder="/var/lib/libvirt/images"
                  prefix={<FolderOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="磁盘文件名"
                name="disk_name"
                rules={[
                  { required: true, message: "请输入磁盘文件名" },
                  {
                    pattern: /^[a-zA-Z0-9_-]+$/,
                    message: "文件名只能包含字母、数字、下划线和连字符",
                  },
                ]}
                extra="不包含扩展名，系统会自动添加.qcow2"
              >
                <Input placeholder="vm-data-disk" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="磁盘大小"
                name="disk_size_gb"
                rules={[
                  { required: true, message: "请输入磁盘大小" },
                  {
                    type: "number",
                    min: 1,
                    max: 2048,
                    message: "磁盘大小必须在1-2048GB之间",
                  },
                ]}
                extra="单位：GB，建议最小20GB"
              >
                <InputNumber
                  min={1}
                  max={2048}
                  step={1}
                  style={{ width: "100%" }}
                  placeholder="20"
                  addonAfter="GB"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="总线类型"
                name="bus"
                rules={[{ required: true, message: "请选择总线类型" }]}
                extra="推荐使用VirtIO获得最佳性能"
              >
                <Select placeholder="选择总线类型">
                  {BUS_TYPE_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div>{option.label}</div> &nbsp;&nbsp;
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {option.description}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建磁盘
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 迁移磁盘弹窗 */}
      <Modal
        title="迁移磁盘"
        open={migrateModalVisible}
        onCancel={() => setMigrateModalVisible(false)}
        onOk={async () => {
          try {
            const values = await migrateForm.validateFields();
            setMigrateLoading(true);
            const res = await vmService.migrateVMDisk({
              hostname: hostname,
              vm_name: vmName,
              target_dir: values.target_dir,
              disk_path: currentDisk?.path,
              dev: currentDisk?.name,
            });
            messageApi.success(res.data?.message || res.message);
            setMigrateModalVisible(false);
            // 刷新磁盘列表
            onDiskChange?.();
          } catch (err: unknown) {
            messageApi.error(err instanceof Error ? err.message : "未知错误");
          } finally {
            setMigrateLoading(false);
          }
        }}
        confirmLoading={migrateLoading}
        destroyOnHidden
      >
        <Form form={migrateForm} layout="vertical">
          <Form.Item
            name="target_dir"
            label="目标目录"
            rules={[{ required: true, message: "请输入迁移目标目录" }]}
          >
            <Input placeholder="请输入本地文件夹或存储目录" />
          </Form.Item>
          <Form.Item label="磁盘路径">
            <Input value={currentDisk?.path} disabled />
          </Form.Item>
          <Form.Item label="设备名">
            <Input value={currentDisk?.name} disabled />
          </Form.Item>
        </Form>
      </Modal>

      {/* 扩容磁盘弹窗 */}
      <Modal
        title="扩容磁盘"
        open={resizeModalVisible}
        onCancel={() => setResizeModalVisible(false)}
        onOk={async () => {
          try {
            const values = await resizeForm.validateFields();
            setResizeLoading(true);
            const res = await vmService.resizeVMDisk({
              hostname: hostname,
              vm_name: vmName,
              new_size_gb: values.new_size_gb,
              disk_path: currentDisk?.path,
              dev: currentDisk?.name,
            });
            messageApi.success(res.data?.message || res.message);
            setResizeModalVisible(false);
            // 刷新磁盘列表
            onDiskChange?.();
          } catch (err: unknown) {
            messageApi.error(err instanceof Error ? err.message : "未知错误");
          } finally {
            setResizeLoading(false);
          }
        }}
        confirmLoading={resizeLoading}
        destroyOnHidden
      >
        <Form form={resizeForm} layout="vertical">
          <Form.Item
            name="new_size_gb"
            label="扩容到(GB)"
            rules={[
              { required: true, message: "请输入扩容后的容量" },
              {
                type: "number",
                min: (currentDisk?.size_gb || 1) + 1,
                message: `必须大于当前容量(${currentDisk?.size_gb || 1}GB)`,
              },
            ]}
          >
            <InputNumber
              min={(currentDisk?.size_gb || 1) + 1}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="磁盘路径">
            <Input value={currentDisk?.path} disabled />
          </Form.Item>
          <Form.Item label="设备名">
            <Input value={currentDisk?.name} disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DiskManagement;
