/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群配置页面 - 创建或加入集群
 */

import React, { useState } from "react";
import {
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Alert,
  App,
} from "antd";
import {
  ClusterOutlined,
  PlusOutlined,
  LinkOutlined,
  LockOutlined,
} from "@ant-design/icons";
import type {
  CreateClusterConfig,
  JoinClusterConfig,
  ClusterConfigType,
} from "@/services/cluster/types";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ClusterConfigPageProps {
  initialType?: ClusterConfigType;
  isCreating?: boolean;
  isJoining?: boolean;
  onSubmit: (
    type: ClusterConfigType,
    config: CreateClusterConfig | JoinClusterConfig
  ) => void;
  loading?: boolean;
}

const ClusterConfigPage: React.FC<ClusterConfigPageProps> = ({
  initialType = "create",
  isCreating = false,
  isJoining = false,
  onSubmit,
  loading = false,
}) => {
  const { message } = App.useApp();
  const [configType, setConfigType] = useState<ClusterConfigType>(initialType);
  const [createForm] = Form.useForm();
  const [joinForm] = Form.useForm();

  // 根据当前状态确定默认tab
  const getDefaultActiveKey = () => {
    if (isCreating) return "create";
    if (isJoining) return "join";
    return configType;
  };

  const handleTabChange = (key: string) => {
    setConfigType(key as ClusterConfigType);
  };

  const handleCreateSubmit = async (values: CreateClusterConfig) => {
    try {
      onSubmit("create", values);
    } catch (error) {
      console.error("提交创建配置失败:", error);
      message.error("提交失败，请稍后重试");
    }
  };

  const handleJoinSubmit = async (values: JoinClusterConfig) => {
    try {
      onSubmit("join", { ...values, nodeRole: "worker" });
    } catch (error) {
      console.error("提交加入配置失败:", error);
      message.error("提交失败，请稍后重试");
    }
  };

  const renderCreateClusterForm = () => (
    <Form
      form={createForm}
      layout="vertical"
      onFinish={handleCreateSubmit}
      initialValues={{
        nodeRole: "master",
        networkInterface: "eth0",
        storageType: "local",
      }}
    >
      <Alert
        message="创建新集群"
        description="您将创建一个新的集群，此节点将作为集群的控制节点"
        type="info"
        showIcon
        style={{ marginBottom: "24px" }}
      />

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="clusterName"
            label="集群名称"
            rules={[
              { required: true, message: "请输入集群名称" },
              { min: 3, message: "集群名称至少3个字符" },
              {
                pattern: /^[a-zA-Z0-9-_]+$/,
                message: "集群名称只能包含字母、数字、连字符和下划线",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="请输入集群名称，如：production-cluster"
              prefix={<ClusterOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="nodeRole"
            label="节点角色"
            rules={[{ required: true, message: "请选择节点角色" }]}
          >
            <Select size="large" placeholder="选择节点角色">
              <Select.Option value="master">主节点 (Master)</Select.Option>
              <Select.Option value="worker">工作节点 (Worker)</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="networkInterface"
            label="网络接口"
            rules={[{ required: true, message: "请输入网络接口" }]}
          >
            <Input
              size="large"
              placeholder="如：eth0, ens33"
              prefix={<LinkOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="storageType"
            label="存储类型"
            rules={[{ required: true, message: "请选择存储类型" }]}
          >
            <Select size="large" placeholder="选择存储类型">
              <Select.Option value="local">本地存储</Select.Option>
              <Select.Option value="shared">共享存储</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="description" label="描述 (可选)">
        <TextArea
          rows={3}
          placeholder="请输入集群描述信息"
          maxLength={200}
          showCount
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          block
          icon={<PlusOutlined />}
        >
          创建集群
        </Button>
      </Form.Item>
    </Form>
  );

  const renderJoinClusterForm = () => (
    <Form
      form={joinForm}
      layout="vertical"
      onFinish={handleJoinSubmit}
      initialValues={{
        masterNodePort: 6443,
      }}
    >
      <Alert
        message="加入现有集群"
        description="您将加入一个现有的集群，请确保已从集群管理员获取必要的连接信息"
        type="warning"
        showIcon
        style={{ marginBottom: "24px" }}
      />

      <Row gutter={16}>
        <Col span={16}>
          <Form.Item
            name="masterNodeIp"
            label="主节点IP地址"
            rules={[
              { required: true, message: "请输入主节点IP地址" },
              {
                pattern:
                  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                message: "请输入有效的IP地址",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="如：192.168.1.100"
              prefix={<ClusterOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="masterNodePort"
            label="端口"
            rules={[
              { required: true, message: "请输入端口" },
              {
                type: "number",
                min: 1,
                max: 65535,
                message: "端口范围：1-65535",
              },
            ]}
          >
            <Input size="large" type="number" placeholder="6443" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="joinToken"
        label="加入令牌"
        rules={[
          { required: true, message: "请输入加入令牌" },
          { min: 10, message: "令牌长度不能少于10位" },
        ]}
      >
        <Input.Password
          size="large"
          placeholder="请输入从管理员获取的加入令牌"
          prefix={<LockOutlined />}
        />
      </Form.Item>

      <Form.Item name="description" label="描述 (可选)">
        <TextArea
          rows={3}
          placeholder="请输入节点描述信息"
          maxLength={200}
          showCount
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          block
          icon={<LinkOutlined />}
        >
          加入集群
        </Button>
      </Form.Item>
    </Form>
  );

  const tabItems = [
    {
      key: "create",
      label: (
        <Space>
          <PlusOutlined />
          创建集群
        </Space>
      ),
      children: renderCreateClusterForm(),
      disabled: isJoining,
    },
    {
      key: "join",
      label: (
        <Space>
          <LinkOutlined />
          加入集群
        </Space>
      ),
      children: renderJoinClusterForm(),
      disabled: isCreating,
    },
  ];

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 600,
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          borderRadius: "12px",
        }}
        variant="borderless"
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <ClusterOutlined
            style={{
              fontSize: "48px",
              color: "#667eea",
              marginBottom: "16px",
            }}
          />
          <Title level={2} style={{ marginBottom: "8px" }}>
            集群配置
          </Title>
          <Text type="secondary">请选择创建新集群或加入现有集群</Text>
        </div>

        <Tabs
          activeKey={getDefaultActiveKey()}
          onChange={handleTabChange}
          items={tabItems}
          centered
          size="large"
        />
      </Card>
    </div>
  );
};

export default ClusterConfigPage;
