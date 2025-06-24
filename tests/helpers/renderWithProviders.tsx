/**
 * 带Provider的渲染工具
 * 提供包含Redux、Router、Theme等Provider的测试渲染环境
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { store } from '@/store';
import { ThemeProvider } from '@/contexts/ThemeContext';

// 扩展的渲染选项
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  store?: any;
  theme?: 'light' | 'dark';
}

// 创建包含所有Provider的包装器
const createWrapper = (options: ExtendedRenderOptions = {}) => {
  const { initialEntries = ['/'], store: customStore, theme = 'light' } = options;

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={customStore || store}>
      <BrowserRouter>
        <ThemeProvider>
          <ConfigProvider>
            <App>
              {children}
            </App>
          </ConfigProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

// 自定义渲染函数
export const renderWithProviders = (
  ui: React.ReactElement,
  options: ExtendedRenderOptions = {}
) => {
  const { store: customStore, theme, initialEntries, ...renderOptions } = options;
  
  const Wrapper = createWrapper({ initialEntries, store: customStore, theme });

  return {
    store: customStore || store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

// 简化的渲染函数，只包含基本Provider
export const renderWithBasicProviders = (
  ui: React.ReactElement,
  options: RenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ConfigProvider>
      <App>
        {children}
      </App>
    </ConfigProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// 只包含Redux的渲染函数
export const renderWithRedux = (
  ui: React.ReactElement,
  { store: customStore, ...options }: { store?: any } & RenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={customStore || store}>
      {children}
    </Provider>
  );

  return {
    store: customStore || store,
    ...render(ui, { wrapper: Wrapper, ...options })
  };
};

// 只包含Router的渲染函数
export const renderWithRouter = (
  ui: React.ReactElement,
  { initialEntries = ['/'], ...options }: { initialEntries?: string[] } & RenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};
