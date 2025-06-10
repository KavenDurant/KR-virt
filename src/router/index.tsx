/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-22 17:54:37
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-05-27 14:30:40
 * @FilePath: /KR-virt/src/router/index.tsx
 * @Description: 路由配置 - 包含认证和权限控制
 */
import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import routes from "./routes";
import AppLayout from "@/components/Layout";
import AuthGuard from "@/components/AuthGuard";
import Login from "@/pages/Auth/Login";

// 验证用户是否已登录的函数
const isUserAuthenticated = () => {
  const token = localStorage.getItem("kr_virt_token");
  return !!token; // 如果有token则认为已登录
};

const Router: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* 登录路由 */}
        <Route path="/login" element={<Login />} />

        {/* 根路由 - 检查认证状态并重定向 */}
        <Route
          path="/"
          element={
            isUserAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 受保护的路由 */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          {/* 应用路由 */}
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<AuthGuard>{route.element}</AuthGuard>}
            />
          ))}
        </Route>

        {/* 兜底重定向 - 根据认证状态决定去向 */}
        <Route
          path="*"
          element={
            isUserAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default Router;
