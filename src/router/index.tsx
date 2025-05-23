/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-22 17:54:37
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-05-22 18:01:23
 * @FilePath: /KR-virt/src/router/index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import routes from "./routes";
import AppLayout from "../components/Layout";

const Router: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/virtual-machine" replace />} />
        <Route path="/" element={<AppLayout />}>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default Router;
