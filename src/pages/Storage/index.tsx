import React, { useState, useEffect, useCallback } from "react";
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
  Alert,
  App,
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
import { useTheme } from "@/hooks/useTheme";
import storageService from "@/services/storage";
import { formatStorageSize } from "@/utils/format";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { StorageInfo, AddStorageRequest } from "@/services/storage/types";

const { Search } = Input;
const { Option } = Select;

const StorageManagement: React.FC = () => {
  const { modal, message } = App.useApp();
  const { themeConfig } = useTheme();
  const [loading, setLoading] = useState(true);
  const [storages, setStorages] = useState<StorageInfo[]>([]);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStorage, setEditingStorage] = useState<StorageInfo | null>(
    null
  );
  const [form] = Form.useForm();

  // 加载存储数据
  const loadStorageData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await storageService.getStorageList();
      if (response.success && response.data) {
        setStorages(response.data.storage_list);
        console.log("存储数据加载成功:", response.data.storage_list);
      } else {
        message.error(response.message || "加载存储数据失败");
      }
    } catch (error) {
      console.error("加载存储数据失败:", error);
      message.error("加载存储数据失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadStorageData();
  }, [loadStorageData]);

  // 获取状态标签和图标
  const getStatusTag = (status: string) => {
    const statusMap = {
      fake: { color: "default", text: "模拟", icon: <WarningOutlined /> },
      healthy: {
        color: "success",
        text: "健康",
        icon: <CheckCircleOutlined />,
      },
      warning: { color: "warning", text: "警告", icon: <WarningOutlined /> },
      error: { color: "error", text: "错误", icon: <WarningOutlined /> },
      offline: { color: "default", text: "离线", icon: <WarningOutlined /> },
    };
    const config = statusMap[status as keyof typeof statusMap] || {
      color: "default",
      text: storageService.getStatusText(status),
      icon: <WarningOutlined />,
    };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 获取存储类型标签
  const getTypeTag = (fstype: string) => {
    const typeMap = {
      smb: { color: "blue", text: "SMB/CIFS" },
      ext4: { color: "blue", text: "EXT4" },
      xfs: { color: "green", text: "XFS" },
      nfs: { color: "green", text: "NFS" },
      iscsi: { color: "orange", text: "iSCSI" },
      ceph: { color: "purple", text: "Ceph" },
      btrfs: { color: "cyan", text: "Btrfs" },
    };
    const config = typeMap[fstype as keyof typeof typeMap] || {
      color: "default",
      text: storageService.getFsTypeText(fstype),
    };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns = [
    {
      title: "存储名称",
      dataIndex: "name",
      key: "name",
      width: 150,
      fixed: "left" as const,
    },
    {
      title: "文件系统",
      dataIndex: "fstype",
      key: "fstype",
      width: 100,
      render: (fstype: string) => getTypeTag(fstype),
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
      render: (_: any, record: StorageInfo) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: "12px", color: "#666" }}>
              {formatStorageSize(record.used)} /{" "}
              {formatStorageSize(record.total)}
            </span>
          </div>
          <Progress
            percent={record.usagePercent}
            strokeColor={storageService.getUsageColor(record.usagePercent)}
            size="small"
            format={(percent) => `${percent}%`}
          />
        </div>
      ),
    },
    {
      title: "设备路径",
      dataIndex: "device",
      key: "device",
      width: 200,
      ellipsis: true,
    },
    {
      title: "挂载目录",
      dataIndex: "directory",
      key: "directory",
      width: 200,
      ellipsis: true,
    },
    {
      title: "挂载选项",
      dataIndex: "options",
      key: "options",
      width: 150,
      ellipsis: true,
      render: (options: string) => options || "N/A",
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
      fixed: "right" as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: StorageInfo) => (
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
  const handleEdit = (storage: StorageInfo) => {
    setEditingStorage(storage);
    form.setFieldsValue(storage);
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = (storage: StorageInfo) => {
    modal.confirm({
      title: "确认删除",
      content: `确定要删除存储 "${storage.name}" 吗？`,
      onOk: async () => {
        try {
          const response = await storageService.removeStorage(storage.id);
          if (response.success) {
            message.success(response.message || "删除成功");
            loadStorageData(); // 重新加载数据
          } else {
            message.error(response.message || "删除失败");
          }
        } catch (error) {
          console.error("删除存储失败:", error);
          message.error("删除存储失败");
        }
      },
    });
  };

  // 刷新数据
  const handleRefresh = () => {
    loadStorageData();
  };

  // 统计数据
  const statistics = {
    total: storages.length,
    healthy: storages.filter((s) => s.status === "healthy").length,
    warning: storages.filter((s) => s.status === "warning").length,
    totalCapacity: storages.reduce((sum, s) => sum + s.total, 0),
    usedCapacity: storages.reduce((sum, s) => sum + s.used, 0),
  };

  const overallUsagePercent =
    statistics.totalCapacity > 0
      ? Math.round((statistics.usedCapacity / statistics.totalCapacity) * 100)
      : 0;

  return (
    <ErrorBoundary
      title="存储管理页面出现错误"
      description="存储管理功能遇到了未预期的错误。可能是数据加载异常或界面渲染错误，请尝试刷新页面。"
      enableErrorReporting={true}
      onError={(error, errorInfo) => {
        console.error("存储管理页面错误:", error, errorInfo);
      }}
    >
      <Spin spinning={loading} tip="加载存储数据中...">
        <div
          style={{
            minHeight: loading ? "400px" : "auto",
            background: themeConfig.token.colorBgLayout,
          }}
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
                    valueStyle={{
                      color: storageService.getUsageColor(overallUsagePercent),
                    }}
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
                  placeholder="搜索存储名称、设备路径、挂载目录..."
                  allowClear
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="文件系统类型"
                  style={{ width: "100%" }}
                  value={typeFilter}
                  onChange={setTypeFilter}
                >
                  <Option value="all">全部类型</Option>
                  <Option value="smb">SMB/CIFS</Option>
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
                  <Option value="fake">模拟</Option>
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
              dataSource={storages.filter((storage) => {
                // 搜索过滤
                const searchMatch =
                  storage.name
                    .toLowerCase()
                    .includes(searchText.toLowerCase()) ||
                  storage.device
                    .toLowerCase()
                    .includes(searchText.toLowerCase()) ||
                  storage.directory
                    .toLowerCase()
                    .includes(searchText.toLowerCase());

                // 类型过滤
                const typeMatch =
                  typeFilter === "all" || storage.fstype === typeFilter;

                // 状态过滤
                const statusMatch =
                  statusFilter === "all" || storage.status === statusFilter;

                return searchMatch && typeMatch && statusMatch;
              })}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              scroll={{ x: 1500 }}
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
              onFinish={async (values) => {
                try {
                  if (editingStorage) {
                    // 编辑功能暂时不支持，因为后端只提供了添加和删除接口
                    message.warning("编辑功能暂未支持");
                  } else {
                    // 添加存储
                    const addRequest: AddStorageRequest = {
                      name: values.name,
                      fstype: values.fstype,
                      device: values.device,
                      directory: values.directory,
                      set_options: values.set_options || "",
                    };

                    const response = await storageService.addStorage(
                      addRequest
                    );
                    if (response.success) {
                      message.success(response.message || "存储添加成功");
                      setModalVisible(false);
                      form.resetFields();
                      loadStorageData(); // 重新加载数据
                    } else {
                      message.error(response.message || "存储添加失败");
                    }
                  }
                } catch (error) {
                  console.error("操作失败:", error);
                  message.error("操作失败");
                }
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="存储名称"
                    rules={[{ required: true, message: "请输入存储名称" }]}
                  >
                    <Input placeholder="请输入存储名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="fstype"
                    label="文件系统类型"
                    rules={[{ required: true, message: "请选择文件系统类型" }]}
                  >
                    <Select placeholder="请选择文件系统类型">
                      <Option value="smb">SMB/CIFS</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="device"
                    label="设备路径"
                    rules={[{ required: true, message: "请输入设备路径" }]}
                  >
                    <Input placeholder="例如：//192.168.1.112/krvirt2" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="directory"
                    label="挂载目录"
                    rules={[{ required: true, message: "请输入挂载目录" }]}
                  >
                    <Input placeholder="例如：/mnt/krvirt2" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="set_options"
                label="挂载选项"
                tooltip="可选，设置存储的挂载选项"
              >
                <Input placeholder="例如：username=user,password=pass,iocharset=utf8" />
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
      </Spin>
    </ErrorBoundary>
  );
};

export default StorageManagement;
