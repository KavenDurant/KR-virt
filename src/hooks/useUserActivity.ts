/**
 * 用户活动监控Hook
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useNavigate } from "react-router-dom";
import { loginService } from "@/services/login";
import type {
  UseUserActivityReturn,
  UserActivityState,
  UserActivityCallbacks,
  DetailedUserActivityState,
} from "@/components/UserActivity/types";
import type { UserActivityConfig } from "@/components/UserActivity/config";
import { mergeConfig, validateConfig } from "@/components/UserActivity/config";
import {
  logActivity,
  generateTabId,
  saveToStorage,
  // loadFromStorage,
  cleanupStorage,
  isPageVisible,
  safeAsync,
} from "@/utils/userActivityUtils";

/**
 * 用户活动监控Hook
 * @param config 配置选项
 * @param callbacks 事件回调
 * @returns Hook返回值
 */
export const useUserActivity = (
  config: Partial<UserActivityConfig> = {},
  callbacks: UserActivityCallbacks = {}
): UseUserActivityReturn => {
  const navigate = useNavigate();
  const finalConfig = mergeConfig(config);

  // 验证配置
  useEffect(() => {
    if (!validateConfig(finalConfig)) {
      throw new Error("Invalid UserActivity configuration");
    }
  }, [finalConfig]);

  // 状态管理
  const [state, setState] = useState<UserActivityState>({
    isIdle: false,
    isPrompted: false,
    remainingTime: finalConfig.timeout,
    lastActiveTime: new Date(),
    totalActiveTime: 0,
    totalIdleTime: 0,
    isLeaderTab: true,
  });

  // 用于控制是否应该处理用户活动的引用
  const shouldProcessActivityRef = useRef(true);

  // 引用管理
  const tabIdRef = useRef<string>(generateTabId());
  const sessionStartTimeRef = useRef<Date>(new Date());
  const statisticsRef = useRef({
    totalSessions: 1,
    averageSessionDuration: 0,
    totalActivityEvents: 0,
    totalIdleEvents: 0,
  });

  // 处理用户活动
  const handleActivity = useCallback(
    (event?: Event) => {
      // 检查是否应该处理用户活动
      if (!shouldProcessActivityRef.current) {
        if (finalConfig.debug) {
          console.log(
            "⚠️ [UserActivity] 警告弹窗显示中，忽略用户活动:",
            event?.type
          );
        }
        return;
      }

      if (finalConfig.debug) {
        logActivity("activity", {
          eventType: event?.type || "manual",
          timestamp: new Date().toISOString(),
        });
      }

      setState((prev) => ({
        ...prev,
        lastActiveTime: new Date(),
        isIdle: false,
        isPrompted: false,
      }));

      statisticsRef.current.totalActivityEvents++;

      // 重置Token刷新计时器
      if (finalConfig.resetTokenOnActivity && loginService.isAuthenticated()) {
        try {
          // 重新触发token刷新机制
          loginService.startGlobalTokenRefresh();
        } catch (error) {
          console.warn("Failed to reset token refresh timer:", error);
        }
      }

      callbacks.onActivity?.({
        type: "activity",
        timestamp: new Date(),
        eventType: event?.type || "manual",
        target: event?.target || null,
      });
    },
    [finalConfig, callbacks]
  );

  // 处理空闲状态
  const handleIdle = useCallback(() => {
    if (finalConfig.debug) {
      logActivity("idle", { timestamp: new Date().toISOString() });
    }

    const now = new Date();
    const idleDuration = now.getTime() - (state.lastActiveTime?.getTime() || 0);

    setState((prev) => ({
      ...prev,
      isIdle: true,
      totalIdleTime: prev.totalIdleTime + idleDuration,
    }));

    statisticsRef.current.totalIdleEvents++;

    callbacks.onIdle?.({
      type: "idle",
      timestamp: now,
      lastActiveTime: state.lastActiveTime || now,
      idleDuration,
    });
  }, [finalConfig, callbacks, state.lastActiveTime]);

  // 处理警告提示
  const handlePrompt = useCallback(() => {
    if (finalConfig.debug) {
      logActivity("prompt", {
        remainingTime: finalConfig.promptTimeout,
        timestamp: new Date().toISOString(),
      });
      console.log("🚨 [UserActivity] 触发警告提示，设置 isPrompted = true");
    }

    // 在警告期间，暂停处理用户活动
    shouldProcessActivityRef.current = false;

    setState((prev) => ({
      ...prev,
      isPrompted: true,
      remainingTime: finalConfig.promptTimeout,
    }));

    callbacks.onPrompt?.({
      type: "prompt",
      timestamp: new Date(),
      remainingTime: finalConfig.promptTimeout,
      promptTimeout: finalConfig.promptTimeout,
    });
  }, [finalConfig, callbacks]);

  // 处理从空闲状态恢复
  const handleActive = useCallback(() => {
    // 检查是否应该处理用户活动
    if (!shouldProcessActivityRef.current) {
      if (finalConfig.debug) {
        console.log("⚠️ [UserActivity] 警告弹窗显示中，忽略自动恢复活动");
      }
      return;
    }

    if (finalConfig.debug) {
      logActivity("active", {
        timestamp: new Date().toISOString(),
      });
    }

    const now = new Date();
    const idleDuration = now.getTime() - (state.lastActiveTime?.getTime() || 0);

    setState((prev) => ({
      ...prev,
      isIdle: false,
      isPrompted: false,
      lastActiveTime: now,
      totalActiveTime: prev.totalActiveTime + idleDuration,
    }));

    callbacks.onActive?.({
      type: "active",
      timestamp: now,
      idleDuration,
      activeDuration: state.totalActiveTime,
    });
  }, [finalConfig, callbacks, state.lastActiveTime, state.totalActiveTime]);

  // 处理超时登出
  const handleTimeout = useCallback(async () => {
    if (finalConfig.debug) {
      logActivity("timeout", {
        reason: "auto",
        timestamp: new Date().toISOString(),
      });
      console.log("🚨 [UserActivity] 开始执行超时登出流程");
    }

    // 重新启用用户活动处理（虽然即将登出，但保持一致性）
    shouldProcessActivityRef.current = true;

    try {
      // 保存用户数据
      await safeAsync(async () => {
        saveToStorage("user_session_data", {
          sessionDuration: Date.now() - sessionStartTimeRef.current.getTime(),
          totalActivityEvents: statisticsRef.current.totalActivityEvents,
          lastActiveTime: state.lastActiveTime,
        });
      }, "Failed to save user data before logout");

      // 触发超时回调
      callbacks.onTimeout?.({
        type: "timeout",
        timestamp: new Date(),
        totalIdleTime: state.totalIdleTime,
        reason: "auto",
      });

      // 直接执行登出操作，不依赖logout函数
      if (finalConfig.debug) {
        console.log("🔄 [UserActivity] 停止Token自动刷新");
      }

      // 停止Token自动刷新
      loginService.stopGlobalTokenRefresh();

      if (finalConfig.debug) {
        console.log("🧹 [UserActivity] 清理用户数据");
      }

      // 清理用户数据
      loginService.clearAuthDataSync();
      cleanupStorage();

      // 触发登出回调
      callbacks.onLogout?.({
        type: "logout",
        timestamp: new Date(),
        reason: "timeout",
        saveData: true,
      });

      if (finalConfig.debug) {
        console.log("🚀 [UserActivity] 跳转到登录页面");
      }

      // 跳转到登录页
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("❌ [UserActivity] 超时登出失败:", error);

      // 即使出错也要尝试跳转到登录页
      try {
        navigate("/login", { replace: true });
      } catch (navError) {
        console.error("❌ [UserActivity] 导航失败:", navError);
        // 最后的备用方案：强制刷新页面到登录页
        window.location.href = "/login";
      }
    }
  }, [finalConfig, callbacks, state, navigate]);

  // 配置react-idle-timer
  const idleTimer = useIdleTimer({
    timeout: finalConfig.timeout,
    promptBeforeIdle: finalConfig.promptTimeout,
    onIdle: handleIdle,
    onActive: handleActive,
    onPrompt: handlePrompt,
    onAction: handleActivity,
    debounce: finalConfig.debounce,
    throttle: finalConfig.throttle,
    events: finalConfig.events as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    crossTab: finalConfig.crossTab,
    startOnMount: true,
    startManually: false,
    stopOnIdle: false,
    eventsThrottle: finalConfig.throttle,
  });

  // 手动登出函数
  const logout = useCallback(
    async (
      reason: "timeout" | "manual" | "force" = "manual",
      saveData: boolean = false
    ) => {
      if (finalConfig.debug) {
        logActivity("logout", { reason, saveData });
      }

      try {
        // 保存数据（如果需要）
        if (saveData) {
          await safeAsync(async () => {
            // 保存会话数据
            saveToStorage("user_session_data", {
              sessionDuration:
                Date.now() - sessionStartTimeRef.current.getTime(),
              totalActivityEvents: statisticsRef.current.totalActivityEvents,
              reason,
            });
          }, "Failed to save user data");
        }

        // 停止Token自动刷新
        loginService.stopGlobalTokenRefresh();

        // 清理用户数据
        loginService.clearAuthDataSync();
        cleanupStorage();

        // 触发登出回调（让组件层处理消息显示）
        callbacks.onLogout?.({
          type: "logout",
          timestamp: new Date(),
          reason,
          saveData,
        });

        // 跳转到登录页
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Logout failed:", error);
        // 让组件层处理错误消息
        callbacks.onLogout?.({
          type: "logout",
          timestamp: new Date(),
          reason: "force",
          saveData: false,
        });
      }
    },
    [finalConfig, callbacks, navigate]
  );

  // 处理警告取消（用户选择继续使用）
  const handlePromptCancel = useCallback(() => {
    if (finalConfig.debug) {
      logActivity("promptCancel", { timestamp: new Date().toISOString() });
      console.log(
        "✅ [UserActivity] 用户选择继续使用，设置 isPrompted = false"
      );
    }

    // 重新启用用户活动处理
    shouldProcessActivityRef.current = true;

    setState((prev) => ({
      ...prev,
      isPrompted: false,
      isIdle: false,
      lastActiveTime: new Date(),
    }));

    // 重置计时器
    idleTimer.reset();
  }, [finalConfig, idleTimer]);

  // 手动重置计时器
  const reset = useCallback(() => {
    idleTimer.reset();
    handleActivity();
  }, [idleTimer, handleActivity]);

  // 手动暂停监控
  const pause = useCallback(() => {
    idleTimer.pause();
  }, [idleTimer]);

  // 手动恢复监控
  const resume = useCallback(() => {
    idleTimer.resume();
  }, [idleTimer]);

  // 获取当前配置
  const getConfig = useCallback(() => finalConfig, [finalConfig]);

  // 更新配置（注意：这会重新创建idleTimer）
  const updateConfig = useCallback((newConfig: Partial<UserActivityConfig>) => {
     
    // 这里需要重新初始化，实际使用中可能需要更复杂的逻辑
    console.warn("updateConfig is not fully implemented yet");
  }, []);

  // 获取详细状态
  const getDetailedState = useCallback(
    (): DetailedUserActivityState => ({
      ...state,
      config: finalConfig,
      isEnabled: !idleTimer.isIdle(),
      isPaused: idleTimer.isIdle(),
      tabId: tabIdRef.current,
      sessionStartTime: sessionStartTimeRef.current,
      statistics: { ...statisticsRef.current },
    }),
    [state, finalConfig, idleTimer]
  );

  // 页面可见性变化处理
  useEffect(() => {
    if (!finalConfig.pauseOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (isPageVisible()) {
        resume();
        handleActivity();
      } else {
        pause();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [finalConfig.pauseOnVisibilityChange, pause, resume, handleActivity]);

  // 监控isPrompted状态变化（调试用）
  useEffect(() => {
    if (finalConfig.debug) {
      console.log(`🔍 [UserActivity] isPrompted 状态变化: ${state.isPrompted}`);
    }
  }, [state.isPrompted, finalConfig.debug]);

  // 更新剩余时间
  useEffect(() => {
    if (!state.isPrompted) return;

    if (finalConfig.debug) {
      console.log(
        "⏰ [UserActivity] 开始倒计时，剩余时间:",
        Math.ceil(state.remainingTime / 1000),
        "秒"
      );
    }

    const interval = setInterval(() => {
      setState((prev) => {
        const newRemainingTime = Math.max(0, prev.remainingTime - 1000);

        if (finalConfig.debug && newRemainingTime > 0) {
          console.log(
            "⏰ [UserActivity] 倒计时:",
            Math.ceil(newRemainingTime / 1000),
            "秒"
          );
        }

        if (newRemainingTime <= 0) {
          if (finalConfig.debug) {
            console.log("⏰ [UserActivity] 倒计时结束，触发超时");
          }
          handleTimeout();
        }

        return {
          ...prev,
          remainingTime: newRemainingTime,
        };
      });
    }, 1000);

    return () => {
      if (finalConfig.debug) {
        console.log("⏰ [UserActivity] 清理倒计时定时器");
      }
      clearInterval(interval);
    };
  }, [state.isPrompted, handleTimeout, finalConfig.debug]);

  return {
    ...state,
    reset,
    pause,
    resume,
    logout,
    getConfig,
    updateConfig,
    getDetailedState,
    handlePromptCancel, // 新增：专门处理警告取消
  };
};
