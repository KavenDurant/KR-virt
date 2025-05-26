/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-27 10:00:00
 * @Description: 登录页面 - 满足信创和国保测要求的双因子认证系统
 */

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Upload, message } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  SafetyOutlined, 
  InboxOutlined, 
  SecurityScanOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import TwoFactorAuth from '../../../components/TwoFactorAuth';
import PasswordStrengthIndicator from '../../../components/PasswordStrengthIndicator';
import { authService } from '../../../services/authService';
import type { LoginData } from '../../../services/authService';
import { SecurityUtils } from '../../../utils/security';
import './Login.less';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface LoginFormData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordValidation, setPasswordValidation] = useState(SecurityUtils.validatePassword(''));

  // 监听密码变化
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasswordValue(value);
    setPasswordValidation(SecurityUtils.validatePassword(value));
  };

  // 处理密钥文件上传
  const handleKeyFileUpload = (file: File) => {
    // 验证文件扩展名
    const allowedExtensions = ['.key', '.pem', '.crt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      message.error('请上传有效的密钥文件（.key、.pem、.crt）');
      return false;
    }

    // 验证文件大小（限制100KB）
    if (file.size > 100 * 1024) {
      message.error('密钥文件大小不能超过100KB');
      return false;
    }

    setKeyFile(file);
    message.success('密钥文件上传成功');
    return false; // 阻止自动上传
  };

  // 移除密钥文件
  const handleRemoveKeyFile = () => {
    setKeyFile(null);
    return true;
  };
  // 处理登录提交
  const handleLogin = async (values: LoginFormData) => {
    if (!keyFile) {
      message.error('请上传密钥文件');
      return;
    }

    setLoading(true);
    try {
      const loginData: LoginData = {
        username: values.username,
        password: values.password,
        keyFile
      };

      const result = await authService.login(loginData);
      
      if (result.success && result.requireTwoFactor) {
        setTempToken(result.tempToken!);
        setShowTwoFactor(true);
        message.success(result.message);
      } else if (!result.success) {
        message.error(result.message);
      }
    } catch {
      message.error('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 双因子认证成功处理
  const handleTwoFactorSuccess = () => {
    message.success('登录成功！正在跳转...');
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };
  // 返回登录页面
  const handleBackToLogin = () => {
    setShowTwoFactor(false);
    setTempToken('');
    setPasswordValue('');
    setPasswordValidation(SecurityUtils.validatePassword(''));
    form.resetFields();
    setKeyFile(null);
  };

  // 如果显示双因子认证，渲染双因子认证组件
  if (showTwoFactor) {
    return (
      <TwoFactorAuth
        tempToken={tempToken}
        onSuccess={handleTwoFactorSuccess}
        onBack={handleBackToLogin}
      />
    );
  }

  // 渲染主登录界面
  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <SafetyOutlined className="login-logo" />
          <Title level={2} className="login-title">
            KR虚拟化管理系统
          </Title>
          <Text className="login-subtitle">
            安全认证 · 信创合规 · 国保三级
          </Text>
        </div>

        <Form
          form={form}
          onFinish={handleLogin}
          layout="vertical"
          className="login-form"
          autoComplete="off"
        >          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const validation = SecurityUtils.validateUsername(value);
                  if (validation.isValid) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(validation.message));
                }
              }
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
              { required: true, message: '请输入密码' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const validation = SecurityUtils.validatePassword(value);
                  if (validation.isValid) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('密码强度不足，请参考安全建议'));
                }
              }
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

          <Form.Item
            label="密钥文件"
            required
            tooltip="请上传信创认证密钥文件，支持.key、.pem、.crt格式"
          >
            <div className="key-file-upload">
              <Dragger
                beforeUpload={handleKeyFileUpload}
                onRemove={handleRemoveKeyFile}
                fileList={keyFile ? [{
                  uid: '1',
                  name: keyFile.name,
                  status: 'done',
                  size: keyFile.size,
                }] : []}
                maxCount={1}
                accept=".key,.pem,.crt"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  点击或拖拽上传密钥文件
                </p>
                <p className="ant-upload-hint">
                  支持 .key、.pem、.crt 格式，文件大小不超过100KB
                </p>
              </Dragger>
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
            <Text strong style={{ color: '#389e0d', fontSize: '13px' }}>
              安全提示：
            </Text>
            <ul>
              <li>系统采用双因子认证，确保账户安全</li>
              <li>测试账户：admin/Admin123!@#、operator/Operator123!@#</li>
              <li>请在安全环境下进行操作，避免信息泄露</li>
              <li>如遇异常请及时联系系统管理员</li>
            </ul>
          </div>
        </div>        <div className="compliance-info">
          <div className="compliance-badge">
            <SecurityScanOutlined />
            信创合规认证
          </div>
          <div className="compliance-text">
            本系统已通过国家信息安全等级保护三级认证<br/>
            符合《网络安全法》和信创产业相关标准要求
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;