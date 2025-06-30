import React, { useState } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Switch,
  Select,
  Button,
  Space,
  Card,
  Row,
  Col,
  Divider,
  message,
} from "antd";
import { SettingOutlined } from "@ant-design/icons";

const { Option } = Select;

interface AuditConfigProps {
  visible: boolean;
  onClose: () => void;
}

interface AuditConfigData {
  retention: {
    auditLogs: number;
    securityEvents: number;
    loginSessions: number;
  };
  alerts: {
    enableEmailAlerts: boolean;
    enableSMSAlerts: boolean;
    emailRecipients: string[];
    smsRecipients: string[];
    criticalEventThreshold: number;
    securityEventThreshold: number;
  };
  compliance: {
    enableGDP: boolean;
    enableSOX: boolean;
    enableHIPAA: boolean;
    enableISO27001: boolean;
    autoExport: boolean;
    exportFormat: string;
    exportFrequency: string;
  };
  monitoring: {
    enableRealTimeMonitoring: boolean;
    enableBehaviorAnalysis: boolean;
    suspiciousActivityThreshold: number;
    enableGeolocationTracking: boolean;
  };
}

const AuditConfig: React.FC<AuditConfigProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const initialConfig: AuditConfigData = {
    retention: {
      auditLogs: 365,
      securityEvents: 730,
      loginSessions: 90,
    },
    alerts: {
      enableEmailAlerts: true,
      enableSMSAlerts: false,
      emailRecipients: ["admin@example.com"],
      smsRecipients: [],
      criticalEventThreshold: 5,
      securityEventThreshold: 10,
    },
    compliance: {
      enableGDP: true,
      enableSOX: false,
      enableHIPAA: false,
      enableISO27001: true,
      autoExport: true,
      exportFormat: "pdf",
      exportFrequency: "monthly",
    },
    monitoring: {
      enableRealTimeMonitoring: true,
      enableBehaviorAnalysis: true,
      suspiciousActivityThreshold: 3,
      enableGeolocationTracking: true,
    },
  };

  const handleSave = async (values: AuditConfigData) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("保存审计配置:", values);
      message.success("审计配置已保存");
      onClose();
    } catch {
      message.error("保存配置失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>审计配置</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          保存配置
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialConfig}
        onFinish={handleSave}
      >
        <Row gutter={24}>
          <Col span={24}>
            <Card
              title="数据保留策略"
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name={["retention", "auditLogs"]}
                    label="审计日志保留天数"
                  >
                    <InputNumber
                      min={30}
                      max={7300}
                      addonAfter="天"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name={["retention", "securityEvents"]}
                    label="安全事件保留天数"
                  >
                    <InputNumber
                      min={30}
                      max={7300}
                      addonAfter="天"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name={["retention", "loginSessions"]}
                    label="登录会话保留天数"
                  >
                    <InputNumber
                      min={7}
                      max={365}
                      addonAfter="天"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="告警配置" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={["alerts", "enableEmailAlerts"]}
                    label="启用邮件告警"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name={["alerts", "emailRecipients"]}
                    label="邮件接收人"
                  >
                    <Select
                      mode="tags"
                      placeholder="输入邮箱地址"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={["alerts", "enableSMSAlerts"]}
                    label="启用短信告警"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name={["alerts", "smsRecipients"]}
                    label="短信接收人"
                  >
                    <Select
                      mode="tags"
                      placeholder="输入手机号码"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={["alerts", "criticalEventThreshold"]}
                    label="严重事件阈值"
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      addonAfter="次/小时"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={["alerts", "securityEventThreshold"]}
                    label="安全事件阈值"
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      addonAfter="次/小时"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="合规配置" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item
                    name={["compliance", "enableGDP"]}
                    label="GDPR合规"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name={["compliance", "enableSOX"]}
                    label="SOX合规"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name={["compliance", "enableHIPAA"]}
                    label="HIPAA合规"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name={["compliance", "enableISO27001"]}
                    label="ISO 27001"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Divider />
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name={["compliance", "autoExport"]}
                    label="自动导出报告"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name={["compliance", "exportFormat"]}
                    label="导出格式"
                  >
                    <Select>
                      <Option value="pdf">PDF</Option>
                      <Option value="excel">Excel</Option>
                      <Option value="csv">CSV</Option>
                      <Option value="json">JSON</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name={["compliance", "exportFrequency"]}
                    label="导出频率"
                  >
                    <Select>
                      <Option value="daily">每日</Option>
                      <Option value="weekly">每周</Option>
                      <Option value="monthly">每月</Option>
                      <Option value="quarterly">每季度</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="监控配置" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name={["monitoring", "enableRealTimeMonitoring"]}
                    label="启用实时监控"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name={["monitoring", "enableBehaviorAnalysis"]}
                    label="启用行为分析"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name={["monitoring", "enableGeolocationTracking"]}
                    label="启用地理位置跟踪"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name={["monitoring", "suspiciousActivityThreshold"]}
                    label="可疑活动阈值"
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      addonAfter="次"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AuditConfig;
