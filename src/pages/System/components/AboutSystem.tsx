import React from "react";
import {
  Card,
  Row,
  Col,
  Descriptions,
  Button,
  Upload,
  Form,
  InputNumber,
  Switch,
  Alert,
  Divider,
  Tag,
  Typography,
} from "antd";
import {
  SyncOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTheme } from "../../../hooks/useTheme";
import type {
  LicenseInfo,
  LoginPolicy,
} from "../../../services/systemSetting/types";

const { Text } = Typography;

interface AboutSystemProps {
  licenseInfo: LicenseInfo | null;
  licenseLoading: boolean;
  loginPolicy: LoginPolicy | null;
  loginPolicyForm: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  loginPolicyLoading: boolean;
  uploadingLicense: boolean;
  onLoadLicenseInfo: () => Promise<void>;
  onLicenseUpload: (file: File) => Promise<boolean>;
  onLoginPolicyUpdate: (values: LoginPolicy) => Promise<void>;
}

// 模拟系统信息
const mockSystemInfo = {
  version: "0.0.1",
  buildTime: "2025-06-19 14:30:22",
  uptime: "15天 8小时 32分钟",
  hardware: {
    cpu: "64 核心 (Intel Xeon Gold 6248R)",
    memory: "512 GB",
    storage: "50 TB SSD",
    network: "10 Gbps",
  },
};

const AboutSystem: React.FC<AboutSystemProps> = ({
  licenseInfo,
  licenseLoading,
  // loginPolicy,
  loginPolicyForm,
  loginPolicyLoading,
  uploadingLicense,
  onLoadLicenseInfo,
  onLicenseUpload,
  onLoginPolicyUpdate,
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
        {/* 第一行：产品信息和硬件信息 */}
        <Col span={12}>
          <Card
            title="产品信息"
            style={{
              height: "320px",
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
              <Descriptions.Item label="产品名称">
                KR-Virt 虚拟化平台
              </Descriptions.Item>
              <Descriptions.Item label="版本号">
                {mockSystemInfo.version}
              </Descriptions.Item>
              <Descriptions.Item label="构建时间">
                {mockSystemInfo.buildTime}
              </Descriptions.Item>
              <Descriptions.Item label="运行时间">
                {mockSystemInfo.uptime}
              </Descriptions.Item>
              <Descriptions.Item label="开发商">
                上海瞰融信息科技有限公司
              </Descriptions.Item>
              <Descriptions.Item label="技术支持">
                luojiaxin888@gmail.com
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="硬件信息"
            style={{
              height: "320px",
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

        {/* 第二行：许可证管理和登录策略 */}
        <Col span={12}>
          <Card
            title="许可证管理"
            loading={licenseLoading}
            style={{
              height: "480px",
              display: "flex",
              flexDirection: "column",
            }}
            styles={{
              body: {
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
              },
            }}
            extra={
              <Button
                type="link"
                icon={<SyncOutlined />}
                onClick={onLoadLicenseInfo}
                size="small"
              >
                刷新
              </Button>
            }
          >
            <div style={{ flex: 1 }}>
              {licenseInfo ? (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="设备代码">
                    <Text code>{licenseInfo.device_code}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="到期日期">
                    <Text>
                      {dayjs(licenseInfo.expiry_date).format(
                        "YYYY-MM-DD HH:mm:ss",
                      )}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="激活状态">
                    {licenseInfo.active_status === "active" ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        已激活
                      </Tag>
                    ) : (
                      <Tag icon={<WarningOutlined />} color="warning">
                        {licenseInfo.active_status}
                      </Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Alert
                  message="暂无许可证信息"
                  description="请上传有效的许可证文件"
                  type="warning"
                  showIcon
                />
              )}
            </div>

            <Divider style={{ margin: "16px 0" }} />

            <Upload
              accept=".lic,.license,.key"
              beforeUpload={onLicenseUpload}
              showUploadList={false}
              disabled={uploadingLicense}
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploadingLicense}
                block
              >
                {uploadingLicense ? "上传中..." : "上传许可证文件"}
              </Button>
            </Upload>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="登录策略"
            loading={loginPolicyLoading}
            style={{
              height: "480px",
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
            <Form
              form={loginPolicyForm}
              layout="vertical"
              onFinish={onLoginPolicyUpdate}
              disabled={loginPolicyLoading}
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ flex: 1 }}>
                <Form.Item
                  name="login_timeout_value"
                  label="登录超时时间（分钟）"
                  rules={[
                    { required: true, message: "请输入登录超时时间" },
                    {
                      type: "number",
                      min: 1,
                      max: 1440,
                      message: "超时时间必须在1-1440分钟之间",
                    },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={1440}
                    style={{ width: "100%" }}
                    placeholder="请输入超时时间"
                  />
                </Form.Item>

                <Form.Item
                  name="login_max_retry_times"
                  label="最大重试次数"
                  rules={[
                    { required: true, message: "请输入最大重试次数" },
                    {
                      type: "number",
                      min: 1,
                      max: 10,
                      message: "重试次数必须在1-10次之间",
                    },
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={10}
                    style={{ width: "100%" }}
                    placeholder="请输入重试次数"
                  />
                </Form.Item>

                <Form.Item
                  name="enable_two_factor_auth"
                  label="双因子认证"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                </Form.Item>
              </div>

              <Form.Item style={{ marginBottom: 0, marginTop: "auto" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loginPolicyLoading}
                  block
                >
                  保存策略
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AboutSystem;
