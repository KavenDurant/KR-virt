import React, { useState, useEffect } from "react";
import { Modal, Input, Alert, Typography, Space } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

export interface SafetyConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText: string;
  placeholder?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  warning?: string;
  loading?: boolean;
  danger?: boolean;
}

const SafetyConfirmModal: React.FC<SafetyConfirmModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  title,
  description,
  confirmText,
  placeholder,
  confirmButtonText = "确认",
  cancelButtonText = "取消",
  warning,
  loading = false,
  danger = true,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState(false);

  // 重置状态当模态框关闭或打开时
  useEffect(() => {
    if (visible) {
      setInputValue("");
      setIsValid(false);
    }
  }, [visible]);

  // 验证输入是否完全匹配确认文本
  useEffect(() => {
    setIsValid(inputValue.trim() === confirmText.trim());
  }, [inputValue, confirmText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) {
      handleConfirm();
    }
  };

  return (
    <Modal
      title={
        <Space>
          {danger && (
            <ExclamationCircleOutlined 
              style={{ color: "#ff4d4f", fontSize: "16px" }} 
            />
          )}
          {title}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText={confirmButtonText}
      cancelText={cancelButtonText}
      okType={danger ? "danger" : "primary"}
      okButtonProps={{
        disabled: !isValid,
        loading: loading,
      }}
      destroyOnClose
      width={520}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* 操作描述 */}
        {description && (
          <Paragraph style={{ marginBottom: 16 }}>
            {description}
          </Paragraph>
        )}

        {/* 安全警告 */}
        {warning && (
          <Alert
            message="安全警告"
            description={warning}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 确认文本输入提示 */}
        <div style={{ marginBottom: 8 }}>
          <Text strong>
            请输入 <Text code style={{ color: "#d32f2f" }}>{confirmText}</Text> 以确认此操作：
          </Text>
        </div>

        {/* 输入框 */}
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || `请输入 "${confirmText}"`}
          autoFocus
          status={inputValue && !isValid ? "error" : undefined}
          style={{
            fontFamily: "Monaco, 'Lucida Console', monospace",
            fontSize: "14px",
          }}
        />

        {/* 输入验证提示 */}
        {inputValue && !isValid && (
          <Text type="secondary" style={{ fontSize: "12px" }}>
            输入的文本必须完全匹配才能继续操作
          </Text>
        )}

        {/* 匹配成功提示 */}
        {isValid && (
          <Text type="success" style={{ fontSize: "12px" }}>
            ✓ 文本匹配成功，可以执行操作
          </Text>
        )}
      </Space>
    </Modal>
  );
};

export default SafetyConfirmModal;