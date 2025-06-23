# Augment Code AI助手协作指南

## 📋 目录

1. [项目概述与技术栈](#项目概述与技术栈)
2. [代码编辑和重构标准](#代码编辑和重构标准)
3. [API开发规范](#api开发规范)
4. [UI组件开发指导](#ui组件开发指导)
5. [用户管理和认证流程](#用户管理和认证流程)
6. [性能优化策略](#性能优化策略)
7. [任务管理和规划方法](#任务管理和规划方法)
8. [常见问题解决方案](#常见问题解决方案)
9. [测试开发指导](#测试开发指导)

---

## 1. 项目概述与技术栈

### 1.1 核心技术栈

KR-virt是一个现代化的虚拟化管理平台，基于以下技术栈构建：

- **前端框架**: React 19.1.0 + TypeScript 5.8.3
- **构建工具**: Vite 6.3.5
- **UI组件库**: Ant Design 5.25.2
- **状态管理**: Redux Toolkit 2.8.2
- **路由管理**: React Router 7.6.0
- **网络请求**: Axios 1.9.0
- **样式方案**: Less 4.3.0
- **日期处理**: Day.js 1.11.13

### 1.2 项目架构

```
src/
├── components/          # 通用组件
├── pages/              # 页面组件
├── services/           # 业务服务层
├── utils/              # 工具函数
├── store/              # Redux状态管理
├── contexts/           # React Context
├── hooks/              # 自定义Hooks
├── router/             # 路由配置
└── styles/             # 全局样式
```

### 1.3 协作原则

- **安全第一**: 始终采用安全的重构方法，保持现有功能
- **渐进式改进**: 优先保持视觉样式和功能，专注代码结构改进
- **类型安全**: 充分利用TypeScript的类型检查能力
- **组件化**: 遵循React组件化开发模式

---

## 2. 代码编辑和重构标准

### 2.1 安全重构方法

**核心原则**: 先移除现有实现但保持核心功能，然后重新实现并增强错误处理

```typescript
// ✅ 推荐的重构流程
// 1. 保留接口定义和核心功能
// 2. 移除冗余代码
// 3. 重新实现并增强错误处理
// 4. 添加适当的日志记录

// 示例：API服务重构
class UserService {
  // 保持接口不变，内部实现优化
  async createUser(userData: CreateUserRequest): Promise<StandardResponse<CreateUserResponse>> {
    return api.post<CreateUserResponse>(`${this.BASE_URL}/create`, userData, {
      defaultSuccessMessage: "用户创建成功",
      defaultErrorMessage: "用户创建失败，请稍后重试",
    });
  }
}
```

### 2.2 代码编辑前的信息收集

**必须步骤**: 在进行任何代码编辑前，使用`codebase-retrieval`工具获取详细信息

```typescript
// 查询示例：获取编辑相关的所有符号信息
"获取UserService类的所有方法、CreateUserRequest接口定义、相关的类型定义和错误处理模式"
```

### 2.3 编辑工具使用规范

- **主要工具**: 使用`str-replace-editor`进行文件编辑
- **禁止操作**: 不要重写整个文件，使用精确的字符串替换
- **批量编辑**: 在单次调用中尽可能完成多个编辑操作

---

## 3. API开发规范

### 3.1 统一API工具使用

**核心工具**: 使用`src/utils/apiHelper.ts`中的统一API工具

```typescript
// ✅ 标准API调用模式
import { api } from '@/utils/apiHelper';

// GET请求
const result = await api.get<ResponseType>('/api/endpoint', params, {
  defaultSuccessMessage: "获取数据成功",
  defaultErrorMessage: "获取数据失败",
});

// POST请求
const result = await api.post<ResponseType>('/api/endpoint', data, {
  skipAuth: false,
  showErrorMessage: true,
  defaultSuccessMessage: "操作成功",
});
```

### 3.2 API路径组织规范

- **系统设置**: `/system_setting/` 路径
- **用户管理**: `/user/` 路径
- **集群管理**: `/cluster/` 路径
- **服务定义**: 放置在`services/`对应目录

### 3.3 响应格式标准

```typescript
// 标准响应格式
interface StandardResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
}

// API错误处理
// 自动处理422验证错误
// 统一错误消息格式
// 支持Mock数据切换
```

### 3.4 认证机制

```typescript
// Token管理
- JWT Token存储在Cookie中
- 自动Token刷新机制
- 请求拦截器自动添加Authorization头
- Token过期自动跳转登录页

// 首次登录流程
1. 检查is_first_time_login标志
2. 2FA绑定（可选跳过）
3. 强制密码修改
4. 调用token续期API
```

---

## 4. UI组件开发指导

### 4.1 Ant Design使用规范

**主题系统**: 使用统一的主题配置

```typescript
// 主题配置示例
const customThemes = {
  light: {
    token: {
      colorPrimary: "#1890ff",
      colorBgBase: "#ffffff",
      borderRadius: 6,
    },
    algorithm: theme.defaultAlgorithm,
  },
  dark: {
    token: {
      colorPrimary: "#1890ff",
      colorBgBase: "#1e1e1e",
      colorTextBase: "#cccccc",
    },
    algorithm: theme.darkAlgorithm,
  }
};
```

**组件使用注意事项**:
- 使用App组件包装以支持动态主题的message
- 避免使用静态message函数，会产生主题警告
- 优化表格行高以改善视觉效果

### 4.2 状态管理模式

**URL状态持久化**: 使用React Router查询参数

```typescript
// 示例：集群管理页面状态持久化
const navigate = useNavigate();
const location = useLocation();

// 保存选中状态到URL
const updateUrlState = (nodeType: string, nodeId: string) => {
  navigate(`/cluster?nodeType=${nodeType}&nodeId=${nodeId}`);
};

// 从URL恢复状态
const searchParams = new URLSearchParams(location.search);
const nodeType = searchParams.get('nodeType');
const nodeId = searchParams.get('nodeId');
```

### 4.3 组件设计原则

**层级树表组件**: 将平面API数据转换为父子关系

```typescript
// 数据转换示例
const transformToHierarchy = (flatData: any[]) => {
  return flatData.map(item => ({
    ...item, // 保留所有原始属性
    children: flatData.filter(child => child.parent === item.name)
  }));
};
```

**懒加载模式**: 仅在用户切换到特定标签时调用API

```typescript
const [activeTab, setActiveTab] = useState('basic');
const [loadedTabs, setLoadedTabs] = useState(new Set(['basic']));

const handleTabChange = (key: string) => {
  setActiveTab(key);
  if (!loadedTabs.has(key)) {
    // 首次访问该标签，加载数据
    loadTabData(key);
    setLoadedTabs(prev => new Set([...prev, key]));
  }
};
```

---

## 5. 用户管理和认证流程

### 5.1 用户类型定义

```typescript
// 支持的用户类型
type UserType = "system_admin" | "security_admin" | "security_auditor";

// 用户类型显示配置
const userTypeConfig = {
  system_admin: { label: "系统管理员", color: "red" },
  security_admin: { label: "安全保密管理员", color: "orange" },
  security_auditor: { label: "安全审计员", color: "blue" }
};
```

### 5.2 认证流程设计

**简化认证**: 仅存储token，避免复杂的数据转换

```typescript
// ✅ 推荐的认证流程
1. 用户登录 -> 获取token
2. 立即调用token续期API
3. 存储token到Cookie
4. 跳转到主应用

// ❌ 避免的复杂转换
// 不要将4字段API响应转换为5字段UserInfo对象
```

### 5.3 2FA绑定流程

```typescript
// 2FA绑定设计原则
- 允许用户跳过2FA设置
- 提供清晰的UI提示2FA为可选
- 支持后续在设置中配置
- 当验证API不可用时优雅降级
```

---

## 6. 性能优化策略

### 6.1 懒加载模式

**系统设置标签**: 仅在用户切换时加载数据

```typescript
const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loadedTabs, setLoadedTabs] = useState(new Set(['basic']));

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (!loadedTabs.has(key)) {
      loadTabData(key);
      setLoadedTabs(prev => new Set([...prev, key]));
    }
  };
};
```

### 6.2 组件优化

- 使用React.memo包装纯组件
- 合理使用useCallback和useMemo
- 避免在render中创建新对象
- 使用虚拟化处理大数据量

### 6.3 网络请求优化

- 使用请求去重机制
- 实现请求缓存
- 支持请求取消
- 合理设置超时时间

---

## 7. 任务管理和规划方法

### 7.1 何时使用任务管理工具

**适用场景**:
- 用户明确要求规划或任务分解
- 复杂的多步骤任务
- 需要跟踪进度的工作
- 协调多个相关变更

### 7.2 任务分解原则

**任务粒度**: 每个子任务代表约20分钟的专业开发工作

```typescript
// ✅ 合适的任务分解
- "实现用户创建API接口"
- "添加用户列表页面UI组件"
- "集成用户管理路由配置"

// ❌ 过于细粒度的任务
- "导入React组件"
- "添加一个按钮"
- "修改一行代码"
```

### 7.3 任务状态管理

```typescript
// 任务状态定义
- NOT_STARTED: [ ] 未开始
- IN_PROGRESS: [/] 进行中  
- COMPLETE: [x] 已完成
- CANCELLED: [-] 已取消

// 批量更新示例
update_tasks({
  tasks: [
    { task_id: "previous-task", state: "COMPLETE" },
    { task_id: "current-task", state: "IN_PROGRESS" }
  ]
});
```

---

## 8. 常见问题解决方案

### 8.1 依赖管理

**包管理器使用**: 始终使用包管理器而非手动编辑配置文件

```bash
# ✅ 推荐方式
npm install package-name
yarn add package-name
pnpm add package-name

# ❌ 避免方式
# 手动编辑package.json
```

### 8.2 测试建议

**测试策略**:
- 编写代码后建议编写单元测试
- 运行测试确保变更正确性
- 使用Vitest进行测试
- 追求80%以上的测试覆盖率

### 8.3 错误处理模式

**统一错误处理**: 使用apiHelper.ts中的统一错误处理

```typescript
// 自动处理的错误类型
- 网络错误
- 422验证错误
- 认证失败
- 超时错误

// 错误消息格式化
- 提供用户友好的错误提示
- 记录详细的错误日志
- 支持错误重试机制
```

---

## 📝 协作检查清单

### 代码编辑前
- [ ] 使用codebase-retrieval获取相关代码信息
- [ ] 了解现有的代码模式和架构
- [ ] 确认编辑范围和影响

### API开发
- [ ] 使用统一的API工具
- [ ] 遵循路径组织规范
- [ ] 实现标准响应格式
- [ ] 添加适当的错误处理

### UI组件开发
- [ ] 遵循Ant Design使用规范
- [ ] 实现主题支持
- [ ] 考虑性能优化
- [ ] 支持响应式设计

### 任务管理
- [ ] 合理分解任务粒度
- [ ] 及时更新任务状态
- [ ] 使用批量更新操作
- [ ] 记录任务进展

### 完成后
- [ ] 建议编写或更新测试
- [ ] 运行测试确保功能正确
- [ ] 检查是否需要文档更新
- [ ] 确认用户反馈和需求满足

---

## 9. 具体实施指导

### 9.1 代码示例模板

#### API服务实现模板

```typescript
// services/[module]/index.ts
import { api, mockApi } from '@/utils/apiHelper';
import { USE_MOCK_DATA } from '@/utils/constants';
import type { StandardResponse } from '@/utils/apiHelper';

class ModuleService {
  private readonly BASE_URL = "/module";

  async getData(params?: QueryParams): Promise<StandardResponse<DataResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.get(`${this.BASE_URL}/list`, params, {
        useMock: true,
        mockData: this.getMockData(),
        defaultSuccessMessage: "获取数据成功",
      });
    }

    return api.get<DataResponse>(`${this.BASE_URL}/list`, params, {
      defaultSuccessMessage: "获取数据成功",
      defaultErrorMessage: "获取数据失败，请稍后重试",
    });
  }

  private getMockData() {
    // Mock数据实现
    return { list: [], total: 0 };
  }
}

export const moduleService = new ModuleService();
```

#### React组件实现模板

```typescript
// components/[ComponentName]/index.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import type { ComponentProps } from './types';

const ComponentName: React.FC<ComponentProps> = ({
  data,
  loading,
  onAction
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();

  // URL状态管理
  const searchParams = new URLSearchParams(location.search);
  const selectedId = searchParams.get('selectedId');

  const handleSelection = (id: string) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('selectedId', id);
    navigate(`${location.pathname}?${newParams.toString()}`);
  };

  return (
    <div className="component-container">
      {/* 组件实现 */}
    </div>
  );
};

export default ComponentName;
```

### 9.2 错误处理最佳实践

#### 统一错误处理配置

```typescript
// utils/apiHelper.ts 错误处理扩展
export class ApiHelper {
  private static handleError(error: ApiError, defaultMessage: string): StandardResponse {
    let message = defaultMessage;

    // 422验证错误特殊处理
    if (error.status === 422 && error.data?.errors) {
      const validationErrors = Object.values(error.data.errors).flat();
      message = validationErrors.join('; ');
    }

    // 401认证错误
    if (error.status === 401) {
      message = "认证失败，请重新登录";
      // 自动跳转登录页
      window.location.href = '/login';
    }

    // 403权限错误
    if (error.status === 403) {
      message = "权限不足，无法执行此操作";
    }

    // 500服务器错误
    if (error.status >= 500) {
      message = "服务器错误，请稍后重试";
    }

    return {
      success: false,
      message,
    };
  }
}
```

### 9.3 主题系统集成指导

#### 组件主题适配

```typescript
// hooks/useTheme.ts 使用示例
import { useTheme } from '@/hooks/useTheme';

const MyComponent: React.FC = () => {
  const { actualTheme, themeConfig } = useTheme();

  const componentStyle = {
    backgroundColor: actualTheme === 'dark' ? '#1e1e1e' : '#ffffff',
    color: actualTheme === 'dark' ? '#cccccc' : '#000000',
    border: `1px solid ${actualTheme === 'dark' ? '#3c3c3c' : '#d9d9d9'}`,
  };

  return (
    <div style={componentStyle}>
      {/* 组件内容 */}
    </div>
  );
};
```

#### CSS变量使用

```less
// styles/components/component.less
.component-container {
  background-color: var(--bg-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);

  &:hover {
    background-color: var(--hover-bg);
  }

  &.selected {
    background-color: var(--selected-bg);
  }
}
```

### 9.4 性能优化实施细节

#### 虚拟化表格实现

```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedTable: React.FC<{ data: any[] }> = ({ data }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {/* 行内容 */}
      {data[index].name}
    </div>
  );

  return (
    <List
      height={400}
      itemCount={data.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

#### 请求缓存实现

```typescript
// utils/requestCache.ts
class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5分钟

  get(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

export const requestCache = new RequestCache();
```

---

## 10. 项目特定配置和约定

### 10.1 环境配置

```typescript
// .env.development
VITE_API_BASE_URL=http://192.168.1.187:8001
VITE_ENABLE_MOCK=false
VITE_PROXY_TARGET=http://192.168.1.187:8001

// .env.production
VITE_API_BASE_URL=https://api.kr-virt.com
VITE_ENABLE_MOCK=false
```

### 10.2 路由配置约定

```typescript
// router/routes.tsx
const routes = [
  {
    path: '/dashboard',
    element: <Dashboard />,
    meta: { title: '仪表盘', icon: 'DashboardOutlined' }
  },
  {
    path: '/cluster',
    element: <Cluster />,
    meta: { title: '集群管理', icon: 'ClusterOutlined' }
  },
  // 支持查询参数状态持久化
  // 例如: /cluster?nodeType=host&nodeId=node155
];
```

### 10.3 文件命名约定

```
components/
├── ComponentName/           # 大驼峰命名
│   ├── index.tsx           # 主组件文件
│   ├── types.ts            # 类型定义
│   ├── styles.less         # 样式文件
│   └── __tests__/          # 测试文件
│       └── index.test.tsx

services/
├── moduleName/             # 小驼峰命名
│   ├── index.ts            # 服务主文件
│   ├── types.ts            # 类型定义
│   └── __tests__/          # 测试文件

pages/
├── PageName/               # 大驼峰命名
│   ├── index.tsx           # 页面主文件
│   ├── components/         # 页面专用组件
│   └── hooks/              # 页面专用hooks
```

---

## 11. 调试和故障排除

### 11.1 常见问题诊断

#### API调用失败

```typescript
// 检查清单
1. 确认API地址配置正确
2. 检查网络连接状态
3. 验证Token是否有效
4. 查看浏览器Network面板
5. 检查CORS配置

// 调试代码
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Current Token:', TokenManager.getToken());
console.log('Token Valid:', TokenManager.isTokenValid());
```

#### 主题切换问题

```typescript
// 检查主题状态
const { themeMode, actualTheme } = useTheme();
console.log('Theme Mode:', themeMode);
console.log('Actual Theme:', actualTheme);
console.log('CSS Variables:', getComputedStyle(document.documentElement));
```

#### 路由状态丢失

```typescript
// 检查URL状态持久化
const location = useLocation();
const searchParams = new URLSearchParams(location.search);
console.log('Current Search Params:', Object.fromEntries(searchParams));
console.log('Current Pathname:', location.pathname);
```

### 11.2 性能监控

```typescript
// 组件渲染性能监控
const ComponentWithPerf: React.FC = () => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      console.log(`Component render time: ${endTime - startTime}ms`);
    };
  }, []);

  return <div>Component Content</div>;
};
```

### 11.3 错误边界实现

```typescript
// components/ErrorBoundary/index.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    // 可以发送错误报告到监控服务
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>出现了一些问题</h2>
          <p>请刷新页面重试，如果问题持续存在，请联系管理员。</p>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

---

## 12. 协作工作流程

### 12.1 标准协作流程

#### 需求分析阶段

```typescript
// 1. 信息收集
codebase-retrieval("获取相关模块的架构信息、现有实现模式、类型定义")

// 2. 任务规划（复杂任务）
add_tasks({
  tasks: [
    {
      name: "分析现有代码结构",
      description: "了解当前实现模式和架构设计"
    },
    {
      name: "设计API接口",
      description: "定义接口规范和数据结构"
    },
    {
      name: "实现服务层",
      description: "创建服务类和API调用逻辑"
    },
    {
      name: "开发UI组件",
      description: "实现用户界面和交互逻辑"
    },
    {
      name: "集成测试",
      description: "编写测试用例并验证功能"
    }
  ]
});
```

#### 实施阶段

```typescript
// 3. 逐步实施
update_tasks({
  tasks: [
    { task_id: "current-task", state: "IN_PROGRESS" },
    { task_id: "previous-task", state: "COMPLETE" }
  ]
});

// 4. 代码实现
str-replace-editor({
  command: "str_replace",
  path: "target-file.ts",
  // 精确的字符串替换
});

// 5. 验证和测试
launch-process({
  command: "npm test",
  wait: true,
  max_wait_seconds: 60
});
```

### 12.2 代码审查检查点

#### 代码质量检查

```typescript
// TypeScript类型检查
✅ 所有接口和类型定义完整
✅ 无any类型使用（除非必要）
✅ 严格的null检查
✅ 正确的泛型使用

// React组件检查
✅ 使用函数组件和Hooks
✅ 正确的依赖数组
✅ 避免不必要的重渲染
✅ 合理的组件拆分

// 性能检查
✅ 懒加载实现
✅ 虚拟化处理大数据
✅ 请求缓存机制
✅ 防抖和节流使用
```

#### 安全性检查

```typescript
// 认证和授权
✅ Token正确管理
✅ 权限验证实现
✅ 敏感数据保护
✅ XSS防护措施

// API安全
✅ 输入验证
✅ 错误信息不泄露敏感信息
✅ HTTPS使用
✅ CORS正确配置
```

### 12.3 文档更新流程

```typescript
// 代码变更后的文档更新
1. 更新API文档（如有接口变更）
2. 更新组件文档（如有新组件）
3. 更新架构文档（如有架构变更）
4. 更新本协作指南（如有新模式）

// 文档格式要求
- 使用Markdown格式
- 包含代码示例
- 提供使用说明
- 标注注意事项
```

---

## 13. 最佳实践总结

### 13.1 代码组织最佳实践

#### 服务层组织

```typescript
// ✅ 推荐的服务层结构
services/
├── auth/                   # 认证相关
│   ├── index.ts           # 主服务类
│   ├── types.ts           # 类型定义
│   └── constants.ts       # 常量定义
├── user/                   # 用户管理
├── cluster/                # 集群管理
└── shared/                 # 共享服务
    ├── apiHelper.ts       # API工具
    ├── mockData.ts        # Mock数据
    └── types.ts           # 共享类型
```

#### 组件层组织

```typescript
// ✅ 推荐的组件结构
components/
├── Layout/                 # 布局组件
├── Form/                   # 表单组件
├── Table/                  # 表格组件
├── Modal/                  # 弹窗组件
└── Business/               # 业务组件
    ├── UserManagement/
    ├── ClusterMonitor/
    └── SystemSettings/
```

### 13.2 状态管理最佳实践

#### Redux Store设计

```typescript
// store/index.ts
interface RootState {
  app: AppState;           // 应用全局状态
  user: UserState;         // 用户状态
  cluster: ClusterState;   // 集群状态
  ui: UIState;            // UI状态（主题、布局等）
}

// 状态设计原则
1. 扁平化状态结构
2. 避免嵌套过深
3. 合理的状态分片
4. 最小化状态存储
```

#### Context使用指导

```typescript
// 适合使用Context的场景
✅ 主题配置
✅ 用户认证状态
✅ 语言设置
✅ 全局配置

// 不适合使用Context的场景
❌ 频繁变化的数据
❌ 复杂的业务逻辑
❌ 大量的状态更新
❌ 需要时间旅行调试的状态
```

### 13.3 性能优化最佳实践

#### 组件优化策略

```typescript
// 1. 使用React.memo
const OptimizedComponent = React.memo(({ data, onAction }) => {
  return <div>{/* 组件内容 */}</div>;
}, (prevProps, nextProps) => {
  // 自定义比较逻辑
  return prevProps.data.id === nextProps.data.id;
});

// 2. 使用useCallback
const handleClick = useCallback((id: string) => {
  onAction(id);
}, [onAction]);

// 3. 使用useMemo
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

#### 网络请求优化

```typescript
// 1. 请求去重
const requestMap = new Map<string, Promise<any>>();

const deduplicatedRequest = (url: string) => {
  if (requestMap.has(url)) {
    return requestMap.get(url);
  }

  const promise = api.get(url);
  requestMap.set(url, promise);

  promise.finally(() => {
    requestMap.delete(url);
  });

  return promise;
};

// 2. 请求取消
const abortController = new AbortController();

const cancelableRequest = api.get('/api/data', {}, {
  signal: abortController.signal
});

// 组件卸载时取消请求
useEffect(() => {
  return () => {
    abortController.abort();
  };
}, []);
```

---

## 14. 故障排除指南

### 14.1 常见错误及解决方案

#### 认证相关错误

```typescript
// 问题：Token过期导致401错误
// 解决方案：
1. 检查Token刷新机制
2. 验证refresh token有效性
3. 确认Token存储正确性

// 调试代码
const debugAuth = () => {
  console.log('Current Token:', TokenManager.getToken());
  console.log('Token Valid:', TokenManager.isTokenValid());
  console.log('Refresh Token:', TokenManager.getRefreshToken());
};
```

#### 主题切换问题

```typescript
// 问题：主题切换后样式不生效
// 解决方案：
1. 检查CSS变量是否正确设置
2. 验证主题配置是否完整
3. 确认组件是否正确使用主题

// 调试代码
const debugTheme = () => {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  console.log('CSS Variables:', {
    bgColor: styles.getPropertyValue('--bg-color'),
    textColor: styles.getPropertyValue('--text-color'),
    borderColor: styles.getPropertyValue('--border-color'),
  });
};
```

#### 路由状态丢失

```typescript
// 问题：页面刷新后状态丢失
// 解决方案：
1. 使用URL查询参数持久化状态
2. 实现状态恢复逻辑
3. 添加默认状态处理

// 实现示例
const useUrlState = <T>(key: string, defaultValue: T) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getValue = (): T => {
    const params = new URLSearchParams(location.search);
    const value = params.get(key);
    return value ? JSON.parse(value) : defaultValue;
  };

  const setValue = (value: T) => {
    const params = new URLSearchParams(location.search);
    params.set(key, JSON.stringify(value));
    navigate(`${location.pathname}?${params.toString()}`);
  };

  return [getValue(), setValue] as const;
};
```

### 14.2 性能问题诊断

#### 渲染性能问题

```typescript
// 使用React DevTools Profiler
// 1. 安装React DevTools浏览器扩展
// 2. 在Profiler标签页录制组件渲染
// 3. 分析渲染时间和频率
// 4. 识别性能瓶颈组件

// 代码层面的性能监控
const useRenderCount = (componentName: string) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
};
```

#### 内存泄漏检测

```typescript
// 常见内存泄漏场景及解决方案

// 1. 未清理的定时器
useEffect(() => {
  const timer = setInterval(() => {
    // 定时任务
  }, 1000);

  return () => {
    clearInterval(timer); // ✅ 清理定时器
  };
}, []);

// 2. 未取消的网络请求
useEffect(() => {
  const abortController = new AbortController();

  api.get('/api/data', {}, {
    signal: abortController.signal
  });

  return () => {
    abortController.abort(); // ✅ 取消请求
  };
}, []);

// 3. 未移除的事件监听器
useEffect(() => {
  const handleResize = () => {
    // 处理窗口大小变化
  };

  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize); // ✅ 移除监听器
  };
}, []);
```

---

## 15. 协作效率提升技巧

### 15.1 快速定位代码

```typescript
// 使用codebase-retrieval的高效查询技巧

// ✅ 具体且详细的查询
"获取UserService类的createUser方法实现、相关的类型定义CreateUserRequest和CreateUserResponse、以及错误处理模式"

// ✅ 按功能模块查询
"获取用户管理模块的所有API接口、服务层实现、类型定义和常量配置"

// ✅ 按技术栈查询
"获取项目中所有使用Ant Design Table组件的实现示例、配置模式和性能优化方案"

// ❌ 过于宽泛的查询
"获取所有代码"
"查看项目结构"
```

### 15.2 批量操作技巧

```typescript
// 任务管理批量操作
update_tasks({
  tasks: [
    { task_id: "task-1", state: "COMPLETE" },
    { task_id: "task-2", state: "IN_PROGRESS" },
    { task_id: "task-3", name: "更新后的任务名称" },
    { task_id: "task-4", description: "更新后的任务描述" }
  ]
});

// 代码编辑批量操作
str-replace-editor({
  command: "str_replace",
  path: "target-file.ts",
  old_str_1: "第一处要替换的代码",
  new_str_1: "第一处新代码",
  old_str_start_line_number_1: 10,
  old_str_end_line_number_1: 15,
  old_str_2: "第二处要替换的代码",
  new_str_2: "第二处新代码",
  old_str_start_line_number_2: 25,
  old_str_end_line_number_2: 30
});
```

### 15.3 调试和验证技巧

```typescript
// 快速验证API接口
const testApi = async () => {
  try {
    const result = await api.get('/test/endpoint');
    console.log('API Test Result:', result);
  } catch (error) {
    console.error('API Test Error:', error);
  }
};

// 快速验证组件渲染
const TestComponent = () => {
  console.log('Component rendered at:', new Date().toISOString());
  return <div>Test Component</div>;
};

// 快速验证状态管理
const useDebugState = (stateName: string, state: any) => {
  useEffect(() => {
    console.log(`${stateName} changed:`, state);
  }, [stateName, state]);
};
```

---

*本指南基于KR-virt项目的实际协作历史和技术架构制定，旨在提高AI助手协作效率和代码质量。定期更新以反映最新的最佳实践和项目演进。*
