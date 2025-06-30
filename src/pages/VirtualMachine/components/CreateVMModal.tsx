import React, { useState } from "react";
import {
  Modal,
  Steps,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Card,
  Row,
  Col,
  Alert,
  Tag,
  Button,
  Space,
  Radio,
  Checkbox,
  message,
} from "antd";
import {
  DesktopOutlined,
  HddOutlined,
  WifiOutlined,
  SafetyOutlined,
  SettingOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;

interface CreateVMFormValues {
  name: string;
  template?: string;
  cpu: number;
  memory: number;
  storage: number;
  os: string;
  network?: string;
  [key: string]: unknown;
}

interface CreateVMModalProps {
  visible: boolean;
  onCancel: () => void;
  onFinish: (values: CreateVMFormValues) => void;
}

interface VMTemplate {
  id: string;
  name: string;
  os: string;
  cpu: number;
  memory: number;
  storage: number;
  description: string;
  recommended?: boolean;
}

const CreateVMModal: React.FC<CreateVMModalProps> = ({
  visible,
  onCancel,
  onFinish,
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customConfig, setCustomConfig] = useState(false);

  // 使用 Form.useWatch 来安全地监听表单值变化
  const formValues = Form.useWatch([], form);

  // 虚拟机模板
  const vmTemplates: VMTemplate[] = [
    {
      id: "web-server",
      name: "Web服务器",
      os: "CentOS 8.4",
      cpu: 4,
      memory: 8,
      storage: 100,
      description: "适用于Web应用部署的标准配置",
      recommended: true,
    },
    {
      id: "database",
      name: "数据库服务器",
      os: "Oracle Linux 8",
      cpu: 8,
      memory: 32,
      storage: 500,
      description: "针对数据库工作负载优化的高性能配置",
      recommended: true,
    },
    {
      id: "app-server",
      name: "应用服务器",
      os: "Ubuntu 20.04",
      cpu: 8,
      memory: 16,
      storage: 200,
      description: "适用于应用程序部署的均衡配置",
    },
    {
      id: "windows-server",
      name: "Windows服务器",
      os: "Windows Server 2019",
      cpu: 4,
      memory: 16,
      storage: 150,
      description: "Windows环境标准配置",
    },
    {
      id: "dev-environment",
      name: "开发环境",
      os: "Ubuntu 22.04",
      cpu: 2,
      memory: 4,
      storage: 50,
      description: "轻量级开发测试环境",
    },
  ];

  const operatingSystems = [
    { value: "centos-8", label: "CentOS 8.4", icon: "🐧" },
    { value: "ubuntu-20", label: "Ubuntu 20.04 LTS", icon: "🐧" },
    { value: "ubuntu-22", label: "Ubuntu 22.04 LTS", icon: "🐧" },
    { value: "rhel-8", label: "Red Hat Enterprise Linux 8", icon: "🐧" },
    { value: "oracle-8", label: "Oracle Linux 8", icon: "🐧" },
    { value: "windows-2019", label: "Windows Server 2019", icon: "🪟" },
    { value: "windows-2022", label: "Windows Server 2022", icon: "🪟" },
  ];

  const clusters = [
    { value: "cluster-01", label: "集群-01", status: "健康", nodes: 5 },
    { value: "cluster-02", label: "集群-02", status: "健康", nodes: 3 },
    { value: "cluster-03", label: "集群-03", status: "维护中", nodes: 4 },
  ];

  const networks = [
    { value: "vpc-default", label: "默认VPC网络", type: "VPC" },
    { value: "classic", label: "经典网络", type: "Classic" },
    { value: "vpc-production", label: "生产环境VPC", type: "VPC" },
    { value: "vpc-development", label: "开发环境VPC", type: "VPC" },
  ];

  const securityGroups = [
    { value: "sg-default", label: "默认安全组", rules: 3 },
    { value: "sg-web", label: "Web服务器安全组", rules: 5 },
    { value: "sg-db", label: "数据库安全组", rules: 4 },
    { value: "sg-app", label: "应用服务器安全组", rules: 6 },
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = vmTemplates.find((t) => t.id === templateId);
    if (template) {
      form.setFieldsValue({
        os: template.os,
        cpu: template.cpu,
        memory: template.memory,
        storage: template.storage,
      });
    }
  };

  const handleNext = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error("验证失败:", error);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFinish = async () => {
    try {
      const values = await form.validateFields();
      onFinish(values);
      message.success("虚拟机创建任务已提交");
      form.resetFields();
      setCurrentStep(0);
      setSelectedTemplate("");
    } catch (error) {
      console.error("创建失败:", error);
    }
  };

  const steps = [
    {
      title: "选择模板",
      icon: <DesktopOutlined />,
      content: (
        <div style={{ padding: "20px 0" }}>
          <Alert
            message="选择虚拟机模板"
            description="您可以选择预定义的模板快速创建虚拟机，也可以自定义配置"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <div style={{ marginBottom: 16 }}>
            <Checkbox
              checked={customConfig}
              onChange={(e) => setCustomConfig(e.target.checked)}
            >
              自定义配置
            </Checkbox>
          </div>
          {!customConfig && (
            <Row gutter={[16, 16]}>
              {vmTemplates.map((template) => (
                <Col span={12} key={template.id}>
                  <Card
                    hoverable
                    className={
                      selectedTemplate === template.id ? "selected-card" : ""
                    }
                    onClick={() => handleTemplateSelect(template.id)}
                    extra={template.recommended && <Tag color="gold">推荐</Tag>}
                  >
                    <Card.Meta
                      title={
                        <Space>
                          {template.name}
                          {selectedTemplate === template.id && (
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <p>{template.description}</p>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            <div>操作系统: {template.os}</div>
                            <div>
                              配置: {template.cpu}核CPU / {template.memory}
                              GB内存 / {template.storage}GB存储
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
    {
      title: "基本配置",
      icon: <SettingOutlined />,
      content: (
        <div style={{ padding: "20px 0" }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="虚拟机名称"
                name="name"
                rules={[
                  { required: true, message: "请输入虚拟机名称" },
                  { min: 2, max: 50, message: "名称长度为2-50个字符" },
                ]}
              >
                <Input placeholder="请输入虚拟机名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="主机名"
                name="hostname"
                rules={[{ required: true, message: "请输入主机名" }]}
              >
                <Input placeholder="请输入主机名" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="描述" name="description">
                <TextArea
                  rows={3}
                  placeholder="请输入虚拟机描述"
                  maxLength={200}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="操作系统"
                name="os"
                rules={[{ required: true, message: "请选择操作系统" }]}
              >
                <Select placeholder="请选择操作系统">
                  {operatingSystems.map((os) => (
                    <Option key={os.value} value={os.value}>
                      {os.icon} {os.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="目标集群"
                name="cluster"
                rules={[{ required: true, message: "请选择目标集群" }]}
              >
                <Select placeholder="请选择目标集群">
                  {clusters.map((cluster) => (
                    <Option key={cluster.value} value={cluster.value}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{cluster.label}</span>
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          {cluster.nodes}节点 | {cluster.status}
                        </span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      title: "硬件配置",
      icon: <HddOutlined />,
      content: (
        <div style={{ padding: "20px 0" }}>
          <Row gutter={24}>
            <Col span={12}>
              <Card
                title="处理器配置"
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Form.Item
                  label="CPU核心数"
                  name="cpu"
                  rules={[{ required: true, message: "请设置CPU核心数" }]}
                >
                  <InputNumber
                    min={1}
                    max={64}
                    style={{ width: "100%" }}
                    addonAfter="核"
                  />
                </Form.Item>
                <Form.Item label="CPU插槽数" name="cpuSockets" initialValue={1}>
                  <InputNumber
                    min={1}
                    max={8}
                    style={{ width: "100%" }}
                    addonAfter="个"
                  />
                </Form.Item>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="内存配置" size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                  label="内存大小"
                  name="memory"
                  rules={[{ required: true, message: "请设置内存大小" }]}
                >
                  <InputNumber
                    min={1}
                    max={512}
                    style={{ width: "100%" }}
                    addonAfter="GB"
                  />
                </Form.Item>
                <Form.Item
                  label="热添加内存"
                  name="memoryHotAdd"
                  valuePropName="checked"
                  initialValue={false}
                >
                  <Switch />
                </Form.Item>
              </Card>
            </Col>
            <Col span={24}>
              <Card title="存储配置" size="small">
                <Form.Item
                  label="系统盘大小"
                  name="storage"
                  rules={[{ required: true, message: "请设置系统盘大小" }]}
                >
                  <InputNumber
                    min={20}
                    max={2048}
                    style={{ width: "100%" }}
                    addonAfter="GB"
                  />
                </Form.Item>
                <Form.Item
                  label="存储类型"
                  name="storageType"
                  initialValue="ssd"
                >
                  <Radio.Group>
                    <Radio value="ssd">SSD高性能</Radio>
                    <Radio value="hdd">HDD普通</Radio>
                    <Radio value="nvme">NVMe超高性能</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item
                  label="添加数据盘"
                  name="addDataDisk"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      title: "网络配置",
      icon: <WifiOutlined />,
      content: (
        <div style={{ padding: "20px 0" }}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="网络"
                name="network"
                rules={[{ required: true, message: "请选择网络" }]}
              >
                <Select placeholder="请选择网络">
                  {networks.map((network) => (
                    <Option key={network.value} value={network.value}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{network.label}</span>
                        <Tag>{network.type}</Tag>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="安全组"
                name="securityGroup"
                rules={[{ required: true, message: "请选择安全组" }]}
              >
                <Select placeholder="请选择安全组">
                  {securityGroups.map((sg) => (
                    <Option key={sg.value} value={sg.value}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{sg.label}</span>
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          {sg.rules}条规则
                        </span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="IP分配方式" name="ipType" initialValue="auto">
                <Radio.Group>
                  <Radio value="auto">自动分配</Radio>
                  <Radio value="static">静态IP</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="带宽限制" name="bandwidth" initialValue={1000}>
                <InputNumber
                  min={1}
                  max={10000}
                  style={{ width: "100%" }}
                  addonAfter="Mbps"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      title: "高级选项",
      icon: <SafetyOutlined />,
      content: (
        <div style={{ padding: "20px 0" }}>
          <Row gutter={24}>
            <Col span={24}>
              <Card title="启动选项" size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                  label="开机自启动"
                  name="autoStart"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  label="创建后立即启动"
                  name="startAfterCreate"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch />
                </Form.Item>
              </Card>
            </Col>
            <Col span={24}>
              <Card title="管理选项" size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                  label="安装VMware Tools"
                  name="installTools"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  label="启用虚拟化支持"
                  name="enableVirtualization"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  label="启用CPU热插拔"
                  name="cpuHotPlug"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Card>
            </Col>
            <Col span={24}>
              <Card title="标签管理" size="small">
                <Form.Item
                  label="环境标签"
                  name="environment"
                  initialValue="production"
                >
                  <Select>
                    <Option value="production">生产环境</Option>
                    <Option value="testing">测试环境</Option>
                    <Option value="development">开发环境</Option>
                    <Option value="staging">预发布环境</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  label="负责人"
                  name="owner"
                  rules={[{ required: true, message: "请输入负责人" }]}
                >
                  <Input placeholder="请输入负责人姓名" />
                </Form.Item>
                <Form.Item label="自定义标签" name="customTags">
                  <Input placeholder="多个标签用逗号分隔" />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      title: "确认创建",
      icon: <CheckCircleOutlined />,
      content: (
        <div style={{ padding: "20px 0" }}>
          <Alert
            message="请确认虚拟机配置信息"
            description="创建虚拟机需要几分钟时间，请确认配置信息无误后点击创建"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Card title="配置摘要" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <p>
                  <strong>虚拟机名称:</strong> {formValues?.name || "未设置"}
                </p>
                <p>
                  <strong>操作系统:</strong> {formValues?.os || "未设置"}
                </p>
                <p>
                  <strong>目标集群:</strong> {formValues?.cluster || "未设置"}
                </p>
                <p>
                  <strong>网络:</strong> {formValues?.network || "未设置"}
                </p>
              </Col>
              <Col span={12}>
                <p>
                  <strong>CPU:</strong> {formValues?.cpu || 0}核
                </p>
                <p>
                  <strong>内存:</strong> {formValues?.memory || 0}GB
                </p>
                <p>
                  <strong>存储:</strong> {formValues?.storage || 0}GB
                </p>
                <p>
                  <strong>负责人:</strong> {formValues?.owner || "未设置"}
                </p>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="创建虚拟机"
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={
        <div style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            {currentStep > 0 && <Button onClick={handlePrev}>上一步</Button>}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary" onClick={handleFinish}>
                创建虚拟机
              </Button>
            )}
          </Space>
        </div>
      }
      destroyOnHidden
    >
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step) => (
          <Step key={step.title} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          cpuSockets: 1,
          memoryHotAdd: false,
          storageType: "ssd",
          ipType: "auto",
          bandwidth: 1000,
          autoStart: true,
          startAfterCreate: true,
          installTools: true,
          environment: "production",
        }}
      >
        {steps[currentStep].content}
      </Form>
    </Modal>
  );
};

export default CreateVMModal;
