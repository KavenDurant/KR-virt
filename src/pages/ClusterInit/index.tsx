/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 集群初始化主页面 - 协调整个初始化流程
 */

import React, { useState, useEffect, useRef } from "react";
import { Spin, App } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import ClusterAuthPage from "./ClusterAuthPage";
import ClusterConfigPage from "./ClusterConfigPage";
import ClusterProcessingPage from "./ClusterProcessingPage";
import { clusterInitService } from "@/services/cluster";
import type {
  ClusterInitStep,
  ClusterStatusResponse,
  ClusterConfigType,
  CreateClusterConfig,
  JoinClusterConfig,
} from "@/services/cluster/types";

interface ClusterInitPageProps {
  onComplete: () => void;
  initialStatus?: ClusterStatusResponse; // 从AppBootstrap传入的初始状态
}

const ClusterInitPage: React.FC<ClusterInitPageProps> = ({
  onComplete,
  initialStatus,
}) => {
  const { message } = App.useApp();
  const [currentStep, setCurrentStep] = useState<ClusterInitStep>("checking");
  const [clusterStatus, setClusterStatus] =
    useState<ClusterStatusResponse | null>(initialStatus || null);
  const [configType, setConfigType] = useState<ClusterConfigType>("create");
  const [clusterConfig, setClusterConfig] = useState<
    CreateClusterConfig | JoinClusterConfig | null
  >(null);
  const [loading, setLoading] = useState(false);
  const hasCheckedStatus = useRef(false);

  // 检查集群状态
  useEffect(() => {
    // 如果有初始状态，直接处理，不需要再次调用API
    if (initialStatus) {
      console.log("使用AppBootstrap传入的初始状态:", initialStatus);
      setClusterStatus(initialStatus);

      if (initialStatus.is_ready) {
        onComplete();
      } else if (initialStatus.is_creating) {
        setCurrentStep("processing");
        setConfigType("create");
      } else if (initialStatus.is_joining) {
        setCurrentStep("processing");
        setConfigType("join");
      } else {
        setCurrentStep("auth");
      }
      return;
    }

    // 只有在没有初始状态时才调用API
    if (hasCheckedStatus.current) return;

    const checkStatus = async () => {
      try {
        hasCheckedStatus.current = true;
        setLoading(true);
        console.log("ClusterInitPage: 调用checkClusterStatus API");
        const status = await clusterInitService.checkClusterStatus();
        setClusterStatus(status);

        if (status.is_ready) {
          // 如果集群已就绪，直接完成初始化
          onComplete();
        } else if (status.is_creating) {
          // 如果正在创建，跳转到处理页面
          setCurrentStep("processing");
          setConfigType("create");
        } else if (status.is_joining) {
          // 如果正在加入，跳转到处理页面
          setCurrentStep("processing");
          setConfigType("join");
        } else {
          // 需要进行配置
          setCurrentStep("auth");
        }
      } catch (error) {
        console.error("检查集群状态失败:", error);
        message.error("无法获取集群状态，请检查网络连接");
        // 即使失败也允许用户进行配置
        setCurrentStep("auth");
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [initialStatus, onComplete, message]); // 添加必要的依赖

  const handleAuthSuccess = (token: string) => {
    console.log("认证成功，token:", token);
    setCurrentStep("config");
  };

  const handleConfigSubmit = async (
    type: ClusterConfigType,
    config: CreateClusterConfig | JoinClusterConfig,
    additionalData?: { hostname?: string },
  ) => {
    try {
      setLoading(true);
      setConfigType(type);
      setClusterConfig(config);

      // 调用相应的API
      let result;
      if (type === "create") {
        result = await clusterInitService.createCluster(
          config as CreateClusterConfig,
          additionalData?.hostname || "",
        );
      } else {
        result = await clusterInitService.joinCluster(
          config as JoinClusterConfig,
        );
      }

      if (result.success) {
        message.success(result.message);
        setCurrentStep("processing");
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error("提交配置失败:", error);
      message.error("提交失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessingComplete = () => {
    // 清除认证token
    clusterInitService.clearAuthToken();
    // 完成初始化流程
    onComplete();
  };

  const handleProcessingRetry = () => {
    // 重新回到配置页面
    setCurrentStep("config");
  };

  // 渲染加载页面
  const renderLoadingPage = () => (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Spin
        indicator={
          <LoadingOutlined style={{ fontSize: 48, color: "#ffffff" }} spin />
        }
        style={{ marginBottom: "16px" }}
      />
      <div style={{ color: "#ffffff", fontSize: "16px" }}>
        正在检查集群状态...
      </div>
    </div>
  );

  // 根据当前步骤渲染对应页面
  switch (currentStep) {
    case "checking":
      return renderLoadingPage();

    case "auth":
      return (
        <ClusterAuthPage onSuccess={handleAuthSuccess} loading={loading} />
      );

    case "config":
      return (
        <ClusterConfigPage
          initialType={configType}
          isCreating={clusterStatus?.is_creating}
          isJoining={clusterStatus?.is_joining}
          onSubmit={handleConfigSubmit}
          loading={loading}
        />
      );

    case "processing":
      if (!clusterConfig) {
        // 如果没有配置信息，回到配置页面
        setCurrentStep("config");
        return null;
      }

      return (
        <ClusterProcessingPage
          type={configType}
          config={clusterConfig}
          onComplete={handleProcessingComplete}
          onRetry={handleProcessingRetry}
        />
      );

    default:
      return renderLoadingPage();
  }
};

export default ClusterInitPage;
