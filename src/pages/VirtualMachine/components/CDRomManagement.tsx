/**
 * 虚拟机光驱管理组件
 *
 * 功能：
 * - 挂载ISO文件到虚拟光驱
 * - 卸载已挂载的ISO文件
 * - 显示当前光驱状态
 */

import React, { useState } from "react";
import {
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  Popconfirm,
  Tag,
  Alert,
  Typography,
  Tooltip,
} from "antd";
import {
  PlayCircleOutlined,
  ExportOutlined,
  FileImageOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { vmService } from "@/services/vm";
import type {
  VMCDRomMountRequest,
  VMCDRomUnmountRequest,
  CDRomDeviceInfo,
} from "@/services/vm/types";
import type { MessageInstance } from "antd/es/message/interface";

const { Text } = Typography;

interface CDRomManagementProps {
  vmName: string;
  hostname: string;
  cdromDevices: CDRomDeviceInfo[];
  onCDRomChange: () => void;
  message: MessageInstance;
}

interface MountCDRomModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  vmName: string;
  hostname: string;
  message: MessageInstance;
}

// 挂载ISO模态框
const MountCDRomModal: React.FC<MountCDRomModalProps> = ({
  visible,
  onCancel,
  onOk,
  vmName,
  hostname,
  message,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const request: VMCDRomMountRequest = {
        hostname,
        vm_name: vmName,
        iso_path: values.iso_path,
      };

      const response = await vmService.mountCDRom(request);
      if (response.success) {
        message.success(response.message || "ISO挂载任务已发送成功");
        form.resetFields();
        onOk();
      } else {
        message.error(response.message || "ISO挂载任务发送失败");
      }
    } catch (error) {
      console.error("挂载ISO失败:", error);
      message.error(
        (error as { message?: string }).message || "ISO挂载任务发送失败"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <FileImageOutlined />
          挂载ISO文件
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Alert
        message="ISO挂载说明"
        description="选择ISO文件路径挂载到虚拟光驱，可用于系统安装、软件安装等操作"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="iso_path"
          label="ISO文件路径"
          rules={[{ required: true, message: "请输入ISO文件的完整路径" }]}
          extra="输入服务器上ISO文件的完整路径，例如: /var/lib/libvirt/images/ubuntu-20.04.iso"
        >
          <Input
            placeholder="/var/lib/libvirt/images/example.iso"
            prefix={<FileImageOutlined />}
          />
        </Form.Item>
      </Form>

      <Alert
        message="提示"
        description="请确保ISO文件路径正确且服务器可访问。挂载前建议先停止虚拟机。"
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};

// 主组件
const CDRomManagement: React.FC<CDRomManagementProps> = ({
  vmName,
  hostname,
  cdromDevices,
  onCDRomChange,
  message,
}) => {
  const [mountModalVisible, setMountModalVisible] = useState(false);

  // 卸载ISO
  const handleUnmountCDRom = async (device: CDRomDeviceInfo) => {
    try {
      const request: VMCDRomUnmountRequest = {
        hostname,
        vm_name: vmName,
        target_dev: device.name,
        iso_path: device.iso_path,
      };

      const response = await vmService.unmountCDRom(request);
      if (response.success) {
        message.success(response.message || "ISO卸载任务已发送成功");
        onCDRomChange();
      } else {
        message.error(response.message || "ISO卸载任务发送失败");
      }
    } catch (error) {
      console.error("卸载ISO失败:", error);
      message.error(
        (error as { message?: string }).message || "ISO卸载任务发送失败"
      );
    }
  };

  const columns = [
    {
      title: "设备名",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text code>{name}</Text>,
    },
    {
      title: "总线类型",
      dataIndex: "bus_type",
      key: "bus_type",
      render: (busType: string) => (
        <Tag color="blue">{busType.toUpperCase()}</Tag>
      ),
    },
    {
      title: "挂载状态",
      dataIndex: "mounted",
      key: "mounted",
      render: (mounted: boolean) => (
        <Tag
          color={mounted ? "success" : "default"}
          icon={mounted ? <PlayCircleOutlined /> : undefined}
        >
          {mounted ? "已挂载" : "空驱"}
        </Tag>
      ),
    },
    {
      title: "ISO文件",
      dataIndex: "iso_path",
      key: "iso_path",
      render: (isoPath: string | null) =>
        isoPath ? (
          <Tooltip title={isoPath}>
            <Text ellipsis style={{ maxWidth: 200 }}>
              {isoPath.split("/").pop()}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">无</Text>
        ),
    },
    {
      title: "格式",
      dataIndex: "format",
      key: "format",
      render: (format?: string) =>
        format ? (
          <Tag color="cyan">{format.toUpperCase()}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: CDRomDeviceInfo) => (
        <Space>
          {!record.mounted ? (
            <Button
              size="small"
              type="primary"
              icon={<FileImageOutlined />}
              onClick={() => setMountModalVisible(true)}
            >
              挂载ISO
            </Button>
          ) : (
            <Popconfirm
              title="确定要卸载这个ISO吗？"
              description="卸载后光驱将变为空驱状态"
              onConfirm={() => handleUnmountCDRom(record)}
              okText="确定"
              cancelText="取消"
              icon={<WarningOutlined style={{ color: "red" }} />}
            >
              <Button size="small" danger icon={<ExportOutlined />}>
                卸载ISO
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="虚拟光驱"
      extra={
        <Space>
          <Tooltip title="挂载新的ISO文件">
            <Button
              type="primary"
              size="small"
              icon={<FileImageOutlined />}
              onClick={() => setMountModalVisible(true)}
            >
              挂载ISO
            </Button>
          </Tooltip>
        </Space>
      }
    >
      <Table
        size="small"
        dataSource={cdromDevices}
        columns={columns}
        rowKey="id"
        pagination={false}
        scroll={{ x: 600 }}
        locale={{
          emptyText: (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <FileImageOutlined
                style={{
                  fontSize: "48px",
                  color: "#d9d9d9",
                  marginBottom: "16px",
                }}
              />
              <div>暂无光驱设备</div>
              <div
                style={{ color: "#999", fontSize: "12px", marginTop: "8px" }}
              >
                虚拟机配置中未找到光驱设备
              </div>
            </div>
          ),
        }}
      />

      {/* 说明信息 */}
      <Alert
        message="光驱使用说明"
        description={
          <div>
            <p>• 挂载ISO：将ISO文件加载到虚拟光驱，可用于安装系统或软件</p>
            <p>• 卸载ISO：移除已挂载的ISO文件，光驱变为空驱状态</p>
            <p>• 建议在虚拟机停止状态下进行光驱操作</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />

      {/* 挂载ISO模态框 */}
      <MountCDRomModal
        visible={mountModalVisible}
        onCancel={() => setMountModalVisible(false)}
        onOk={() => {
          setMountModalVisible(false);
          onCDRomChange();
        }}
        vmName={vmName}
        hostname={hostname}
        message={message}
      />
    </Card>
  );
};

export default CDRomManagement;
