/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群初始化页面 - 一次性密码验证
 */

import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, Alert, Space, App } from "antd";
import { SafetyOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface ClusterAuthPageProps {
  onSuccess: (token: string) => void;
  loading?: boolean;
}

const ClusterAuthPage: React.FC<ClusterAuthPageProps> = ({
  onSuccess,
  loading = false,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: { password: string }) => {
    setIsSubmitting(true);
    try {
      // 导入服务
      // const { clusterInitService } = await import("@/services/cluster");

      // const result = await clusterInitService.verifyOneTimePassword(
      //   values.password
      // );

      // if (result.success && result.token) {
      //   message.success(result.message);
      //   onSuccess(result.token);
      // } else {
      //   message.error(result.message);
      // }
      // 模拟验证过程
      onSuccess("admin123admin123");
      localStorage.setItem("kr_virt_token", "admin123admin123");
      message.success("验证成功，正在跳转...");
    } catch (error) {
      console.error("验证失败:", error);
      message.error("验证失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          borderRadius: "12px",
        }}
        variant="borderless"
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <SafetyOutlined
            style={{
              fontSize: "48px",
              color: "#667eea",
              marginBottom: "16px",
            }}
          />
          <Title level={2} style={{ marginBottom: "8px" }}>
            配置未完成
          </Title>
          <Text type="secondary">
            监测到集群配置未完成，请输入一次性密码继续配置
          </Text>
        </div>

        <Alert
          message="系统安全提示"
          description="为了确保系统安全，首次配置需要验证一次性密码。请联系系统管理员获取密码。"
          type="info"
          showIcon
          style={{ marginBottom: "24px" }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="password"
            label="一次性密码"
            rules={[
              { required: true, message: "请输入一次性密码" },
              { min: 6, message: "密码长度至少6位" },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="请输入一次性密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isSubmitting || loading}
                block
              >
                验证并继续
              </Button>

              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  提示：开发环境下可使用 "testCluster" 进行测试
                </Text>
              </div>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ClusterAuthPage;
