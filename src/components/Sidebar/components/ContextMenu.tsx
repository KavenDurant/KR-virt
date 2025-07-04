/**
 * 右键菜单组件
 * 
 * 提供统一的右键菜单功能，根据节点类型和模式显示不同的菜单项
 */

import React, { useMemo } from "react";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import type { UnifiedNodeData, SidebarMode, MenuItemConfig, MenuActionCallback } from "../types";
import { getSidebarConfig } from "../config";

interface ContextMenuProps {
  node: UnifiedNodeData;
  mode: SidebarMode;
  onAction: MenuActionCallback;
  children: React.ReactNode;
}

/**
 * 检查菜单项是否应该禁用
 */
const isMenuItemDisabled = (
  action: string, 
  node: UnifiedNodeData
): boolean => {
  const { type, status } = node;

  if (type === "vm") {
    const isRunning = status === "running";
    const isStopped = status === "stopped" || status === "shutoff";
    const isPaused = status === "paused" || status === "suspended";

    switch (action) {
      case "start":
        return isRunning || isPaused;
      case "shutdown":
      case "restart":
      case "destroy":
        return isStopped;
      case "pause":
        return !isRunning;
      case "resume":
        return !isPaused;
      default:
        return false;
    }
  }

  if (type === "host") {
    const isOnline = status === "online";
    
    switch (action) {
      case "reboot":
      case "shutdown":
      case "maintenance":
        return !isOnline;
      default:
        return false;
    }
  }

  return false;
};

/**
 * 获取菜单项的状态提示
 */
const getMenuItemHint = (
  action: string, 
  node: UnifiedNodeData
): string | null => {
  const { type, status } = node;

  if (type === "vm") {
    const isRunning = status === "running";
    const isStopped = status === "stopped" || status === "shutoff";
    const isPaused = status === "paused" || status === "suspended";

    switch (action) {
      case "start":
        return isStopped ? "可用" : null;
      case "shutdown":
        return isRunning ? "推荐" : null;
      case "pause":
        return isRunning ? "可用" : null;
      case "resume":
        return isPaused ? "可用" : null;
      case "destroy":
        return status === "error" ? "可用" : null;
      default:
        return null;
    }
  }

  if (type === "host") {
    // 这里可以根据主机状态添加提示
    // 例如检查是否有运行中的VM等
    return null;
  }

  return null;
};

/**
 * 转换菜单配置为Ant Design菜单项
 */
const convertToAntdMenuItems = (
  menuConfigs: MenuItemConfig[],
  node: UnifiedNodeData,
  onAction: MenuActionCallback
): MenuProps["items"] => {
  return menuConfigs.map((config) => {
    if (config.divider) {
      return {
        type: "divider" as const,
        key: config.key,
      };
    }

    const disabled = isMenuItemDisabled(config.key, node);
    const hint = getMenuItemHint(config.key, node);
    const IconComponent = config.icon;

    return {
      key: config.key,
      icon: IconComponent ? <IconComponent /> : undefined,
      label: (
        <span>
          {config.label}
          {hint && (
            <span
              style={{
                color: disabled ? "#d9d9d9" : "#52c41a",
                marginLeft: 8,
                fontSize: "11px",
              }}
            >
              {hint}
            </span>
          )}
        </span>
      ),
      disabled,
      danger: config.danger,
      onClick: (e) => {
        e?.domEvent?.stopPropagation();
        onAction(config.key, node);
      },
    };
  });
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  node,
  mode,
  onAction,
  children,
}) => {
  const menuItems = useMemo((): MenuProps["items"] => {
    const config = getSidebarConfig(mode);
    const nodeConfig = config.nodeConfigs[node.type];
    
    if (!nodeConfig?.contextMenu || nodeConfig.contextMenu.length === 0) {
      return [];
    }

    return convertToAntdMenuItems(nodeConfig.contextMenu, node, onAction);
  }, [node, mode, onAction]);

  // 如果没有菜单项，直接返回子元素
  if (!menuItems || menuItems.length === 0) {
    return <>{children}</>;
  }

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={["contextMenu"]}
      overlayClassName={`${node.type}-context-menu`}
    >
      {children}
    </Dropdown>
  );
};

export default ContextMenu;