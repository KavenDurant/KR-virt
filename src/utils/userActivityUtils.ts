/**
 * 用户活动监控工具函数
 */

import type { UserActivityEvent } from "@/components/UserActivity/types";
import { LOG_CONFIG, STORAGE_KEYS } from "@/components/UserActivity/config";

/**
 * 格式化时间显示
 * @param milliseconds 毫秒数
 * @returns 格式化的时间字符串
 */
export const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟${seconds % 60}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
};

/**
 * 格式化持续时间（简短版本）
 * @param milliseconds 毫秒数
 * @returns 简短的时间字符串
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(
      seconds % 60
    ).padStart(2, "0")}`;
  } else {
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  }
};

/**
 * 检查是否为有效的活动事件
 * @param event DOM事件
 * @returns 是否为有效活动
 */
export const isValidActivityEvent = (event: Event): boolean => {
  // 排除某些不应该被视为用户活动的事件
  const excludeTargets = ["script", "style", "meta", "link"];
  const target = event.target as HTMLElement;

  if (target && excludeTargets.includes(target.tagName?.toLowerCase())) {
    return false;
  }

  // 排除自动触发的事件
  if (event.isTrusted === false) {
    return false;
  }

  return true;
};

/**
 * 生成唯一标签页ID
 * @returns 唯一标识符
 */
export const generateTabId = (): string => {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 保存用户数据到本地存储
 * @param data 要保存的数据
 */
export const saveToStorage = (key: string, data: unknown): void => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.warn(`${LOG_CONFIG.prefix} Failed to save to localStorage:`, error);
  }
};

/**
 * 从本地存储读取数据
 * @param key 存储键
 * @returns 读取的数据
 */
export const loadFromStorage = <T = unknown>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    return parsed.data;
  } catch (error) {
    console.warn(
      `${LOG_CONFIG.prefix} Failed to load from localStorage:`,
      error
    );
    return null;
  }
};

/**
 * 清理本地存储数据
 */
export const cleanupStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn(`${LOG_CONFIG.prefix} Failed to cleanup localStorage:`, error);
  }
};

/**
 * 记录活动日志
 * @param event 事件类型
 * @param data 附加数据
 */
export const logActivity = (event: UserActivityEvent, data?: unknown): void => {
  if (!import.meta.env.DEV) return;

  const timestamp = new Date().toLocaleTimeString();
  const color = LOG_CONFIG.colors[getLogLevel(event)];

  console.log(
    `%c${LOG_CONFIG.prefix} [${timestamp}] ${event.toUpperCase()}`,
    `color: ${color}; font-weight: bold;`,
    data || ""
  );
};

/**
 * 获取日志级别
 * @param event 事件类型
 * @returns 日志级别
 */
const getLogLevel = (
  event: UserActivityEvent
): keyof typeof LOG_CONFIG.colors => {
  switch (event) {
    case "timeout":
    case "logout":
      return "error";
    case "prompt":
      return "warn";
    case "active":
    case "promptCancel":
      return "success";
    default:
      return "info";
  }
};

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间
 * @returns 防抖后的函数
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 延迟时间
 * @returns 节流后的函数
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * 检查页面可见性
 * @returns 页面是否可见
 */
export const isPageVisible = (): boolean => {
  return !document.hidden;
};

/**
 * 获取页面可见性状态
 * @returns 可见性状态
 */
export const getVisibilityState = (): DocumentVisibilityState => {
  return document.visibilityState;
};

/**
 * 检查是否支持BroadcastChannel
 * @returns 是否支持
 */
export const supportsBroadcastChannel = (): boolean => {
  return typeof BroadcastChannel !== "undefined";
};

/**
 * 安全地执行异步操作
 * @param asyncFn 异步函数
 * @param errorMessage 错误消息
 */
export const safeAsync = async <T>(
  asyncFn: () => Promise<T>,
  errorMessage: string = "Async operation failed"
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    console.error(`${LOG_CONFIG.prefix} ${errorMessage}:`, error);
    return null;
  }
};

/**
 * 创建延迟Promise
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 格式化错误信息
 * @param error 错误对象
 * @returns 格式化的错误信息
 */
export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error occurred";
};

/**
 * 检查是否为移动设备
 * @returns 是否为移动设备
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * 获取设备类型
 * @returns 设备类型
 */
export const getDeviceType = (): "mobile" | "tablet" | "desktop" => {
  const userAgent = navigator.userAgent;

  if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) {
    return "tablet";
  }

  if (
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  ) {
    return "mobile";
  }

  return "desktop";
};

export const findUserActivityModule = (
  path: string,
  activityModules: Record<string, unknown>
): string => {
  // 查找匹配的活动模块
  for (const moduleName in activityModules) {
    const moduleConfig = activityModules[moduleName] as Record<string, unknown>;

    if (moduleConfig?.paths && Array.isArray(moduleConfig.paths)) {
      for (const pathPattern of moduleConfig.paths) {
        if (typeof pathPattern === "string" && path.includes(pathPattern)) {
          return moduleName;
        }
      }
    }
  }

  return "未知模块";
};

export const createUserActivityRecord = (
  type: string,
  details: Record<string, unknown>,
  user: Record<string, unknown>
): Record<string, unknown> => {
  return {
    id: generateId(),
    timestamp: Date.now(),
    type,
    details,
    user,
    sessionId: getSessionId(),
  };
};

export const shouldSkipActivityLog = (
  path: string,
  skipPaths: string[] = []
): boolean => {
  // 默认跳过的路径
  const defaultSkipPaths = [
    "/api/system/health",
    "/api/auth/refresh",
    "/api/ping",
    "/favicon.ico",
  ];

  const allSkipPaths = [...defaultSkipPaths, ...skipPaths];

  return allSkipPaths.some((skipPath) => path.includes(skipPath));
};

export const attachActivityListeners = (
  element: Element,
  config: Record<string, unknown> = {}
): void => {
  // 实现活动监听器附加逻辑
  console.log("Attaching activity listeners to element:", element, config);
};

export const detachActivityListeners = (
  element: Element,
  config: Record<string, unknown> = {}
): void => {
  // 实现活动监听器分离逻辑
  console.log("Detaching activity listeners from element:", element, config);
};
