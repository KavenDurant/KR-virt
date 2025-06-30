<!--
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-24 16:44:58
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-24 16:58:02
 * @FilePath: /KR-virt/DOCS/VItest.file.md
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->

```typescript
tests/
├── __mocks__/                    # 全局Mock文件
│   ├── axios.ts                  # Axios Mock配置
│   ├── antd.ts                   # Ant Design组件Mock
│   ├── react-router-dom.ts       # 路由Mock
│   └── localStorage.ts           # 浏览器API Mock
│
├── fixtures/                     # 测试数据固定装置
│   ├── api/                      # API响应数据
│   │   ├── user.ts              # 用户相关测试数据
│   │   ├── cluster.ts           # 集群相关测试数据
│   │   ├── system.ts            # 系统设置测试数据
│   │   └── auth.ts              # 认证相关测试数据
│   ├── components/              # 组件测试数据
│   └── forms/                   # 表单测试数据
│
├── helpers/                      # 测试辅助工具
│   ├── renderWithProviders.tsx  # 带Provider的渲染工具
│   ├── mockApiHelper.ts         # API Mock辅助函数
│   ├── testUtils.ts             # 通用测试工具
│   └── setupTests.ts            # 测试环境设置
│
├── services/                     # 服务层测试 (95%+ 覆盖率目标)
│   ├── login/                   # 登录服务测试
│   │   ├── index.test.ts        # 登录服务主要功能测试
│   │   ├── tokenRefresh.test.ts # Token刷新功能测试
│   │   └── firstTimeLogin.test.ts # 首次登录流程测试
│   ├── user/                    # 用户管理服务测试
│   │   ├── index.test.ts        # 用户CRUD操作测试
│   │   ├── userTypes.test.ts    # 用户类型管理测试
│   │   └── validation.test.ts   # 用户数据验证测试
│   ├── cluster/                 # 集群服务测试
│   │   ├── index.test.ts        # 集群管理功能测试
│   │   ├── status.test.ts       # 集群状态检查测试
│   │   └── initialization.test.ts # 集群初始化测试
│   └── systemSetting/           # 系统设置服务测试
│       ├── index.test.ts        # 系统设置功能测试
│       └── configuration.test.ts # 配置管理测试
│
├── utils/                        # 工具函数测试 (95%+ 覆盖率目标)
│   ├── apiHelper.test.ts        # API辅助工具测试
│   ├── cookies.test.ts          # Cookie工具测试
│   ├── format.test.ts           # 格式化工具测试
│   ├── security.test.ts         # 安全工具测试
│   └── request.test.ts          # 请求工具测试
│
├── hooks/                        # 自定义Hook测试
│   ├── useTheme.test.ts         # 主题Hook测试
│   ├── useSidebarSelection.test.ts # 侧边栏选择Hook测试
│   ├── useSidebarRefresh.test.ts # 侧边栏刷新Hook测试
│   └── useSidebarHostActions.test.ts # 侧边栏主机操作Hook测试
│
├── components/                   # 组件测试 (80%+ 覆盖率目标)
│   ├── Layout/                  # 布局组件测试
│   │   ├── index.test.tsx       # 主布局组件测试
│   │   └── Sidebar.test.tsx     # 侧边栏组件测试
│   ├── AuthGuard/               # 认证守卫组件测试
│   │   └── index.test.tsx       # 路由守卫功能测试
│   ├── ClusterComponent/        # 集群组件测试
│   │   ├── index.test.tsx       # 集群主组件测试
│   │   └── ClusterTree.test.tsx # 集群树组件测试
│   ├── SystemSettingComponent/  # 系统设置组件测试
│   │   ├── index.test.tsx       # 系统设置主组件测试
│   │   └── TabContent.test.tsx  # 标签内容组件测试
│   └── common/                  # 通用组件测试
│       ├── PasswordStrengthIndicator.test.tsx # 密码强度指示器测试
│       ├── SafetyConfirmModal.test.tsx # 安全确认弹窗测试
│       └── TaskDrawer.test.tsx  # 任务抽屉组件测试
│
├── pages/                        # 页面级测试 (85%+ 覆盖率目标)
│   ├── Auth/                    # 认证页面测试
│   │   ├── Login.test.tsx       # 登录页面测试
│   │   └── FirstTimeLogin.test.tsx # 首次登录页面测试
│   ├── Dashboard/               # 仪表板页面测试
│   │   ├── index.test.tsx       # 仪表板主页测试
│   │   └── HostMonitoring.test.tsx # 主机监控测试
│   ├── User/                    # 用户管理页面测试
│   │   ├── index.test.tsx       # 用户列表页面测试
│   │   ├── CreateUser.test.tsx  # 用户创建页面测试
│   │   └── UserSettings.test.tsx # 用户设置页面测试
│   ├── Cluster/                 # 集群管理页面测试
│   │   ├── index.test.tsx       # 集群管理主页测试
│   │   ├── ClusterInit.test.tsx # 集群初始化页面测试
│   │   └── HostDetails.test.tsx # 主机详情页面测试
│   └── System/                  # 系统管理页面测试
│       ├── index.test.tsx       # 系统设置页面测试
│       └── SystemConfiguration.test.tsx # 系统配置页面测试
│
├── integration/                  # 集成测试
│   ├── auth-flow.test.tsx       # 完整认证流程测试
│   ├── user-management.test.tsx # 用户管理流程测试
│   ├── cluster-operations.test.tsx # 集群操作流程测试
│   └── system-settings.test.tsx # 系统设置流程测试
│
├── e2e/                         # 端到端测试 (可选)
│   ├── login.spec.ts           # 登录流程E2E测试
│   ├── user-crud.spec.ts       # 用户CRUD操作E2E测试
│   └── cluster-management.spec.ts # 集群管理E2E测试
│
└── setup/                       # 测试环境配置
    ├── globalSetup.ts          # 全局测试设置
    ├── testEnvironment.ts      # 测试环境配置
    └── mockServer.ts           # Mock服务器配置

```
