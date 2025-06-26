import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Badge,
  Layout,
  Menu,
  Tooltip,
  Avatar,
  Dropdown,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  DesktopOutlined,
  ClusterOutlined,
  GlobalOutlined,
  HddOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
  BellOutlined,
  AuditOutlined,
  LogoutOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import routes from "@/router/routes";
import TaskDrawer from "@/components/TaskDrawer";
import HierarchicalSidebar from "@/components/HierarchicalSidebar";
import { useTheme } from "@/hooks/useTheme";
import { loginService } from "@/services/login";
import type { UserInfo } from "@/services/login";
import { UserActivityMonitor } from "@/components/UserActivity";
import type {
  IdleEvent,
  ActiveEvent,
  PromptEvent,
  TimeoutEvent,
  LogoutEvent,
} from "@/components/UserActivity/types";
import { getSidebarData, getClusterSidebarData } from "@/services/mockData";
import type { DataCenter } from "@/services/mockData";
import "./AppLayout.css";

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { actualTheme } = useTheme();

  // 用户信息状态
  const [, setCurrentUser] = useState<UserInfo | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] =
    useState<boolean>(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState<boolean>(false);
  const [passwordForm] = Form.useForm();

  // 初始化用户信息和Token自动刷新
  useEffect(() => {
    const user = loginService.getCurrentUser();
    setCurrentUser(user);

    // 确保Token自动刷新在主应用中运行
    // 这是为了修复页面刷新后Token自动刷新停止的问题
    if (loginService.isAuthenticated()) {
      console.log("🔧 AppLayout: 确保Token自动刷新正在运行");

      // 检查当前自动刷新状态
      const status = loginService.getAutoRefreshStatus();
      console.log("📊 当前Token自动刷新状态:", status);

      if (!status.isRunning) {
        console.log("🚀 Token自动刷新未运行，重新启动...");
        loginService.startGlobalTokenRefresh();

        // 验证启动结果
        setTimeout(() => {
          const newStatus = loginService.getAutoRefreshStatus();
          console.log("✅ Token自动刷新重启结果:", newStatus);
        }, 1000);
      } else {
        console.log("✅ Token自动刷新已在运行中");
      }
    }
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

  // 侧边栏数据状态
  const [sidebarData, setSidebarData] = useState<DataCenter | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarError, setSidebarError] = useState<string | null>(null);

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
    [], // 移除sidebarWidth依赖，避免频繁重新创建函数
  );

  // 根据当前路径确定选中的菜单项
  const getCurrentSelectedPath = useCallback(() => {
    // 如果是根路径，默认选中仪表盘
    return location.pathname === "/" ? "/dashboard" : location.pathname;
  }, [location.pathname]);

  const [selectedActivityItem, setSelectedActivityItem] = useState(
    getCurrentSelectedPath,
  );

  // 获取侧边栏数据的异步函数
  const loadSidebarData = useCallback(async (modulePath: string) => {
    if (modulePath === "/cluster") {
      // 集群页面使用API数据
      setSidebarLoading(true);
      setSidebarError(null); // 清除之前的错误
      try {
        const clusterData = await getClusterSidebarData();
        setSidebarData(clusterData);
      } catch (error) {
        console.error("获取集群侧边栏数据失败:", error);
        // 设置错误状态，不再回退到mock数据
        setSidebarError("获取集群数据失败，请检查网络连接或联系管理员");
        setSidebarData(null);
      } finally {
        setSidebarLoading(false);
      }
    } else {
      // 其他页面使用静态数据
      setSidebarError(null);
      setSidebarData(getSidebarData(modulePath));
    }
  }, []);

  const shouldShowHierarchicalSidebar =
    selectedActivityItem === "/virtual-machine" ||
    selectedActivityItem === "/cluster";

  // 判断是否需要显示侧边栏（只有虚拟机、集群模块显示侧边栏）
  const shouldShowSidebar =
    selectedActivityItem === "/virtual-machine" ||
    selectedActivityItem === "/cluster";

  // 当路由变化时更新选中的菜单项
  useEffect(() => {
    const currentPath = getCurrentSelectedPath();
    setSelectedActivityItem(currentPath);
  }, [location.pathname, getCurrentSelectedPath]);

  // 当选中的菜单项变化时加载侧边栏数据
  useEffect(() => {
    if (shouldShowSidebar) {
      loadSidebarData(selectedActivityItem);
    }
  }, [selectedActivityItem, shouldShowSidebar, loadSidebarData]);

  // 监听侧边栏刷新事件
  useEffect(() => {
    const handleSidebarRefresh = (event: CustomEvent) => {
      console.log("收到侧边栏刷新事件:", event.detail);

      // 只有在显示集群侧边栏时才刷新
      if (shouldShowSidebar && selectedActivityItem === "/cluster") {
        console.log("正在刷新集群侧边栏数据...");
        loadSidebarData(selectedActivityItem);
      }
    };

    window.addEventListener(
      "refresh-sidebar",
      handleSidebarRefresh as EventListener,
    );

    return () => {
      window.removeEventListener(
        "refresh-sidebar",
        handleSidebarRefresh as EventListener,
      );
    };
  }, [shouldShowSidebar, selectedActivityItem, loadSidebarData]);

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

  // 处理退出登录
  const handleLogout = () => {
    // 使用内联模态框代替静态方法，这样可以正确获取上下文
    setLogoutModalVisible(true);
  };

  // 确认退出登录
  const confirmLogout = async () => {
    try {
      // 调用异步登出API
      const result = await loginService.logout();
      console.log("登出结果:", result.message);

      // 使用React Router进行导航，避免URL问题
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("退出登录出错:", error);
      // 即使出错也要跳转到登录页
      navigate("/login", { replace: true });
    } finally {
      setLogoutModalVisible(false);
    }
  };

  // 处理修改密码
  const handleChangePassword = () => {
    setPasswordModalVisible(true);
  };

  // 提交密码修改
  const handlePasswordSubmit = () => {
    passwordForm.validateFields().then((values) => {
      if (values.newPassword !== values.confirmPassword) {
        message.error("两次输入的新密码不一致");
        return;
      }

      // 这里只是模拟成功，实际应调用API
      message.success("密码修改成功");
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    });
  };

  // 恢复活动栏图标配置，后续会按位置单独渲染
  const activityItems = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "仪表盘" },
    { key: "/virtual-machine", icon: <DesktopOutlined />, label: "虚拟机管理" },
    { key: "/cluster", icon: <ClusterOutlined />, label: "集群管理" },
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
        {/* 主要图标 */}
        <div style={{ flex: "1" }}>
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
            items={activityItems.map((item) => ({
              key: item.key,
              icon: (
                <Tooltip
                  title={item.label}
                  placement="right"
                  classNames={{ root: "activity-tooltip" }}
                  mouseEnterDelay={0.5}
                  styles={{
                    body: {
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
                    },
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

        {/* 底部图标区域 */}
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
                classNames={{ root: "activity-tooltip" }}
                mouseEnterDelay={0.5}
                styles={{
                  body: {
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
                  },
                }}
              >
                <div style={{ position: "relative" }}>
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

          {/* 用户头像 */}
          <div
            style={{
              marginTop: "20px",
              marginBottom: "10px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Dropdown
              menu={{
                items: [
                  {
                    key: "changePassword",
                    label: "修改密码",
                    icon: <KeyOutlined />,
                    onClick: handleChangePassword,
                  },
                  {
                    key: "logout",
                    label: "退出登录",
                    icon: <LogoutOutlined />,
                    onClick: handleLogout,
                  },
                ],
              }}
              placement="topRight"
              trigger={["click"]}
            >
              <Avatar
                style={{
                  cursor: "pointer",
                  backgroundColor:
                    actualTheme === "dark" ? "#1890ff" : "#1890ff",
                }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </div>
        </div>
      </div>{" "}
      {/* 侧边栏 - 导航菜单 */}
      {shouldShowSidebar && (
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
          {" "}
          {shouldShowHierarchicalSidebar ? (
            sidebarLoading ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: actualTheme === "dark" ? "#cccccc" : "#666666",
                }}
              >
                正在加载集群数据...
              </div>
            ) : sidebarError ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: actualTheme === "dark" ? "#ff6b6b" : "#ff4d4f",
                }}
              >
                <div style={{ marginBottom: "10px" }}>❌</div>
                <div>{sidebarError}</div>
                <div
                  style={{
                    marginTop: "10px",
                    color: actualTheme === "dark" ? "#1890ff" : "#1890ff",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => {
                    // 重新加载侧边栏数据
                    loadSidebarData(selectedActivityItem);
                  }}
                >
                  点击重试
                </div>
              </div>
            ) : (
              <HierarchicalSidebar
                data={sidebarData}
                onSelect={(
                  selectedKeys: string[],
                  info: Record<string, unknown>,
                ) => {
                  // 处理树节点选择事件，传递选择信息到主内容区域
                  const selectedKey = selectedKeys[0];
                  const nodeInfo = info.node as {
                    type?: string;
                    data?: unknown;
                  };

                  if (nodeInfo && nodeInfo.data) {
                    // 通过自定义事件传递选择信息到页面组件
                    window.dispatchEvent(
                      new CustomEvent("hierarchical-sidebar-select", {
                        detail: {
                          selectedKey,
                          nodeType: nodeInfo.type,
                          nodeData: nodeInfo.data,
                        },
                      }),
                    );
                  }
                }}
              />
            )
          ) : (
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
                  icon: routes.find(
                    (route) => route.path === selectedActivityItem,
                  )?.icon,
                  children: [],
                  className: "sidebar-menu-item",
                },
              ]}
            />
          )}{" "}
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
                      Math.min(newWidth, 400),
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
        </div>
      )}{" "}
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
              height: "100vh", // 减去头部高度
              overflow: "auto",
              width: "100%",
              boxSizing: "border-box",
              backgroundColor: actualTheme === "dark" ? "#1e1e1e" : "#ffffff",
            }}
          >
            <Routes>
              {/* 默认路径重定向到仪表盘 */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              ))}
            </Routes>
          </div>
        </TaskDrawer>
      </Layout>
      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[{ required: true, message: "请输入当前密码" }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 6, message: "密码长度不能少于6位" },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: "请确认新密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
        </Form>
      </Modal>
      {/* 退出登录确认模态框 */}
      <Modal
        title="确认退出"
        open={logoutModalVisible}
        onOk={confirmLogout}
        onCancel={() => setLogoutModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <p>确定要退出登录吗？</p>
      </Modal>
      {/* 用户活动监控 */}
      <UserActivityMonitor
        config={{
          timeout: import.meta.env.DEV ? 5 * 60 * 1000 : 10 * 60 * 1000, // 开发环境1小时，生产环境10分钟
          promptTimeout: import.meta.env.DEV ? 10 * 1000 : 30 * 1000, // 开发环境10秒，生产环境30秒
          debug: import.meta.env.DEV,
          crossTab: true,
          resetTokenOnActivity: true,
        }}
        callbacks={{
          onIdle: (event: IdleEvent) => {
            if (import.meta.env.DEV) {
              console.log("🔍 用户进入空闲状态:", event);
            }
          },
          onActive: (event: ActiveEvent) => {
            if (import.meta.env.DEV) {
              console.log("🔍 用户恢复活动:", event);
            }
          },
          onPrompt: (event: PromptEvent) => {
            if (import.meta.env.DEV) {
              console.log("⚠️ 显示空闲警告:", event);
            }
          },
          onTimeout: (event: TimeoutEvent) => {
            console.log("⏰ 用户会话超时:", event);
          },
          onLogout: (event: LogoutEvent) => {
            console.log("👋 用户登出:", event);
          },
        }}
      />
    </Layout>
  );
};

export default AppLayout;
