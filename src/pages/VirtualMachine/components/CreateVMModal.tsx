import React from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Card,
  Row,
  Col,
  Button,
  Space,
  Divider,
} from "antd";
import {
  DesktopOutlined,
  FolderOutlined,
  FileImageOutlined,
} from "@ant-design/icons";

interface CreateVMFormValues {
  vm_name: string;
  hostname: string;
  memory_gb: number;
  cpu_num: number;
  disk_size_gb: number;
  disk_dir: string;
  iso_file_path: string;
}

interface CreateVMModalProps {
  visible: boolean;
  onCancel: () => void;
  onFinish: (values: CreateVMFormValues) => void;
  loading?: boolean;
}

const CreateVMModal: React.FC<CreateVMModalProps> = ({
  visible,
  onCancel,
  onFinish,
  loading = false,
}) => {
  const [form] = Form.useForm<CreateVMFormValues>();

  const handleFinish = async (values: CreateVMFormValues) => {
    try {
      await onFinish(values);
      form.resetFields();
    } catch (error) {
      console.error("创建虚拟机失败:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <DesktopOutlined />
          创建虚拟机
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          memory_gb: 4,
          cpu_num: 2,
          disk_size_gb: 50,
          disk_dir: "/var/lib/libvirt/images",
        }}
      >
        <Card title="基本配置" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="虚拟机名称"
                name="vm_name"
                rules={[
                  { required: true, message: "请输入虚拟机名称" },
                  { min: 2, max: 50, message: "名称长度为2-50个字符" },
                  {
                    pattern: /^[a-zA-Z0-9_-]+$/,
                    message: "名称只能包含字母、数字、下划线和连字符",
                  },
                ]}
              >
                <Input placeholder="例如: web-server-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="主机名"
                name="hostname"
                rules={[
                  { required: true, message: "请输入主机名" },
                  { min: 2, max: 50, message: "主机名长度为2-50个字符" },
                  {
                    pattern: /^[a-zA-Z0-9.-]+$/,
                    message: "主机名只能包含字母、数字、点和连字符",
                  },
                ]}
              >
                <Input placeholder="例如: webserver01.local" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="硬件配置" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="CPU核数"
                name="cpu_num"
                rules={[
                  { required: true, message: "请设置CPU核数" },
                  { type: "number", min: 1, max: 64, message: "CPU核数范围为1-64" },
                ]}
              >
                <InputNumber
                  min={1}
                  max={64}
                  placeholder="CPU核数"
                  style={{ width: "100%" }}
                  addonAfter="核"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="内存大小"
                name="memory_gb"
                rules={[
                  { required: true, message: "请设置内存大小" },
                  { type: "number", min: 1, max: 1024, message: "内存大小范围为1-1024GB" },
                ]}
              >
                <InputNumber
                  min={1}
                  max={1024}
                  placeholder="内存大小"
                  style={{ width: "100%" }}
                  addonAfter="GB"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="存储配置" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="磁盘大小"
                name="disk_size_gb"
                rules={[
                  { required: true, message: "请设置磁盘大小" },
                  { type: "number", min: 10, max: 10240, message: "磁盘大小范围为10-10240GB" },
                ]}
              >
                <InputNumber
                  min={10}
                  max={10240}
                  placeholder="磁盘大小"
                  style={{ width: "100%" }}
                  addonAfter="GB"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <Space>
                    <FolderOutlined />
                    磁盘存储目录
                  </Space>
                }
                name="disk_dir"
                rules={[
                  { required: true, message: "请输入磁盘存储目录" },
                  {
                    pattern: /^\/.*$/,
                    message: "请输入有效的绝对路径",
                  },
                ]}
              >
                <Input placeholder="/usr/local/vm_disks" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="系统配置" size="small" style={{ marginBottom: 24 }}>
          <Form.Item
            label={
              <Space>
                <FileImageOutlined />
                ISO镜像路径
              </Space>
            }
            name="iso_file_path"
            rules={[
              { required: false, message: "请输入ISO镜像文件路径" },
              {
                pattern: /^\/.*\.iso$/i,
                message: "请输入有效的ISO文件路径（以.iso结尾）",
              },
            ]}
          >
            <Input placeholder="/var/lib/libvirt/images" />
          </Form.Item>
        </Card>

        <Divider />

        <Row justify="end">
          <Space>
            <Button onClick={handleCancel}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建虚拟机
            </Button>
          </Space>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateVMModal;
