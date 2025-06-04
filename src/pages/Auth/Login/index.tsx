/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-27 10:00:00
 * @Description: 登录页面 - 简化版登录系统
 */

import React, { useState } from "react";
import { App } from "antd";
import { Form, Input, Button, Card, Typography, Modal } from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  SecurityScanOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PasswordStrengthIndicator from "../../../components/PasswordStrengthIndicator";
import { authService } from "../../../services/authService";
import type { LoginData } from "../../../services/authService";
import { SecurityUtils } from "../../../utils/security";
import "./Login.less";

const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordValidation, setPasswordValidation] = useState(
    SecurityUtils.validatePassword("")
  );
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [newPasswordValidation, setNewPasswordValidation] = useState(
    SecurityUtils.validatePassword("")
  );
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordForm] = Form.useForm();
  interface ChangePasswordFormData {
    newPassword: string;
    confirmPassword: string;
  }
  interface CurrentUserType {
    username: string;
    role: string;
    permissions: string[];
    lastLogin: string;
    isFirstLogin?: boolean;
  }
  // 修改用户：用来判断是否为第一次登录
  const [currentUser, setCurrentUser] = useState<CurrentUserType | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  // 监听密码变化
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasswordValue(value);
    setPasswordValidation(SecurityUtils.validatePassword(value));
  };
  // 监听新密码变化
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPasswordValue(value);
    setNewPasswordValidation(SecurityUtils.validatePassword(value));
  };
  // 处理登录提交
  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const loginData: LoginData = {
        username: values.username,
        password: values.password,
      };
      const result = await authService.login(loginData);
      console.log(result, "----");

      if (result.success && result.user) {
        if (result.user.isFirstLogin) {
          // 如果是第一次登录，跳转到修改密码页面
          setCurrentUser(result.user);
          setShowChangePasswordModal(true);
          message.info("检测到您是首次登录，请修改密码以确保账户安全");
        } else {
          message.success("登录成功！正在跳转...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 1000);
        }
      } else if (!result.success) {
        console.error("登录失败原因:", result.message);
        message.error(result.message);
      }
    } catch {
      message.error("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };
  const handleChangePassword = async (values: ChangePasswordFormData) => {
    setChangePasswordLoading(true);
    try {
      if (!currentUser) {
        message.error("用户信息不存在");
        setChangePasswordLoading(false);
        return;
      }

      const result = await authService.changePassword({
        username: currentUser.username,
        oldPassword: form.getFieldValue("password"),
        newPassword: values.newPassword,
      });

      if (result.success) {
        message.success("密码修改成功！正在跳转...");
        setShowChangePasswordModal(false);
        changePasswordForm.resetFields();
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        message.error(result.message || "密码修改失败");
      }
    } catch {
      message.error("密码修改失败，请稍后重试");
    } finally {
      setChangePasswordLoading(false);
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
              placeholder="请输入用户名"
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
                placeholder="请输入密码"
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
        <div className="security-notice">
          <CheckCircleOutlined />
          <div>
            <Text strong style={{ color: "#389e0d", fontSize: "13px" }}>
              测试账户信息：
            </Text>
            <ul>
              <li>
                <strong>管理员：</strong>用户名: admin，密码: Admin123!@#
              </li>
              <li>
                <strong>操作员：</strong>用户名: operator，密码: Operator123!@#
              </li>
              <li>
                <strong>审计员：</strong>用户名: auditor，密码: Auditor123!@#
              </li>
              <li>
                <strong>测试用户：</strong>用户名: test，密码: 123456
              </li>
            </ul>
          </div>
        </div>
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
      <Modal
        title="首次登录 - 修改密码"
        footer={null}
        loading={loading}
        open={showChangePasswordModal}
        onCancel={() => setShowChangePasswordModal(false)}
        centered
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="warning">
            为了您的账户安全，首次登录需要修改默认密码。
          </Text>
        </div>
        <Form
          form={changePasswordForm}
          onFinish={handleChangePassword}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: "请输入新密码" },
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
                placeholder="请输入新密码"
                onChange={handleNewPasswordChange}
                value={newPasswordValue}
              />
              {newPasswordValue && (
                <PasswordStrengthIndicator
                  password={newPasswordValue}
                  validation={newPasswordValidation}
                  showSuggestions={true}
                />
              )}
            </div>
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "请确认新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={changePasswordLoading}
              block
            >
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
