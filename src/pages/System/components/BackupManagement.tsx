import React from "react";
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

  Alert,
  Divider,
} from "antd";
import type { FormInstance } from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../hooks/useTheme";

const { Option } = Select;

interface Backup {
  id: string;
  name: string;
  type: string;
  size: string;
  status: string;
  startTime: string;
  endTime: string;
  description: string;
}

interface BackupManagementProps {
  backups: Backup[];
  backupModalVisible: boolean;
  backupForm: FormInstance;
  onCreateBackup: () => void;
  onDeleteBackup: (backupId: string) => Promise<void>;
  onBackupModalCancel: () => void;
  onBackupFormSubmit: (values: BackupFormValues) => Promise<void>;
}

interface BackupFormValues {
  name: string;
  type: string;
  description?: string;
}
// 模拟备份数据
const mockBackups: Backup[] = [
  {
    id: "1",
    name: "系统全量备份_20241219",
    type: "full",
    size: "15.2 GB",
    status: "completed",
    startTime: "2024-12-19 02:00:00",
    endTime: "2024-12-19 03:45:00",
    description: "系统完整备份",
  },
  {
    id: "2",
    name: "配置增量备份_20241218",
    type: "incremental",
    size: "245 MB",
    status: "completed",
    startTime: "2024-12-18 02:00:00",
    endTime: "2024-12-18 02:15:00",
    description: "配置文件增量备份",
  },
  {
    id: "3",
    name: "数据差异备份_20241217",
    type: "differential",
    size: "8.7 GB",
    status: "failed",
    startTime: "2024-12-17 02:00:00",
    endTime: "2024-12-17 02:30:00",
    description: "数据差异备份失败",
  },
];

const BackupManagement: React.FC<BackupManagementProps> = ({
  backups = mockBackups,
  backupModalVisible,
  backupForm,
  onCreateBackup,
  onDeleteBackup,
  onBackupModalCancel,
  onBackupFormSubmit,
}) => {
  const { themeConfig } = useTheme();

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            完成
          </Tag>
        );
      case "failed":
        return (
          <Tag icon={<WarningOutlined />} color="error">
            失败
          </Tag>
        );
      case "running":
        return (
          <Tag icon={<SyncOutlined spin />} color="processing">
            运行中
          </Tag>
        );
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // 获取类型标签
  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      full: { color: "blue", text: "完整备份" },
      incremental: { color: "green", text: "增量备份" },
      differential: { color: "orange", text: "差量备份" },
    };
    const config = typeMap[type] || { color: "default", text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const backupColumns = [
    {
      title: "备份名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: getTypeTag,
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: getStatusTag,
    },
    {
      title: "开始时间",
      dataIndex: "startTime",
      key: "startTime",
    },
    {
      title: "结束时间",
      dataIndex: "endTime",
      key: "endTime",
      render: (text: string) => text || "-",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: Backup) => (
        <Space size="middle">
          {record.status === "completed" && (
            <Button
              type="link"
              icon={<DownloadOutlined />}
              size="small"
            >
              下载
            </Button>
          )}
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDeleteBackup(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ 
      padding: '8px',
      backgroundColor: themeConfig.token.colorBgContainer,
      minHeight: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <>
        <Card
          title="备份管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreateBackup}>
              创建备份
            </Button>
          }
        >
          <Alert
            message="备份建议"
            description="建议定期创建完整备份，并配置自动增量备份以确保数据安全。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Divider orientation="left">备份统计</Divider>
          <div style={{ marginBottom: 24 }}>
            <Space size="large">
              <div>
                <div>总备份数量</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#1890ff" }}>
                  {backups.length}
                </div>
              </div>
              <div>
                <div>成功备份</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#52c41a" }}>
                  {backups.filter((b) => b.status === "completed").length}
                </div>
              </div>
              <div>
                <div>总大小</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#722ed1" }}>
                  31.1 GB
                </div>
              </div>
            </Space>
          </div>

          <Table
            columns={backupColumns}
            dataSource={backups}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Card>

        <Modal
          title="创建备份"
          open={backupModalVisible}
          onCancel={onBackupModalCancel}
          footer={null}
          width={600}
        >
          <Form
            form={backupForm}
            layout="vertical"
            onFinish={onBackupFormSubmit}
            preserve={false}
          >
            <Form.Item
              name="name"
              label="备份名称"
              rules={[
                { required: true, message: "请输入备份名称" },
                { min: 3, message: "备份名称至少3个字符" },
              ]}
            >
              <Input placeholder="请输入备份名称" />
            </Form.Item>

            <Form.Item
              name="type"
              label="备份类型"
              rules={[{ required: true, message: "请选择备份类型" }]}
            >
              <Select placeholder="请选择备份类型">
                <Option value="full">完整备份</Option>
                <Option value="incremental">增量备份</Option>
                <Option value="differential">差量备份</Option>
              </Select>
            </Form.Item>

            <Form.Item name="description" label="备份描述">
              <Input.TextArea
                rows={3}
                placeholder="请输入备份描述（可选）"
              />
            </Form.Item>

            <Alert
              message="备份提示"
              description="完整备份包含所有数据，增量备份仅包含自上次备份以来的变更数据。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button onClick={onBackupModalCancel}>取消</Button>
                <Button type="primary" htmlType="submit">
                  开始备份
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </>
    </div>
  );
};

export default BackupManagement; 