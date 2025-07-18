import React from "react";
import {
  Card,
  Form,
  Switch,
  Input,
  Button,
  Space,
  Row,
  Col,
  InputNumber,
  Alert,
  Divider,
} from "antd";
import type { FormInstance } from "antd";
import {
  SecurityScanOutlined,
  SafetyOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../hooks/useTheme";

const { TextArea } = Input;

interface SecuritySettingsProps {
  securityForm: FormInstance;
  loading: boolean;
  onSave: (values: Record<string, unknown>) => Promise<void>;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  securityForm,
  loading,
  onSave,
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
            form={securityForm}
            layout="vertical"
            onFinish={onSave}
            initialValues={{
              enableSSL: true,
              sslPort: 443,
              enableFirewall: true,
              enableAuditLog: true,
              passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                maxAge: 90,
              },
              loginSecurity: {
                maxAttempts: 5,
                lockoutDuration: 30,
                sessionTimeout: 30,
                enableCaptcha: true,
              },
            }}
          >
            <Card
              title={
                <Space>
                  <LockOutlined />
                  <span>SSL/TLS 配置</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="enableSSL"
                    label="启用SSL/TLS"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sslPort"
                    label="SSL端口"
                    rules={[
                      { required: true, message: "请输入SSL端口" },
                      {
                        type: "number",
                        min: 1,
                        max: 65535,
                        message: "端口范围1-65535",
                      },
                    ]}
                  >
                    <InputNumber style={{ width: "100%" }} placeholder="443" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="sslCertificate" label="SSL证书">
                <TextArea rows={4} placeholder="请粘贴SSL证书内容（PEM格式）" />
              </Form.Item>

              <Form.Item name="sslPrivateKey" label="私钥">
                <TextArea rows={4} placeholder="请粘贴私钥内容（PEM格式）" />
              </Form.Item>
            </Card>

            <Card
              title={
                <Space>
                  <SafetyOutlined />
                  <span>密码策略</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={["passwordPolicy", "minLength"]}
                    label="最小长度"
                    rules={[
                      { required: true, message: "请输入最小长度" },
                      {
                        type: "number",
                        min: 6,
                        max: 32,
                        message: "长度范围6-32",
                      },
                    ]}
                  >
                    <InputNumber style={{ width: "100%" }} min={6} max={32} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={["passwordPolicy", "maxAge"]}
                    label="密码有效期（天）"
                    rules={[
                      { required: true, message: "请输入密码有效期" },
                      {
                        type: "number",
                        min: 1,
                        max: 365,
                        message: "有效期范围1-365天",
                      },
                    ]}
                  >
                    <InputNumber style={{ width: "100%" }} min={1} max={365} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={["passwordPolicy", "requireUppercase"]}
                    label="需要大写字母"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={["passwordPolicy", "requireLowercase"]}
                    label="需要小写字母"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={["passwordPolicy", "requireNumbers"]}
                    label="需要数字"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={["passwordPolicy", "requireSpecialChars"]}
                    label="需要特殊字符"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              title={
                <Space>
                  <SecurityScanOutlined />
                  <span>登录安全</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={["loginSecurity", "maxAttempts"]}
                    label="最大尝试次数"
                    rules={[
                      { required: true, message: "请输入最大尝试次数" },
                      {
                        type: "number",
                        min: 3,
                        max: 10,
                        message: "次数范围3-10",
                      },
                    ]}
                  >
                    <InputNumber style={{ width: "100%" }} min={3} max={10} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={["loginSecurity", "lockoutDuration"]}
                    label="锁定时长（分钟）"
                    rules={[
                      { required: true, message: "请输入锁定时长" },
                      {
                        type: "number",
                        min: 5,
                        max: 1440,
                        message: "时长范围5-1440分钟",
                      },
                    ]}
                  >
                    <InputNumber style={{ width: "100%" }} min={5} max={1440} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={["loginSecurity", "sessionTimeout"]}
                    label="会话超时（分钟）"
                    rules={[
                      { required: true, message: "请输入会话超时时间" },
                      {
                        type: "number",
                        min: 5,
                        max: 480,
                        message: "时间范围5-480分钟",
                      },
                    ]}
                  >
                    <InputNumber style={{ width: "100%" }} min={5} max={480} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={["loginSecurity", "enableCaptcha"]}
                    label="启用验证码"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              title={
                <Space>
                  <SafetyCertificateOutlined />
                  <span>其他安全设置</span>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="enableFirewall"
                    label="启用防火墙"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="enableAuditLog"
                    label="启用审计日志"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="allowedIPs" label="允许的IP地址">
                <TextArea
                  rows={3}
                  placeholder="请输入允许访问的IP地址或IP段，每行一个，例如：192.168.1.0/24"
                />
              </Form.Item>
            </Card>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存安全设置
                </Button>
                <Button onClick={() => securityForm.resetFields()}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Col>

        <Col span={8}>
          <Card title="安全状态概览">
            <Alert
              message="系统安全状态良好"
              description="所有安全策略均已正确配置并运行"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Divider orientation="left">安全检查项</Divider>

            <div style={{ marginBottom: 12 }}>
              <Space>
                <span style={{ color: "#52c41a" }}>✓</span>
                <span>SSL/TLS已启用</span>
              </Space>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Space>
                <span style={{ color: "#52c41a" }}>✓</span>
                <span>密码策略已配置</span>
              </Space>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Space>
                <span style={{ color: "#52c41a" }}>✓</span>
                <span>防火墙已启用</span>
              </Space>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Space>
                <span style={{ color: "#52c41a" }}>✓</span>
                <span>审计日志已启用</span>
              </Space>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Space>
                <span style={{ color: "#faad14" }}>!</span>
                <span>建议定期更新SSL证书</span>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SecuritySettings;
