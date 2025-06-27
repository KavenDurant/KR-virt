/**
 * Token刷新失败Modal管理器
 * 用于在全局范围内显示Token刷新失败的Modal
 */

import { createRoot } from "react-dom/client";
import { ConfigProvider, App, theme } from "antd";
import TokenRefreshFailureModal, { type TokenRefreshFailureModalProps } from "./index";
import type { TokenRefreshFailureOptions } from "./utils";

type ReactRoot = ReturnType<typeof createRoot>;

class TokenRefreshFailureModalManager {
  private static instance: TokenRefreshFailureModalManager | null = null;
  private container: HTMLDivElement | null = null;
  private root: ReactRoot | null = null;
  private currentModal: TokenRefreshFailureOptions | null = null;

  private constructor() {
    // 私有构造函数，确保单例
  }

  static getInstance(): TokenRefreshFailureModalManager {
    if (!TokenRefreshFailureModalManager.instance) {
      TokenRefreshFailureModalManager.instance = new TokenRefreshFailureModalManager();
    }
    return TokenRefreshFailureModalManager.instance;
  }

  /**
   * 显示Token刷新失败Modal
   */
  show(options: TokenRefreshFailureOptions): void {
    // 如果已经有Modal在显示，则不重复显示
    if (this.currentModal) {
      console.warn("Token刷新失败Modal已在显示中，忽略重复调用");
      return;
    }

    this.currentModal = options;
    this.createContainer();
    this.renderModal(options);
  }

  /**
   * 隐藏Modal
   */
  hide(): void {
    if (this.root && this.container) {
      this.renderModal(null);
      setTimeout(() => {
        this.cleanup();
      }, 300); // 等待动画完成
    }
    this.currentModal = null;
  }

  /**
   * 创建容器
   */
  private createContainer(): void {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.className = "token-refresh-failure-modal-container";
      document.body.appendChild(this.container);
      
      // 使用React 18的createRoot
      this.root = createRoot(this.container);
    }
  }

  /**
   * 渲染Modal
   */
  private renderModal(options: TokenRefreshFailureOptions | null): void {
    if (!this.root) return;

    const visible = !!options;

    const handleClose = () => {
      this.hide();
    };

    const handleConfirm = () => {
      if (options?.onConfirm) {
        options.onConfirm();
      } else {
        // 默认跳转到登录页
        window.location.href = "/login";
      }
      this.hide();
    };

    const handleRetry = async () => {
      if (options?.onRetry) {
        try {
          await options.onRetry();
          // 如果重试成功，隐藏Modal
          this.hide();
        } catch (error) {
          console.error("重试失败:", error);
          // 重试失败，保持Modal显示
        }
      }
    };

    const modalProps: TokenRefreshFailureModalProps = {
      visible,
      message: options?.message || "",
      reason: options?.reason,
      countdown: options?.countdown ?? 5,
      showRetry: options?.showRetry ?? false,
      autoRedirect: options?.autoRedirect ?? true,
      onClose: handleClose,
      onConfirm: handleConfirm,
      onRetry: options?.onRetry ? handleRetry : undefined,
    };

    // 获取当前主题
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const isDark = currentTheme === "dark";

    this.root.render(
      <ConfigProvider
        theme={isDark ? { algorithm: theme.darkAlgorithm } : undefined}
      >
        <App>
          <TokenRefreshFailureModal {...modalProps} />
        </App>
      </ConfigProvider>
    );
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  /**
   * 检查是否有Modal在显示
   */
  isVisible(): boolean {
    return !!this.currentModal;
  }

  /**
   * 销毁实例（用于清理）
   */
  static destroy(): void {
    if (TokenRefreshFailureModalManager.instance) {
      TokenRefreshFailureModalManager.instance.hide();
      TokenRefreshFailureModalManager.instance = null;
    }
  }
}

export default TokenRefreshFailureModalManager;
