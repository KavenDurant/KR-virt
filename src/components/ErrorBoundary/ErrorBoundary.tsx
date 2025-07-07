/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-01-07 11:30:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-07 14:22:22
 * @FilePath: /KR-virt/src/components/ErrorBoundary/index.tsx
 * @Description: React错误边界组件
 */

import React, { Component, type ErrorInfo } from "react";
import { Result, Button, Card, Typography, Collapse, Space } from "antd";
import {
  ExclamationCircleOutlined,
  ReloadOutlined,
  BugOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorReportData,
  ErrorType,
} from "./types";
import { ERROR_TYPES } from "./types";

const { Text, Paragraph } = Typography;

/**
 * React错误边界组件
 *
 * 功能特性：
 * - 捕获React组件渲染时的错误
 * - 提供用户友好的错误显示
 * - 支持错误重试功能
 * - 支持错误详情展示（开发环境）
 * - 支持错误上报（生产环境）
 * - 自动错误分类和严重程度判断
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  /**
   * 当子组件抛出错误时，React会调用此方法
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 生成错误ID用于追踪
    const errorId = `error_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorTime: new Date(),
      errorId,
    };
  }

  /**
   * 组件捕获到错误时调用
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, enableErrorReporting = true } = this.props;

    // 更新状态中的错误信息
    this.setState({
      errorInfo,
    });

    // 开发环境下详细日志
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 ErrorBoundary 捕获到错误");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }

    // 调用用户自定义的错误处理函数
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (callbackError) {
        console.error("错误处理回调函数执行失败:", callbackError);
      }
    }

    // 生产环境错误上报
    if (process.env.NODE_ENV === "production" && enableErrorReporting) {
      this.reportError(error, errorInfo);
    }
  }

  /**
   * 错误上报方法
   */
  private async reportError(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      const { errorReportingConfig } = this.props;
      const { errorId } = this.state;

      const reportData: ErrorReportData = {
        errorId: errorId || "unknown",
        message: error.message,
        stack: error.stack || "",
        componentStack: errorInfo.componentStack || "",
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        extra: {
          retryCount: this.retryCount,
          errorType: this.getErrorType(error),
          ...errorReportingConfig?.extra,
        },
      };

      // 如果配置了上报端点，则进行上报
      if (errorReportingConfig?.endpoint) {
        await fetch(errorReportingConfig.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(errorReportingConfig.apiKey && {
              Authorization: `Bearer ${errorReportingConfig.apiKey}`,
            }),
          },
          body: JSON.stringify(reportData),
        });
      } else {
        // 默认上报到控制台（生产环境可以集成第三方服务如Sentry）
        console.error("ErrorBoundary上报:", reportData);
      }
    } catch (reportError) {
      console.error("错误上报失败:", reportError);
    }
  }

  /**
   * 判断错误类型
   */
  private getErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";

    if (message.includes("chunk") || message.includes("loading")) {
      return ERROR_TYPES.CHUNK_LOAD_ERROR;
    }

    if (message.includes("network") || message.includes("fetch")) {
      return ERROR_TYPES.NETWORK_ERROR;
    }

    if (stack.includes("async") || stack.includes("promise")) {
      return ERROR_TYPES.ASYNC_ERROR;
    }

    if (stack.includes("render") || stack.includes("component")) {
      return ERROR_TYPES.RENDER_ERROR;
    }

    return ERROR_TYPES.UNKNOWN_ERROR;
  }

  /**
   * 重试处理
   */
  private handleRetry = (): void => {
    const { onRetry } = this.props;

    if (this.retryCount >= this.maxRetries) {
      // 超过最大重试次数，建议刷新页面
      if (window.confirm("重试次数过多，是否刷新页面？")) {
        window.location.reload();
      }
      return;
    }

    this.retryCount++;

    // 重置错误状态
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorTime: undefined,
      errorId: undefined,
    });

    // 调用用户自定义重试逻辑
    if (onRetry) {
      try {
        onRetry();
      } catch (retryError) {
        console.error("重试回调执行失败:", retryError);
      }
    }
  };

  /**
   * 复制错误信息
   */
  private handleCopyError = async (): Promise<void> => {
    const { error, errorInfo, errorId } = this.state;

    const errorText = [
      `错误ID: ${errorId}`,
      `时间: ${new Date().toLocaleString()}`,
      `错误消息: ${error?.message}`,
      `错误堆栈: ${error?.stack}`,
      `组件堆栈: ${errorInfo?.componentStack}`,
      `页面URL: ${window.location.href}`,
      `用户代理: ${navigator.userAgent}`,
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(errorText);
      // 这里应该显示复制成功的提示，但由于在ErrorBoundary中，避免使用message
      console.log("错误信息已复制到剪贴板");
    } catch (copyError) {
      console.error("复制失败:", copyError);
      // 备用方案：创建临时textarea
      const textarea = document.createElement("textarea");
      textarea.value = errorText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  /**
   * 渲染默认的错误UI
   */
  private renderDefaultErrorUI(): React.ReactNode {
    const { error, errorInfo, errorId, errorTime } = this.state;
    const {
      title = "页面出现错误",
      description = "抱歉，页面发生了未预期的错误。您可以尝试刷新页面或联系技术支持。",
      showErrorDetails = process.env.NODE_ENV === "development",
      showRetry = true,
    } = this.props;

    const isDev = process.env.NODE_ENV === "development";
    const errorType = error ? this.getErrorType(error) : "UNKNOWN_ERROR";

    return (
      <div
        style={{
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <Card style={{ maxWidth: "800px", width: "100%" }}>
          <Result
            status="error"
            icon={<ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />}
            title={title}
            subTitle={
              <div>
                <Text type="secondary">{description}</Text>
                {isDev && (
                  <div style={{ marginTop: "10px" }}>
                    <Text type="warning" style={{ fontSize: "12px" }}>
                      错误ID: {errorId} | 类型: {errorType} | 重试次数:{" "}
                      {this.retryCount}/{this.maxRetries}
                    </Text>
                  </div>
                )}
              </div>
            }
            extra={
              <Space direction="vertical" style={{ width: "100%" }}>
                <Space>
                  {showRetry && (
                    <Button
                      type="primary"
                      icon={<ReloadOutlined />}
                      onClick={this.handleRetry}
                      disabled={this.retryCount >= this.maxRetries}
                    >
                      {this.retryCount >= this.maxRetries
                        ? "重试次数已达上限"
                        : "重试"}
                    </Button>
                  )}
                  <Button onClick={() => window.location.reload()}>
                    刷新页面
                  </Button>
                  {isDev && (
                    <Button
                      icon={<CopyOutlined />}
                      onClick={this.handleCopyError}
                    >
                      复制错误信息
                    </Button>
                  )}
                </Space>

                {/* 开发环境显示错误详情 */}
                {showErrorDetails && error && (
                  <div style={{ marginTop: "20px", textAlign: "left" }}>
                    <Collapse
                      size="small"
                      items={[
                        {
                          key: "error-details",
                          label: (
                            <Space>
                              <BugOutlined />
                              <Text>错误详情 (开发环境)</Text>
                            </Space>
                          ),
                          children: (
                            <div>
                              <Paragraph>
                                <Text strong>错误消息:</Text>
                                <br />
                                <Text code style={{ color: "#ff4d4f" }}>
                                  {error.message}
                                </Text>
                              </Paragraph>

                              {error.stack && (
                                <Paragraph>
                                  <Text strong>错误堆栈:</Text>
                                  <br />
                                  <Text
                                    code
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      fontSize: "11px",
                                      maxHeight: "200px",
                                      overflow: "auto",
                                      display: "block",
                                      background: "#f5f5f5",
                                      padding: "8px",
                                      border: "1px solid #d9d9d9",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    {error.stack}
                                  </Text>
                                </Paragraph>
                              )}

                              {errorInfo?.componentStack && (
                                <Paragraph>
                                  <Text strong>组件堆栈:</Text>
                                  <br />
                                  <Text
                                    code
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      fontSize: "11px",
                                      maxHeight: "200px",
                                      overflow: "auto",
                                      display: "block",
                                      background: "#f5f5f5",
                                      padding: "8px",
                                      border: "1px solid #d9d9d9",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    {errorInfo.componentStack}
                                  </Text>
                                </Paragraph>
                              )}

                              <Paragraph>
                                <Text strong>发生时间:</Text>
                                <br />
                                <Text code>{errorTime?.toLocaleString()}</Text>
                              </Paragraph>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  render(): React.ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children } = this.props;

    if (hasError && error) {
      // 如果提供了自定义fallback UI
      if (fallback) {
        if (typeof fallback === "function") {
          try {
            return fallback(error, errorInfo || ({} as ErrorInfo));
          } catch (fallbackError) {
            console.error("fallback渲染失败:", fallbackError);
            // 降级到默认UI
            return this.renderDefaultErrorUI();
          }
        }
        return fallback;
      }

      // 使用默认错误UI
      return this.renderDefaultErrorUI();
    }

    // 正常渲染子组件
    return children;
  }
}

export default ErrorBoundary;
