import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { createElement } from "react";

/**
 * 全局Token刷新失败Modal管理器
 * 用于在任何地方显示Token错误提醒Modal
 */
class TokenRefreshFailureModalManager {
  private static instance: TokenRefreshFailureModalManager;
  private container: HTMLDivElement | null = null;
  private root: Root | null = null;
  private isShowing = false;

  private constructor() {
    this.createContainer();
  }

  public static getInstance(): TokenRefreshFailureModalManager {
    if (!TokenRefreshFailureModalManager.instance) {
      TokenRefreshFailureModalManager.instance = new TokenRefreshFailureModalManager();
    }
    return TokenRefreshFailureModalManager.instance;
  }

  private createContainer(): void {
    if (typeof window === "undefined") return;

    this.container = document.createElement("div");
    this.container.id = "token-refresh-failure-modal-container";
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
  }

  public show(message: string): void {
    if (!this.root || this.isShowing) return;

    this.isShowing = true;

    const handleClose = () => {
      this.hide();
    };

    // 动态导入组件并渲染
    import("./index").then((module) => {
      const TokenRefreshFailureModal = module.default;
      if (this.root) {
        this.root.render(
          createElement(TokenRefreshFailureModal, {
            open: true,
            message: message,
            onClose: handleClose,
          })
        );
      }
    });
  }

  public hide(): void {
    if (!this.root || !this.isShowing) return;

    this.isShowing = false;
    this.root.render(createElement("div"));

    // 延迟清理容器
    setTimeout(() => {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
        this.container = null;
        this.root = null;
        this.createContainer(); // 重新创建容器，以备下次使用
      }
    }, 100);
  }

  public isModalShowing(): boolean {
    return this.isShowing;
  }

  public destroy(): void {
    this.hide();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.root = null;
    this.isShowing = false;
  }
}

// 导出单例实例
export const tokenRefreshFailureModalManager = TokenRefreshFailureModalManager.getInstance();

// 全局显示函数，方便在任何地方调用
export const showTokenRefreshFailureModal = (message: string): void => {
  tokenRefreshFailureModalManager.show(message);
};

export default TokenRefreshFailureModalManager;
