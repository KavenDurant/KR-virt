import { useEffect, useCallback } from 'react';

/**
 * 侧边栏刷新事件的详细信息
 */
export interface SidebarRefreshDetail {
  type: string;
  action: string;
  [key: string]: unknown;
}

/**
 * 侧边栏刷新回调函数类型
 */
export type SidebarRefreshCallback = (detail: SidebarRefreshDetail) => void;

/**
 * useSidebarRefresh Hook 配置选项
 */
export interface UseSidebarRefreshOptions {
  /**
   * 是否启用刷新监听
   * @default true
   */
  enabled?: boolean;
  
  /**
   * 过滤刷新事件的条件函数
   * 返回 true 表示处理该事件，false 表示忽略
   */
  filter?: (detail: SidebarRefreshDetail) => boolean;
}

/**
 * 自定义Hook：管理侧边栏刷新事件监听
 * 
 * 这个Hook提供了一个简洁的方式来监听和处理侧边栏刷新事件，
 * 支持条件过滤和自动清理，避免了手动管理事件监听器的复杂性。
 * 
 * 使用场景：
 * - 当侧边栏数据发生变化时，需要刷新主内容区域
 * - 当执行某些操作后，需要同步更新侧边栏显示
 * 
 * @param callback 刷新事件的回调函数
 * @param options 配置选项
 */
export const useSidebarRefresh = (
  callback: SidebarRefreshCallback,
  options: UseSidebarRefreshOptions = {}
): void => {
  const { enabled = true, filter } = options;

  /**
   * 处理侧边栏刷新事件
   * 应用过滤条件并调用回调函数
   */
  const handleSidebarRefresh = useCallback((event: CustomEvent<SidebarRefreshDetail>) => {
    const detail = event.detail;
    
    // 应用过滤条件
    if (filter && !filter(detail)) {
      return;
    }
    
    // 调用回调函数
    callback(detail);
  }, [callback, filter]);

  /**
   * 监听侧边栏刷新事件
   * 根据 enabled 状态自动注册和清理事件监听器
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const eventListener = handleSidebarRefresh as EventListener;
    
    window.addEventListener('refresh-sidebar', eventListener);
    
    return () => {
      window.removeEventListener('refresh-sidebar', eventListener);
    };
  }, [handleSidebarRefresh, enabled]);
};

/**
 * 触发侧边栏刷新事件的工具函数
 * 
 * 这个函数提供了一个统一的方式来触发侧边栏刷新事件，
 * 确保事件格式的一致性和类型安全。
 * 
 * @param detail 刷新事件的详细信息
 */
export const triggerSidebarRefresh = (detail: SidebarRefreshDetail): void => {
  const refreshEvent = new CustomEvent('refresh-sidebar', {
    detail,
  });
  
  window.dispatchEvent(refreshEvent);
};

/**
 * 预定义的侧边栏刷新事件类型
 * 提供常用的刷新事件类型，确保事件类型的一致性
 */
export const SidebarRefreshTypes = {
  CLUSTER: 'cluster',
  HOST: 'host',
  VM: 'vm',
  NETWORK: 'network',
  STORAGE: 'storage',
} as const;

/**
 * 预定义的侧边栏刷新操作类型
 * 提供常用的操作类型，确保操作类型的一致性
 */
export const SidebarRefreshActions = {
  ADDED: 'added',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STATUS_CHANGED: 'status-changed',
  CONFIGURATION_CHANGED: 'configuration-changed',
} as const;

/**
 * 便捷的刷新事件触发函数
 * 为常见的刷新场景提供简化的调用方式
 */
export const SidebarRefreshTriggers = {
  /**
   * 触发集群相关的刷新事件
   */
  cluster: (action: string, data?: Record<string, unknown>) => {
    triggerSidebarRefresh({
      type: SidebarRefreshTypes.CLUSTER,
      action,
      ...data,
    });
  },
  
  /**
   * 触发主机相关的刷新事件
   */
  host: (action: string, data?: Record<string, unknown>) => {
    triggerSidebarRefresh({
      type: SidebarRefreshTypes.HOST,
      action,
      ...data,
    });
  },
  
  /**
   * 触发虚拟机相关的刷新事件
   */
  vm: (action: string, data?: Record<string, unknown>) => {
    triggerSidebarRefresh({
      type: SidebarRefreshTypes.VM,
      action,
      ...data,
    });
  },
  
  /**
   * 触发网络相关的刷新事件
   */
  network: (action: string, data?: Record<string, unknown>) => {
    triggerSidebarRefresh({
      type: SidebarRefreshTypes.NETWORK,
      action,
      ...data,
    });
  },
  
  /**
   * 触发存储相关的刷新事件
   */
  storage: (action: string, data?: Record<string, unknown>) => {
    triggerSidebarRefresh({
      type: SidebarRefreshTypes.STORAGE,
      action,
      ...data,
    });
  },
};
