/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-01-07 11:30:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-07 11:58:07
 * @FilePath: /KR-virt/src/components/ErrorBoundary/types.ts
 * @Description: ErrorBoundary组件类型定义
 */

import type { ReactNode, ErrorInfo } from "react";

/**
 * 错误边界组件属性接口
 */
export interface ErrorBoundaryProps {
  /** 子组件 */
  children: ReactNode;
  /** 错误发生时的回退UI，如果不提供则使用默认的错误页面 */
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  /** 错误发生时的回调函数 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 是否显示错误详情（开发环境默认true，生产环境默认false） */
  showErrorDetails?: boolean;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 重试按钮点击回调 */
  onRetry?: () => void;
  /** 自定义错误标题 */
  title?: string;
  /** 自定义错误描述 */
  description?: string;
  /** 是否启用错误日志上报（生产环境使用） */
  enableErrorReporting?: boolean;
  /** 错误上报服务配置 */
  errorReportingConfig?: {
    endpoint?: string;
    apiKey?: string;
    extra?: Record<string, unknown>;
  };
}

/**
 * 错误边界组件状态接口
 */
export interface ErrorBoundaryState {
  /** 是否发生错误 */
  hasError: boolean;
  /** 错误对象 */
  error?: Error;
  /** 错误信息 */
  errorInfo?: ErrorInfo;
  /** 错误发生时间 */
  errorTime?: Date;
  /** 错误ID（用于追踪） */
  errorId?: string;
}

/**
 * 错误上报数据接口
 */
export interface ErrorReportData {
  /** 错误ID */
  errorId: string;
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 组件堆栈 */
  componentStack?: string;
  /** 发生时间 */
  timestamp: string;
  /** 用户代理 */
  userAgent: string;
  /** 页面URL */
  url: string;
  /** 用户ID（如果有） */
  userId?: string;
  /** 额外信息 */
  extra?: Record<string, unknown>;
}

/**
 * 错误类型枚举
 */
export const ERROR_TYPES = {
  RENDER_ERROR: "RENDER_ERROR", // 组件渲染错误
  ASYNC_ERROR: "ASYNC_ERROR", // 异步错误
  CHUNK_LOAD_ERROR: "CHUNK_LOAD_ERROR", // 代码分块加载错误
  NETWORK_ERROR: "NETWORK_ERROR", // 网络错误
  UNKNOWN_ERROR: "UNKNOWN_ERROR", // 未知错误
} as const;

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

/**
 * 错误严重程度枚举
 */
export const ERROR_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium", 
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type ErrorSeverity = (typeof ERROR_SEVERITY)[keyof typeof ERROR_SEVERITY]; 