/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-10 15:30:00
 * @Description: 应用启动守卫 - 检查集群状态和用户认证
 */
import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ClusterInitPage from "@/pages/ClusterInit";
import Login from "@/pages/Auth/Login";
import { clusterInitService } from "@/services/cluster";
import { loginService } from "@/services/login";
import { CookieUtils } from "@/utils/cookies";
// 在开发环境中加载测试工具
// if (import.meta.env.DEV) {
//   import("@/utils/tokenRefreshTestUtils");
// }
import type { ClusterStatusResponse } from "@/services/cluster/types";

type AppState = "loading" | "cluster-init" | "login" | "app";

const AppBootstrap: React.FC = () => {
  const [appState, setAppState] = useState<AppState>("loading");
  const [clusterStatus, setClusterStatus] =
    useState<ClusterStatusResponse | null>(null);
  const navigate = useNavigate();

  // Token自动刷新初始化
  useEffect(() => {
    console.log("🔧 应用启动器：初始化Token自动刷新...");

    // 清理可能存在的无效Token
    const hasInvalidToken = loginService.cleanupInvalidToken();
    if (hasInvalidToken) {
      console.warn("⚠️ 发现并清理了无效Token");
    }

    // 如果用户已登录，启动自动刷新
    if (loginService.isAuthenticated()) {
      console.log("👤 用户已登录，启动Token自动刷新");
      loginService.startGlobalTokenRefresh();

      // 打印自动刷新状态
      const status = loginService.getAutoRefreshStatus();
      console.log("🔄 Token自动刷新状态:", status);
    } else {
      console.log("❌ 用户未登录，跳过Token自动刷新");
    }

    // 清理函数：在组件卸载时停止自动刷新
    return () => {
      console.log("🛑 应用关闭，停止Token自动刷新");
      loginService.stopGlobalTokenRefresh();
    };
  }, []);

  const checkApplicationState = React.useCallback(async () => {
    try {
      // 检查集群状态
      const status = await clusterInitService.checkClusterStatus();
      setClusterStatus(status); // 保存状态

      if (!status.is_ready) {
        // 集群未就绪，需要初始化
        setAppState("cluster-init");
        return;
      }

      // 集群已就绪，检查用户认证状态
      const token = CookieUtils.getToken();
      if (!token) {
        // 未登录，跳转到登录页
        setAppState("login");
      } else {
        // 已登录，跳转到主应用
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("检查应用状态失败:", error);
      // 出错时默认跳转到集群初始化
      setAppState("cluster-init");
    }
  }, [navigate]);

  useEffect(() => {
    checkApplicationState();
  }, [checkApplicationState]);

  const handleClusterInitComplete = () => {
    // 集群初始化完成，跳转到登录页
    setAppState("login");
  };

  const handleLoginSuccess = () => {
    // 登录成功，重新检查应用状态并跳转
    checkApplicationState();
  };

  const renderLoadingPage = () => (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Spin
        indicator={
          <LoadingOutlined style={{ fontSize: 48, color: "#ffffff" }} spin />
        }
        style={{ marginBottom: "16px" }}
      />
      <div style={{ color: "#ffffff", fontSize: "16px" }}>正在启动应用...</div>
    </div>
  );

  switch (appState) {
    case "loading":
      return renderLoadingPage();

    case "cluster-init":
      return (
        <ClusterInitPage
          onComplete={handleClusterInitComplete}
          initialStatus={clusterStatus || undefined}
        />
      );

    case "login":
      return <Login onLoginSuccess={handleLoginSuccess} />;

    default:
      return renderLoadingPage();
  }
};

export default AppBootstrap;
