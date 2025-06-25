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
// 在开发环境中加载诊断工具
if (import.meta.env.DEV) {
  import("@/utils/tokenRefreshDiagnostic");
}
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

    // 检查当前登录状态
    const isAuthenticated = loginService.isAuthenticated();
    const token = loginService.getToken();
    const user = loginService.getCurrentUser();

    console.log("📊 当前状态检查:");
    console.log("  - 认证状态:", isAuthenticated);
    console.log("  - Token存在:", !!token);
    console.log("  - 用户信息:", !!user);

    // 如果用户已登录，启动自动刷新
    if (isAuthenticated) {
      console.log("👤 用户已登录，启动Token自动刷新");
      loginService.startGlobalTokenRefresh();

      // 打印自动刷新状态
      const status = loginService.getAutoRefreshStatus();
      console.log("🔄 Token自动刷新状态:", status);

      // 在开发环境中额外打印调试信息
      if (import.meta.env.DEV) {
        setTimeout(() => {
          console.log("🔍 5秒后检查自动刷新状态:");
          const laterStatus = loginService.getAutoRefreshStatus();
          console.log("  - 运行状态:", laterStatus.isRunning);
          console.log("  - 刷新状态:", laterStatus.isRefreshing);

          // 检查定时器是否真的在运行
          if (laterStatus.isRunning) {
            console.log("✅ Token自动刷新定时器正在运行");
            console.log("⏰ 等待下次自动刷新触发...");
          } else {
            console.log("❌ Token自动刷新定时器未运行！");
            console.log("🔧 尝试重新启动...");
            loginService.startGlobalTokenRefresh();
          }
        }, 5000);

        // 15秒后再次检查
        setTimeout(() => {
          console.log("🔍 15秒后再次检查:");
          const finalStatus = loginService.getAutoRefreshStatus();
          console.log("最终状态:", finalStatus);
        }, 15000);
      }
    } else {
      console.log("❌ 用户未登录，跳过Token自动刷新");
    }

    // 修复：不在组件卸载时停止Token自动刷新
    // Token自动刷新应该在整个应用生命周期中保持运行
    // 只有在用户主动登出时才停止
    return () => {
      console.log("🔧 AppBootstrap组件卸载，但保持Token自动刷新运行");
      // 注释掉这行，避免导航时停止Token自动刷新
      // loginService.stopGlobalTokenRefresh();
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
