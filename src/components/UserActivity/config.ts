/**
 * 用户活动监控配置文件
 * 
 * 提供用户活动监控的默认配置和类型定义
 */

export interface UserActivityConfig {
  /** 空闲超时时间（毫秒） - 默认3分钟 */
  timeout: number;
  
  /** 警告提示时间（毫秒） - 默认30秒 */
  promptTimeout: number;
  
  /** 监听的事件类型 */
  events: string[];
  
  /** 防抖延迟（毫秒） */
  debounce: number;
  
  /** 节流延迟（毫秒） */
  throttle: number;
  
  /** 是否启用跨标签页同步 */
  crossTab: boolean;
  
  /** 是否在开发环境显示调试信息 */
  debug: boolean;
  
  /** 是否在页面隐藏时暂停监控 */
  pauseOnVisibilityChange: boolean;
  
  /** 是否在用户活动时重置Token刷新 */
  resetTokenOnActivity: boolean;
}

/**
 * 默认配置
 */
export const DEFAULT_USER_ACTIVITY_CONFIG: UserActivityConfig = {
  // 3分钟空闲超时
  timeout: 3 * 60 * 1000, // 180000ms
  
  // 30秒警告提示
  promptTimeout: 30 * 1000, // 30000ms
  
  // 监听的用户活动事件
  events: [
    'mousemove',
    'keydown',
    'wheel',
    'DOMMouseScroll',
    'mousewheel',
    'mousedown',
    'touchstart',
    'touchmove',
    'MSPointerDown',
    'MSPointerMove',
    'visibilitychange',
    'focus'
  ],
  
  // 防抖延迟 - 避免频繁触发
  debounce: 0,
  
  // 节流延迟 - 限制触发频率
  throttle: 500,
  
  // 启用跨标签页同步
  crossTab: true,
  
  // 开发环境显示调试信息
  debug: import.meta.env.DEV,
  
  // 页面隐藏时暂停监控
  pauseOnVisibilityChange: true,
  
  // 用户活动时重置Token刷新
  resetTokenOnActivity: true,
};

/**
 * 环境特定配置
 */
export const ENVIRONMENT_CONFIGS = {
  development: {
    ...DEFAULT_USER_ACTIVITY_CONFIG,
    // 开发环境缩短超时时间便于测试
    timeout: 30 * 1000, // 30秒
    promptTimeout: 10 * 1000, // 10秒
    debug: true,
  },
  
  production: {
    ...DEFAULT_USER_ACTIVITY_CONFIG,
    debug: false,
  },
  
  test: {
    ...DEFAULT_USER_ACTIVITY_CONFIG,
    timeout: 5 * 1000, // 5秒
    promptTimeout: 2 * 1000, // 2秒
    debug: false,
  },
};

/**
 * 获取当前环境的配置
 */
export const getCurrentConfig = (): UserActivityConfig => {
  const env = import.meta.env.MODE as keyof typeof ENVIRONMENT_CONFIGS;
  return ENVIRONMENT_CONFIGS[env] || DEFAULT_USER_ACTIVITY_CONFIG;
};

/**
 * 合并用户自定义配置
 */
export const mergeConfig = (
  userConfig: Partial<UserActivityConfig> = {}
): UserActivityConfig => {
  const defaultConfig = getCurrentConfig();
  return {
    ...defaultConfig,
    ...userConfig,
  };
};

/**
 * 验证配置有效性
 */
export const validateConfig = (config: UserActivityConfig): boolean => {
  // 超时时间必须大于警告时间
  if (config.timeout <= config.promptTimeout) {
    console.error('UserActivity: timeout must be greater than promptTimeout');
    return false;
  }
  
  // 超时时间不能小于5秒
  if (config.timeout < 5000) {
    console.error('UserActivity: timeout must be at least 5 seconds');
    return false;
  }
  
  // 警告时间不能小于1秒
  if (config.promptTimeout < 1000) {
    console.error('UserActivity: promptTimeout must be at least 1 second');
    return false;
  }
  
  return true;
};

/**
 * 日志配置
 */
export const LOG_CONFIG = {
  prefix: '[UserActivity]',
  colors: {
    info: '#1890ff',
    warn: '#faad14',
    error: '#ff4d4f',
    success: '#52c41a',
  },
};

/**
 * 存储键名
 */
export const STORAGE_KEYS = {
  LAST_ACTIVITY: 'kr_virt_last_activity',
  USER_ACTIVE: 'kr_virt_user_active',
  IDLE_STATE: 'kr_virt_idle_state',
} as const;
