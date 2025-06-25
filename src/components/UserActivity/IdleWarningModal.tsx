/**
 * 空闲警告弹窗组件
 */

import React, { useEffect, useState } from 'react';
import { Modal, Button, Progress, Space, Typography, Alert } from 'antd';
import { ExclamationCircleOutlined, ClockCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import type { IdleWarningModalProps } from './types';
import { formatTime } from '@/utils/userActivityUtils';

const { Title, Text } = Typography;

const IdleWarningModal: React.FC<IdleWarningModalProps> = ({
  visible,
  remainingTime,
  onContinue,
  onLogout,
  onCancel,
  title = '会话即将过期',
  description,
  showCountdown = true,
  closable = false,
  mask = true,
  maskClosable = false,
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(remainingTime / 1000));
  const [isAutoLogout, setIsAutoLogout] = useState(false);

  // 更新倒计时
  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      const newCountdown = Math.ceil(remainingTime / 1000);
      setCountdown(newCountdown);

      // 倒计时结束，自动登出
      if (newCountdown <= 0 && !isAutoLogout) {
        setIsAutoLogout(true);
        onLogout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, remainingTime, onLogout, isAutoLogout]);

  // 重置状态
  useEffect(() => {
    if (visible) {
      setIsAutoLogout(false);
      setCountdown(Math.ceil(remainingTime / 1000));
    }
  }, [visible, remainingTime]);

  // 计算进度百分比
  const progressPercent = Math.max(0, (countdown / Math.ceil(remainingTime / 1000)) * 100);

  // 获取进度条颜色
  const getProgressColor = () => {
    if (countdown <= 5) return '#ff4d4f'; // 红色
    if (countdown <= 10) return '#faad14'; // 橙色
    return '#1890ff'; // 蓝色
  };

  // 处理键盘事件
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!visible) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          event.stopPropagation(); // 阻止事件冒泡
          onContinue();
          break;
        case 'Escape':
          // 在超时警告中，Esc键也应该执行"继续使用"操作
          // 而不是简单的关闭，这样更符合用户期望
          event.preventDefault();
          event.stopPropagation(); // 阻止事件冒泡
          if (closable && onCancel) {
            onCancel();
          } else {
            // 如果没有onCancel或不可关闭，则执行继续使用
            onContinue();
          }
          break;
      }
    };

    // 使用capture模式，确保在其他监听器之前处理
    document.addEventListener('keydown', handleKeyPress, true);
    return () => document.removeEventListener('keydown', handleKeyPress, true);
  }, [visible, onContinue, onCancel, closable]);

  const defaultDescription = (
    <div>
      <Text>
        由于您已经有一段时间没有操作，为了保护您的账户安全，系统将在
        <Text strong style={{ color: getProgressColor() }}>
          {showCountdown ? ` ${countdown} 秒` : ' 短时间'}
        </Text>
        后自动登出。
      </Text>
      <br />
      <Text type="secondary">
        如果您希望继续使用系统，请点击"继续使用"按钮。
      </Text>
    </div>
  );

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          {title}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      closable={closable}
      mask={mask}
      maskClosable={maskClosable}
      width={480}
      centered
      destroyOnClose
      footer={null}
      className="idle-warning-modal"
      style={{ userSelect: 'none' }}
    >
      <div style={{ padding: '16px 0' }}>
        {/* 警告信息 */}
        <Alert
          message="会话即将过期"
          description={description || defaultDescription}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* 倒计时进度条 */}
        {showCountdown && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text strong>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                剩余时间
              </Text>
              <Text strong style={{ color: getProgressColor() }}>
                {formatTime(countdown * 1000)}
              </Text>
            </div>
            <Progress
              percent={progressPercent}
              strokeColor={getProgressColor()}
              trailColor="#f0f0f0"
              strokeWidth={8}
              showInfo={false}
              status={countdown <= 5 ? 'exception' : 'normal'}
            />
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Button
            type="primary"
            size="large"
            onClick={onContinue}
            disabled={isAutoLogout}
            style={{ minWidth: 120 }}
          >
            继续使用
          </Button>
          <Button
            size="large"
            onClick={onLogout}
            disabled={isAutoLogout}
            icon={<LogoutOutlined />}
            style={{ minWidth: 120 }}
          >
            立即登出
          </Button>
        </div>

        {/* 提示信息 */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            您也可以按 <Text code>Enter</Text> 键继续使用，或按 <Text code>Esc</Text> 键{closable ? '关闭' : ''}
          </Text>
        </div>

        {/* 自动登出状态 */}
        {isAutoLogout && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              正在自动登出...
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default IdleWarningModal;
