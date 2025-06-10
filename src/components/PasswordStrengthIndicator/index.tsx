/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-27 10:00:00
 * @Description: 密码强度指示器组件
 */

import React from "react";
import { Progress, Typography, Space } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { PasswordStrength } from "@/utils/security";
import type { PasswordValidationResult } from "@/utils/security";

const { Text } = Typography;

interface PasswordStrengthIndicatorProps {
  password: string;
  validation: PasswordValidationResult;
  showSuggestions?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  validation,
  showSuggestions = true,
}) => {
  // 获取进度条颜色
  const getProgressColor = (strength: PasswordStrength): string => {
    switch (strength) {
      case PasswordStrength.WEAK:
        return "#ff4d4f";
      case PasswordStrength.MEDIUM:
        return "#faad14";
      case PasswordStrength.STRONG:
        return "#52c41a";
      case PasswordStrength.VERY_STRONG:
        return "#1890ff";
      default:
        return "#d9d9d9";
    }
  };

  // 获取强度文本
  const getStrengthText = (strength: PasswordStrength): string => {
    switch (strength) {
      case PasswordStrength.WEAK:
        return "弱";
      case PasswordStrength.MEDIUM:
        return "中等";
      case PasswordStrength.STRONG:
        return "强";
      case PasswordStrength.VERY_STRONG:
        return "很强";
      default:
        return "";
    }
  };

  // 计算进度百分比
  const getProgressPercent = (score: number): number => {
    return Math.min((score / 9) * 100, 100);
  };

  if (!password) {
    return null;
  }

  return (
    <div style={{ marginTop: 8 }}>
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {/* 强度进度条 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Progress
            percent={getProgressPercent(validation.score)}
            size="small"
            strokeColor={getProgressColor(validation.strength)}
            showInfo={false}
            style={{ flex: 1 }}
          />
          <Text
            style={{
              color: getProgressColor(validation.strength),
              fontSize: "12px",
              fontWeight: 500,
              minWidth: "32px",
            }}
          >
            {getStrengthText(validation.strength)}
          </Text>
        </div>

        {/* 安全状态指示 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {validation.isValid ? (
            <>
              <CheckCircleOutlined
                style={{ color: "#52c41a", fontSize: "12px" }}
              />
              <Text style={{ color: "#52c41a", fontSize: "12px" }}>
                符合安全要求
              </Text>
            </>
          ) : (
            <>
              <ExclamationCircleOutlined
                style={{ color: "#faad14", fontSize: "12px" }}
              />
              <Text style={{ color: "#faad14", fontSize: "12px" }}>
                需要增强安全性
              </Text>
            </>
          )}
        </div>

        {/* 改进建议 */}
        {showSuggestions && validation.suggestions.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <Text style={{ fontSize: "11px", color: "#8c8c8c" }}>
              建议：{validation.suggestions.slice(0, 2).join("，")}
              {validation.suggestions.length > 2 && "..."}
            </Text>
          </div>
        )}
      </Space>
    </div>
  );
};

export default PasswordStrengthIndicator;
