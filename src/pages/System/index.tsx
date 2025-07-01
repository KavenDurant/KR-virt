import React, { useState, useEffect, useCallback } from "react";
import { Tabs, Form, Spin, App, Space } from "antd";
import {
  SettingOutlined,
  UserOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  MonitorOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

import { useTheme } from "../../hooks/useTheme";
import { TimeSyncComponent } from "../../components/SystemSettingComponent";
import { systemSettingService } from "../../services/systemSetting";
import type {
  LicenseInfo,
  LoginPolicy,
} from "../../services/systemSetting/types";

// 按需导入组件
import {
  GeneralSettings,
  UserManagement,
  SecuritySettings,
  BackupManagement,
  SystemMonitoring,
  LogManagement,
  AboutSystem,
} from "./components";

// Layout组件已移除，不再需要Content

// 定义类型
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  loginCount: number;
}

interface Backup {
  id: string;
  name: string;
  type: string;
  size: string;
  status: string;
  startTime: string;
  endTime: string;
  description: string;
}

interface LogEntry {
  id: string;
  level: string;
  module: string;
  message: string;
  timestamp: string;
  ip: string;
}

interface GeneralSettingsData {
  systemName: string;
  description: string;
  adminEmail: string;
  language: string;
  timezone: string;
  sessionTimeout: number;
  autoLogout: boolean;
  enableNotifications: boolean;
}

type ThemeMode = "light" | "dark" | "auto";

interface UserFormValues {
  username: string;
  email: string;
  role: string;
  status: string;
}

interface SecuritySettingsValues {
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  sessionTimeout: number;
  twoFactorEnabled: boolean;
}

interface BackupFormValues {
  name: string;
  type: string;
  description: string;
}

const SystemSettings: React.FC = () => {
  const { message } = App.useApp();
  const { themeConfig, themeMode, setThemeMode } = useTheme();

  // Tab状态管理
  const [activeTab, setActiveTab] = useState("general");
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());

  // 通用状态
  const [loading, setLoading] = useState(false);

  // 表单实例
  const [form] = Form.useForm();
  const [userForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [backupForm] = Form.useForm();
  const [loginPolicyForm] = Form.useForm();

  // 通用设置状态
  const [generalSettings, setGeneralSettings] = useState<GeneralSettingsData>({
    systemName: "KR-Virt 虚拟化平台",
    description: "企业级虚拟化管理平台",
    adminEmail: "admin@krvirt.com",
    language: "zh-CN",
    timezone: "Asia/Shanghai",
    sessionTimeout: 30,
    autoLogout: true,
    enableNotifications: true,
  });

  // 用户管理状态
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  // 备份管理状态
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupModalVisible, setBackupModalVisible] = useState(false);

  // 日志管理状态
  const [logs] = useState<LogEntry[]>([]);

  // 关于系统状态
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [loginPolicy, setLoginPolicy] = useState<LoginPolicy | null>(null);
  const [loginPolicyLoading, setLoginPolicyLoading] = useState(false);

  // 加载许可证信息
  const loadLicenseInfo = useCallback(async () => {
    setLicenseLoading(true);
    try {
      const response = await systemSettingService.getLicenseInfo();
      if (response.success && response.data) {
        setLicenseInfo(response.data);
      }
    } catch (error) {
      console.error("Failed to load license info:", error);
    } finally {
      setLicenseLoading(false);
    }
  }, []);

  // 加载登录策略
  const loadLoginPolicy = useCallback(async () => {
    setLoginPolicyLoading(true);
    try {
      const response = await systemSettingService.getLoginPolicy();
      if (response.success && response.data) {
        setLoginPolicy(response.data);
        loginPolicyForm.setFieldsValue(response.data);
      }
    } catch (error) {
      console.error("Failed to load login policy:", error);
    } finally {
      setLoginPolicyLoading(false);
    }
  }, [loginPolicyForm]);

  // 加载"关于系统"标签页数据
  const loadAboutTabData = useCallback(async () => {
    if (loadedTabs.has("about")) {
      return; // 已经加载过，直接返回
    }

    try {
      await Promise.all([loadLicenseInfo(), loadLoginPolicy()]);
      // 标记该标签页已加载
      setLoadedTabs((prev) => new Set(prev).add("about"));
    } catch (error) {
      console.error("Failed to load about tab data:", error);
      message.error("加载关于系统数据失败");
    }
  }, [loadedTabs, loadLicenseInfo, loadLoginPolicy, message]);

  // 标签页切换处理函数
  const handleTabChange = useCallback(
    async (tabKey: string) => {
      setActiveTab(tabKey);

      // 根据标签页懒加载对应数据
      switch (tabKey) {
        case "about":
          if (!loadedTabs.has("about")) {
            await loadAboutTabData();
          }
          break;
        case "users":
          if (!loadedTabs.has("users")) {
            // 加载用户数据（如果需要的话）
            setLoadedTabs((prev) => new Set(prev).add("users"));
          }
          break;
        case "backup":
          if (!loadedTabs.has("backup")) {
            // 加载备份数据（如果需要的话）
            setLoadedTabs((prev) => new Set(prev).add("backup"));
          }
          break;
        case "logs":
          if (!loadedTabs.has("logs")) {
            // 加载日志数据（如果需要的话）
            setLoadedTabs((prev) => new Set(prev).add("logs"));
          }
          break;
        case "timeSync":
          if (!loadedTabs.has("timeSync")) {
            setLoadedTabs((prev) => new Set(prev).add("timeSync"));
          }
          break;
        default:
          break;
      }
    },
    [loadedTabs, loadAboutTabData]
  );

  // 初始化数据加载
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // 模拟加载系统设置通用数据
        await new Promise((resolve) => setTimeout(resolve, 800));
        // 标记默认Tab已加载
        setLoadedTabs((prev) => new Set(prev).add("general"));
      } catch (error) {
        console.error("Failed to load system settings:", error);
        message.error("加载系统设置失败");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [message]);

  // 处理初始标签页的懒加载
  useEffect(() => {
    if (!loading && activeTab === "about" && !loadedTabs.has("about")) {
      loadAboutTabData();
    }
  }, [loading, activeTab, loadedTabs, loadAboutTabData]);

  // 通用设置处理函数
  const handleSaveGeneralSettings = async (values: GeneralSettingsData) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setGeneralSettings({ ...generalSettings, ...values });
      message.success("设置保存成功");
    } catch {
      message.error("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (value: string) => {
    setThemeMode(value as ThemeMode);
  };

  // 用户管理处理函数
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    userForm.setFieldsValue(user);
    setUserModalVisible(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers(users.filter((u) => u.id !== userId));
      message.success("用户删除成功");
    } catch {
      message.error("删除失败，请重试");
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleUserModalCancel = () => {
    setUserModalVisible(false);
    setEditingUser(null);
    userForm.resetFields();
  };

  const handleUserFormSubmit = async (values: UserFormValues) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (editingUser) {
        setUsers(
          users.map((u) => (u.id === editingUser.id ? { ...u, ...values } : u))
        );
        message.success("用户更新成功");
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          ...values,
          lastLogin: "-",
          loginCount: 0,
        };
        setUsers([...users, newUser]);
        message.success("用户添加成功");
      }
      setUserModalVisible(false);
      setEditingUser(null);
      userForm.resetFields();
    } catch {
      message.error("操作失败，请重试");
    }
  };

  // 安全设置处理函数
  const handleSaveSecuritySettings = async (values: SecuritySettingsValues) => {
    console.log("Security settings values:", values);
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success("安全设置保存成功");
    } catch {
      message.error("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 备份管理处理函数
  const handleCreateBackup = () => {
    backupForm.resetFields();
    setBackupModalVisible(true);
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setBackups(backups.filter((b) => b.id !== backupId));
      message.success("备份删除成功");
    } catch {
      message.error("删除失败，请重试");
    }
  };

  const handleBackupModalCancel = () => {
    setBackupModalVisible(false);
    backupForm.resetFields();
  };

  const handleBackupFormSubmit = async (values: BackupFormValues) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const newBackup: Backup = {
        id: Date.now().toString(),
        ...values,
        size: "计算中...",
        status: "completed",
        startTime: new Date().toLocaleString(),
        endTime: new Date(Date.now() + 60000).toLocaleString(),
      };
      setBackups([newBackup, ...backups]);
      message.success("备份创建成功");
      setBackupModalVisible(false);
      backupForm.resetFields();
    } catch {
      message.error("备份失败，请重试");
    }
  };

  // 许可证上传处理
  const handleLicenseUpload = async (file: File) => {
    setUploadingLicense(true);
    try {
      const response = await systemSettingService.uploadLicense(file);
      if (response.success) {
        message.success("许可证上传成功");
        await loadLicenseInfo();
      } else {
        message.error(response.message || "许可证上传失败");
      }
    } catch (error) {
      console.error("Failed to upload license:", error);
      message.error("许可证上传失败");
    } finally {
      setUploadingLicense(false);
    }
    return false;
  };

  // 登录策略更新处理
  const handleLoginPolicyUpdate = async (values: LoginPolicy) => {
    setLoginPolicyLoading(true);
    try {
      const response = await systemSettingService.updateLoginPolicy(values);
      if (response.success) {
        message.success("登录策略更新成功");
        setLoginPolicy(values);
      } else {
        message.error(response.message || "登录策略更新失败");
      }
    } catch (error) {
      console.error("Failed to update login policy:", error);
      message.error("登录策略更新失败");
    } finally {
      setLoginPolicyLoading(false);
    }
  };

  // 渲染Tab内容的函数
  const renderTabContent = (tabKey: string) => {
    if (!loadedTabs.has(tabKey)) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: "16px",
            padding: "50px",
            minHeight: "200px",
          }}
        >
          <Spin size="large" />
          <div
            style={{ color: themeConfig.token.colorTextBase, opacity: 0.65 }}
          >
            加载中...
          </div>
        </div>
      );
    }

    switch (tabKey) {
      case "general":
        return (
          <GeneralSettings
            form={form}
            loading={loading}
            generalSettings={generalSettings}
            themeMode={themeMode}
            onSave={handleSaveGeneralSettings}
            onThemeChange={handleThemeChange}
          />
        );
      case "users":
        return (
          <UserManagement
            users={users}
            editingUser={editingUser}
            userModalVisible={userModalVisible}
            userForm={userForm}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onAddUser={handleAddUser}
            onUserModalCancel={handleUserModalCancel}
            onUserFormSubmit={handleUserFormSubmit}
          />
        );
      case "security":
        return (
          <SecuritySettings
            securityForm={securityForm}
            loading={loading}
            onSave={handleSaveSecuritySettings}
          />
        );
      case "backup":
        return (
          <BackupManagement
            backups={backups}
            backupModalVisible={backupModalVisible}
            backupForm={backupForm}
            onCreateBackup={handleCreateBackup}
            onDeleteBackup={handleDeleteBackup}
            onBackupModalCancel={handleBackupModalCancel}
            onBackupFormSubmit={handleBackupFormSubmit}
          />
        );
      case "monitoring":
        return (
          <SystemMonitoring
            onRefresh={() => message.info("系统监控数据已刷新")}
          />
        );
      case "logs":
        return (
          <LogManagement
            logs={logs}
            onRefresh={() => message.info("日志数据已刷新")}
            onExport={() => message.info("日志导出功能开发中")}
            onSearch={() => message.info("日志搜索功能开发中")}
          />
        );
      case "timeSync":
        return <TimeSyncComponent />;
      case "about":
        return (
          <AboutSystem
            licenseInfo={licenseInfo}
            licenseLoading={licenseLoading}
            loginPolicy={loginPolicy}
            loginPolicyForm={loginPolicyForm}
            loginPolicyLoading={loginPolicyLoading}
            uploadingLicense={uploadingLicense}
            onLoadLicenseInfo={loadLicenseInfo}
            onLicenseUpload={handleLicenseUpload}
            onLoginPolicyUpdate={handleLoginPolicyUpdate}
          />
        );
      default:
        return <div>未知Tab</div>;
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        height: "100%",
        backgroundColor: themeConfig.token.colorBgContainer,
        padding: "24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <Spin size="large" />
          <div
            style={{ color: themeConfig.token.colorTextBase, opacity: 0.65 }}
          >
            加载系统设置数据中...
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "24px", flexShrink: 0 }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "600",
                margin: "0 0 8px 0",
                color: themeConfig.token.colorTextBase,
              }}
            >
              系统设置
            </h1>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              type="line"
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
              tabBarStyle={{ flexShrink: 0 }}
              items={[
                {
                  key: "general",
                  label: (
                    <Space>
                      <SettingOutlined />
                      <span>通用设置</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      {renderTabContent("general")}
                    </div>
                  ),
                },
                {
                  key: "users",
                  label: (
                    <Space>
                      <UserOutlined />
                      <span>用户管理</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      {renderTabContent("users")}
                    </div>
                  ),
                },
                {
                  key: "security",
                  label: (
                    <Space>
                      <SecurityScanOutlined />
                      <span>安全设置</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      {renderTabContent("security")}
                    </div>
                  ),
                },
                {
                  key: "backup",
                  label: (
                    <Space>
                      <DatabaseOutlined />
                      <span>备份管理</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      {renderTabContent("backup")}
                    </div>
                  ),
                },
                {
                  key: "monitoring",
                  label: (
                    <Space>
                      <MonitorOutlined />
                      <span>系统监控</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      {renderTabContent("monitoring")}
                    </div>
                  ),
                },
                {
                  key: "logs",
                  label: (
                    <Space>
                      <FileTextOutlined />
                      <span>日志管理</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      {renderTabContent("logs")}
                    </div>
                  ),
                },
                {
                  key: "timeSync",
                  label: (
                    <Space>
                      <ClockCircleOutlined />
                      <span>时间同步</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      {renderTabContent("timeSync")}
                    </div>
                  ),
                },
                {
                  key: "about",
                  label: (
                    <Space>
                      <InfoCircleOutlined />
                      <span>关于系统</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      {renderTabContent("about")}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SystemSettings;
