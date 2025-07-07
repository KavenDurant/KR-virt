/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-01-07 11:30:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-07 14:23:57
 * @FilePath: /KR-virt/src/components/ErrorBoundary/utils.ts
 * @Description: ErrorBoundary工具函数
 */

import type { ErrorInfo } from "react";
import type { ErrorType, ErrorSeverity } from "./types";
import { ERROR_TYPES, ERROR_SEVERITY } from "./types";

/**
 * 错误分类工具
 */
export class ErrorClassifier {
  /**
   * 根据错误信息判断错误类型
   */
  static classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";

    // 代码分块加载错误
    if (
      message.includes("chunk") ||
      message.includes("loading") ||
      message.includes("dynamicimport") ||
      stack.includes("__webpack")
    ) {
      return ERROR_TYPES.CHUNK_LOAD_ERROR;
    }

    // 网络相关错误
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("cors") ||
      message.includes("timeout") ||
      message.includes("abort")
    ) {
      return ERROR_TYPES.NETWORK_ERROR;
    }

    // 异步错误
    if (
      stack.includes("async") ||
      stack.includes("promise") ||
      stack.includes("await") ||
      message.includes("promise")
    ) {
      return ERROR_TYPES.ASYNC_ERROR;
    }

    // 组件渲染错误
    if (
      stack.includes("render") ||
      stack.includes("component") ||
      stack.includes("react") ||
      message.includes("element") ||
      message.includes("props") ||
      message.includes("jsx")
    ) {
      return ERROR_TYPES.RENDER_ERROR;
    }

    return ERROR_TYPES.UNKNOWN_ERROR;
  }

  /**
   * 根据错误信息判断严重程度
   */
  static classifyErrorSeverity(
    error: Error,
    errorInfo?: ErrorInfo
  ): ErrorSeverity {
    const errorType = this.classifyError(error);
    const message = error.message.toLowerCase();

    // 关键错误 - 可能导致应用无法使用
    if (
      errorType === ERROR_TYPES.CHUNK_LOAD_ERROR ||
      message.includes("fatal") ||
      message.includes("critical") ||
      message.includes("security")
    ) {
      return ERROR_SEVERITY.CRITICAL;
    }

    // 高严重程度错误 - 影响主要功能
    if (
      errorType === ERROR_TYPES.NETWORK_ERROR ||
      message.includes("authentication") ||
      message.includes("authorization") ||
      message.includes("permission") ||
      errorInfo?.componentStack?.includes("AppLayout") ||
      errorInfo?.componentStack?.includes("Router")
    ) {
      return ERROR_SEVERITY.HIGH;
    }

    // 中等严重程度错误 - 影响部分功能
    if (
      errorType === ERROR_TYPES.ASYNC_ERROR ||
      message.includes("data") ||
      message.includes("api") ||
      errorInfo?.componentStack?.includes("Table") ||
      errorInfo?.componentStack?.includes("Form")
    ) {
      return ERROR_SEVERITY.MEDIUM;
    }

    // 低严重程度错误 - 影响较小
    return ERROR_SEVERITY.LOW;
  }

  /**
   * 判断是否需要自动上报
   */
  static shouldAutoReport(error: Error, errorInfo?: ErrorInfo): boolean {
    const severity = this.classifyErrorSeverity(error, errorInfo);

    // 只有中等及以上严重程度的错误才自动上报
    const autoReportSeverities: ErrorSeverity[] = [
      ERROR_SEVERITY.MEDIUM,
      ERROR_SEVERITY.HIGH,
      ERROR_SEVERITY.CRITICAL,
    ];
    return autoReportSeverities.includes(severity);
  }

  /**
   * 判断是否应该显示重试按钮
   */
  static shouldShowRetry(error: Error): boolean {
    const errorType = this.classifyError(error);

    // 网络错误和异步错误通常可以重试
    const retryableErrorTypes: ErrorType[] = [
      ERROR_TYPES.NETWORK_ERROR,
      ERROR_TYPES.ASYNC_ERROR,
      ERROR_TYPES.CHUNK_LOAD_ERROR,
    ];
    return retryableErrorTypes.includes(errorType);
  }

  /**
   * 获取用户友好的错误消息
   */
  static getFriendlyMessage(error: Error): string {
    const errorType = this.classifyError(error);
    const message = error.message.toLowerCase();

    switch (errorType) {
      case ERROR_TYPES.CHUNK_LOAD_ERROR:
        return "页面资源加载失败，请刷新页面重试";

      case ERROR_TYPES.NETWORK_ERROR:
        return "网络连接失败，请检查网络设置后重试";

      case ERROR_TYPES.ASYNC_ERROR:
        return "数据加载失败，请稍后重试";

      case ERROR_TYPES.RENDER_ERROR:
        return "页面渲染出现问题，请刷新页面";

      default:
        // 尝试根据具体错误消息提供更友好的提示
        if (message.includes("permission")) {
          return "权限不足，请联系管理员";
        }
        if (message.includes("timeout")) {
          return "请求超时，请稍后重试";
        }
        if (message.includes("not found")) {
          return "请求的资源不存在";
        }
        return "页面出现未知错误，请刷新页面或联系技术支持";
    }
  }
}

/**
 * 全局错误处理器
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorQueue: Array<{ error: Error; timestamp: Date }> = [];
  private readonly maxQueueSize = 50;

  private constructor() {
    this.setupGlobalHandlers();
  }

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalHandlers(): void {
    // 捕获未处理的Promise rejection
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled Promise Rejection:", event.reason);

      // 防止过多错误影响用户体验
      if (this.shouldSuppressError(event.reason)) {
        event.preventDefault();
        return;
      }

      this.recordError(new Error(`Promise Rejection: ${event.reason}`));
    });

    // 捕获全局JavaScript错误
    window.addEventListener("error", (event) => {
      console.error("Global Error:", event.error);
      this.recordError(event.error || new Error(event.message));
    });

    // 捕获资源加载错误
    window.addEventListener(
      "error",
      (event) => {
        if (event.target !== window) {
          console.error("Resource Load Error:", event.target);
          this.recordError(
            new Error(
              `Resource load failed: ${
                (event.target as HTMLElement | null)?.getAttribute?.("src") ||
                "unknown"
              }`
            )
          );
        }
      },
      true
    );
  }

  /**
   * 记录错误到队列
   */
  private recordError(error: Error): void {
    // 清理旧错误记录
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.errorQueue.shift();
    }

    this.errorQueue.push({
      error,
      timestamp: new Date(),
    });
  }

  /**
   * 判断是否应该抑制某些错误（避免过多无用错误）
   */
  private shouldSuppressError(reason: unknown): boolean {
    if (typeof reason === "string") {
      const lowerReason = reason.toLowerCase();

      // 抑制一些常见的无害错误
      return (
        lowerReason.includes("non-error promise rejection") ||
        lowerReason.includes("script error") ||
        lowerReason.includes("ResizeObserver loop limit exceeded")
      );
    }

    return false;
  }

  /**
   * 获取最近的错误记录
   */
  getRecentErrors(
    count: number = 10
  ): Array<{ error: Error; timestamp: Date }> {
    return this.errorQueue.slice(-count);
  }

  /**
   * 清空错误队列
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrorCount: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentErrors = this.errorQueue.filter(
      (item) => item.timestamp > oneHourAgo
    );

    const errorsByType = this.errorQueue.reduce((acc, item) => {
      const errorType = ErrorClassifier.classifyError(item.error);
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errorQueue.length,
      errorsByType,
      recentErrorCount: recentErrors.length,
    };
  }
}

/**
 * 初始化全局错误处理
 */
export const initializeGlobalErrorHandling = (): GlobalErrorHandler => {
  return GlobalErrorHandler.getInstance();
};

/**
 * 格式化错误信息为文本
 */
export const formatErrorForReport = (
  error: Error,
  errorInfo?: ErrorInfo,
  additionalInfo?: Record<string, unknown>
): string => {
  const errorType = ErrorClassifier.classifyError(error);
  const severity = ErrorClassifier.classifyErrorSeverity(error, errorInfo);

  return [
    `=== 错误报告 ===`,
    `时间: ${new Date().toLocaleString()}`,
    `错误类型: ${errorType}`,
    `严重程度: ${severity}`,
    `错误消息: ${error.message}`,
    `页面URL: ${window.location.href}`,
    `用户代理: ${navigator.userAgent}`,
    "",
    `=== 错误堆栈 ===`,
    error.stack || "无堆栈信息",
    "",
    ...(errorInfo?.componentStack
      ? [`=== 组件堆栈 ===`, errorInfo.componentStack, ""]
      : []),
    ...(additionalInfo
      ? [`=== 附加信息 ===`, JSON.stringify(additionalInfo, null, 2)]
      : []),
  ].join("\n");
};
