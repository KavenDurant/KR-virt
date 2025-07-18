import React, { createContext, useEffect, useState } from "react";
import { ConfigProvider, theme } from "antd";

// 主题类型定义
export type ThemeMode = "light" | "dark" | "auto";

// 自定义主题配置
const customThemes = {
  light: {
    token: {
      colorPrimary: "#1890ff",
      colorBgBase: "#ffffff",
      colorTextBase: "#000000",
      colorBgContainer: "#ffffff",
      colorBgElevated: "#ffffff",
      colorBorder: "#d9d9d9",
      colorBorderSecondary: "#f0f0f0",
      colorFill: "#f5f5f5",
      colorFillSecondary: "#fafafa",
      colorFillTertiary: "#f5f5f5",
      colorFillQuaternary: "#f0f0f0",
      colorBgLayout: "#f5f5f5",
      colorBgSpotlight: "#ffffff",
      colorBgMask: "rgba(0, 0, 0, 0.45)",
      borderRadius: 6,
      boxShadow:
        "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
    },
    components: {
      Tooltip: {
        colorBgSpotlight: "rgba(0, 0, 0, 0.85)",
        colorTextLightSolid: "#ffffff",
      },
    },
    algorithm: theme.defaultAlgorithm,
  },
  dark: {
    token: {
      colorPrimary: "#177ddc",
      colorBgBase: "#1e1e1e",
      colorTextBase: "#cccccc",
      colorBgContainer: "#252526",
      colorBgElevated: "#2d2d30",
      colorBorder: "#3c3c3c",
      colorBorderSecondary: "#404040",
      colorFill: "#1e1e1e",
      colorFillSecondary: "#252526",
      colorFillTertiary: "#2d2d30",
      colorFillQuaternary: "#343434",
      colorBgLayout: "#1e1e1e",
      colorBgSpotlight: "#252526",
      colorBgMask: "rgba(0, 0, 0, 0.45)",
      borderRadius: 6,
      boxShadow:
        "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
    },
    components: {
      Tooltip: {
        colorBgSpotlight: "#434343",
        colorTextLightSolid: "#ffffff",
      },
    },
    algorithm: theme.darkAlgorithm,
  },
};

// 主题上下文类型
export interface ThemeContextType {
  themeMode: ThemeMode;
  actualTheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
  themeConfig: typeof customThemes.light;
}

// 创建主题上下文
// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

// 获取系统主题偏好
const getSystemTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
};

// 主题提供者组件
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // 从 localStorage 获取保存的主题设置
    const saved = localStorage.getItem("kr-virt-theme");
    return (saved as ThemeMode) || "auto";
  });

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme,
  );

  // 计算实际使用的主题
  const actualTheme: "light" | "dark" =
    themeMode === "auto" ? systemTheme : themeMode;
  const themeConfig = customThemes[actualTheme];

  // 设置主题模式
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem("kr-virt-theme", mode);
  };

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // 应用主题到 document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", actualTheme);

    // 为了兼容现有的 less 变量，同时设置 CSS 变量
    const root = document.documentElement;
    if (actualTheme === "dark") {
      root.style.setProperty("--bg-color", "#1e1e1e");
      root.style.setProperty("--text-color", "#cccccc");
      root.style.setProperty("--border-color", "#3c3c3c");
      root.style.setProperty("--resize-handle-color", "#2d2d2d");
      root.style.setProperty("--hover-bg", "#2a2d2e");
      root.style.setProperty("--selected-bg", "#37373d");
      root.style.setProperty("--sidebar-bg", "#252526");
      root.style.setProperty("--activity-bar-bg", "#333333");
      root.style.setProperty("--activity-bar-selected", "#444444");
      root.style.setProperty("--activity-bar-icon", "#858585");
      root.style.setProperty("--activity-bar-icon-active", "#ffffff");
      // Tooltip 专用变量
      root.style.setProperty("--tooltip-bg", "#252526");
      root.style.setProperty("--tooltip-text", "#cccccc");
      root.style.setProperty("--tooltip-border", "#454545");
      // 滚动条主题变量
      root.style.setProperty("--scrollbar-thumb", "#424242");
      root.style.setProperty("--scrollbar-thumb-hover", "#616161");
      root.style.setProperty("--scrollbar-track", "#1e1e1e");
      root.style.setProperty("--scrollbar-corner", "#252526");
    } else {
      root.style.setProperty("--bg-color", "#ffffff");
      root.style.setProperty("--text-color", "#000000");
      root.style.setProperty("--border-color", "#d9d9d9");
      root.style.setProperty("--resize-handle-color", "#ccc");
      root.style.setProperty("--hover-bg", "#f5f5f5");
      root.style.setProperty("--selected-bg", "#e6f7ff");
      root.style.setProperty("--sidebar-bg", "#f8f8f8");
      root.style.setProperty("--activity-bar-bg", "#f3f3f3");
      root.style.setProperty("--activity-bar-selected", "#e6f7ff");
      root.style.setProperty("--activity-bar-icon", "#666666");
      root.style.setProperty("--activity-bar-icon-active", "#000000");
      // Tooltip 专用变量
      root.style.setProperty("--tooltip-bg", "#ffffff");
      root.style.setProperty("--tooltip-text", "#000000");
      root.style.setProperty("--tooltip-border", "#d9d9d9");
      // 滚动条主题变量
      root.style.setProperty("--scrollbar-thumb", "#c1c1c1");
      root.style.setProperty("--scrollbar-thumb-hover", "#a8a8a8");
      root.style.setProperty("--scrollbar-track", "#f1f1f1");
      root.style.setProperty("--scrollbar-corner", "#f8f8f8");
    }
  }, [actualTheme]);

  const contextValue: ThemeContextType = {
    themeMode,
    actualTheme,
    setThemeMode,
    themeConfig,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
};
