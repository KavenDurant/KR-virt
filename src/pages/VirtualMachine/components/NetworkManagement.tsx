/**
 * 虚拟机网络管理组件
 *
 * 功能：
 * - 添加普通桥接网卡
 * - 添加NAT网络
 * - 添加VLAN网卡
 * - 移除网卡
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
  Select,
  Radio,
  InputNumber,
  Popconfirm,
  Tag,
  Alert,
  Divider,
  Row,
  Col,
  Tooltip,
} from "antd";
import type { MessageInstance } from "antd/es/message/interface";
import {
  DeleteOutlined,
  WifiOutlined,
  GlobalOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { vmService } from "@/services/vm";
import type {
  VMNetworkMountRequest,
  VMNATMountRequest,
  VMVLANMountRequest,
  VMNetworkUnmountRequest,
  NetworkDeviceInfo,
} from "@/services/vm/types";

interface NetworkManagementProps {
  vmName: string;
  hostname: string;
  networkDevices: NetworkDeviceInfo[];
  onNetworkChange: () => void;
  message: MessageInstance;
}

interface AddNetworkModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  vmName: string;
  hostname: string;
  message: MessageInstance;
}

// 添加普通桥接网卡模态框
const AddBridgeNetworkModal: React.FC<AddNetworkModalProps> = ({
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

      const request: VMNetworkMountRequest = {
        hostname,
        vm_name: vmName,
        net_name: values.net_name,
        model: values.model || "virtio",
        mac_addr: values.mac_addr || null,
      };

      const response = await vmService.mountNetwork(request);
      if (response.success) {
        message.success(response.message || "网卡添加任务已发送成功");
        form.resetFields();
        onOk();
      } else {
        message.error(response.message || "网卡添加任务发送失败");
      }
    } catch (error) {
      console.error("添加网卡失败:", error);
      message.error(
        (error as { message?: string }).message || "网卡添加任务发送失败"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <WifiOutlined />
          添加桥接网卡
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={500}
    >
      <Alert
        message="桥接网络说明"
        description="桥接网卡直接连接到物理网络，虚拟机将获得与主机相同网段的IP地址"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="net_name"
          label="网桥名称"
          rules={[{ required: true, message: "请输入网桥名称" }]}
        >
          <Input placeholder="例如: vmbr0" />
        </Form.Item>

        <Form.Item name="model" label="网卡型号" initialValue="virtio">
          <Select>
            <Select.Option value="virtio">virtio (推荐)</Select.Option>
            <Select.Option value="e1000">e1000</Select.Option>
            <Select.Option value="rtl8139">rtl8139</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="mac_addr" label="MAC地址" extra="留空则自动生成">
          <Input placeholder="例如: 52:54:00:12:34:56" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// 添加NAT网络模态框
const AddNATNetworkModal: React.FC<AddNetworkModalProps> = ({
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

      const request: VMNATMountRequest = {
        hostname,
        vm_name: vmName,
        net_name: values.net_name,
        bridge_name: values.bridge_name || null,
        ip_addr: values.ip_addr,
        netmask: values.netmask,
        dhcp_start: values.dhcp_start,
        dhcp_end: values.dhcp_end,
      };

      const response = await vmService.mountNAT(request);
      if (response.success) {
        message.success(response.message || "NAT网络添加任务已发送成功");
        form.resetFields();
        onOk();
      } else {
        message.error(response.message || "NAT网络添加任务发送失败");
      }
    } catch (error) {
      console.error("添加NAT网络失败:", error);
      message.error(
        (error as { message?: string }).message || "NAT网络添加任务发送失败"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <GlobalOutlined />
          添加NAT网络
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Alert
        message="NAT网络说明"
        description="NAT网络提供网络地址转换功能，虚拟机可以访问外网，但外网无法直接访问虚拟机"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="net_name"
              label="网络名称"
              rules={[{ required: true, message: "请输入网络名称" }]}
            >
              <Input placeholder="例如: nat1" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="bridge_name" label="网桥名称">
              <Input placeholder="留空则自动生成" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="ip_addr"
              label="网关IP地址"
              rules={[{ required: true, message: "请输入网关IP地址" }]}
              initialValue="192.168.100.1"
            >
              <Input placeholder="192.168.100.1" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="netmask"
              label="子网掩码"
              rules={[{ required: true, message: "请输入子网掩码" }]}
              initialValue="255.255.255.0"
            >
              <Input placeholder="255.255.255.0" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>DHCP 配置</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="dhcp_start"
              label="DHCP起始IP"
              rules={[{ required: true, message: "请输入DHCP起始IP" }]}
              initialValue="192.168.100.100"
            >
              <Input placeholder="192.168.100.100" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dhcp_end"
              label="DHCP结束IP"
              rules={[{ required: true, message: "请输入DHCP结束IP" }]}
              initialValue="192.168.100.200"
            >
              <Input placeholder="192.168.100.200" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

// 添加VLAN网卡模态框
const AddVLANNetworkModal: React.FC<AddNetworkModalProps> = ({
  visible,
  onCancel,
  onOk,
  vmName,
  hostname,
  message,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [vlanMode, setVlanMode] = useState<"isolated" | "bridge">("isolated");

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const request: VMVLANMountRequest = {
        hostname,
        vm_name: vmName,
        net_name: values.net_name,
        forward: vlanMode,
        vlan_id: vlanMode === "bridge" ? values.vlan_id : null,
        // 暂时移除 ip_addr 参数，因为后端不支持
        // ip_addr: vlanMode === 'isolated' ? values.ip_addr : null,
        netmask: vlanMode === "isolated" ? values.netmask : null,
        dhcp_start: vlanMode === "isolated" ? values.dhcp_start : null,
        dhcp_end: vlanMode === "isolated" ? values.dhcp_end : null,
      };

      const response = await vmService.mountVLAN(request);
      if (response.success) {
        message.success(response.message || "VLAN网络添加任务已发送成功");
        form.resetFields();
        onOk();
      } else {
        message.error(response.message || "VLAN网络添加任务发送失败");
      }
    } catch (error) {
      console.error("添加VLAN网络失败:", error);
      message.error("VLAN网络添加任务发送失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <LinkOutlined />
          添加VLAN网卡
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={650}
    >
      <Alert
        message="VLAN网络说明"
        description="VLAN网络提供虚拟局域网功能，可以隔离或桥接不同的网络段"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="net_name"
          label="VLAN网络名称"
          rules={[{ required: true, message: "请输入VLAN网络名称" }]}
        >
          <Input placeholder="例如: vlan1" />
        </Form.Item>

        <Form.Item label="VLAN模式">
          <Radio.Group
            value={vlanMode}
            onChange={(e) => setVlanMode(e.target.value)}
          >
            <Radio.Button value="isolated">
              <Space>
                隔离模式
                <Tooltip title="创建独立的虚拟网络，包含DHCP服务">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            </Radio.Button>
            <Radio.Button value="bridge">
              <Space>
                桥接模式
                <Tooltip title="桥接到现有VLAN">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {vlanMode === "bridge" && (
          <Form.Item
            name="vlan_id"
            label="VLAN ID"
            rules={[{ required: true, message: "请输入VLAN ID" }]}
          >
            <InputNumber
              min={1}
              max={4094}
              placeholder="1-4094"
              style={{ width: "100%" }}
            />
          </Form.Item>
        )}

        {vlanMode === "isolated" && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="ip_addr"
                  label="网关IP地址"
                  rules={[{ required: true, message: "请输入网关IP地址" }]}
                  initialValue="192.168.101.1"
                >
                  <Input placeholder="192.168.101.1" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="netmask"
                  label="子网掩码"
                  rules={[{ required: true, message: "请输入子网掩码" }]}
                  initialValue="255.255.255.0"
                >
                  <Input placeholder="255.255.255.0" />
                </Form.Item>
              </Col>
            </Row>

            <Divider>DHCP 配置</Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="dhcp_start"
                  label="DHCP起始IP"
                  rules={[{ required: true, message: "请输入DHCP起始IP" }]}
                  initialValue="192.168.101.100"
                >
                  <Input placeholder="192.168.101.100" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="dhcp_end"
                  label="DHCP结束IP"
                  rules={[{ required: true, message: "请输入DHCP结束IP" }]}
                  initialValue="192.168.101.200"
                >
                  <Input placeholder="192.168.101.200" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Form>
    </Modal>
  );
};

// 主组件
const NetworkManagement: React.FC<NetworkManagementProps> = ({
  vmName,
  hostname,
  networkDevices,
  onNetworkChange,
  message,
}) => {
  const [bridgeModalVisible, setBridgeModalVisible] = useState(false);
  const [natModalVisible, setNatModalVisible] = useState(false);
  const [vlanModalVisible, setVlanModalVisible] = useState(false);

  // 移除网卡
  const handleRemoveNetwork = async (device: NetworkDeviceInfo) => {
    try {
      const request: VMNetworkUnmountRequest = {
        hostname,
        vm_name: vmName,
        net_name: device.bridge,
        mac: device.mac,
      };

      const response = await vmService.unmountNetwork(request);
      if (response.success) {
        message.success(response.message || "网卡移除任务已发送成功");
        onNetworkChange();
      } else {
        message.error(response.message || "网卡移除任务发送失败");
      }
    } catch (error) {
      console.error("移除网卡失败:", error);
      message.error("网卡移除任务发送失败");
    }
  };

  const columns = [
    {
      title: "设备名",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const typeConfig = {
          bridge: { color: "blue", text: "桥接" },
          nat: { color: "green", text: "NAT" },
          vlan: { color: "orange", text: "VLAN" },
        };
        const config = typeConfig[type as keyof typeof typeConfig] || {
          color: "default",
          text: type,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "型号",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "网桥",
      dataIndex: "bridge",
      key: "bridge",
      render: (bridge: string) => <Tag color="green">{bridge}</Tag>,
    },
    {
      title: "MAC地址",
      dataIndex: "mac",
      key: "mac",
      render: (mac: string) => <code style={{ fontSize: "12px" }}>{mac}</code>,
    },
    {
      title: "VLAN ID",
      dataIndex: "vlan_id",
      key: "vlan_id",
      render: (vlanId?: number) =>
        vlanId ? <Tag color="purple">{vlanId}</Tag> : "-",
    },
    {
      title: "状态",
      dataIndex: "enabled",
      key: "enabled",
      render: (enabled: boolean) => (
        <Tag color={enabled ? "success" : "default"}>
          {enabled ? "启用" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: NetworkDeviceInfo) => (
        <Popconfirm
          title="确定要移除这个网卡吗？"
          description="移除后虚拟机将失去此网络连接"
          onConfirm={() => handleRemoveNetwork(record)}
          okText="确定"
          cancelText="取消"
          icon={<WarningOutlined style={{ color: "red" }} />}
        >
          <Button size="small" danger icon={<DeleteOutlined />}>
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title="网络适配器"
      extra={
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<WifiOutlined />}
            onClick={() => setBridgeModalVisible(true)}
          >
            添加桥接网卡
          </Button>
          <Button
            size="small"
            icon={<GlobalOutlined />}
            onClick={() => setNatModalVisible(true)}
          >
            添加NAT网络
          </Button>
          <Button
            size="small"
            icon={<LinkOutlined />}
            onClick={() => setVlanModalVisible(true)}
          >
            添加VLAN网卡
          </Button>
        </Space>
      }
    >
      <Table
        size="small"
        dataSource={networkDevices}
        columns={columns}
        rowKey="id"
        pagination={false}
        scroll={{ x: 800 }}
      />

      {/* 添加桥接网卡模态框 */}
      <AddBridgeNetworkModal
        visible={bridgeModalVisible}
        onCancel={() => setBridgeModalVisible(false)}
        onOk={() => {
          setBridgeModalVisible(false);
          onNetworkChange();
        }}
        vmName={vmName}
        hostname={hostname}
        message={message}
      />

      {/* 添加NAT网络模态框 */}
      <AddNATNetworkModal
        visible={natModalVisible}
        onCancel={() => setNatModalVisible(false)}
        onOk={() => {
          setNatModalVisible(false);
          onNetworkChange();
        }}
        vmName={vmName}
        hostname={hostname}
        message={message}
      />

      {/* 添加VLAN网卡模态框 */}
      <AddVLANNetworkModal
        visible={vlanModalVisible}
        onCancel={() => setVlanModalVisible(false)}
        onOk={() => {
          setVlanModalVisible(false);
          onNetworkChange();
        }}
        vmName={vmName}
        hostname={hostname}
        message={message}
      />
    </Card>
  );
};

export default NetworkManagement;
