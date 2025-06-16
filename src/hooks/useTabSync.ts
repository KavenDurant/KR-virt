/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-01-20 10:00:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-16 11:49:46
 * @FilePath: /KR-virt/src/hooks/useTabSync.ts
 * @Description: Tab URL同步Hook - 实现tab切换与URL地址同步
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * useTabSync Hook配置选项
 */
interface UseTabSyncOptions {
  /** 默认的tab key */
  defaultTab: string;
  /** URL参数名称，默认为'tab' */
  paramName?: string;
  /** 是否替换历史记录，默认为false */
  replace?: boolean;
  /** 是否启用调试日志，默认为false */
  debug?: boolean;
}

/**
 * useTabSync Hook返回值
 */
interface UseTabSyncReturn {
  /** 当前激活的tab key */
  activeTab: string;
  /** 设置活跃tab的函数 */
  setActiveTab: (tabKey: string) => void;
  /** 从URL获取tab参数的函数 */
  getTabFromUrl: () => string | null;
  /** 更新URL中tab参数的函数 */
  updateUrlTab: (tabKey: string, replace?: boolean) => void;
}

/**
 * Tab URL同步Hook
 *
 * 功能：
 * 1. 监听URL变化，自动同步tab状态
 * 2. tab切换时自动更新URL参数
 * 3. 页面刷新后能恢复正确的tab状态
 * 4. 支持浏览器前进/后退按钮
 *
 * @param options 配置选项
 * @returns Hook返回值
 *
 * @example
 * ```tsx
 * // 基本用法
 * const { activeTab, setActiveTab } = useTabSync({
 *   defaultTab: 'overview'
 * });
 *
 * <Tabs activeKey={activeTab} onChange={setActiveTab}>
 *   <TabPane tab="概览" key="overview">...</TabPane>
 *   <TabPane tab="列表" key="list">...</TabPane>
 * </Tabs>
 *
 * // 自定义参数名
 * const { activeTab, setActiveTab } = useTabSync({
 *   defaultTab: 'general',
 *   paramName: 'section' // URL: ?section=general
 * });
 *
 * // 启用调试模式
 * const { activeTab, setActiveTab } = useTabSync({
 *   defaultTab: 'audit-logs',
 *   debug: true
 * });
 * ```
 */
export const useTabSync = (options: UseTabSyncOptions): UseTabSyncReturn => {
  const {
    defaultTab,
    paramName = "tab",
    replace = false,
    debug = false,
  } = options;

  const location = useLocation();
  const navigate = useNavigate();

  // 从URL获取tab参数
  const getTabFromUrl = useCallback((): string | null => {
    const searchParams = new URLSearchParams(location.search);
    const tabFromUrl = searchParams.get(paramName);

    if (debug && tabFromUrl) {
      console.log(`[useTabSync] 从URL获取tab: ${tabFromUrl}`);
    }

    return tabFromUrl;
  }, [location.search, paramName, debug]);

  // 初始化activeTab状态
  const [activeTab, setActiveTabState] = useState<string>(() => {
    const urlTab = getTabFromUrl();
    const initialTab = urlTab || defaultTab;

    if (debug) {
      console.log(`[useTabSync] 初始化tab: ${initialTab}`, {
        urlTab,
        defaultTab,
        currentUrl: location.pathname + location.search,
      });
    }

    return initialTab;
  });

  // 更新URL中的tab参数
  const updateUrlTab = useCallback(
    (tabKey: string, shouldReplace = replace) => {
      const searchParams = new URLSearchParams(location.search);

      // 如果是默认tab，移除URL参数以保持简洁
      if (tabKey === defaultTab) {
        searchParams.delete(paramName);
      } else {
        searchParams.set(paramName, tabKey);
      }

      const newSearch = searchParams.toString();
      const newUrl = location.pathname + (newSearch ? `?${newSearch}` : "");

      if (debug) {
        console.log(`[useTabSync] 更新URL:`, {
          tabKey,
          newUrl,
          replace: shouldReplace,
          isDefault: tabKey === defaultTab,
        });
      }

      navigate(newUrl, { replace: shouldReplace });
    },
    [
      location.pathname,
      location.search,
      paramName,
      defaultTab,
      replace,
      navigate,
      debug,
    ]
  );

  // 设置activeTab并同步URL
  const setActiveTab = useCallback(
    (tabKey: string) => {
      if (debug) {
        console.log(`[useTabSync] 切换tab: ${activeTab} -> ${tabKey}`);
      }

      setActiveTabState(tabKey);
      updateUrlTab(tabKey);
    },
    [activeTab, updateUrlTab, debug]
  );

  // 监听URL变化，同步tab状态
  useEffect(() => {
    const urlTab = getTabFromUrl();
    const targetTab = urlTab || defaultTab;

    if (targetTab !== activeTab) {
      if (debug) {
        console.log(
          `[useTabSync] URL变化同步tab: ${activeTab} -> ${targetTab}`
        );
      }
      setActiveTabState(targetTab);
    }
  }, [location.search, activeTab, defaultTab, getTabFromUrl, debug]);

  // 页面加载时，如果URL没有tab参数且当前不是默认tab，更新URL
  useEffect(() => {
    const urlTab = getTabFromUrl();

    if (!urlTab && activeTab !== defaultTab) {
      if (debug) {
        console.log(`[useTabSync] 页面加载时同步URL: tab=${activeTab}`);
      }
      updateUrlTab(activeTab, true); // 使用replace避免产生额外历史记录
    }
  }, []); // 只在组件挂载时执行

  return {
    activeTab,
    setActiveTab,
    getTabFromUrl,
    updateUrlTab,
  };
};

/**
 * 简化版的Tab同步Hook，用于最常见的场景
 *
 * @param defaultTab 默认tab key
 * @returns [activeTab, setActiveTab] 元组
 *
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useSimpleTabSync('overview');
 *
 * <Tabs activeKey={activeTab} onChange={setActiveTab}>
 *   <TabPane tab="概览" key="overview">...</TabPane>
 *   <TabPane tab="列表" key="list">...</TabPane>
 * </Tabs>
 * ```
 */
export const useSimpleTabSync = (
  defaultTab: string
): [string, (tabKey: string) => void] => {
  const { activeTab, setActiveTab } = useTabSync({ defaultTab });
  return [activeTab, setActiveTab];
};

export default useTabSync;
