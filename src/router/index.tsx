/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-22 17:54:37
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-10 14:57:41
 * @FilePath: /KR-virt/src/router/index.tsx
 * @Description: 路由配置 - 集成集群状态检查和认证控制
 */
import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { CookieUtils } from "@/utils/cookies";
import AppBootstrap from "@/components/AppBootstrap";
import AppLayout from "@/components/Layout";
import AuthGuard from "@/components/AuthGuard";
import Login from "@/pages/Auth/Login";
import FirstTimeLogin from "@/pages/FirstTimeLogin";

// 验证用户是否已登录的函数
const isUserAuthenticated = () => {
  const token = CookieUtils.getToken();
  return !!token;
};

const Router: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* 集群状态检查和登录的启动页面 */}
        <Route path="/bootstrap" element={<AppBootstrap />} />

        {/* 独立的登录路由 */}
        <Route path="/login" element={<Login />} />

        {/* 首次登录流程路由 */}
        <Route
          path="/first-time-login"
          element={
            <AuthGuard>
              <FirstTimeLogin />
            </AuthGuard>
          }
        />

        {/* 根路由 - 重定向到启动页面 */}
        <Route path="/" element={<Navigate to="/bootstrap" replace />} />

        {/* 受保护的应用路由 - 这些路由都在AppLayout内部 */}
        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        />

        {/* 兜底重定向 */}
        <Route
          path="*"
          element={
            isUserAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/bootstrap" replace />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default Router;
