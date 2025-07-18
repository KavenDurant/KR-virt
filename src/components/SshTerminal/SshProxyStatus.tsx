/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-18 10:30:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-18 10:30:00
 * @FilePath: /KR-virt/src/components/SshTerminal/SshProxyStatus.tsx
 * @Description: SSH代理服务器状态检查组件
 */

import { useState, useEffect } from 'react';
import { Alert, Button, Space, Spin } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ReloadOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';

interface SshProxyStatusProps {
  onStatusChange?: (isRunning: boolean) => void;
}

interface ServerStatus {
  isRunning: boolean;
  message: string;
  lastCheck: Date;
}

export default function SshProxyStatus({ onStatusChange }: SshProxyStatusProps) {
  const [status, setStatus] = useState<ServerStatus>({
    isRunning: false,
    message: '检查中...',
    lastCheck: new Date()
  });
  const [checking, setChecking] = useState(false);

  const checkServerStatus = async () => {
    setChecking(true);
    try {
      // 支持环境变量配置的服务器地址
      const proxyHost = import.meta.env.VITE_SSH_PROXY_HOST || window.location.hostname;
      const proxyHealthPort = import.meta.env.VITE_SSH_PROXY_HEALTH_PORT || '3002';
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const healthUrl = `${protocol}//${proxyHost}:${proxyHealthPort}/health`;

      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        const newStatus = {
          isRunning: true,
          message: data.message || 'SSH代理服务器运行正常',
          lastCheck: new Date()
        };
        setStatus(newStatus);
        onStatusChange?.(true);
      } else {
        throw new Error(`服务器响应错误: ${response.status}`);
      }
    } catch (error) {
      const newStatus = {
        isRunning: false,
        message: error instanceof Error ? error.message : '连接失败',
        lastCheck: new Date()
      };
      setStatus(newStatus);
      onStatusChange?.(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
    
    // 每30秒检查一次服务器状态
    const interval = setInterval(checkServerStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (checking) {
      return <Spin size="small" />;
    }
    return status.isRunning ? 
      <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  const getAlertType = () => {
    if (checking) return 'info';
    return status.isRunning ? 'success' : 'error';
  };

  const getAlertMessage = () => {
    if (checking) return 'SSH代理服务器状态检查中...';
    return status.isRunning ? 'SSH代理服务器运行正常' : 'SSH代理服务器未运行';
  };

  const getAlertDescription = () => {
    if (status.isRunning) {
      return (
        <div>
          <div>{status.message}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            最后检查: {status.lastCheck.toLocaleTimeString()}
          </div>
        </div>
      );
    }
    
    return (
      <div>
        <div style={{ marginBottom: '8px' }}>
          请确保SSH代理服务器已启动。如果未启动，请按以下步骤操作：
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          <div>1. 打开终端，进入项目的 server 目录</div>
          <div>2. 运行命令: <code style={{ background: '#f5f5f5', padding: '2px 4px' }}>npm install</code></div>
          <div>3. 启动服务: <code style={{ background: '#f5f5f5', padding: '2px 4px' }}>npm start</code></div>
          <div>4. 或者运行: <code style={{ background: '#f5f5f5', padding: '2px 4px' }}>./start.sh</code></div>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          错误信息: {status.message}
        </div>
      </div>
    );
  };

  return (
    <Alert
      message={getAlertMessage()}
      description={getAlertDescription()}
      type={getAlertType()}
      icon={getStatusIcon()}
      showIcon
      action={
        <Space>
          <Button 
            size="small" 
            onClick={checkServerStatus}
            loading={checking}
            icon={<ReloadOutlined />}
          >
            重新检查
          </Button>
          {!status.isRunning && (
            <Button 
              size="small" 
              type="link"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                window.open('http://localhost:3002/health', '_blank');
              }}
            >
              查看详情
            </Button>
          )}
        </Space>
      }
      style={{ marginBottom: '16px' }}
    />
  );
}
