/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-01-07 11:30:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-07 13:30:24
 * @FilePath: /KR-virt/src/components/ErrorBoundary/index.ts
 * @Description: ErrorBoundary模块导出
 */

// 主组件
export { default as ErrorBoundary } from "./ErrorBoundary";

// 类型定义
export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorReportData,
  ErrorType,
  ErrorSeverity,
} from "./types";

export { ERROR_TYPES, ERROR_SEVERITY } from "./types";

// 工具函数
export {
  ErrorClassifier,
  GlobalErrorHandler,
  initializeGlobalErrorHandling,
  formatErrorForReport,
} from "./utils";

// 测试组件（仅开发环境）
export { default as TestErrorComponent } from "./TestErrorComponent";

// 默认导出主组件
export { default } from "./ErrorBoundary";
