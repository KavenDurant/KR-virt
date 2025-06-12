/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群处理中页面 - 显示创建或加入进度
 */

import React, { useEffect, useState } from "react";
import { Card, Typography, Spin, Progress, Space, Button, Result } from "antd";
import { LoadingOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useTheme } from "@/hooks/useTheme";
import type {
  ClusterConfigType,
  CreateClusterConfig,
  JoinClusterConfig,
} from "@/services/cluster/types";

const { Title, Text, Paragraph } = Typography;

interface ClusterProcessingPageProps {
  type: ClusterConfigType;
  config: CreateClusterConfig | JoinClusterConfig;
  onComplete: () => void;
  onRetry: () => void;
}

const ClusterProcessingPage: React.FC<ClusterProcessingPageProps> = ({
  type,
  config,
  onComplete,
  onRetry,
}) => {
  const { themeConfig } = useTheme();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isCreate = type === "create";
  const title = isCreate ? "创建集群中" : "加入集群中";

  // 模拟进度更新
  useEffect(() => {
    const steps = isCreate
      ? [
          { step: "初始化集群配置...", progress: 10 },
          { step: "创建控制平面...", progress: 30 },
          { step: "配置网络组件...", progress: 50 },
          { step: "启动系统服务...", progress: 70 },
          { step: "验证集群状态...", progress: 90 },
          { step: "集群创建完成", progress: 100 },
        ]
      : [
          { step: "连接主节点...", progress: 15 },
          { step: "验证加入令牌...", progress: 35 },
          { step: "下载集群配置...", progress: 55 },
          { step: "配置本地节点...", progress: 75 },
          { step: "注册到集群...", progress: 95 },
          { step: "加入集群完成", progress: 100 },
        ];

    // 立即设置第一步
    setCurrentStep(steps[0].step);
    setProgress(5); // 设置一个小的初始进度值

    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex < steps.length) {
        const current = steps[currentIndex];
        setCurrentStep(current.step);
        setProgress(current.progress);

        if (current.progress === 100) {
          setIsCompleted(true);
          clearInterval(timer);
          // 模拟完成后等待一会再调用完成回调
          setTimeout(() => {
            onComplete();
          }, 2000);
        }

        currentIndex++;
      }
    }, 2000); // 每2秒更新一次

    // 模拟可能的错误（10%概率）
    const errorTimer = setTimeout(() => {
      if (Math.random() < 0.1) {
        setHasError(true);
        setCurrentStep("配置过程中出现错误");
        clearInterval(timer);
      }
    }, 8000);

    return () => {
      clearInterval(timer);
      clearTimeout(errorTimer);
    };
  }, [type, isCreate, onComplete]);

  const renderConfig = () => {
    if (isCreate) {
      const createConfig = config as CreateClusterConfig;
      return (
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>选择的IP地址：</Text>
            <Text>{createConfig.selectedIp}</Text>
          </div>
          <div>
            <Text strong>节点角色：</Text>
            <Text>主节点 (Master)</Text>
          </div>
        </Space>
      );
    } else {
      const joinConfig = config as JoinClusterConfig;
      return (
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>主节点地址：</Text>
            <Text>
              {joinConfig.masterNodeIp}:{joinConfig.masterNodePort}
            </Text>
          </div>
          <div>
            <Text strong>节点角色：</Text>
            <Text>工作节点</Text>
          </div>
          <div>
            <Text strong>加入令牌：</Text>
            <Text>{"*".repeat(20)}</Text>
          </div>
          {joinConfig.description && (
            <div>
              <Text strong>描述：</Text>
              <Text>{joinConfig.description}</Text>
            </div>
          )}
        </Space>
      );
    }
  };

  if (hasError) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "20px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: 600,
            maxHeight: "calc(100vh - 40px)",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
          }}
          variant="borderless"
        >
          <Result
            status="error"
            title={`${isCreate ? "创建" : "加入"}集群失败`}
            subTitle="配置过程中遇到错误，请检查网络连接和配置信息后重试"
            extra={[
              <Button type="primary" key="retry" onClick={onRetry}>
                重试
              </Button>,
              <Button key="back" onClick={() => window.location.reload()}>
                返回配置
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >        <Card
          style={{
            width: "100%",
            maxWidth: 600,
            maxHeight: "calc(100vh - 40px)",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
          }}
          variant="borderless"
        >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          {isCompleted ? (
            <CheckCircleOutlined
              style={{
                fontSize: "48px",
                color: "#52c41a",
                marginBottom: "16px",
              }}
            />
          ) : (
            <Spin
              indicator={
                <LoadingOutlined
                  style={{ fontSize: 48, color: "#667eea" }}
                  spin
                />
              }
              style={{ marginBottom: "16px" }}
            />
          )}

          <Title level={2} style={{ marginBottom: "8px" }}>
            {isCompleted ? `${isCreate ? "创建" : "加入"}集群完成` : title}
          </Title>

          <Text type="secondary">
            {isCompleted
              ? `恭喜！集群${
                  isCreate ? "创建" : "加入"
                }已完成，系统将自动跳转到登录页面`
              : "请耐心等待，正在处理您的请求..."}
          </Text>
        </div>

        {/* 进度条 */}
        <div style={{ 
          marginBottom: "32px",
          padding: "16px",
          backgroundColor: themeConfig.token.colorBgContainer,
          borderRadius: "8px",
          border: `1px solid ${themeConfig.token.colorBorder}`
        }}>
          <Progress
            percent={progress}
            status={isCompleted ? "success" : "active"}
            strokeColor={{
              "0%": "#667eea",
              "100%": "#764ba2",
            }}
            strokeWidth={10}
            trailColor={themeConfig.token.colorBorderSecondary}
            showInfo={true}
            format={(percent) => `${percent}%`}
          />
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <Text type="secondary" style={{ fontSize: "14px", fontWeight: 500 }}>
              {currentStep}
            </Text>
          </div>
        </div>

        {/* 配置信息 */}
        <Card
          title={`${isCreate ? "创建" : "加入"}配置信息`}
          size="small"
          style={{ backgroundColor: themeConfig.token.colorFillSecondary }}
        >
          {renderConfig()}
        </Card>

        {isCompleted && (
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Paragraph type="secondary">
              系统将在 2 秒后自动跳转到登录页面...
            </Paragraph>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ClusterProcessingPage;
