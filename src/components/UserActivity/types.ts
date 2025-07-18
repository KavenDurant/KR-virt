/**
 * 用户活动监控类型定义
 */

import type { UserActivityConfig } from "./config";

/**
 * 用户活动状态
 */
export interface UserActivityState {
  /** 是否处于空闲状态 */
  isIdle: boolean;

  /** 是否正在显示警告提示 */
  isPrompted: boolean;

  /** 剩余时间（毫秒） */
  remainingTime: number;

  /** 最后活动时间 */
  lastActiveTime: Date | null;

  /** 总活动时间（毫秒） */
  totalActiveTime: number;

  /** 总空闲时间（毫秒） */
  totalIdleTime: number;

  /** 是否为主标签页 */
  isLeaderTab: boolean;
}

/**
 * 用户活动事件类型
 */
export type UserActivityEvent =
  | "idle" // 用户进入空闲状态
  | "active" // 用户从空闲状态恢复活动
  | "prompt" // 显示警告提示
  | "promptCancel" // 取消警告提示
  | "activity" // 用户活动
  | "timeout" // 超时自动登出
  | "logout"; // 手动登出

/**
 * 事件回调函数类型
 */
export interface UserActivityCallbacks {
  /** 用户进入空闲状态时的回调 */
  onIdle?: (event: IdleEvent) => void;

  /** 用户从空闲状态恢复活动时的回调 */
  onActive?: (event: ActiveEvent) => void;

  /** 显示警告提示时的回调 */
  onPrompt?: (event: PromptEvent) => void;

  /** 用户活动时的回调 */
  onActivity?: (event: ActivityEvent) => void;

  /** 超时自动登出时的回调 */
  onTimeout?: (event: TimeoutEvent) => void;

  /** 手动登出时的回调 */
  onLogout?: (event: LogoutEvent) => void;
}

/**
 * 空闲事件
 */
export interface IdleEvent {
  type: "idle";
  timestamp: Date;
  lastActiveTime: Date;
  idleDuration: number;
}

/**
 * 活动事件
 */
export interface ActiveEvent {
  type: "active";
  timestamp: Date;
  idleDuration: number;
  activeDuration: number;
}

/**
 * 警告提示事件
 */
export interface PromptEvent {
  type: "prompt";
  timestamp: Date;
  remainingTime: number;
  promptTimeout: number;
}

/**
 * 用户活动事件
 */
export interface ActivityEvent {
  type: "activity";
  timestamp: Date;
  eventType: string;
  target?: EventTarget | null;
}

/**
 * 超时事件
 */
export interface TimeoutEvent {
  type: "timeout";
  timestamp: Date;
  totalIdleTime: number;
  reason: "auto" | "manual";
}

/**
 * 登出事件
 */
export interface LogoutEvent {
  type: "logout";
  timestamp: Date;
  reason: "timeout" | "manual" | "force";
  saveData?: boolean;
}

/**
 * Hook返回值类型
 */
export interface UseUserActivityReturn extends UserActivityState {
  /** 手动重置计时器 */
  reset: () => void;

  /** 手动暂停监控 */
  pause: () => void;

  /** 手动恢复监控 */
  resume: () => void;

  /** 手动触发登出 */
  logout: (reason?: "manual" | "force", saveData?: boolean) => void;

  /** 获取当前配置 */
  getConfig: () => UserActivityConfig;

  /** 更新配置 */
  updateConfig: (newConfig: Partial<UserActivityConfig>) => void;

  /** 获取详细状态信息 */
  getDetailedState: () => DetailedUserActivityState;

  /** 处理警告取消（用户选择继续使用） */
  handlePromptCancel: () => void;
}

/**
 * 详细状态信息
 */
export interface DetailedUserActivityState extends UserActivityState {
  /** 当前配置 */
  config: UserActivityConfig;

  /** 监控是否启用 */
  isEnabled: boolean;

  /** 监控是否暂停 */
  isPaused: boolean;

  /** 标签页ID */
  tabId: string;

  /** 会话开始时间 */
  sessionStartTime: Date;

  /** 活动统计 */
  statistics: {
    totalSessions: number;
    averageSessionDuration: number;
    totalActivityEvents: number;
    totalIdleEvents: number;
  };
}

/**
 * 警告弹窗Props
 */
export interface IdleWarningModalProps {
  /** 是否显示弹窗 */
  visible: boolean;

  /** 剩余时间（秒） */
  remainingTime: number;

  /** 确认继续使用的回调 */
  onContinue: () => void;

  /** 手动登出的回调 */
  onLogout: () => void;

  /** 弹窗关闭的回调 */
  onCancel?: () => void;

  /** 自定义标题 */
  title?: string;

  /** 自定义描述 */
  description?: string;

  /** 是否显示倒计时 */
  showCountdown?: boolean;

  /** 是否可以通过ESC键关闭 */
  closable?: boolean;

  /** 是否显示遮罩 */
  mask?: boolean;

  /** 点击遮罩是否关闭 */
  maskClosable?: boolean;
}

/**
 * 组件Props
 */
export interface UserActivityMonitorProps {
  /** 自定义配置 */
  config?: Partial<UserActivityConfig>;

  /** 事件回调 */
  callbacks?: UserActivityCallbacks;

  /** 是否启用监控 */
  enabled?: boolean;

  /** 子组件 */
  children?: React.ReactNode;

  /** 自定义警告弹窗组件 */
  warningComponent?: React.ComponentType<IdleWarningModalProps>;
}

/**
 * 工具函数类型
 */
export interface UserActivityUtils {
  /** 格式化时间 */
  formatTime: (milliseconds: number) => string;

  /** 格式化持续时间 */
  formatDuration: (milliseconds: number) => string;

  /** 检查是否为有效的活动事件 */
  isValidActivityEvent: (event: Event) => boolean;

  /** 生成唯一标签页ID */
  generateTabId: () => string;

  /** 保存用户数据 */
  saveUserData: () => Promise<void>;

  /** 清理用户数据 */
  cleanupUserData: () => void;

  /** 记录活动日志 */
  logActivity: (event: UserActivityEvent, data?: unknown) => void;
}
