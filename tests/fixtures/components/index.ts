/**
 * 组件测试数据
 * 提供组件测试所需的标准数据
 */

// 表格列配置
export const mockTableColumns = [
  {
    title: "用户名",
    dataIndex: "login_name",
    key: "login_name",
  },
  {
    title: "姓名",
    dataIndex: "user_name",
    key: "user_name",
  },
  {
    title: "用户类型",
    dataIndex: "user_type",
    key: "user_type",
  },
  {
    title: "创建时间",
    dataIndex: "created_at",
    key: "created_at",
  },
];

// 树形数据
export const mockTreeData = [
  {
    key: "cluster",
    title: "集群",
    children: [
      {
        key: "node155",
        title: "node155",
        type: "host",
        children: [
          {
            key: "vm001",
            title: "vm001",
            type: "vm",
          },
        ],
      },
      {
        key: "node156",
        title: "node156",
        type: "host",
        children: [],
      },
    ],
  },
];

// 侧边栏菜单数据
export const mockSidebarMenuData = [
  {
    key: "dashboard",
    icon: "DashboardOutlined",
    label: "仪表盘",
    path: "/dashboard",
  },
  {
    key: "cluster",
    icon: "ClusterOutlined",
    label: "集群管理",
    path: "/cluster",
  },
  {
    key: "user",
    icon: "UserOutlined",
    label: "用户管理",
    path: "/user",
  },
  {
    key: "system",
    icon: "SettingOutlined",
    label: "系统设置",
    path: "/system",
  },
];

// 标签页数据
export const mockTabsData = [
  {
    key: "basic",
    label: "基础设置",
    content: "基础设置内容",
  },
  {
    key: "network",
    label: "网络设置",
    content: "网络设置内容",
  },
  {
    key: "storage",
    label: "存储设置",
    content: "存储设置内容",
  },
  {
    key: "security",
    label: "安全设置",
    content: "安全设置内容",
  },
];

// 模态框配置
export const mockModalConfig = {
  title: "确认操作",
  content: "您确定要执行此操作吗？",
  okText: "确定",
  cancelText: "取消",
};
