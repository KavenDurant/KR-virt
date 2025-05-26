/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-22 17:54:37
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-05-27 10:00:00
 * @FilePath: /KR-virt/src/router/index.tsx
 * @Description: 路由配置 - 包含认证和权限控制
 */
import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import routes from "./routes";
import AppLayout from "../components/Layout";
import AuthGuard from "../components/AuthGuard";
import Login from "../pages/Auth/Login";

const Router: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* 登录路由 */}
        <Route path="/login" element={<Login />} />

        {/* 受保护的路由 */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          {/* 默认重定向到仪表盘 */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* 应用路由 */}
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<AuthGuard>{route.element}</AuthGuard>}
            />
          ))}
        </Route>

        {/* 兜底重定向 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default Router;
