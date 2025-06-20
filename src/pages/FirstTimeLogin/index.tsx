/**
 * 首次登录流程主组件
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { loginService } from '../../services/login';
import TotpSetup from './TotpSetup';
import PasswordChange from './PasswordChange';

type FirstTimeLoginStep = 'totp' | 'password' | 'complete';

const FirstTimeLogin: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<FirstTimeLoginStep>('totp');
  const [loading, setLoading] = useState(true);

  // 检查是否需要首次登录流程
  useEffect(() => {
    const checkFirstTimeLogin = async () => {
      // 检查用户是否已登录
      if (!loginService.isAuthenticated()) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      // 检查本地首次登录状态
      console.log('🔄 正在检查首次登录状态...');
      if (!loginService.isFirstTimeLogin()) {
        console.log('✅ 已完成首次登录设置');
        message.info('您已完成首次登录设置');
        navigate('/');
        return;
      }

      console.log('✅ 需要首次登录流程');

      setLoading(false);
    };

    checkFirstTimeLogin();
  }, [message, navigate]);

  // 处理2FA设置完成
  const handleTotpComplete = () => {
    console.log('2FA设置完成，进入密码修改步骤');
    setCurrentStep('password');
  };

  // 处理跳过2FA设置
  const handleTotpSkip = () => {
    console.log('跳过2FA设置，进入密码修改步骤');
    setCurrentStep('password');
  };

  // 处理密码修改完成
  const handlePasswordComplete = () => {
    console.log('密码修改完成，首次登录流程结束');
    setCurrentStep('complete');
    
    // 延迟跳转到主页
    setTimeout(() => {
      message.success('首次登录设置完成，欢迎使用系统！');
      navigate('/');
    }, 1000);
  };

  // 如果正在检查状态，显示加载状态
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>正在检查登录状态...</div>
      </div>
    );
  }

  // 根据当前步骤渲染对应组件
  switch (currentStep) {
    case 'totp':
      return (
        <TotpSetup 
          onComplete={handleTotpComplete}
          onSkip={handleTotpSkip}
        />
      );
    
    case 'password':
      return (
        <PasswordChange 
          onComplete={handlePasswordComplete}
        />
      );
    
    case 'complete':
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2>设置完成</h2>
            <p>正在跳转到主页...</p>
          </div>
        </div>
      );
    
    default:
      return null;
  }
};

export default FirstTimeLogin;
