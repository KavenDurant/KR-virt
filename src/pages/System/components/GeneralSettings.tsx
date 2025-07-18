import React from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Row,
  Col,
  Select,
  Switch,
  InputNumber,
  Radio,
  Tag,
  Descriptions,
  Divider,
  Progress,
} from "antd";
import { SunOutlined, MoonOutlined, DesktopOutlined } from "@ant-design/icons";
import { useTheme } from "../../../hooks/useTheme";

const { TextArea } = Input;
const { Option } = Select;

interface GeneralSettings {
  systemName: string;
  description: string;
  adminEmail: string;
  language: string;
  timezone: string;
  sessionTimeout: number;
  autoLogout: boolean;
  enableNotifications: boolean;
}

interface GeneralSettingsProps {
  form: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  loading: boolean;
  generalSettings: GeneralSettings;
  themeMode: string;
  onSave: (values: GeneralSettings) => Promise<void>;
  onThemeChange: (value: string) => void;
}

// 模拟系统信息
const mockSystemInfo = {
  version: "0.0.1",
  buildTime: "2025-06-19 14:30:22",
  uptime: "15天 8小时 32分钟",
  license: {
    type: "Enterprise",
    expiry: "2025-12-31",
    status: "active",
    nodes: 100,
    usedNodes: 45,
  },
  hardware: {
    cpu: "64 核心 (Intel Xeon Gold 6248R)",
    memory: "512 GB",
    storage: "50 TB SSD",
    network: "10 Gbps",
  },
};

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  form,
  loading,
  generalSettings,
  themeMode,
  onSave,
  onThemeChange,
}) => {
  const { themeConfig } = useTheme();

  return (
    <div
      style={{
        padding: "8px",
        backgroundColor: themeConfig.token.colorBgContainer,
        minHeight: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Row gutter={[24, 24]}>
        <Col span={16}>
          <Form
            form={form}
            layout="vertical"
            initialValues={generalSettings}
            onFinish={onSave}
          >
            <Card title="基本信息" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="systemName"
                    label="系统名称"
                    rules={[{ required: true, message: "请输入系统名称" }]}
                  >
                    <Input placeholder="请输入系统名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="adminEmail"
                    label="管理员邮箱"
                    rules={[
                      { required: true, message: "请输入管理员邮箱" },
                      { type: "email", message: "请输入有效的邮箱地址" },
                    ]}
                  >
                    <Input placeholder="请输入管理员邮箱" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="description" label="系统描述">
                <TextArea rows={3} placeholder="请输入系统描述" />
              </Form.Item>
            </Card>

            <Card title="区域设置" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="language" label="语言">
                    <Select>
                      <Option value="zh-CN">简体中文</Option>
                      <Option value="zh-TW">繁体中文</Option>
                      <Option value="en-US">English</Option>
                      <Option value="ja-JP">日本語</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="timezone" label="时区">
                    <Select>
                      <Option value="Asia/Shanghai">北京时间 (UTC+8)</Option>
                      <Option value="Asia/Tokyo">东京时间 (UTC+9)</Option>
                      <Option value="UTC">协调世界时 (UTC+0)</Option>
                      <Option value="America/New_York">纽约时间 (UTC-5)</Option>
                      <Option value="Europe/London">伦敦时间 (UTC+0)</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="外观设置" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="主题模式">
                    <Radio.Group
                      value={themeMode}
                      onChange={(e) => onThemeChange(e.target.value)}
                    >
                      <Radio.Button value="light">
                        <SunOutlined /> 浅色
                      </Radio.Button>
                      <Radio.Button value="dark">
                        <MoonOutlined /> 深色
                      </Radio.Button>
                      <Radio.Button value="auto">
                        <DesktopOutlined /> 自动
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="当前主题">
                    <Tag color={themeMode === "dark" ? "blue" : "gold"}>
                      {themeMode === "dark"
                        ? "深色模式"
                        : themeMode === "light"
                          ? "浅色模式"
                          : "自动模式"}
                    </Tag>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="安全设置" style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="sessionTimeout" label="会话超时时间（分钟）">
                    <InputNumber min={5} max={480} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="autoLogout"
                    label="自动登出"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="enableNotifications"
                label="启用系统通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Card>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存设置
                </Button>
                <Button onClick={() => form.resetFields()}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Col>

        <Col span={8}>
          <Card
            title="系统信息"
            style={{
              height: "400px",
              display: "flex",
              flexDirection: "column",
            }}
            styles={{
              body: {
                flex: 1,
                overflow: "auto",
              },
            }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="版本">
                {mockSystemInfo.version}
              </Descriptions.Item>
              <Descriptions.Item label="构建时间">
                {mockSystemInfo.buildTime}
              </Descriptions.Item>
              <Descriptions.Item label="运行时间">
                {mockSystemInfo.uptime}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span>许可证使用情况</span>
                <span>
                  {mockSystemInfo.license.usedNodes}/
                  {mockSystemInfo.license.nodes}
                </span>
              </div>
              <Progress
                percent={Math.round(
                  (mockSystemInfo.license.usedNodes /
                    mockSystemInfo.license.nodes) *
                    100,
                )}
                size="small"
                status="active"
              />
            </div>

            <Tag
              color={
                mockSystemInfo.license.status === "active" ? "green" : "red"
              }
            >
              {mockSystemInfo.license.type} 许可证
            </Tag>
          </Card>

          <Card
            title="硬件信息"
            style={{
              marginTop: 24,
              height: "240px",
              display: "flex",
              flexDirection: "column",
            }}
            styles={{
              body: {
                flex: 1,
                overflow: "auto",
              },
            }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="处理器">
                {mockSystemInfo.hardware.cpu}
              </Descriptions.Item>
              <Descriptions.Item label="内存">
                {mockSystemInfo.hardware.memory}
              </Descriptions.Item>
              <Descriptions.Item label="存储">
                {mockSystemInfo.hardware.storage}
              </Descriptions.Item>
              <Descriptions.Item label="网络">
                {mockSystemInfo.hardware.network}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GeneralSettings;
