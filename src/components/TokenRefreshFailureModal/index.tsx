/**
 * Token刷新失败Modal组件
 * 用于替换原生alert，提供更好的用户体验
 */

import React, { useState, useEffect } from "react";
import { Modal, Button, Alert, Typography, Space, Progress } from "antd";
import {
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import "./index.less";

const { Title, Text } = Typography;

export interface TokenRefreshFailureModalProps {
  /** 是否显示Modal */
  visible: boolean;
  /** 关闭Modal的回调 */
  onClose?: () => void;
  /** 确认跳转到登录页的回调 */
  onConfirm?: () => void;
  /** 重试刷新Token的回调 */
  onRetry?: () => Promise<void>;
  /** 错误消息 */
  message: string;
  /** 失败原因 */
  reason?: string;
  /** 自动跳转倒计时时间（秒），默认5秒 */
  countdown?: number;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 是否自动跳转 */
  autoRedirect?: boolean;
}

const TokenRefreshFailureModal: React.FC<TokenRefreshFailureModalProps> = ({
  visible,
  onClose,
  onConfirm,
  onRetry,
  message,
  reason,
  countdown = 5,
  showRetry = false,
  autoRedirect = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(countdown);
  const [isRetrying, setIsRetrying] = useState(false);

  // 倒计时逻辑
  useEffect(() => {
    if (!visible || !autoRedirect) {
      setTimeLeft(countdown);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 自动确认跳转
          onConfirm?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, autoRedirect, countdown, onConfirm]);

  // 重置倒计时
  useEffect(() => {
    if (visible) {
      setTimeLeft(countdown);
      setIsRetrying(false);
    }
  }, [visible, countdown]);

  // 处理重试
  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
      // 如果重试成功，Modal会被外部关闭
    } catch (error) {
      console.error("重试刷新Token失败:", error);
      // 重试失败，继续显示Modal
    } finally {
      setIsRetrying(false);
    }
  };

  // 获取错误类型对应的提示
  const getErrorTypeInfo = () => {
    if (!reason) return { type: "error", title: "认证失败" };

    if (reason.includes("网络") || reason.includes("network")) {
      return { type: "warning", title: "网络连接异常" };
    }

    if (reason.includes("已失效") || reason.includes("expired")) {
      return { type: "error", title: "登录状态已过期" };
    }

    if (reason.includes("401") || reason.includes("403")) {
      return { type: "error", title: "身份验证失败" };
    }

    return { type: "error", title: "Token验证失败" };
  };

  const errorInfo = getErrorTypeInfo();
  const progressPercent = autoRedirect
    ? ((countdown - timeLeft) / countdown) * 100
    : 0;

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined
            style={{
              color: errorInfo.type === "warning" ? "#faad14" : "#ff4d4f",
              fontSize: "16px",
            }}
          />
          {errorInfo.title}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      closable={false}
      maskClosable={false}
      width={520}
      centered
      destroyOnClose
      className="token-refresh-failure-modal"
      footer={[
        // 重试按钮（如果支持）
        showRetry && onRetry && (
          <Button
            key="retry"
            icon={<ReloadOutlined />}
            onClick={handleRetry}
            loading={isRetrying}
            disabled={timeLeft <= 0}
          >
            重试刷新
          </Button>
        ),
        // 立即跳转按钮
        <Button
          key="confirm"
          type="primary"
          icon={<LogoutOutlined />}
          onClick={onConfirm}
          disabled={isRetrying}
        >
          立即跳转登录
        </Button>,
      ].filter(Boolean)}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* 主要错误信息 */}
        <Alert
          message={message}
          description={
            reason && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">失败原因：{reason}</Text>
              </div>
            )
          }
          type={errorInfo.type as "error" | "warning"}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 自动跳转倒计时 */}
        {autoRedirect && timeLeft > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Space>
                <ClockCircleOutlined />
                <Text strong>
                  系统将在 <Text type="danger">{timeLeft}</Text>{" "}
                  秒后自动跳转到登录页
                </Text>
              </Space>
            </div>
            <Progress
              percent={progressPercent}
              strokeColor="#ff4d4f"
              trailColor="#f0f0f0"
              strokeWidth={6}
              showInfo={false}
              status={timeLeft <= 2 ? "exception" : "normal"}
              className={
                timeLeft <= 2
                  ? "countdown-progress urgent"
                  : "countdown-progress"
              }
            />
          </div>
        )}

        {/* 操作提示 */}
        <div className="info-section">
          <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
            为了保护您的账户安全：
          </Title>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>系统已自动清除本地认证信息</li>
            <li>请重新登录以继续使用系统</li>
            {showRetry && <li>如果是网络问题，您可以尝试重试刷新</li>}
          </ul>
        </div>

        {/* 键盘提示 */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            您也可以按 <Text code>Enter</Text> 键立即跳转到登录页
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

// 键盘事件处理
const TokenRefreshFailureModalWithKeyboard: React.FC<
  TokenRefreshFailureModalProps
> = (props) => {
  const { visible, onConfirm } = props;

  useEffect(() => {
    if (!visible) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Enter":
          event.preventDefault();
          onConfirm?.();
          break;
        case "Escape":
          // Token刷新失败时不允许Esc关闭，必须处理
          event.preventDefault();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress, true);
    return () => document.removeEventListener("keydown", handleKeyPress, true);
  }, [visible, onConfirm]);

  return <TokenRefreshFailureModal {...props} />;
};

export default TokenRefreshFailureModalWithKeyboard;
