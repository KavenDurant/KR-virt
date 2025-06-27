/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-27 14:18:27
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-27 14:40:11
 * @FilePath: /KR-virt/src/components/TokenRefreshFailureModal/index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from "react";
import { Modal, Typography, Space, Alert } from "antd";
import { ExclamationCircleOutlined, WarningOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

interface TokenRefreshFailureModalProps {
  open: boolean;
  message: string;
  onClose?: () => void;
}

/**
 * Token刷新失败模态框组件
 * 用于替换浏览器原生的alert提醒
 */
const TokenRefreshFailureModal: React.FC<TokenRefreshFailureModalProps> = ({
  open,
  message,
  onClose,
}) => {
  const handleOk = () => {
    onClose?.();
    // 跳转到登录页
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
  };

  // 判断是否是多次失败的情况
  const isMultipleFailures =
    message.includes("多次失败") || message.includes("达到最大重试次数");

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: "#faad14" }} />
          <span>身份验证失败</span>
        </Space>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleOk}
      closable={false} // 移除右上角关闭icon
      maskClosable={false} // 禁止点击遮罩关闭
      keyboard={false} // 禁止ESC键关闭
      cancelButtonProps={{ style: { display: "none" } }}
      okText="重新登录"
      width={480}
      centered
      destroyOnClose
    >
      <div style={{ padding: "16px 0" }}>
        {isMultipleFailures && (
          <Alert
            message="安全提醒"
            description="系统检测到多次身份验证失败，为保护您的账户安全，已自动退出登录。"
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Paragraph>
          <Text>{message}</Text>
        </Paragraph>

        <div style={{ fontSize: "12px", color: "#666", marginTop: 16 }}>
          <Text type="secondary">
            点击"重新登录"按钮将跳转到登录页面，请使用正确的凭据重新登录。
          </Text>
        </div>

        {isMultipleFailures && (
          <div style={{ fontSize: "12px", color: "#ff4d4f", marginTop: 8 }}>
            <Text type="secondary">
              如果问题持续出现，请联系系统管理员或检查网络连接。
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TokenRefreshFailureModal;
