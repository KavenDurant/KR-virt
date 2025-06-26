import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Row,
  Col,
  Table,
  Tag,
  Alert,
  Spin,
  message,
  Statistic,
  Typography,
  Divider,
  Popconfirm,
  Tooltip,
  Badge,
} from "antd";
import {
  SyncOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { systemSettingService as timeSyncApi } from "../../services/systemSetting";
import type {
  NtpServerConfig,
  TimeSyncStatusResponse,
  NodeTimeSyncStatus,
  NtpServerStatus,
} from "../../services/systemSetting/types";

const { Title, Text } = Typography;

interface TimeSyncComponentProps {
  className?: string;
}

const TimeSyncComponent: React.FC<TimeSyncComponentProps> = ({ className }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [ntpServer, setNtpServer] = useState("");
  const [syncStatus, setSyncStatus] = useState<TimeSyncStatusResponse | null>(
    null,
  );

  // 获取NTP服务器配置
  const loadNtpServer = useCallback(async () => {
    try {
      const result = await timeSyncApi.getNtpServer();
      if (result.success && result.data) {
        setNtpServer(result.data.address);
        form.setFieldsValue({ address: result.data.address });
      }
    } catch (error) {
      console.error("Failed to load NTP server:", error);
    }
  }, [form]);

  // 获取时间同步状态
  const loadSyncStatus = useCallback(async () => {
    try {
      const result = await timeSyncApi.getTimeSyncStatus();
      if (result.success && result.data) {
        setSyncStatus(result.data);
      }
    } catch (error) {
      console.error("Failed to load sync status:", error);
    }
  }, []);

  // 初始化数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadNtpServer(), loadSyncStatus()]);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        message.error("加载数据失败");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadNtpServer, loadSyncStatus]);

  // 保存NTP服务器配置
  const handleSaveNtpServer = async (values: NtpServerConfig) => {
    setLoading(true);
    try {
      const result = await timeSyncApi.setNtpServer(values);
      if (result.success) {
        setNtpServer(values.address);
        message.success(result.message || "NTP服务器配置保存成功");
        // 保存后刷新状态
        await loadSyncStatus();
      }
    } catch (error) {
      console.error("Failed to save NTP server:", error);
      message.error("保存NTP服务器配置失败");
    } finally {
      setLoading(false);
    }
  };

  // 刷新同步状态
  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      await loadSyncStatus();
      message.success("状态刷新成功");
    } catch (error) {
      console.error("Failed to refresh status:", error);
      message.error("刷新状态失败");
    } finally {
      setRefreshing(false);
    }
  };

  // 强制时间同步
  const handleExecuteSync = async (nodeIds?: string[]) => {
    setExecuting(true);
    try {
      const result = await timeSyncApi.executeTimeSync(
        nodeIds ? { node_ids: nodeIds } : {},
      );
      if (result.success) {
        message.success(result.message || "时间同步任务已启动");

        // 延迟刷新状态，等待同步完成
        setTimeout(() => {
          loadSyncStatus();
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to execute time sync:", error);
      message.error("启动时间同步失败");
    } finally {
      setExecuting(false);
    }
  };

  // 获取服务状态标签
  const getServiceStatusTag = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "running":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            运行中
          </Tag>
        );
      case "inactive":
      case "stopped":
        return (
          <Tag icon={<ExclamationCircleOutlined />} color="error">
            已停止
          </Tag>
        );
      case "failed":
        return (
          <Tag icon={<WarningOutlined />} color="error">
            失败
          </Tag>
        );
      default:
        return (
          <Tag icon={<WarningOutlined />} color="warning">
            未知
          </Tag>
        );
    }
  };

  // 获取NTP服务器状态标签
  const getNtpStatusTag = (status: string) => {
    switch (status?.toLowerCase()) {
      case "reachable":
      case "synchronized":
      case "ok":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            正常
          </Tag>
        );
      case "unreachable":
      case "failed":
        return (
          <Tag icon={<ExclamationCircleOutlined />} color="error">
            不可达
          </Tag>
        );
      case "synchronizing":
        return (
          <Tag icon={<SyncOutlined spin />} color="processing">
            同步中
          </Tag>
        );
      default:
        return (
          <Tag icon={<WarningOutlined />} color="warning">
            未知
          </Tag>
        );
    }
  };

  // 节点列表表格列定义
  const nodeColumns = [
    {
      title: "节点",
      dataIndex: "nodeId",
      key: "nodeId",
      render: (nodeId: string) => (
        <Space>
          <GlobalOutlined />
          <Text strong>{nodeId}</Text>
        </Space>
      ),
    },
    {
      title: "同步服务",
      dataIndex: "sync_service",
      key: "sync_service",
      render: (service: string) => <Tag color="blue">{service || "NTP"}</Tag>,
    },
    {
      title: "服务状态",
      dataIndex: "service_status",
      key: "service_status",
      render: (status: string) => getServiceStatusTag(status),
    },
    {
      title: "NTP服务器",
      dataIndex: "ntp_server_list",
      key: "ntp_server_list",
      render: (servers: NtpServerStatus[]) => (
        <Space direction="vertical" size="small">
          {servers?.map((server, index) => (
            <Space key={index} size="small">
              <Text code>{server.address}</Text>
              {getNtpStatusTag(server.status)}
            </Space>
          ))}
        </Space>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (
        _: unknown,
        record: { nodeId: string; data: NodeTimeSyncStatus },
      ) => (
        <Space>
          <Tooltip title="强制同步此节点">
            <Button
              type="link"
              icon={<SyncOutlined />}
              loading={executing}
              onClick={() => handleExecuteSync([record.nodeId])}
            >
              同步
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 准备节点数据
  const nodeData = syncStatus?.nodes
    ? Object.entries(syncStatus.nodes).map(([nodeId, data]) => ({
        key: nodeId,
        nodeId,
        data,
        ...data,
      }))
    : [];

  // 计算统计信息
  const totalNodes = nodeData.length;
  const activeNodes = nodeData.filter(
    (node) =>
      node.service_status?.toLowerCase() === "active" ||
      node.service_status?.toLowerCase() === "running",
  ).length;
  const syncedNodes = nodeData.filter((node) =>
    node.ntp_server_list?.some(
      (server) =>
        server.status?.toLowerCase() === "synchronized" ||
        server.status?.toLowerCase() === "ok",
    ),
  ).length;

  return (
    <div className={className}>
      <Spin spinning={loading} tip="正在加载时间同步配置...">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* NTP服务器配置 */}
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                <span>NTP服务器配置</span>
              </Space>
            }
          >
            <Row gutter={[24, 24]}>
              <Col span={16}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveNtpServer}
                  initialValues={{ address: ntpServer }}
                >
                  <Form.Item
                    name="address"
                    label="NTP服务器地址"
                    rules={[
                      { required: true, message: "请输入NTP服务器地址" },
                      {
                        pattern:
                          /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/,
                        message: "请输入有效的IP地址或域名",
                      },
                    ]}
                    extra="支持IP地址或域名，例如：pool.ntp.org 或 192.168.1.1"
                  >
                    <Input
                      placeholder="请输入NTP服务器地址"
                      prefix={<GlobalOutlined />}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={<CheckCircleOutlined />}
                      >
                        保存配置
                      </Button>
                      <Button onClick={() => form.resetFields()}>重置</Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Col>

              <Col span={8}>
                <Card size="small">
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Title level={5}>常用NTP服务器</Title>
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <Button
                        type="link"
                        size="small"
                        onClick={() =>
                          form.setFieldsValue({ address: "pool.ntp.org" })
                        }
                      >
                        pool.ntp.org
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        onClick={() =>
                          form.setFieldsValue({ address: "time.windows.com" })
                        }
                      >
                        time.windows.com
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        onClick={() =>
                          form.setFieldsValue({ address: "ntp.aliyun.com" })
                        }
                      >
                        ntp.aliyun.com
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        onClick={() =>
                          form.setFieldsValue({ address: "cn.pool.ntp.org" })
                        }
                      >
                        cn.pool.ntp.org
                      </Button>
                    </Space>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* 同步状态统计 */}
          {syncStatus && (
            <Card
              title={
                <Space>
                  <SyncOutlined />
                  <span>同步状态统计</span>
                </Space>
              }
              extra={
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    loading={refreshing}
                    onClick={handleRefreshStatus}
                  >
                    刷新状态
                  </Button>
                  <Popconfirm
                    title="确定要对所有节点执行强制时间同步吗？"
                    description="此操作将对所有节点执行时间同步，可能会短暂影响服务。"
                    onConfirm={() => handleExecuteSync()}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      loading={executing}
                      danger
                    >
                      强制全部同步
                    </Button>
                  </Popconfirm>
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8} md={8}>
                  <Statistic
                    title="总节点数"
                    value={totalNodes}
                    prefix={<GlobalOutlined />}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Col>
                <Col xs={24} sm={8} md={8}>
                  <Statistic
                    title="服务正常"
                    value={activeNodes}
                    suffix={`/ ${totalNodes}`}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{
                      color: activeNodes === totalNodes ? "#52c41a" : "#faad14",
                    }}
                  />
                </Col>
                <Col xs={24} sm={8} md={8}>
                  <Statistic
                    title="时间已同步"
                    value={syncedNodes}
                    suffix={`/ ${totalNodes}`}
                    prefix={<SyncOutlined />}
                    valueStyle={{
                      color: syncedNodes === totalNodes ? "#52c41a" : "#ff4d4f",
                    }}
                  />
                </Col>
              </Row>

              {/* 状态提示 */}
              {totalNodes > 0 && (
                <Alert
                  style={{ marginTop: 16 }}
                  message={
                    syncedNodes === totalNodes
                      ? "所有节点时间同步正常"
                      : `有 ${totalNodes - syncedNodes} 个节点时间同步异常，建议检查网络连接或执行强制同步`
                  }
                  type={syncedNodes === totalNodes ? "success" : "warning"}
                  showIcon
                />
              )}
            </Card>
          )}

          {/* 节点详细状态 */}
          {syncStatus && (
            <Card
              title={
                <Space>
                  <Badge count={totalNodes} showZero>
                    <GlobalOutlined />
                  </Badge>
                  <span>节点详细状态</span>
                </Space>
              }
            >
              <Table
                columns={nodeColumns}
                dataSource={nodeData}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `第 ${range[0]}-${range[1]} 项，共 ${total} 项`,
                }}
                loading={refreshing}
                size="middle"
              />
            </Card>
          )}

          {/* 使用说明 */}
          <Card
            title={
              <Space>
                <ExclamationCircleOutlined />
                <span>使用说明</span>
              </Space>
            }
            size="small"
          >
            <Space direction="vertical" size="small">
              <Text>
                <Text strong>时间同步服务</Text>
                用于确保集群中所有节点的系统时间保持一致，这对于分布式系统的正常运行至关重要。
              </Text>
              <Divider />
              <Text>
                • <Text strong>配置NTP服务器：</Text>
                设置可靠的时间源，建议使用就近的NTP服务器以减少延迟
              </Text>
              <Text>
                • <Text strong>监控同步状态：</Text>
                定期检查各节点的时间同步状态，确保服务正常运行
              </Text>
              <Text>
                • <Text strong>强制同步：</Text>
                当发现时间偏差较大时，可手动触发强制同步
              </Text>
              <Text>
                • <Text strong>故障排除：</Text>
                如果同步失败，请检查网络连接和NTP服务器可达性
              </Text>
            </Space>
          </Card>
        </Space>
      </Spin>
    </div>
  );
};

export default TimeSyncComponent;
