/**
 * 首次登录密码修改页面组件
 */

import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Progress,
  Alert,
  Space,
  App,
  List,
} from 'antd';
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../hooks/useTheme';
import { loginService } from '../../services/login';

const { Title, Text, Paragraph } = Typography;

interface PasswordChangeProps {
  onComplete: () => void;
}

interface PasswordStrength {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
  color: string;
  text: string;
}

const PasswordChange: React.FC<PasswordChangeProps> = ({ onComplete }) => {
  const { message } = App.useApp();
  const { themeConfig } = useTheme();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    level: 'weak',
    color: '#ff4d4f',
    text: '弱'
  });

  // 密码强度检测
  const checkPasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0;
    
    // 长度检查
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    
    // 字符类型检查
    if (/[a-z]/.test(pwd)) score += 10;
    if (/[A-Z]/.test(pwd)) score += 10;
    if (/[0-9]/.test(pwd)) score += 10;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 20;
    
    let level: PasswordStrength['level'] = 'weak';
    let color = '#ff4d4f';
    let text = '弱';
    
    if (score >= 80) {
      level = 'strong';
      color = '#52c41a';
      text = '强';
    } else if (score >= 60) {
      level = 'good';
      color = '#1890ff';
      text = '良好';
    } else if (score >= 40) {
      level = 'fair';
      color = '#faad14';
      text = '一般';
    }
    
    return { score, level, color, text };
  };

  // 密码输入处理
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(checkPasswordStrength(pwd));
  };

  // 密码规则检查
  const getPasswordRules = () => {
    return [
      {
        text: '至少8个字符',
        passed: password.length >= 8,
      },
      {
        text: '包含小写字母',
        passed: /[a-z]/.test(password),
      },
      {
        text: '包含大写字母',
        passed: /[A-Z]/.test(password),
      },
      {
        text: '包含数字',
        passed: /[0-9]/.test(password),
      },
      {
        text: '包含特殊字符',
        passed: /[^A-Za-z0-9]/.test(password),
      },
    ];
  };

  // 表单提交处理
  const handleSubmit = async (values: { new_password: string; confirm_password: string }) => {
    setLoading(true);
    try {
      const response = await loginService.changePasswordFirstTime({
        new_password: values.new_password
      });

      if (response.success) {
        message.success('密码修改成功！');

        // 更新本地首次登录状态
        console.log('🔄 正在更新首次登录状态...');
        loginService.updateFirstTimeLoginStatus(false);
        console.log('✅ 首次登录状态更新完成');

        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        message.error(response.message || '密码修改失败');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      message.error('密码修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const passwordRules = getPasswordRules();
  const allRulesPassed = passwordRules.every(rule => rule.passed);

  return (
    <div style={{
      minHeight: '100vh',
      background: themeConfig.token.colorBgContainer,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '20px',
      paddingTop: '40px',
      overflow: 'auto'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          marginBottom: '40px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <LockOutlined
            style={{
              fontSize: 40,
              color: themeConfig.token.colorPrimary,
              marginBottom: 12
            }}
          />
          <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
            修改登录密码
          </Title>
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            为了账户安全，首次登录需要修改密码
          </Paragraph>
        </div>

        <Alert
          message="安全要求"
          description="请设置一个强密码以保护您的账户安全。密码应包含大小写字母、数字和特殊字符。"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="新密码"
            name="new_password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少需要8个字符' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const strength = checkPasswordStrength(value);
                  if (strength.score < 60) {
                    return Promise.reject(new Error('密码强度不够，请设置更强的密码'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input.Password
              placeholder="请输入新密码"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              onChange={handlePasswordChange}
              style={{ fontSize: '16px' }}
            />
          </Form.Item>

          {password && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ marginRight: 8 }}>密码强度：</Text>
                <Text style={{ color: passwordStrength.color, fontWeight: 'bold' }}>
                  {passwordStrength.text}
                </Text>
              </div>
              <Progress
                percent={passwordStrength.score}
                strokeColor={passwordStrength.color}
                showInfo={false}
                size="small"
              />
            </div>
          )}

          <Form.Item
            label="确认密码"
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="请再次输入新密码"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              style={{ fontSize: '16px' }}
            />
          </Form.Item>

          {password && (
            <Card
              size="small"
              title={
                <Space>
                  <SafetyOutlined />
                  <span>密码要求</span>
                </Space>
              }
              style={{ marginBottom: 20 }}
            >
              <List
                size="small"
                dataSource={passwordRules}
                renderItem={(rule) => (
                  <List.Item style={{ padding: '4px 0', border: 'none' }}>
                    <Space>
                      {rule.passed ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      )}
                      <Text 
                        style={{ 
                          color: rule.passed ? '#52c41a' : '#ff4d4f',
                          textDecoration: rule.passed ? 'line-through' : 'none'
                        }}
                      >
                        {rule.text}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              disabled={!allRulesPassed || passwordStrength.score < 60}
            >
              确认修改密码
            </Button>
          </Form.Item>
        </Form>

        <Alert
          message="重要提示"
          description="密码修改成功后，您将可以正常使用系统的所有功能。请妥善保管您的新密码。"
          type="warning"
          showIcon
          style={{ marginTop: 24 }}
        />
      </Card>
    </div>
  );
};

export default PasswordChange;
