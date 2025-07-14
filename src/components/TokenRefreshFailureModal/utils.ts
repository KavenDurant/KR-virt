/**
 * Token刷新失败Modal管理器 - 工具函数
 */

import TokenRefreshFailureModalManager from "./manager";

export interface TokenRefreshFailureOptions {
  /** 错误消息 */
  message: string;
  /** 失败原因 */
  reason?: string;
  /** 自动跳转倒计时时间（秒），默认5秒 */
  countdown?: number;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 是否自动跳转 */
  autoRedirect?: boolean;
  /** 重试刷新Token的回调 */
  onRetry?: () => Promise<void>;
  /** 确认跳转到登录页的回调 */
  onConfirm?: () => void;
}

/**
 * 显示Token刷新失败Modal
 */
export const showTokenRefreshFailureModal = (
  options: TokenRefreshFailureOptions,
): void => {
  const manager = TokenRefreshFailureModalManager.getInstance();
  manager.show(options);
};

/**
 * 隐藏Token刷新失败Modal
 */
export const hideTokenRefreshFailureModal = (): void => {
  const manager = TokenRefreshFailureModalManager.getInstance();
  manager.hide();
};

/**
 * 检查Token刷新失败Modal是否可见
 */
export const isTokenRefreshFailureModalVisible = (): boolean => {
  const manager = TokenRefreshFailureModalManager.getInstance();
  return manager.isVisible();
};

/**
 * 销毁Token刷新失败Modal管理器
 */
export const destroyTokenRefreshFailureModal = (): void => {
  TokenRefreshFailureModalManager.destroy();
};
