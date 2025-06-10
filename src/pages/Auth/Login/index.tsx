/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-27 10:00:00
 * @Description: 登录页面 - 简化版登录系统
 */

import React, { useState } from "react";
import { App } from "antd";
import { Form, Input, Button, Card, Typography } from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  SecurityScanOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { loginService } from "@/services/login";
import type { LoginData } from "@/services/login/types";
import { SecurityUtils } from "@/utils/security";
import "./Login.less";

const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
  verificationCode: string;
}

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordValidation, setPasswordValidation] = useState(
    SecurityUtils.validatePassword("")
  );

  // 在组件挂载时可以添加一些初始化逻辑（如果需要）
  React.useEffect(() => {
    console.log("登录页面已加载");
    console.log("测试账号：test_user");
    console.log("测试密码：-p-p-p");
    console.log("固定验证码：123456");
  }, []);

  // 监听密码变化
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasswordValue(value);
    setPasswordValidation(SecurityUtils.validatePassword(value));
  };

  // 处理登录提交
  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const loginData: LoginData = {
        login_name: values.username, // 映射到后端期望的字段名
        password: values.password,
        two_factor: values.verificationCode, // 映射到后端期望的字段名
      };
      const result = await loginService.login(loginData);
      if (!result.success) {
        message.error(result.message || "登录失败，请检查用户名和密码");
        return;
      }
      message.success("登录成功！正在跳转...");
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          navigate("/dashboard");
        }
      }, 1000);
    } catch {
      message.error("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 渲染主登录界面
  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <SafetyOutlined className="login-logo" />
          <Title level={2} className="login-title">
            KR虚拟化管理系统
          </Title>
          <Text className="login-subtitle">安全认证 · 信创合规 · 国保三级</Text>
        </div>

        <Form
          form={form}
          onFinish={handleLogin}
          layout="vertical"
          className="login-form"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: "请输入用户名" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const validation = SecurityUtils.validateUsername(value);
                  if (validation.isValid) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(validation.message));
                },
              },
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="请输入用户名 (test_user)"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: "请输入密码" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const validation = SecurityUtils.validatePassword(value);
                  if (validation.isValid) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("密码强度不足，请参考安全建议")
                  );
                },
              },
            ]}
          >
            <div>
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="请输入密码 (-p0-p0-p0)"
                autoComplete="current-password"
                onChange={handlePasswordChange}
                value={passwordValue}
              />
              {passwordValue && (
                <PasswordStrengthIndicator
                  password={passwordValue}
                  validation={passwordValidation}
                  showSuggestions={true}
                />
              )}
            </div>
          </Form.Item>

          <Form.Item
            name="verificationCode"
            label="验证码"
            rules={[
              { required: true, message: "请输入验证码" },
              { pattern: /^\d{6}$/, message: "请输入6位数字验证码" },
            ]}
          >
            <Input
              size="large"
              prefix={<SecurityScanOutlined />}
              placeholder="请输入6位验证码 (123456)"
              maxLength={6}
              style={{
                textAlign: "center",
                fontSize: "16px",
                letterSpacing: "2px",
              }}
            />
          </Form.Item>

          <Form.Item className="login-actions">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
            >
              安全登录
            </Button>
          </Form.Item>
        </Form>

        <div className="compliance-info">
          <div className="compliance-badge">
            <SecurityScanOutlined />
            信创合规认证
          </div>
          <div className="compliance-text">
            本系统已通过国家信息安全等级保护三级认证
            <br />
            符合《网络安全法》和信创产业相关标准要求
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;
