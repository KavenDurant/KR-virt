import { useContext } from "react";
import { ThemeContext, type ThemeContextType } from "../contexts/ThemeContext";

// 主题 Hook
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// 主题切换 Hook
export const useThemeToggle = () => {
  const { themeMode, setThemeMode, actualTheme } = useTheme();

  const toggleTheme = () => {
    if (themeMode === "light") {
      setThemeMode("dark");
    } else if (themeMode === "dark") {
      setThemeMode("auto");
    } else {
      setThemeMode("light");
    }
  };

  return { themeMode, actualTheme, setThemeMode, toggleTheme };
};
