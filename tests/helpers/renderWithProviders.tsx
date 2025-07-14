/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-02 19:13:46
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-09 11:57:05
 * @FilePath: /KR-virt/tests/helpers/renderWithProviders.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 带Provider的渲染工具
 * 提供包含Redux、Router、Theme等Provider的测试渲染环境
 */

import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, App } from "antd";
import { store } from "@/store";
import { ThemeProvider } from "@/contexts/ThemeContext";

// 扩展的渲染选项
interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
  store?: unknown;
  theme?: "light" | "dark";
}

// 创建包含所有Provider的包装器
const createWrapper = (options: ExtendedRenderOptions = {}) => {
  const { store: customStore } = options;

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={(customStore || store) as never}>
      <BrowserRouter>
        <ThemeProvider>
          <ConfigProvider>
            <App>{children}</App>
          </ConfigProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

// 自定义渲染函数
export const renderWithProviders = (
  ui: React.ReactElement,
  options: ExtendedRenderOptions = {},
) => {
  const { store: customStore, ...renderOptions } = options;

  const Wrapper = createWrapper({ store: customStore });

  return {
    store: customStore || store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

// 简化的渲染函数，只包含基本Provider
export const renderWithBasicProviders = (
  ui: React.ReactElement,
  options: RenderOptions = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ConfigProvider>
      <App>{children}</App>
    </ConfigProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// 只包含Redux的渲染函数
export const renderWithRedux = (
  ui: React.ReactElement,
  { store: customStore, ...options }: { store?: unknown } & RenderOptions = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={(customStore || store) as never}>{children}</Provider>
  );

  return {
    store: customStore || store,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
};

// 只包含Router的渲染函数
export const renderWithRouter = (
  ui: React.ReactElement,
  { ...options }: { initialEntries?: string[] } & RenderOptions = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};
