/**
 * Token刷新失败Modal组件测试
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import TokenRefreshFailureModal from "@/components/TokenRefreshFailureModal/index";
import type { TokenRefreshFailureModalProps } from "@/components/TokenRefreshFailureModal/index";

describe("TokenRefreshFailureModal", () => {
  const defaultProps: TokenRefreshFailureModalProps = {
    visible: true,
    message: "测试错误消息",
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该渲染Modal", () => {
    render(<TokenRefreshFailureModal {...defaultProps} />);

    expect(screen.getByText("测试错误消息")).toBeInTheDocument();
    expect(screen.getByText("立即跳转登录")).toBeInTheDocument();
  });

  it("应该显示倒计时", () => {
    render(
      <TokenRefreshFailureModal
        {...defaultProps}
        countdown={5}
        autoRedirect={true}
      />,
    );

    expect(screen.getByText(/剩余时间/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("应该显示重试按钮", () => {
    const onRetry = vi.fn();

    render(
      <TokenRefreshFailureModal
        {...defaultProps}
        showRetry={true}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("重试刷新")).toBeInTheDocument();
  });

  it("点击确认按钮应该调用onConfirm", () => {
    const onConfirm = vi.fn();

    render(
      <TokenRefreshFailureModal {...defaultProps} onConfirm={onConfirm} />,
    );

    fireEvent.click(screen.getByText("立即跳转登录"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("应该响应键盘Enter事件", () => {
    const onConfirm = vi.fn();

    render(
      <TokenRefreshFailureModal {...defaultProps} onConfirm={onConfirm} />,
    );

    fireEvent.keyDown(document, { key: "Enter" });
    expect(onConfirm).toHaveBeenCalled();
  });

  it("应该显示失败原因", () => {
    render(
      <TokenRefreshFailureModal {...defaultProps} reason="网络连接超时" />,
    );

    expect(screen.getByText(/失败原因/)).toBeInTheDocument();
    expect(screen.getByText("网络连接超时")).toBeInTheDocument();
  });

  it("倒计时结束后应该自动调用onConfirm", async () => {
    const onConfirm = vi.fn();

    render(
      <TokenRefreshFailureModal
        {...defaultProps}
        onConfirm={onConfirm}
        countdown={1}
        autoRedirect={true}
      />,
    );

    // 等待倒计时结束
    await waitFor(
      () => {
        expect(onConfirm).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
  });
});
