/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群配置页面 - 创建或加入集群
 */

import React, { useState, useEffect } from "react";
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
  Spin,
} from "antd";
import {
  ClusterOutlined,
  PlusOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { clusterInitService } from "@/services/cluster";
import type {
  CreateClusterConfig,
  JoinClusterConfig,
  ClusterConfigType,
} from "@/services/cluster/types";

const { Title, Text } = Typography;

interface ClusterConfigPageProps {
  initialType?: ClusterConfigType;
  isCreating?: boolean;
  isJoining?: boolean;
  onSubmit: (
    type: ClusterConfigType,
    config: CreateClusterConfig | JoinClusterConfig,
    additionalData?: { hostname?: string }
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
  
  // 节点信息状态
  const [nodeInfo, setNodeInfo] = useState({
    hostname: "",
    ipAddresses: [] as string[],
    selectedIp: "",
    loading: true,
  });

  // 获取节点信息
  useEffect(() => {
    const fetchNodeInfo = async () => {
      try {
        setNodeInfo(prev => ({ ...prev, loading: true }));

        // 并行获取主机名和IP地址
        const [hostnameResult, ipResult] = await Promise.all([
          clusterInitService.getNodeHostname(),
          clusterInitService.getNodeIpAddresses(),
        ]);

        let hostname = "";
        let ipAddresses: string[] = [];

        if (hostnameResult.success && hostnameResult.hostname) {
          hostname = hostnameResult.hostname;
        } else {
          message.warning(hostnameResult.message);
        }

        if (ipResult.success && ipResult.ipAddresses) {
          ipAddresses = ipResult.ipAddresses;
        } else {
          message.warning(ipResult.message);
        }

        setNodeInfo({
          hostname,
          ipAddresses,
          selectedIp: ipAddresses[0] || "", // 默认选择第一个IP
          loading: false,
        });

        // 更新表单的初始值
        createForm.setFieldsValue({
          selectedIp: ipAddresses[0] || "",
        });

      } catch (error) {
        console.error("获取节点信息失败:", error);
        message.error("获取节点信息失败，请稍后重试");
        setNodeInfo(prev => ({ ...prev, loading: false }));
      }
    };

    fetchNodeInfo();
  }, [createForm, message]);

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
      onSubmit("create", values, {
        hostname: nodeInfo.hostname,
      });
    } catch (error) {
      console.error("提交创建配置失败:", error);
      message.error("提交失败，请稍后重试");
    }
  };

  const handleJoinSubmit = async (values: JoinClusterConfig) => {
    try {
      onSubmit("join", values);
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
    >
      <Alert
        message="创建新集群"
        description="系统将自动获取节点信息并创建集群，请选择要使用的IP地址"
        type="info"
        showIcon
        style={{ marginBottom: "24px" }}
      />

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="节点名称"
          >
            <Spin spinning={nodeInfo.loading} size="small">
              <Input
                size="large"
                disabled
                value={nodeInfo.hostname}
                placeholder={nodeInfo.loading ? "获取中..." : "自动获取"}
              />
            </Spin>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="selectedIp"
            label="节点IP地址"
            rules={[{ required: true, message: "请选择节点IP地址" }]}
          >
            <Select
              size="large"
              placeholder="选择IP地址"
              loading={nodeInfo.loading}
              disabled={nodeInfo.loading || nodeInfo.ipAddresses.length === 0}
            >
              {nodeInfo.ipAddresses.map((ip) => (
                <Select.Option key={ip} value={ip}>
                  {ip}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

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
    >
      <Alert
        message="加入现有集群"
        description="请填写节点信息以加入现有集群"
        type="warning"
        showIcon
        style={{ marginBottom: "24px" }}
      />

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="ip"
            label="节点IP地址"
            rules={[
              { required: true, message: "请输入节点IP地址" },
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
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="hostname"
            label="节点主机名"
            rules={[
              { required: true, message: "请输入节点主机名" },
              { min: 3, message: "主机名至少3个字符" },
            ]}
          >
            <Input
              size="large"
              placeholder="如：worker-node-01"
              prefix={<ClusterOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="pub_key"
            label="公钥"
            rules={[
              { required: true, message: "请输入公钥" },
              { min: 10, message: "公钥长度不能少于10位" },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请输入节点的公钥"
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Col>
      </Row>

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
