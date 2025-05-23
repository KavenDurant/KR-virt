import React, { useState, useEffect } from "react";
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
} from "@ant-design/icons";
import routes from "../../router/routes";
import "./AppLayout.css";

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 添加侧边栏宽度状态
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // 从本地存储中获取保存的侧边栏宽度，如果没有则使用默认值
    const savedWidth = localStorage.getItem("sidebarWidth");
    return savedWidth ? parseInt(savedWidth) : 250;
  });

  // 处理侧边栏宽度调整
  const handleSidebarResize = (newWidth: number) => {
    setSidebarWidth(newWidth);
    localStorage.setItem("sidebarWidth", newWidth.toString());
  };

  // 根据当前路径确定选中的菜单项
  const getCurrentSelectedPath = () => {
    // 如果是根路径，默认选中仪表盘
    return location.pathname === "/" ? "/dashboard" : location.pathname;
  };

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
  }, [location.pathname]);

  // 初始加载时检查路由
  useEffect(() => {
    // 如果是根路径，自动导航到仪表盘
    if (location.pathname === "/") {
      navigate("/dashboard");
    }
  }, []);

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
    { key: "/system", icon: <SettingOutlined />, label: "系统设置" },
  ];

  return (
    <Layout
      className="app-layout"
      style={{ height: "100vh", display: "flex", flexDirection: "row" }}
    >
      {/* 活动栏 - VS Code左侧窄栏 */}
      <div
        className="activity-bar"
        style={{
          backgroundColor: "#333333",
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
            theme="dark"
            style={{ backgroundColor: "#333333" }}
            onClick={(e) => handleMenuClick(e.key)}
            items={activityItems.slice(0, 6).map((item) => ({
              key: item.key,
              icon: (
                <Tooltip
                  title={item.label}
                  placement="right"
                  overlayClassName="activity-tooltip"
                  mouseEnterDelay={0.5}
                >
                  {React.cloneElement(item.icon, {
                    style: {
                      fontSize: "20px",
                      color:
                        item.key === selectedActivityItem
                          ? "#ffffff"
                          : "#858585",
                    },
                  })}
                </Tooltip>
              ),
              style: {
                backgroundColor:
                  item.key === selectedActivityItem ? "#444444" : "#333333",
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
              >
                <div style={{ position: "relative" }}>
                  {" "}
                  <BellOutlined
                    style={{
                      fontSize: "20px",
                      color: "#858585",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      // 处理通知点击事件
                      console.log("通知图标点击");
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
            theme="dark"
            style={{ backgroundColor: "#333333" }}
            onClick={(e) => handleMenuClick(e.key)}
            items={activityItems.slice(6).map((item) => ({
              key: item.key,
              icon: (
                <Tooltip
                  title={item.label}
                  placement="right"
                  overlayClassName="activity-tooltip"
                  mouseEnterDelay={0.5}
                >
                  {React.cloneElement(item.icon, {
                    style: {
                      fontSize: "20px",
                      color:
                        item.key === selectedActivityItem
                          ? "#ffffff"
                          : "#858585",
                    },
                  })}
                </Tooltip>
              ),
              style: {
                backgroundColor:
                  item.key === selectedActivityItem ? "#444444" : "#333333",
                height: "50px",
              },
            }))}
          />
        </div>
      </div>

      {/* 侧边栏 - 导航菜单 */}
      <div
        className="sidebar"
        style={{
          width: sidebarWidth,
          backgroundColor: "#252526",
          position: "relative",
        }}
      >
        <Menu
          mode="inline"
          theme="dark"
          className="explorer-tree"
          style={{
            height: "calc(100% - 35px)",
            borderRight: 0,
            backgroundColor: "#252526",
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
        />
        {/* 拖拽手柄 */}
        <div
          className="sidebar-resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = sidebarWidth;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const newWidth = startWidth + (moveEvent.clientX - startX);
              if (newWidth >= 200 && newWidth <= 400) {
                handleSidebarResize(newWidth);
              }
            };

            const handleMouseUp = () => {
              document.removeEventListener("mousemove", handleMouseMove);
              document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
          }}
        />
      </div>

      {/* 内容区域 */}
      <Layout style={{ flex: 1, height: "100vh", overflow: "hidden" }}>
        <div className="editor-area" style={{ width: "100%" }}>
          <div
            className="editor-content"
            style={{
              padding: "20px",
              height: "calc(100vh - 22px)",
              transition: "height 0.3s",
              overflow: "auto",
              width: "100%",
            }}
          >
            <Outlet />
          </div>
        </div>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
