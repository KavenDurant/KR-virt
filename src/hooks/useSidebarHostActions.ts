import { useEffect, useCallback } from "react";
import type { Node } from "@/services/mockData";

/**
 * 侧边栏主机操作事件的详细信息
 */
export interface SidebarHostActionDetail {
  action: string;
  hostname: string;
  hostData?: Node;
  [key: string]: unknown;
}

/**
 * 主机操作类型映射
 * 将侧边栏的操作名称映射到实际的API操作类型
 */
export const HOST_ACTION_MAPPING = {
  reboot: "reboot",
  shutdown: "stop",
  maintenance: "enter_maintenance",
  migrate: "migrate",
} as const;

/**
 * 主机操作回调函数类型
 */
export type HostActionCallback = (
  operation: keyof typeof HOST_ACTION_MAPPING | string,
  hostname: string,
  hostData?: Node,
) => void;

/**
 * useSidebarHostActions Hook 配置选项
 */
export interface UseSidebarHostActionsOptions {
  /**
   * 是否启用主机操作监听
   * @default true
   */
  enabled?: boolean;

  /**
   * 过滤主机操作事件的条件函数
   * 返回 true 表示处理该事件，false 表示忽略
   */
  filter?: (detail: SidebarHostActionDetail) => boolean;
}

/**
 * 自定义Hook：管理侧边栏主机操作事件监听
 *
 * 这个Hook专门处理从侧边栏触发的主机操作事件，提供了：
 * 1. 自动的事件监听和清理
 * 2. 操作类型的标准化映射
 * 3. 类型安全的回调接口
 * 4. 灵活的过滤机制
 *
 * 使用场景：
 * - 处理侧边栏右键菜单的主机操作
 * - 统一管理主机操作的业务逻辑
 * - 确保操作类型的一致性
 *
 * @param callback 主机操作的回调函数
 * @param options 配置选项
 */
export const useSidebarHostActions = (
  callback: HostActionCallback,
  options: UseSidebarHostActionsOptions = {},
): void => {
  const { enabled = true, filter } = options;

  /**
   * 处理侧边栏主机操作事件
   * 将侧边栏的操作名称映射到标准的操作类型，并调用回调函数
   */
  const handleSidebarHostAction = useCallback(
    (event: CustomEvent<SidebarHostActionDetail>) => {
      const { action, hostname, hostData } = event.detail;

      // 应用过滤条件
      if (filter && !filter(event.detail)) {
        return;
      }

      // 映射操作类型到标准格式
      const mappedOperation =
        HOST_ACTION_MAPPING[action as keyof typeof HOST_ACTION_MAPPING] ||
        action;

      // 调用回调函数
      callback(mappedOperation, hostname, hostData);
    },
    [callback, filter],
  );

  /**
   * 监听侧边栏主机操作事件
   * 根据 enabled 状态自动注册和清理事件监听器
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const eventListener = handleSidebarHostAction as EventListener;

    window.addEventListener("hierarchical-sidebar-host-action", eventListener);

    return () => {
      window.removeEventListener(
        "hierarchical-sidebar-host-action",
        eventListener,
      );
    };
  }, [handleSidebarHostAction, enabled]);
};

/**
 * 触发侧边栏主机操作事件的工具函数
 *
 * 这个函数提供了一个统一的方式来触发主机操作事件，
 * 确保事件格式的一致性和类型安全。
 *
 * @param action 操作类型
 * @param hostname 主机名
 * @param hostData 主机数据（可选）
 */
export const triggerSidebarHostAction = (
  action: string,
  hostname: string,
  hostData?: Node,
): void => {
  const actionEvent = new CustomEvent("hierarchical-sidebar-host-action", {
    detail: {
      action,
      hostname,
      hostData,
    },
  });

  window.dispatchEvent(actionEvent);
};

/**
 * 预定义的主机操作类型
 * 提供常用的主机操作类型，确保操作类型的一致性
 */
export const HostActionTypes = {
  REBOOT: "reboot",
  SHUTDOWN: "shutdown",
  MAINTENANCE: "maintenance",
  MIGRATE: "migrate",
  START: "start",
  STOP: "stop",
} as const;

/**
 * 便捷的主机操作触发函数
 * 为常见的主机操作提供简化的调用方式
 */
export const HostActionTriggers = {
  /**
   * 触发主机重启操作
   */
  reboot: (hostname: string, hostData?: Node) => {
    triggerSidebarHostAction(HostActionTypes.REBOOT, hostname, hostData);
  },

  /**
   * 触发主机关机操作
   */
  shutdown: (hostname: string, hostData?: Node) => {
    triggerSidebarHostAction(HostActionTypes.SHUTDOWN, hostname, hostData);
  },

  /**
   * 触发主机进入维护模式操作
   */
  enterMaintenance: (hostname: string, hostData?: Node) => {
    triggerSidebarHostAction(HostActionTypes.MAINTENANCE, hostname, hostData);
  },

  /**
   * 触发虚拟机迁移操作
   */
  migrate: (hostname: string, hostData?: Node) => {
    triggerSidebarHostAction(HostActionTypes.MIGRATE, hostname, hostData);
  },
};
