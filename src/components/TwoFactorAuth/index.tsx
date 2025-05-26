/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-27 10:00:00
 * @Description: 双因子认证组件
 */

import React, { useState, useEffect } from "react";
import { Form, Input, Button, message, Space, Typography, Card } from "antd";
import {
  SafetyOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { authService } from "../../services/authService";
import type { TwoFactorData } from "../../services/authService";

const { Title, Text } = Typography;

interface TwoFactorAuthProps {
  tempToken: string;
  onSuccess: () => void;
  onBack: () => void;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  tempToken,
  onSuccess,
  onBack,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    setSendingCode(true);
    try {
      const result = await authService.sendVerificationCode();
      if (result.success) {
        message.success(result.message);
        setCountdown(60); // 60秒倒计时
      } else {
        message.error(result.message);
      }
    } catch {
      message.error("发送验证码失败");
    } finally {
      setSendingCode(false);
    }
  };

  // 提交双因子认证
  const handleSubmit = async (values: { verificationCode: string }) => {
    setLoading(true);
    try {
      const data: TwoFactorData = {
        tempToken,
        verificationCode: values.verificationCode,
      };

      const result = await authService.verifyTwoFactor(data);

      if (result.success) {
        message.success(result.message);
        onSuccess();
      } else {
        message.error(result.message);
      }
    } catch {
      message.error("验证失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="two-factor-container">
      <Card className="two-factor-card">
        <div className="two-factor-header">
          <SafetyOutlined className="two-factor-icon" />
          <Title level={3} className="two-factor-title">
            双因子身份认证
          </Title>
          <Text type="secondary" className="two-factor-subtitle">
            为了保障系统安全，请完成二次身份验证
          </Text>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          className="two-factor-form"
        >
          <Form.Item
            name="verificationCode"
            label="验证码"
            rules={[
              { required: true, message: "请输入验证码" },
              { len: 6, message: "验证码长度为6位" },
              { pattern: /^\d{6}$/, message: "验证码只能包含数字" },
            ]}
          >
            <Input
              size="large"
              placeholder="请输入6位数字验证码"
              maxLength={6}
              className="verification-input"
              suffix={
                <Button
                  type="link"
                  size="small"
                  loading={sendingCode}
                  disabled={countdown > 0}
                  onClick={handleSendCode}
                  icon={<SendOutlined />}
                >
                  {countdown > 0 ? `${countdown}s后重发` : "发送验证码"}
                </Button>
              }
            />
          </Form.Item>

          <div className="security-notice">
            <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              验证码已通过安全渠道发送，请在5分钟内完成验证
            </Text>
          </div>

          <Form.Item className="two-factor-actions">
            <Space size="middle" style={{ width: "100%" }}>
              <Button size="large" onClick={onBack} style={{ flex: 1 }}>
                返回
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
                style={{ flex: 2 }}
              >
                完成验证
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div className="security-tips">
          <Text type="secondary" style={{ fontSize: "12px" }}>
            • 测试验证码：123456、666666、888888
            <br />
            • 请确保在安全的网络环境下进行操作
            <br />• 如遇问题请联系系统管理员
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default TwoFactorAuth;
