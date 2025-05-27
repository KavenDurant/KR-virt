import React, { useState, useEffect, useCallback, useRef } from "react";
import { Badge, Layout, Menu, Tooltip } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  DesktopOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  HddOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
  BellOutlined,
  AuditOutlined,
} from "@ant-design/icons";
import routes from "../../router/routes";
import TaskDrawer from "../TaskDrawer";
import { useTheme } from "../../hooks/useTheme";
import { authService } from "../../services/authService";
import type { UserInfo } from "../../services/authService";
import "./AppLayout.css";

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { actualTheme } = useTheme();

  // 用户信息状态
  const [, setCurrentUser] = useState<UserInfo | null>(null);

  // 初始化用户信息
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // 添加侧边栏宽度状态，使用useRef保证它不会随渲染重置
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // 从本地存储中获取保存的侧边栏宽度，如果没有则使用默认值
    const savedWidth = localStorage.getItem("sidebarWidth");
    return savedWidth ? parseInt(savedWidth) : 250;
  });

  // 存储原始宽度的ref，用于拖动参考
  const originalWidthRef = useRef(sidebarWidth);
  // 添加任务抽屉状态
  const [taskDrawerVisible, setTaskDrawerVisible] = useState(false);

  // 添加拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  // 处理侧边栏宽度调整 - 优化版本，减少重新渲染
  const handleSidebarResize = useCallback(
    (newWidth: number, updateState: boolean = true) => {
      // 确保宽度在有效范围内
      const validWidth = Math.max(200, Math.min(newWidth, 400));

      // 立即更新DOM样式，避免视觉延迟
      if (sidebarRef.current) {
        sidebarRef.current.style.width = `${validWidth}px`;
      }

      // 只在需要时更新状态和localStorage
      if (updateState) {
        setSidebarWidth(validWidth);
        localStorage.setItem("sidebarWidth", validWidth.toString());
        originalWidthRef.current = validWidth;
      }
    },
    [] // 移除sidebarWidth依赖，避免频繁重新创建函数
  );

  // 根据当前路径确定选中的菜单项
  const getCurrentSelectedPath = useCallback(() => {
    // 如果是根路径，默认选中仪表盘
    return location.pathname === "/" ? "/dashboard" : location.pathname;
  }, [location.pathname]);

  const [selectedActivityItem, setSelectedActivityItem] = useState(
    getCurrentSelectedPath
  );

  // 当路由变化时更新选中的菜单项
  useEffect(() => {
    const currentPath = getCurrentSelectedPath();
    setSelectedActivityItem(currentPath);

    // 如果当前是根路径，自动跳转到仪表盘
    if (location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [location.pathname, getCurrentSelectedPath, navigate]);

  // 初始加载时设置侧边栏宽度
  useEffect(() => {
    // 确保侧边栏宽度与localStorage同步（仅在组件挂载时）
    const savedWidth = localStorage.getItem("sidebarWidth");
    if (savedWidth && sidebarRef.current) {
      const width = parseInt(savedWidth);
      setSidebarWidth(width);
      originalWidthRef.current = width;
      sidebarRef.current.style.width = `${width}px`;
    }

    // 监听存储变化（来自其他标签页的变化）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sidebarWidth" && e.newValue) {
        const width = parseInt(e.newValue);
        setSidebarWidth(width);
        originalWidthRef.current = width;
        if (sidebarRef.current) {
          sidebarRef.current.style.width = `${width}px`;
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // 空依赖数组，仅在挂载时执行

  // 处理根路径重定向
  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/dashboard");
    }
  }, [location.pathname, navigate]);

  // 处理菜单点击事件
  const handleMenuClick = (path: string) => {
    setSelectedActivityItem(path);
    navigate(path);
  };

  // 恢复活动栏图标配置，后续会按位置单独渲染
  const activityItems = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "仪表盘" },
    { key: "/virtual-machine", icon: <DesktopOutlined />, label: "虚拟机管理" },
    { key: "/cluster", icon: <ClusterOutlined />, label: "集群管理" },
    {
      key: "/physical-machine",
      icon: <DatabaseOutlined />,
      label: "物理机管理",
    },
    { key: "/network", icon: <GlobalOutlined />, label: "网络管理" },
    { key: "/storage", icon: <HddOutlined />, label: "存储管理" },
    { key: "/user", icon: <UserOutlined />, label: "用户管理" },
    { key: "/audit", icon: <AuditOutlined />, label: "审计管理" },
    { key: "/system", icon: <SettingOutlined />, label: "系统设置" },
  ];
  return (
    <Layout
      className="app-layout"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "row",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* 活动栏 - VS Code左侧窄栏 */}
      <div
        className="activity-bar"
        style={{
          backgroundColor: actualTheme === "dark" ? "#333333" : "#f3f3f3",
          display: "flex",
          flexDirection: "column",
          width: "50px",
          boxShadow: "2px 0 5px rgba(0, 0, 0, 0.3)",
          zIndex: 10,
        }}
      >
        {/* 顶部图标 */}
        <div style={{ flex: "0 0 auto" }}>
          <Menu
            className="activity-bar-menu"
            selectedKeys={[selectedActivityItem]}
            mode="vertical"
            theme={actualTheme === "dark" ? "dark" : "light"}
            style={{
              backgroundColor: actualTheme === "dark" ? "#333333" : "#f3f3f3",
              borderRight: "none",
            }}
            onClick={(e) => handleMenuClick(e.key)}
            items={activityItems.slice(0, 6).map((item) => ({
              key: item.key,
              icon: (
                <Tooltip
                  title={item.label}
                  placement="right"
                  overlayClassName="activity-tooltip"
                  mouseEnterDelay={0.5}
                  overlayInnerStyle={{
                    backgroundColor:
                      actualTheme === "dark" ? "#252526" : "#ffffff",
                    color: actualTheme === "dark" ? "#cccccc" : "#000000",
                    border: `1px solid ${
                      actualTheme === "dark" ? "#454545" : "#d9d9d9"
                    }`,
                    borderRadius: "2px",
                    fontSize: "12px",
                    padding: "4px 8px",
                    boxShadow:
                      actualTheme === "dark"
                        ? "0 2px 8px rgba(0, 0, 0, 0.5)"
                        : "0 2px 8px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  {React.cloneElement(item.icon, {
                    style: {
                      fontSize: "20px",
                      color:
                        item.key === selectedActivityItem
                          ? actualTheme === "dark"
                            ? "#ffffff"
                            : "#000000"
                          : actualTheme === "dark"
                          ? "#858585"
                          : "#666666",
                    },
                  })}
                </Tooltip>
              ),
              style: {
                backgroundColor:
                  item.key === selectedActivityItem
                    ? actualTheme === "dark"
                      ? "#444444"
                      : "#e6f7ff"
                    : actualTheme === "dark"
                    ? "#333333"
                    : "#f3f3f3",
                height: "50px",
              },
            }))}
          />
        </div>

        {/* 底部图标 - 使用弹性布局将它们推到底部 */}
        <div style={{ marginTop: "auto" }}>
          {/* 通知图标 - 非模块图标，仅用于显示 */}
          <div
            className="notification-icon"
            style={{
              width: "50px",
              height: "50px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <Badge count={5}>
              <Tooltip
                title="通知"
                placement="right"
                overlayClassName="activity-tooltip"
                mouseEnterDelay={0.5}
                overlayInnerStyle={{
                  backgroundColor:
                    actualTheme === "dark" ? "#252526" : "#ffffff",
                  color: actualTheme === "dark" ? "#cccccc" : "#000000",
                  border: `1px solid ${
                    actualTheme === "dark" ? "#454545" : "#d9d9d9"
                  }`,
                  borderRadius: "2px",
                  fontSize: "12px",
                  padding: "4px 8px",
                  boxShadow:
                    actualTheme === "dark"
                      ? "0 2px 8px rgba(0, 0, 0, 0.5)"
                      : "0 2px 8px rgba(0, 0, 0, 0.15)",
                }}
              >
                <div style={{ position: "relative" }}>
                  {" "}
                  <BellOutlined
                    style={{
                      fontSize: "20px",
                      color: taskDrawerVisible
                        ? actualTheme === "dark"
                          ? "#ffffff"
                          : "#000000"
                        : actualTheme === "dark"
                        ? "#858585"
                        : "#666666",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      // 处理通知点击事件，打开/关闭任务抽屉
                      setTaskDrawerVisible(!taskDrawerVisible);
                    }}
                  />
                </div>
              </Tooltip>
            </Badge>
          </div>

          <Menu
            className="activity-bar-menu"
            selectedKeys={[selectedActivityItem]}
            mode="vertical"
            theme={actualTheme === "dark" ? "dark" : "light"}
            style={{
              backgroundColor: actualTheme === "dark" ? "#333333" : "#f3f3f3",
              borderRight: "none",
            }}
            onClick={(e) => handleMenuClick(e.key)}
            items={activityItems.slice(6).map((item) => ({
              key: item.key,
              icon: (
                <Tooltip
                  title={item.label}
                  placement="right"
                  overlayClassName="activity-tooltip"
                  mouseEnterDelay={0.5}
                  overlayInnerStyle={{
                    backgroundColor:
                      actualTheme === "dark" ? "#252526" : "#ffffff",
                    color: actualTheme === "dark" ? "#cccccc" : "#000000",
                    border: `1px solid ${
                      actualTheme === "dark" ? "#454545" : "#d9d9d9"
                    }`,
                    borderRadius: "2px",
                    fontSize: "12px",
                    padding: "4px 8px",
                    boxShadow:
                      actualTheme === "dark"
                        ? "0 2px 8px rgba(0, 0, 0, 0.5)"
                        : "0 2px 8px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  {React.cloneElement(item.icon, {
                    style: {
                      fontSize: "20px",
                      color:
                        item.key === selectedActivityItem
                          ? actualTheme === "dark"
                            ? "#ffffff"
                            : "#000000"
                          : actualTheme === "dark"
                          ? "#858585"
                          : "#666666",
                    },
                  })}
                </Tooltip>
              ),
              style: {
                backgroundColor:
                  item.key === selectedActivityItem
                    ? actualTheme === "dark"
                      ? "#444444"
                      : "#e6f7ff"
                    : actualTheme === "dark"
                    ? "#333333"
                    : "#f3f3f3",
                height: "50px",
              },
            }))}
          />
        </div>
      </div>{" "}
      {/* 侧边栏 - 导航菜单 */}
      <div
        ref={sidebarRef}
        className={`sidebar ${isDragging ? "dragging" : ""}`}
        style={{
          width: `${sidebarWidth}px`,
          backgroundColor: actualTheme === "dark" ? "#252526" : "#f8f8f8",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <Menu
          mode="inline"
          theme={actualTheme === "dark" ? "dark" : "light"}
          className="explorer-tree"
          style={{
            height: "calc(100% - 35px)",
            borderRight: 0,
            backgroundColor: actualTheme === "dark" ? "#252526" : "#f8f8f8",
          }}
          selectedKeys={[selectedActivityItem]} // 使用selectedActivityItem保持一致
          items={[
            {
              key: selectedActivityItem,
              label:
                routes.find((route) => route.path === selectedActivityItem)
                  ?.name || "仪表盘",
              icon: routes.find((route) => route.path === selectedActivityItem)
                ?.icon,
              children: [],
              className: "sidebar-menu-item",
            },
          ]}
        />{" "}
        {/* 拖拽手柄 */}
        <div
          className="sidebar-resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);

            const startX = e.clientX;
            const startWidth = originalWidthRef.current;
            let lastUpdateTime = 0;
            const throttleDelay = 16; // 约60FPS

            // 添加拖拽类到body，禁用文本选择
            document.body.classList.add("sidebar-dragging");

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const now = Date.now();
              const newWidth = startWidth + (moveEvent.clientX - startX);

              // 确保在有效范围内
              if (newWidth >= 200 && newWidth <= 400) {
                // 立即更新DOM，提供流畅的视觉反馈
                handleSidebarResize(newWidth, false);

                // 节流状态更新，减少重新渲染
                if (now - lastUpdateTime > throttleDelay) {
                  originalWidthRef.current = Math.max(
                    200,
                    Math.min(newWidth, 400)
                  );
                  lastUpdateTime = now;
                }
              }
            };

            const handleMouseUp = () => {
              setIsDragging(false);

              // 移除拖拽类
              document.body.classList.remove("sidebar-dragging");

              // 拖拽结束时，最终更新状态和localStorage
              const finalWidth = originalWidthRef.current;
              setSidebarWidth(finalWidth);
              localStorage.setItem("sidebarWidth", finalWidth.toString());

              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        />
      </div>{" "}
      {/* 内容区域 */}
      <Layout
        style={{
          flex: "1 1 auto",
          minWidth: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 主内容区域 */}
        <TaskDrawer
          visible={taskDrawerVisible}
          onClose={() => setTaskDrawerVisible(false)}
        >
          <div
            className="editor-content"
            style={{
              padding: "20px",
              height: "calc(100vh - 56px)", // 减去头部高度
              overflow: "auto",
              width: "100%",
              boxSizing: "border-box",
              backgroundColor: actualTheme === "dark" ? "#1e1e1e" : "#ffffff",
            }}
          >
            <Outlet />
          </div>
        </TaskDrawer>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
