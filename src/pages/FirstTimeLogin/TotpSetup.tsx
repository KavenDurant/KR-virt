/**
 * 2FA绑定页面组件
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Steps,
  QRCode,
  Typography,
  Space,
  Alert,
  Divider,
  App,
  Row,
  Col,
} from "antd";
import {
  SafetyOutlined,
  QrcodeOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../hooks/useTheme";
import { loginService } from "../../services/login";

const { Title, Text, Paragraph } = Typography;

interface TotpSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

const TotpSetup: React.FC<TotpSetupProps> = ({ onComplete, onSkip }) => {
  const { message } = App.useApp();
  const { themeConfig } = useTheme();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [secretLoading, setSecretLoading] = useState(true);
  const [totpSecret, setTotpSecret] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [qrCodeValue, setQrCodeValue] = useState<string>("");

  // 生成QR码内容
  const generateQRCodeValue = (secret: string) => {
    const user = loginService.getCurrentUser();
    const username = user?.username || "user";
    const issuer = "KR-Virt";
    return `otpauth://totp/${issuer}:${username}?secret=${secret}&issuer=${issuer}`;
  };

  // 加载2FA密钥
  useEffect(() => {
    const loadTotpSecret = async () => {
      setSecretLoading(true);
      try {
        const response = await loginService.generateTotpSecret();
        if (response.success && response.data) {
          setTotpSecret(response.data.totp_secret);
          setQrCodeValue(generateQRCodeValue(response.data.totp_secret));
        } else {
          message.error(response.message || "获取2FA密钥失败");
        }
      } catch (error) {
        console.error("Failed to load TOTP secret:", error);
        message.error("获取2FA密钥失败");
      } finally {
        setSecretLoading(false);
      }
    };

    loadTotpSecret();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时调用一次，避免重复API调用

  // 处理验证码验证
  const handleVerifyCode = async (values: { totp_code: string }) => {
    setLoading(true);
    try {
      const response = await loginService.verifyTotpCode({
        totp_code: values.totp_code,
      });
      if (response.success) {
        message.success("2FA设置成功！");
        setCurrentStep(2);
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        message.error(response.message || "验证码错误，请重试");
      }
    } catch (error) {
      console.error("Failed to verify TOTP code:", error);
      message.error("验证失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理跳过
  const handleSkip = () => {
    message.info("已跳过2FA设置，您可以稍后在设置中配置");
    onSkip();
  };

  // 步骤配置
  const steps = [
    {
      title: "扫描二维码",
      icon: <QrcodeOutlined />,
    },
    {
      title: "输入验证码",
      icon: <KeyOutlined />,
    },
    {
      title: "设置完成",
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: themeConfig.token.colorBgContainer,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "20px",
        paddingTop: "40px",
        overflow: "auto",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 600,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          marginBottom: "40px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <SafetyOutlined
            style={{
              fontSize: 40,
              color: themeConfig.token.colorPrimary,
              marginBottom: 12,
            }}
          />
          <Title level={2} style={{ margin: 0, fontSize: "24px" }}>
            设置双因子认证 (2FA)
          </Title>
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            为了提高账户安全性，建议您设置双因子认证
          </Paragraph>
        </div>

        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 24 }}
        />

        {currentStep === 0 && (
          <div>
            <Alert
              message="设置说明"
              description={
                <div>
                  <p style={{ margin: "4px 0" }}>
                    1. 在您的手机上下载并安装认证器应用（如 Google
                    Authenticator、Microsoft Authenticator）
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    2. 使用认证器应用扫描下方二维码，或手动输入密钥
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    3. 输入认证器显示的6位验证码完成设置
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Row gutter={[20, 16]}>
              <Col xs={24} md={12}>
                <div style={{ textAlign: "center" }}>
                  <Title level={4} style={{ marginBottom: 12 }}>
                    扫描二维码
                  </Title>
                  {secretLoading ? (
                    <div
                      style={{
                        height: 140,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text>正在生成二维码...</Text>
                    </div>
                  ) : (
                    <QRCode
                      value={qrCodeValue}
                      size={140}
                      style={{ margin: "8px 0" }}
                    />
                  )}
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div>
                  <Title level={4} style={{ marginBottom: 12 }}>
                    手动输入密钥
                  </Title>
                  <Paragraph style={{ marginBottom: 12 }}>
                    如果无法扫描二维码，请在认证器应用中手动输入以下密钥：
                  </Paragraph>
                  <Input.TextArea
                    value={totpSecret}
                    readOnly
                    rows={3}
                    style={{ fontFamily: "monospace", fontSize: "13px" }}
                  />
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(totpSecret);
                      message.success("密钥已复制到剪贴板");
                    }}
                    style={{ padding: 0, marginTop: 6 }}
                  >
                    复制密钥
                  </Button>
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: "20px 0" }} />

            <div style={{ textAlign: "center" }}>
              <Space size="large">
                <Button
                  size="large"
                  onClick={handleSkip}
                  icon={<ArrowRightOutlined />}
                >
                  跳过设置
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setCurrentStep(1)}
                  disabled={secretLoading}
                >
                  下一步
                </Button>
              </Space>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Title level={4} style={{ marginBottom: 8 }}>
                输入验证码
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                请输入认证器应用显示的6位验证码
              </Paragraph>
            </div>

            <Form
              form={form}
              onFinish={handleVerifyCode}
              layout="vertical"
              style={{ maxWidth: 300, margin: "0 auto" }}
            >
              <Form.Item
                name="totp_code"
                rules={[
                  { required: true, message: "请输入验证码" },
                  { pattern: /^\d{6}$/, message: "请输入6位数字验证码" },
                ]}
              >
                <Input
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  style={{
                    textAlign: "center",
                    fontSize: "18px",
                    letterSpacing: "2px",
                  }}
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item style={{ textAlign: "center", marginBottom: 0 }}>
                <Space size="large">
                  <Button onClick={() => setCurrentStep(0)}>返回上一步</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                  >
                    验证并完成
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Button
                type="link"
                onClick={handleSkip}
                icon={<ArrowRightOutlined />}
              >
                跳过2FA设置
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: "center" }}>
            <CheckCircleOutlined
              style={{
                fontSize: 64,
                color: "#52c41a",
                marginBottom: 16,
              }}
            />
            <Title level={3} style={{ color: "#52c41a" }}>
              2FA设置成功！
            </Title>
            <Paragraph type="secondary">
              您的账户安全性已得到提升，正在跳转到下一步...
            </Paragraph>
          </div>
        )}

        <Alert
          message="安全提示"
          description="2FA是可选的安全功能。如果您选择跳过，建议您稍后在账户设置中启用此功能以提高安全性。"
          type="warning"
          showIcon
          style={{ marginTop: 20 }}
        />
      </Card>
    </div>
  );
};

export default TotpSetup;
