/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-23 15:59:41
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-30 14:23:32
 * @FilePath: /KR-virt/src/main.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EnvConfig } from "@/config/env";
import "./index.css";
import Router from "@/router";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

// 设置页面标题
document.title = EnvConfig.APP_TITLE;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <ConfigProvider locale={zhCN}>
          <App>
            <Router />
          </App>
        </ConfigProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
