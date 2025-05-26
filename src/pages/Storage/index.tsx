import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Tooltip,
  Row,
  Col,
  Statistic,
  Spin,
  Select,
  Input,
  Modal,
  Form,
  message,
  Alert,
} from "antd";
import {
  HddOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";

const { Search } = Input;
const { Option } = Select;

// 存储数据类型定义
interface Storage {
  id: string;
  name: string;
  type: "local" | "nfs" | "iscsi" | "ceph";
  status: "healthy" | "warning" | "error" | "offline";
  totalCapacity: number; // GB
  usedCapacity: number; // GB
  availableCapacity: number; // GB
  usagePercent: number;
  mountPoint: string;
  host: string;
  createTime: string;
  lastCheck: string;
  performance: {
    readIOPS: number;
    writeIOPS: number;
    readBandwidth: string;
    writeBandwidth: string;
  };
}

// 模拟存储数据
const mockStorages: Storage[] = [
  {
    id: "1",
    name: "主存储池",
    type: "local",
    status: "healthy",
    totalCapacity: 2048,
    usedCapacity: 1024,
    availableCapacity: 1024,
    usagePercent: 50,
    mountPoint: "/var/lib/virt/images",
    host: "host-01",
    createTime: "2025-01-01 00:00:00",
    lastCheck: "2025-05-26 10:30:00",
    performance: {
      readIOPS: 2500,
      writeIOPS: 1800,
      readBandwidth: "150 MB/s",
      writeBandwidth: "120 MB/s",
    },
  },
  {
    id: "2",
    name: "备份存储",
    type: "nfs",
    status: "healthy",
    totalCapacity: 4096,
    usedCapacity: 1536,
    availableCapacity: 2560,
    usagePercent: 37.5,
    mountPoint: "/mnt/backup",
    host: "nfs-server",
    createTime: "2025-01-15 00:00:00",
    lastCheck: "2025-05-26 10:25:00",
    performance: {
      readIOPS: 1200,
      writeIOPS: 800,
      readBandwidth: "80 MB/s",
      writeBandwidth: "60 MB/s",
    },
  },
  {
    id: "3",
    name: "高性能存储",
    type: "iscsi",
    status: "warning",
    totalCapacity: 1024,
    usedCapacity: 819,
    availableCapacity: 205,
    usagePercent: 80,
    mountPoint: "/var/lib/high-perf",
    host: "san-storage",
    createTime: "2025-02-01 00:00:00",
    lastCheck: "2025-05-26 10:20:00",
    performance: {
      readIOPS: 8000,
      writeIOPS: 6000,
      readBandwidth: "500 MB/s",
      writeBandwidth: "400 MB/s",
    },
  },
];

const StorageManagement: React.FC = () => {
  const { themeConfig } = useTheme();
  const [loading, setLoading] = useState(true);
  const [storages, setStorages] = useState<Storage[]>([]);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStorage, setEditingStorage] = useState<Storage | null>(null);
  const [form] = Form.useForm();

  // 模拟数据加载
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      // 模拟API调用延迟
      setTimeout(() => {
        setStorages(mockStorages);
        setLoading(false);
      }, 1000);
    };

    loadData();
  }, []);

  // 获取状态标签和图标
  const getStatusTag = (status: string) => {
    const statusMap = {
      healthy: {
        color: "success",
        text: "健康",
        icon: <CheckCircleOutlined />,
      },
      warning: { color: "warning", text: "警告", icon: <WarningOutlined /> },
      error: { color: "error", text: "错误", icon: <WarningOutlined /> },
      offline: { color: "default", text: "离线", icon: <WarningOutlined /> },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 获取存储类型标签
  const getTypeTag = (type: string) => {
    const typeMap = {
      local: { color: "blue", text: "本地存储" },
      nfs: { color: "green", text: "NFS" },
      iscsi: { color: "orange", text: "iSCSI" },
      ceph: { color: "purple", text: "Ceph" },
    };
    const config = typeMap[type as keyof typeof typeMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取使用率颜色
  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "#ff4d4f";
    if (percent >= 75) return "#faad14";
    return "#52c41a";
  };

  // 表格列定义
  const columns = [
    {
      title: "存储名称",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "容量",
      key: "capacity",
      width: 200,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: Storage) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: "12px", color: "#666" }}>
              {record.usedCapacity}GB / {record.totalCapacity}GB
            </span>
          </div>
          <Progress
            percent={record.usagePercent}
            strokeColor={getUsageColor(record.usagePercent)}
            size="small"
            format={(percent) => `${percent}%`}
          />
        </div>
      ),
    },
    {
      title: "挂载点",
      dataIndex: "mountPoint",
      key: "mountPoint",
      width: 200,
      ellipsis: true,
    },
    {
      title: "主机",
      dataIndex: "host",
      key: "host",
      width: 120,
    },
    {
      title: "性能",
      key: "performance",
      width: 150,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: Storage) => (
        <div style={{ fontSize: "12px" }}>
          <div>读: {record.performance.readIOPS} IOPS</div>
          <div>写: {record.performance.writeIOPS} IOPS</div>
        </div>
      ),
    },
    {
      title: "最后检查",
      dataIndex: "lastCheck",
      key: "lastCheck",
      width: 150,
    },
    {
      title: "操作",
      key: "action",
      width: 150,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: Storage) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 处理编辑
  const handleEdit = (storage: Storage) => {
    setEditingStorage(storage);
    form.setFieldsValue(storage);
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = (storage: Storage) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除存储 "${storage.name}" 吗？`,
      onOk: () => {
        setStorages(storages.filter((s) => s.id !== storage.id));
        message.success("删除成功");
      },
    });
  };

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setStorages(mockStorages);
      setLoading(false);
      message.success("数据已刷新");
    }, 500);
  };

  // 统计数据
  const statistics = {
    total: storages.length,
    healthy: storages.filter((s) => s.status === "healthy").length,
    warning: storages.filter((s) => s.status === "warning").length,
    totalCapacity: storages.reduce((sum, s) => sum + s.totalCapacity, 0),
    usedCapacity: storages.reduce((sum, s) => sum + s.usedCapacity, 0),
  };

  const overallUsagePercent =
    statistics.totalCapacity > 0
      ? Math.round((statistics.usedCapacity / statistics.totalCapacity) * 100)
      : 0;

  // 如果正在加载，显示Loading状态
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          background: themeConfig.token.colorBgLayout,
        }}
      >
        <Spin size="large" tip="加载存储数据中..." />
      </div>
    );
  }

  return (
    <div
      style={{ padding: "24px", background: themeConfig.token.colorBgLayout }}
    >
      <Card
        title={
          <Space>
            <HddOutlined />
            <span>存储管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => {
                setEditingStorage(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              添加存储
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
          </Space>
        }
      >
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="存储总数"
                value={statistics.total}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="健康存储"
                value={statistics.healthy}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="告警存储"
                value={statistics.warning}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总使用率"
                value={overallUsagePercent}
                suffix="%"
                valueStyle={{ color: getUsageColor(overallUsagePercent) }}
              />
            </Card>
          </Col>
        </Row>

        {/* 容量警告 */}
        {storages.some((s) => s.usagePercent >= 80) && (
          <Alert
            message="存储容量警告"
            description="部分存储池使用率超过80%，建议及时清理或扩容"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 筛选区域 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="搜索存储名称、挂载点..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="存储类型"
              style={{ width: "100%" }}
              value={typeFilter}
              onChange={setTypeFilter}
            >
              <Option value="all">全部类型</Option>
              <Option value="local">本地存储</Option>
              <Option value="nfs">NFS</Option>
              <Option value="iscsi">iSCSI</Option>
              <Option value="ceph">Ceph</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              style={{ width: "100%" }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="healthy">健康</Option>
              <Option value="warning">警告</Option>
              <Option value="error">错误</Option>
              <Option value="offline">离线</Option>
            </Select>
          </Col>
        </Row>

        {/* 存储表格 */}
        <Table
          columns={columns}
          dataSource={storages}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 存储编辑模态框 */}
      <Modal
        title={editingStorage ? "编辑存储" : "添加存储"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            console.log("提交存储数据:", values);
            message.success(editingStorage ? "存储更新成功" : "存储添加成功");
            setModalVisible(false);
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="存储名称"
                rules={[{ required: true, message: "请输入存储名称" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="存储类型"
                rules={[{ required: true, message: "请选择存储类型" }]}
              >
                <Select>
                  <Option value="local">本地存储</Option>
                  <Option value="nfs">NFS</Option>
                  <Option value="iscsi">iSCSI</Option>
                  <Option value="ceph">Ceph</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mountPoint"
                label="挂载点"
                rules={[{ required: true, message: "请输入挂载点" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="host"
                label="主机"
                rules={[{ required: true, message: "请输入主机" }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="totalCapacity"
            label="总容量(GB)"
            rules={[{ required: true, message: "请输入总容量" }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingStorage ? "更新" : "添加"}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StorageManagement;
