/**
 * 用户活动监控组件
 */

import React, { useEffect, useMemo } from "react";
import { App } from "antd";
import { useUserActivity } from "@/hooks/useUserActivity";
import IdleWarningModal from "./IdleWarningModal";
import type { UserActivityMonitorProps } from "./types";
import { DEFAULT_USER_ACTIVITY_CONFIG } from "./config";
import { logActivity } from "@/utils/userActivityUtils";

/**
 * 用户活动监控组件
 *
 * 提供完整的用户活动监控功能，包括：
 * - 空闲检测
 * - 警告提示
 * - 自动登出
 * - 跨标签页同步
 */
export const UserActivityMonitor: React.FC<UserActivityMonitorProps> = ({
  config = {},
  callbacks = {},
  enabled = true,
  children,
  warningComponent: CustomWarningComponent,
}) => {
  const { message } = App.useApp();

  // 合并配置，使用useMemo优化性能
  const finalConfig = useMemo(
    () => ({
      ...DEFAULT_USER_ACTIVITY_CONFIG,
      ...config,
    }),
    [config],
  );

  // 使用用户活动监控Hook
  const {
    isIdle,
    isPrompted,
    remainingTime,
    lastActiveTime,
    // totalActiveTime,
    // totalIdleTime,
    isLeaderTab,
    // reset, // 不再直接使用reset，改用handlePromptCancel
    pause,
    resume,
    logout,
    getDetailedState,
    handlePromptCancel,
  } = useUserActivity(finalConfig, {
    ...callbacks,
    onIdle: (event) => {
      if (finalConfig.debug) {
        logActivity("idle", event);
      }
      callbacks.onIdle?.(event);
    },
    onActive: (event) => {
      if (finalConfig.debug) {
        logActivity("active", event);
      }
      callbacks.onActive?.(event);
    },
    onPrompt: (event) => {
      if (finalConfig.debug) {
        logActivity("prompt", event);
      }
      callbacks.onPrompt?.(event);
    },
    onActivity: (event) => {
      if (finalConfig.debug && Math.random() < 0.1) {
        // 只记录10%的活动事件，避免日志过多
        logActivity("activity", { eventType: event.eventType });
      }
      callbacks.onActivity?.(event);
    },
    onTimeout: (event) => {
      if (finalConfig.debug) {
        logActivity("timeout", event);
      }
      message.warning("由于长时间未操作，您已被自动登出");
      callbacks.onTimeout?.(event);
    },
    onLogout: (event) => {
      if (finalConfig.debug) {
        logActivity("logout", event);
      }
      callbacks.onLogout?.(event);
    },
  });

  // 监控启用/禁用状态
  useEffect(() => {
    if (enabled) {
      resume();
    } else {
      pause();
    }
  }, [enabled, resume, pause]);

  // 处理继续使用
  const handleContinue = () => {
    handlePromptCancel();
    if (finalConfig.debug) {
      logActivity("promptCancel", { action: "continue" });
    }
  };

  // 处理手动登出
  const handleLogout = () => {
    logout("manual", true);
  };

  // 开发环境调试信息
  useEffect(() => {
    if (!finalConfig.debug) return;

    const logInterval = setInterval(() => {
      const state = getDetailedState();
      console.group("🔍 UserActivity Debug Info");
      console.log("📊 Current State:", {
        isIdle,
        isPrompted,
        remainingTime: Math.ceil(remainingTime / 1000) + "s",
        lastActiveTime: lastActiveTime?.toLocaleTimeString(),
        isLeaderTab,
      });
      console.log("📈 Statistics:", state.statistics);
      console.log("⚙️ Config:", {
        timeout: finalConfig.timeout / 1000 + "s",
        promptTimeout: finalConfig.promptTimeout / 1000 + "s",
        crossTab: finalConfig.crossTab,
      });
      console.groupEnd();
    }, 10000); // 每10秒输出一次调试信息

    return () => clearInterval(logInterval);
  }, [
    finalConfig.debug,
    isIdle,
    isPrompted,
    remainingTime,
    lastActiveTime,
    isLeaderTab,
    getDetailedState,
    finalConfig,
  ]);

  // 渲染警告弹窗
  const WarningComponent = CustomWarningComponent || IdleWarningModal;

  return (
    <>
      {children}

      {/* 空闲警告弹窗 */}
      <WarningComponent
        visible={isPrompted}
        remainingTime={remainingTime}
        onContinue={handleContinue}
        onLogout={handleLogout}
        onCancel={handleContinue} // 添加onCancel回调，Esc键等同于继续使用
        title="会话即将过期"
        description="由于您已经有一段时间没有操作，为了保护您的账户安全，系统将在倒计时结束后自动登出。如果您希望继续使用系统，请点击'继续使用'按钮。"
        showCountdown={true}
        closable={true} // 启用Esc键
        maskClosable={false}
      />
    </>
  );
};

/**
 * 用户活动监控Provider组件
 *
 * 用于在应用顶层提供用户活动监控功能
 */
export const UserActivityProvider: React.FC<{
  children: React.ReactNode;
  config?: Partial<UserActivityMonitorProps>;
}> = ({ children, config = {} }) => {
  return <UserActivityMonitor {...config}>{children}</UserActivityMonitor>;
};

/**
 * 轻量级用户活动监控组件
 *
 * 只提供监控功能，不渲染任何UI
 */
export const UserActivityWatcher: React.FC<{
  config?: Parameters<typeof useUserActivity>[0];
  callbacks?: Parameters<typeof useUserActivity>[1];
  enabled?: boolean;
}> = ({ config = {}, callbacks = {}, enabled = true }) => {
  const activity = useUserActivity(config, callbacks);

  useEffect(() => {
    if (enabled) {
      activity.resume();
    } else {
      activity.pause();
    }
  }, [enabled, activity]);

  return null;
};

// 默认导出
export default UserActivityMonitor;

// 类型导出
export type { UserActivityMonitorProps } from "./types";
