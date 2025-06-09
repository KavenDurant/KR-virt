# KR-virt 前端架构设计与技术选型文档

## 1. 项目概述

### 1.1 项目背景

KR-virt 是一个现代化的虚拟化管理平台，提供虚拟机生命周期管理、网络配置、存储管理、用户权限控制等企业级功能。项目基于 React + TypeScript 技术栈构建，注重用户体验、性能优化和可维护性。

### 1.2 技术愿景

- **现代化**：采用最新的前端技术栈，确保技术先进性
- **企业级**：满足大型企业的功能需求和性能要求
- **可维护**：良好的代码组织和开发规范，便于团队协作
- **可扩展**：模块化设计，支持功能快速迭代和扩展
- **高性能**：优秀的用户体验和系统响应速度

## 2. 整体架构设计

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    KR-virt 前端架构                      │
├─────────────────────────────────────────────────────────┤
│  展示层 (Presentation Layer)                            │
│  ┌─────────────┬─────────────┬─────────────┬───────────┐ │
│  │   Dashboard │ VirtualMachine│  Network   │  Storage  │ │
│  │    仪表板   │    虚拟机     │   网络管理  │  存储管理  │ │
│  └─────────────┴─────────────┴─────────────┴───────────┘ │
├─────────────────────────────────────────────────────────┤
│  组件层 (Component Layer)                               │
│  ┌─────────────┬─────────────┬─────────────┬───────────┐ │
│  │   Layout    │  AuthGuard  │ TaskDrawer  │HierSidebar│ │
│  │   布局组件   │   认证守卫   │  任务抽屉   │ 层级侧栏   │ │
│  └─────────────┴─────────────┴─────────────┴───────────┘ │
├─────────────────────────────────────────────────────────┤
│  业务逻辑层 (Business Logic Layer)                       │
│  ┌─────────────┬─────────────┬─────────────┬───────────┐ │
│  │   Services  │    Hooks    │   Context   │   Utils   │ │
│  │   服务层     │  自定义钩子  │   上下文    │  工具函数  │ │
│  └─────────────┴─────────────┴─────────────┴───────────┘ │
├─────────────────────────────────────────────────────────┤
│  状态管理层 (State Management Layer)                     │
│  ┌─────────────┬─────────────┬─────────────┬───────────┐ │
│  │Redux Toolkit│Local Storage│Session State│Cache Layer│ │
│  │  全局状态    │   本地存储   │   会话状态   │  缓存层   │ │
│  └─────────────┴─────────────┴─────────────┴───────────┘ │
├─────────────────────────────────────────────────────────┤
│  数据访问层 (Data Access Layer)                          │
│  ┌─────────────┬─────────────┬─────────────┬───────────┐ │
│  │    Axios    │   Request   │   Security  │TOTP Service│ │
│  │  HTTP客户端  │   请求封装   │   安全模块   │TOTP认证   │ │
│  └─────────────┴─────────────┴─────────────┴───────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 目录结构设计

```
src/
├── assets/                    # 静态资源
│   ├── images/               # 图片资源
│   └── icons/                # 图标资源
├── components/               # 通用组件
│   ├── AuthGuard/           # 认证守卫组件
│   ├── Layout/              # 布局组件
│   ├── HierarchicalSidebar/ # 层级侧栏
│   ├── TaskDrawer/          # 任务抽屉
│   ├── PasswordStrengthIndicator/ # 密码强度指示器
│   └── ...                  # 其他通用组件
├── contexts/                 # React Context
│   └── ThemeContext.tsx     # 主题上下文
├── hooks/                   # 自定义 Hooks
│   └── useTheme.ts          # 主题钩子
├── pages/                   # 页面组件
│   ├── Auth/                # 认证相关页面
│   ├── Dashboard/           # 仪表板
│   ├── VirtualMachine/      # 虚拟机管理
│   ├── Network/             # 网络管理
│   ├── Storage/             # 存储管理
│   ├── User/                # 用户管理
│   ├── Audit/               # 审计管理
│   ├── Cluster/             # 集群管理
│   └── System/              # 系统设置
├── router/                  # 路由配置
│   ├── index.tsx            # 路由主文件
│   └── routes.tsx           # 路由定义
├── services/                # 业务服务
│   ├── authService.ts       # 认证服务
│   ├── totpService.ts       # TOTP认证服务
│   └── mockData.ts          # 模拟数据
├── store/                   # 状态管理
│   └── index.ts             # Redux Store
├── styles/                  # 全局样式
│   ├── theme.less           # 主题样式
│   └── variables.less       # 样式变量
└── utils/                   # 工具函数
    ├── request.ts           # 请求封装
    └── security.ts          # 安全工具
```

## 3. 核心技术选型

### 3.1 前端框架 - React 19.1.0

#### 选型理由

1. **生态成熟**：拥有庞大的社区和丰富的第三方库
2. **性能优秀**：Virtual DOM 和并发特性提供优秀性能
3. **组件化**：组件化开发模式，代码复用性高
4. **团队熟悉**：团队对 React 技术栈有深度掌握
5. **长期支持**：Facebook 官方维护，版本更新稳定

#### 核心特性应用

- **Hooks**：使用 useState、useEffect、useCallback 等内置 Hooks
- **Context API**：主题管理、用户状态共享
- **Suspense**：组件懒加载和异步数据获取
- **并发特性**：提升用户交互响应速度

### 3.2 类型系统 - TypeScript 5.8.3

#### 选型理由

1. **类型安全**：编译时错误检测，减少运行时错误
2. **开发效率**：智能提示、重构安全、代码导航
3. **团队协作**：接口定义明确，降低沟通成本
4. **生态支持**：主流库都有完善的类型定义

#### 配置策略

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler"
  }
}
```

### 3.3 构建工具 - Vite 6.3.5

#### 选型理由

1. **极速启动**：基于 ES 模块，开发服务器启动速度快
2. **HMR**：热模块替换，开发体验优秀
3. **现代化**：原生支持 TypeScript、JSX、CSS 预处理器
4. **插件生态**：丰富的插件系统，扩展性强
5. **构建优化**：基于 Rollup，生产构建优化

#### 核心配置

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        additionalData: '@import "@/styles/variables.less";',
      },
    },
  },
});
```

## 4. UI 框架选型

### 4.1 组件库 - Ant Design 5.25.2

#### 选型理由

1. **企业级设计**：符合企业级应用的设计规范
2. **组件丰富**：提供完整的组件库，覆盖各种使用场景
3. **国际化**：内置国际化支持，适合多语言需求
4. **主题定制**：支持深度主题定制，满足品牌要求
5. **文档完善**：详细的文档和示例，学习成本低

#### 核心组件使用

- **Layout**：页面布局组件
- **Table**：数据表格，支持排序、筛选、分页
- **Form**：表单组件，支持验证和联动
- **Modal**：对话框组件
- **Menu**：导航菜单
- **Card**：卡片容器

### 4.2 图标库 - @ant-design/icons 6.0.0

#### 特性

- 矢量图标，支持任意大小缩放
- Tree Shaking 支持，按需加载
- 与 Ant Design 风格统一

### 4.3 样式方案 - Less 4.3.0

#### 选型理由

1. **Ant Design 集成**：与 Ant Design 深度集成
2. **变量支持**：支持变量、混合、嵌套
3. **主题定制**：便于实现动态主题切换
4. **编译时优化**：CSS 在构建时优化压缩

## 5. 状态管理方案

### 5.1 全局状态 - Redux Toolkit 2.8.2

#### 选型理由

1. **现代化 Redux**：简化 Redux 使用，减少样板代码
2. **内置工具**：集成 Immer、Redux DevTools
3. **类型支持**：完善的 TypeScript 支持
4. **性能优化**：内置性能优化机制

#### 状态设计

```typescript
interface AppState {
  user: UserInfo | null;
  theme: ThemeConfig;
  permissions: Permission[];
  notifications: Notification[];
}
```

### 5.2 本地状态管理

#### React Hooks

- **useState**：组件内部状态
- **useReducer**：复杂状态逻辑
- **useContext**：跨组件状态共享
- **useMemo/useCallback**：性能优化

#### 自定义 Hooks

```typescript
// 主题钩子
const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  // ...
  return { theme, toggleTheme };
};
```

## 6. 路由设计

### 6.1 路由库 - React Router DOM 7.6.0

#### 路由架构

```typescript
const Router: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="vm" element={<VirtualMachine />} />
          <Route path="network" element={<Network />} />
          {/* ... */}
        </Route>
      </Routes>
    </HashRouter>
  );
};
```

#### 路由守卫设计

```typescript
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

## 7. 网络请求架构

### 7.1 HTTP 客户端 - Axios 1.9.0

#### 请求封装

```typescript
const request = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use((config) => {
  const token = localStorage.getItem("kr_virt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权
      localStorage.removeItem("kr_virt_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### 7.2 服务层设计

#### 认证服务

```typescript
export class AuthService {
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await request.post("/auth/login", credentials);
    return response;
  }

  async logout(): Promise<void> {
    await request.post("/auth/logout");
    localStorage.removeItem("kr_virt_token");
  }
}
```

## 8. 安全架构

### 8.1 认证与授权

#### JWT Token 管理

- Token 存储在 localStorage
- 请求自动携带 Token
- Token 过期自动跳转登录

#### 双因子认证 (TOTP)

```typescript
export class TOTPService {
  private static readonly TOTP_SECRET = "TA2SS5UUTTFSHBELVGVO53NRIR7AQHFM";

  async generateCode(): Promise<string> {
    // 基于 RFC 6238 标准实现
    const timeStep = Math.floor(Date.now() / 30000);
    return this.generateHOTP(this.TOTP_SECRET, timeStep);
  }
}
```

#### 权限控制

- 基于角色的访问控制 (RBAC)
- 路由级权限验证
- 组件级权限控制

### 8.2 数据安全

#### 密码安全

```typescript
export const validatePasswordStrength = (
  password: string,
): PasswordStrength => {
  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score, level: getStrengthLevel(score) };
};
```

#### XSS 防护

- 输入验证和过滤
- 内容安全策略 (CSP)
- 危险 HTML 转义

## 9. 性能优化策略

### 9.1 构建优化

#### 代码分割

```typescript
// 路由级别懒加载
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const VirtualMachine = lazy(() => import("@/pages/VirtualMachine"));

// 组件级别懒加载
const CreateVMModal = lazy(() => import("./components/CreateVMModal"));
```

#### 静态资源优化

- 图片压缩和格式优化
- CSS/JS 压缩和混淆
- Gzip 压缩
- CDN 加速

### 9.2 运行时优化

#### React 性能优化

```typescript
// 组件记忆化
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// Hook 优化
const MemoizedValue = useMemo(() => {
  return expensiveCalculation(deps);
}, [deps]);

const MemoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

#### 虚拟化列表

```typescript
// 大数据量表格虚拟化
<Table
  virtual
  scroll={{ y: 400 }}
  dataSource={largeDataSource}
  columns={columns}
/>
```

### 9.3 缓存策略

#### 请求缓存

- API 响应缓存
- 本地数据缓存
- 浏览器缓存策略

#### 状态缓存

- Redux 状态持久化
- 组件状态缓存
- 路由状态保持

## 10. 开发工具链

### 10.1 代码质量

#### ESLint 配置

```javascript
export default {
  extends: [
    "@eslint/js",
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
};
```

#### Prettier 格式化

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 10.2 Git 工作流

#### Husky 钩子

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

#### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建工具或辅助工具更新
```

## 11. 国际化与主题

### 11.1 国际化支持

#### Ant Design 国际化

```typescript
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

<ConfigProvider locale={locale === 'zh' ? zhCN : enUS}>
  <App />
</ConfigProvider>
```

#### 自定义文案国际化

```typescript
const messages = {
  "zh-CN": {
    "common.confirm": "确认",
    "common.cancel": "取消",
  },
  "en-US": {
    "common.confirm": "Confirm",
    "common.cancel": "Cancel",
  },
};
```

### 11.2 主题定制

#### Less 变量定制

```less
// variables.less
@primary-color: #1890ff;
@success-color: #52c41a;
@warning-color: #faad14;
@error-color: #f5222d;
@border-radius-base: 6px;
@box-shadow-base: 0 3px 6px -4px rgba(0, 0, 0, 0.12);
```

#### 动态主题切换

```typescript
const ThemeContext = createContext<{
  theme: "light" | "dark";
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});
```

## 12. 测试策略

### 12.1 单元测试

- **框架**：Vitest + Testing Library
- **覆盖率**：>80% 代码覆盖率
- **策略**：测试用户行为而非实现细节

### 12.2 集成测试

- **API 测试**：MSW 模拟后端接口
- **组件集成**：多组件交互测试
- **路由测试**：页面跳转和权限验证

### 12.3 E2E 测试

- **框架**：Playwright
- **覆盖**：关键业务流程
- **多浏览器**：Chrome、Firefox、Safari

## 13. 部署与运维

### 13.1 构建配置

#### 环境变量管理

```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_ENABLE_MOCK: string;
}
```

#### 多环境配置

- **开发环境**：开发调试、热更新
- **测试环境**：功能测试、集成测试
- **生产环境**：性能优化、错误监控

### 13.2 部署方案

#### 静态资源部署

```dockerfile
# Dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### CI/CD 流程

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
```

### 13.3 监控告警

#### 错误监控

- **Sentry**：JavaScript 错误监控
- **SourceMap**：生产环境错误定位
- **用户反馈**：错误收集和分析

#### 性能监控

- **Web Vitals**：核心性能指标
- **Bundle 分析**：打包体积优化
- **加载性能**：首屏加载时间

## 14. 技术选型总结

| 分类          | 技术选型          | 版本    | 核心价值                     |
| ------------- | ----------------- | ------- | ---------------------------- |
| **前端框架**  | React             | 19.1.0  | 组件化、生态成熟、性能优秀   |
| **类型系统**  | TypeScript        | 5.8.3   | 类型安全、开发效率、团队协作 |
| **构建工具**  | Vite              | 6.3.5   | 极速启动、现代化、优秀体验   |
| **UI 组件库** | Ant Design        | 5.25.2  | 企业级、组件丰富、设计统一   |
| **状态管理**  | Redux Toolkit     | 2.8.2   | 现代化 Redux、工具完善       |
| **路由管理**  | React Router      | 7.6.0   | 功能完善、社区活跃           |
| **网络请求**  | Axios             | 1.9.0   | 功能强大、拦截器、易用性     |
| **样式方案**  | Less              | 4.3.0   | 主题定制、变量支持           |
| **日期处理**  | Day.js            | 1.11.13 | 轻量级、API 兼容             |
| **加密安全**  | Crypto-js         | 4.2.0   | 多算法支持、安全可靠         |
| **代码规范**  | ESLint + Prettier | Latest  | 代码质量、团队协作           |
| **Git 钩子**  | Husky             | 9.1.7   | 提交规范、质量保证           |

## 15. 风险评估与对策

### 15.1 技术风险

| 风险项                | 影响程度 | 概率 | 对策                     |
| --------------------- | -------- | ---- | ------------------------ |
| React 版本升级兼容性  | 中       | 低   | 渐进式升级、充分测试     |
| Ant Design 破坏性更新 | 中       | 中   | 版本锁定、关注 changelog |
| 第三方库安全漏洞      | 高       | 中   | 定期安全扫描、及时更新   |
| 浏览器兼容性问题      | 中       | 低   | Polyfill、兼容性测试     |

### 15.2 性能风险

| 风险项           | 影响程度 | 概率 | 对策                   |
| ---------------- | -------- | ---- | ---------------------- |
| 首屏加载时间过长 | 高       | 中   | 代码分割、懒加载、CDN  |
| 大数据量渲染卡顿 | 高       | 高   | 虚拟化、分页、优化算法 |
| 内存泄漏         | 中       | 中   | 性能监控、定期检查     |
| 网络请求超时     | 中       | 中   | 重试机制、降级策略     |

## 16. 未来演进规划

### 16.1 短期目标

1. **功能完善**：完成核心功能开发
2. **性能优化**：首屏加载时间 < 2s
3. **测试覆盖**：单元测试覆盖率 > 80%
4. **文档完善**：API 文档、组件文档

### 16.2 中期目标

1. **微前端**：探索微前端架构
2. **PWA 支持**：离线功能、推送通知
3. **组件库**：内部组件库建设
4. **国际化**：多语言支持完善

### 16.3 长期目标

1. **技术升级**：React 18+ 并发特性深度应用
2. **架构优化**：模块联邦、边缘计算
3. **智能化**：AI 辅助运维、智能监控

## 17. 总结

KR-virt 前端架构基于现代化的技术栈，采用组件化、模块化的设计理念，注重性能优化、安全防护和用户体验。通过合理的技术选型和架构设计，项目具备良好的可维护性、可扩展性和稳定性，能够满足企业级虚拟化管理平台的各种需求。

### 核心优势

1. **技术先进**：采用最新的前端技术栈
2. **架构清晰**：分层设计、职责分明
3. **性能优秀**：多层次性能优化策略
4. **安全可靠**：完善的安全防护机制
5. **开发友好**：良好的开发体验和工具链

### 持续改进

项目将持续关注前端技术发展趋势，适时引入新技术，不断优化架构设计，提升用户体验和开发效率，确保技术栈的先进性和竞争力。

---

## 18. 实际代码实现细节

### 18.1 Redux Store 实际实现

#### Store 配置

```typescript
// src/store/index.ts
import { configureStore, createSlice } from "@reduxjs/toolkit";

interface AppState {
  sampleData: string;
  user: UserInfo | null;
  theme: "light" | "dark";
  loading: boolean;
}

const initialState: AppState = {
  sampleData: "示例数据",
  user: null,
  theme: "light",
  loading: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSampleData: (state, action) => {
      state.sampleData = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setSampleData, setUser, setTheme, setLoading } =
  appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 18.2 路由架构实际实现

#### 主路由配置

```typescript
// src/router/index.tsx
import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../components/Layout";
import AuthGuard from "../components/AuthGuard";
import Login from "../pages/Auth/Login";

const isUserAuthenticated = () => {
  const token = localStorage.getItem("kr_virt_token");
  return !!token;
};

const Router: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            isUserAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/*"
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        />
      </Routes>
    </HashRouter>
  );
};
```

#### 认证守卫实现

```typescript
// src/components/AuthGuard/index.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('kr_virt_token');
      const isValid = token && !isTokenExpired(token);
      setIsAuthenticated(isValid);
    };

    checkAuth();
  }, []);

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  if (isAuthenticated === null) {
    return <Spin size="large" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
```

### 18.3 服务层架构实现

#### 认证服务实现

```typescript
// src/services/authService.ts
export interface UserInfo {
  username: string;
  role: string;
  permissions: string[];
  lastLogin: string;
  isFirstLogin?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserInfo;
}

export interface LoginData {
  username: string;
  password: string;
  totpCode?: string; // TOTP 验证码
}

export class AuthService {
  private static readonly API_BASE = "/api/auth";

  // 登录
  static async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem("kr_virt_token", data.token);
        localStorage.setItem("kr_virt_user", JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: "网络错误，请重试",
      };
    }
  }

  // 登出
  static async logout(): Promise<void> {
    try {
      await fetch(`${this.API_BASE}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("kr_virt_token")}`,
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("kr_virt_token");
      localStorage.removeItem("kr_virt_user");
      window.location.href = "/login";
    }
  }

  // 获取当前用户信息
  static getCurrentUser(): UserInfo | null {
    const userStr = localStorage.getItem("kr_virt_user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // 检查用户权限
  static hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  }
}
```

### 18.4 请求封装实际实现

#### HTTP 客户端封装

```typescript
// src/utils/request.ts
import axios, { AxiosResponse, AxiosError } from "axios";
import { message } from "antd";

// 创建 axios 实例
const request = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("kr_virt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加请求时间戳，防止缓存
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;

    // 统一处理业务错误
    if (data.code && data.code !== 200) {
      message.error(data.message || "请求失败");
      return Promise.reject(new Error(data.message || "请求失败"));
    }

    return data;
  },
  (error: AxiosError) => {
    const { response } = error;

    if (response) {
      switch (response.status) {
        case 401:
          message.error("登录已过期，请重新登录");
          localStorage.removeItem("kr_virt_token");
          localStorage.removeItem("kr_virt_user");
          window.location.href = "/login";
          break;
        case 403:
          message.error("没有权限访问该资源");
          break;
        case 404:
          message.error("请求的资源不存在");
          break;
        case 500:
          message.error("服务器内部错误");
          break;
        default:
          message.error("网络错误，请稍后重试");
      }
    } else {
      message.error("网络连接失败，请检查网络设置");
    }

    return Promise.reject(error);
  },
);

export default request;
```

### 18.5 TOTP 双因子认证实现

#### TOTP 服务实现

```typescript
// src/services/totpService.ts - 扩展版
import CryptoJS from "crypto-js";

export interface TOTPConfig {
  secret: string;
  window: number;
  timeStep: number;
  digits: number;
  algorithm: "SHA1" | "SHA256" | "SHA512";
}

export class TOTPService {
  private static readonly DEFAULT_CONFIG: TOTPConfig = {
    secret: "TA2SS5UUTTFSHBELVGVO53NRIR7AQHFM",
    window: 1,
    timeStep: 30,
    digits: 6,
    algorithm: "SHA1",
  };

  // 生成安全的随机密钥
  static generateSecret(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let result = "";
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);

    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
    }

    return result;
  }

  // 生成当前 TOTP 码
  static async generateCurrentCode(
    config: Partial<TOTPConfig> = {},
  ): Promise<string> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const timeStep = Math.floor(Date.now() / 1000 / fullConfig.timeStep);
    return this.generateHOTP(fullConfig.secret, timeStep, fullConfig);
  }

  // 验证 TOTP 码（支持时间窗口）
  static async verifyCode(
    code: string,
    config: Partial<TOTPConfig> = {},
  ): Promise<{ valid: boolean; timeStep?: number }> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const currentTimeStep = Math.floor(Date.now() / 1000 / fullConfig.timeStep);

    // 在时间窗口内验证
    for (let i = -fullConfig.window; i <= fullConfig.window; i++) {
      const timeStep = currentTimeStep + i;
      const expectedCode = await this.generateHOTP(
        fullConfig.secret,
        timeStep,
        fullConfig,
      );

      if (code === expectedCode) {
        return { valid: true, timeStep };
      }
    }

    return { valid: false };
  }

  // 生成 HOTP
  private static async generateHOTP(
    secret: string,
    counter: number,
    config: TOTPConfig,
  ): Promise<string> {
    const key = this.base32Decode(secret);
    const counterBytes = this.intToBytes(counter);

    let hmac: CryptoJS.lib.WordArray;
    switch (config.algorithm) {
      case "SHA256":
        hmac = CryptoJS.HmacSHA256(counterBytes, key);
        break;
      case "SHA512":
        hmac = CryptoJS.HmacSHA512(counterBytes, key);
        break;
      default:
        hmac = CryptoJS.HmacSHA1(counterBytes, key);
    }

    const hmacBytes = this.wordArrayToBytes(hmac);
    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;

    const code =
      (((hmacBytes[offset] & 0x7f) << 24) |
        ((hmacBytes[offset + 1] & 0xff) << 16) |
        ((hmacBytes[offset + 2] & 0xff) << 8) |
        (hmacBytes[offset + 3] & 0xff)) %
      Math.pow(10, config.digits);

    return code.toString().padStart(config.digits, "0");
  }

  // Base32 解码
  private static base32Decode(encoded: string): CryptoJS.lib.WordArray {
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const cleanInput = encoded.replace(/=+$/, "").toUpperCase();
    const bytes: number[] = [];

    let bits = 0;
    let value = 0;

    for (const char of cleanInput) {
      const index = base32Chars.indexOf(char);
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return CryptoJS.lib.WordArray.create(bytes);
  }

  // WordArray 转字节数组
  private static wordArrayToBytes(wordArray: CryptoJS.lib.WordArray): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
      const byte = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      bytes.push(byte);
    }
    return bytes;
  }

  // 整数转字节数组
  private static intToBytes(num: number): CryptoJS.lib.WordArray {
    const bytes: number[] = [];
    for (let i = 7; i >= 0; i--) {
      bytes.push((num >>> (i * 8)) & 0xff);
    }
    return CryptoJS.lib.WordArray.create(bytes);
  }

  // 生成二维码数据
  static generateQRCodeData(
    username: string,
    issuer: string = "KR-virt",
    config: Partial<TOTPConfig> = {},
  ): string {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const label = `${issuer}:${username}`;

    const params = new URLSearchParams({
      secret: fullConfig.secret,
      issuer,
      algorithm: fullConfig.algorithm,
      digits: fullConfig.digits.toString(),
      period: fullConfig.timeStep.toString(),
    });

    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
  }

  // 获取剩余时间
  static getRemainingTime(timeStep: number = 30): number {
    return timeStep - (Math.floor(Date.now() / 1000) % timeStep);
  }
}
```

## 19. 实际开发最佳实践

### 19.1 组件开发规范

#### 组件文件结构

```
ComponentName/
├── index.tsx              # 组件入口文件
├── ComponentName.tsx      # 主组件实现
├── ComponentName.less     # 组件样式
├── types.ts               # 类型定义
└── hooks.ts               # 组件专用 hooks
```

#### 组件开发模板

```typescript
// ComponentTemplate.tsx
import React, { memo, useMemo, useCallback } from 'react';
import { Button } from 'antd';
import styles from './ComponentTemplate.less';

interface ComponentTemplateProps {
  title: string;
  onAction?: () => void;
  disabled?: boolean;
}

const ComponentTemplate: React.FC<ComponentTemplateProps> = memo(({
  title,
  onAction,
  disabled = false
}) => {
  const handleClick = useCallback(() => {
    onAction?.();
  }, [onAction]);

  const buttonText = useMemo(() => {
    return disabled ? '不可用' : '点击执行';
  }, [disabled]);

  return (
    <div className={styles.container}>
      <h3>{title}</h3>
      <Button
        onClick={handleClick}
        disabled={disabled}
        type="primary"
      >
        {buttonText}
      </Button>
    </div>
  );
});

ComponentTemplate.displayName = 'ComponentTemplate';

export default ComponentTemplate;
```

### 19.2 状态管理最佳实践

#### Slice 设计模式

```typescript
// userSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AuthService } from "@/services/authService";

interface UserState {
  currentUser: UserInfo | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
};

// 异步 thunk
export const loginUser = createAsyncThunk(
  "user/login",
  async (credentials: LoginData, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response.user;
    } catch (error) {
      return rejectWithValue("登录失败");
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.currentUser = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUser, clearError } = userSlice.actions;
export default userSlice.reducer;
```

### 19.3 性能优化实际应用

#### 虚拟化表格实现

```typescript
// VirtualizedTable.tsx
import React, { useMemo } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface VirtualizedTableProps<T> {
  dataSource: T[];
  columns: ColumnsType<T>;
  height?: number;
  rowKey: string;
}

function VirtualizedTable<T extends Record<string, any>>({
  dataSource,
  columns,
  height = 400,
  rowKey
}: VirtualizedTableProps<T>) {
  const pagination = useMemo(() => ({
    pageSize: 50,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) =>
      `${range[0]}-${range[1]} 共 ${total} 条`,
  }), []);

  return (
    <Table<T>
      dataSource={dataSource}
      columns={columns}
      rowKey={rowKey}
      pagination={pagination}
      scroll={{ y: height }}
      virtual
      size="middle"
    />
  );
}

export default VirtualizedTable;
```

### 19.4 错误处理和用户体验优化

#### 全局错误边界

```typescript
// src/components/ErrorBoundary/index.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 发送错误到监控服务
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // 这里可以集成 Sentry 或其他错误监控服务
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="500"
          title="页面出现错误"
          subTitle="抱歉，页面发生了未预期的错误。请刷新页面重试。"
          extra={
            <Button type="primary" onClick={this.handleReload}>
              刷新页面
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

#### 加载状态管理

```typescript
// src/hooks/useLoading.ts
import { useState, useCallback } from "react";

interface UseLoadingReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

export const useLoading = (initialLoading = false): UseLoadingReturn => {
  const [loading, setLoading] = useState(initialLoading);

  const withLoading = useCallback(
    async <T>(asyncFn: () => Promise<T>): Promise<T> => {
      setLoading(true);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    setLoading,
    withLoading,
  };
};
```

## 20. 最新技术栈详细分析

### 20.1 React 19.1.0 新特性应用

#### 并发特性应用

```typescript
// 使用 Suspense 和懒加载
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';

const VirtualMachine = lazy(() => import('@/pages/VirtualMachine'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));

const AppRoutes: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}>
          <Spin size="large" />
        </div>
      }
    >
      {/* 路由组件 */}
    </Suspense>
  );
};
```

#### 新版 Hooks 优化

```typescript
// 使用 useDeferredValue 优化搜索性能
import { useDeferredValue, useMemo } from 'react';

const SearchableList: React.FC<{ items: Item[]; searchTerm: string }> = ({
  items,
  searchTerm
}) => {
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(deferredSearchTerm.toLowerCase())
    );
  }, [items, deferredSearchTerm]);

  return (
    <div>
      {filteredItems.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

### 20.2 Vite 6.3.5 高级配置

#### 环境配置优化

```typescript
// vite.config.ts - 完整版
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react({
        // 开启 React 19 新特性
        jsxImportSource: "@emotion/react",
        babel: {
          plugins: [
            ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "@components": resolve(__dirname, "src/components"),
        "@pages": resolve(__dirname, "src/pages"),
        "@utils": resolve(__dirname, "src/utils"),
        "@services": resolve(__dirname, "src/services"),
      },
    },

    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          additionalData: `
            @import "@/styles/variables.less";
            @import "@/styles/mixins.less";
          `,
          modifyVars: {
            "@primary-color": env.VITE_PRIMARY_COLOR || "#1890ff",
            "@border-radius-base": "6px",
            "@box-shadow-base": "0 3px 6px -4px rgba(0, 0, 0, 0.12)",
          },
        },
      },
      modules: {
        localsConvention: "camelCaseOnly",
        generateScopedName: "[name]__[local]___[hash:base64:5]",
      },
    },

    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      open: true,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:8080",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy, options) => {
            proxy.on("error", (err, req, res) => {
              console.log("proxy error", err);
            });
          },
        },
      },
    },

    build: {
      target: "es2020",
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: mode === "development",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: mode === "production",
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "antd-vendor": ["antd", "@ant-design/icons"],
            "router-vendor": ["react-router-dom"],
            "redux-vendor": ["@reduxjs/toolkit", "react-redux"],
            "utils-vendor": ["axios", "dayjs", "crypto-js"],
            "chart-vendor": ["reactflow"],
          },
          chunkFileNames: "js/[name]-[hash].js",
          entryFileNames: "js/[name]-[hash].js",
          assetFileNames: "[ext]/[name]-[hash].[ext]",
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "antd",
        "react-router-dom",
        "@reduxjs/toolkit",
        "react-redux",
        "axios",
        "dayjs",
        "crypto-js",
      ],
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  };
});
```

### 20.3 TypeScript 5.8.3 最新特性应用

#### 严格类型定义

```typescript
// src/types/global.d.ts
declare global {
  interface Window {
    __KR_VIRT_CONFIG__: {
      apiBaseUrl: string;
      version: string;
      buildTime: string;
    };
  }

  namespace NodeJS {
    interface ProcessEnv {
      readonly VITE_API_BASE_URL: string;
      readonly VITE_APP_TITLE: string;
      readonly VITE_PRIMARY_COLOR: string;
    }
  }
}

// 严格的 API 响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
}

// 虚拟机数据类型
export interface VirtualMachine {
  id: string;
  name: string;
  status: "running" | "stopped" | "error" | "pending";
  cpu: number;
  memory: number;
  disk: number;
  network: string[];
  os: string;
  createdAt: string;
  updatedAt: string;
}

// 用户权限类型
export type Permission =
  | "vm:create"
  | "vm:delete"
  | "vm:start"
  | "vm:stop"
  | "network:manage"
  | "storage:manage"
  | "user:manage"
  | "audit:view"
  | "system:config";

// 主题类型
export interface ThemeConfig {
  primaryColor: string;
  mode: "light" | "dark";
  compactMode: boolean;
  borderRadius: number;
}
```

### 20.4 Ant Design 5.25.2 深度定制

#### 主题定制完整方案

```typescript
// src/theme/index.ts
import { theme } from "antd";
import type { ThemeConfig } from "antd";

export const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // 品牌色
    colorPrimary: "#1890ff",
    colorSuccess: "#52c41a",
    colorWarning: "#faad14",
    colorError: "#f5222d",
    colorInfo: "#1890ff",

    // 中性色
    colorTextBase: "#000000",
    colorBgBase: "#ffffff",

    // 字体
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // 阴影
    boxShadow:
      "0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08)",
    boxShadowSecondary:
      "0 6px 16px -8px rgba(0, 0, 0, 0.08), 0 9px 28px 0 rgba(0, 0, 0, 0.05)",

    // 运动
    motionDurationSlow: "0.3s",
    motionDurationMid: "0.2s",
    motionDurationFast: "0.1s",
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      headerHeight: 64,
      headerPadding: "0 24px",
      siderBg: "#001529",
      bodyBg: "#f0f2f5",
    },
    Menu: {
      darkItemBg: "#001529",
      darkItemSelectedBg: "#1890ff",
      darkItemHoverBg: "rgba(255, 255, 255, 0.08)",
    },
    Table: {
      headerBg: "#fafafa",
      headerSortActiveBg: "#f0f0f0",
      bodySortBg: "#fafafa",
    },
    Card: {
      headerBg: "transparent",
      actionsBg: "#fafafa",
    },
    Button: {
      controlHeight: 32,
      fontSize: 14,
      borderRadius: 6,
    },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...lightTheme.token,
    colorTextBase: "#ffffff",
    colorBgBase: "#000000",
  },
  components: {
    ...lightTheme.components,
    Layout: {
      ...lightTheme.components?.Layout,
      headerBg: "#141414",
      siderBg: "#001529",
      bodyBg: "#000000",
    },
  },
};
```

#### 自定义组件样式

```less
// src/styles/components.less
.kr-virt-layout {
  &-header {
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &-logo {
      height: 32px;
      display: flex;
      align-items: center;

      img {
        height: 100%;
        margin-right: 12px;
      }

      h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #1890ff;
      }
    }

    &-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  }

  &-sidebar {
    background: #001529;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
  }

  &-content {
    background: #f0f2f5;
    min-height: calc(100vh - 64px);
    padding: 24px;

    &-wrapper {
      background: #ffffff;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
      padding: 24px;
      min-height: 400px;
    }
  }
}

// 暗色主题适配
[data-theme="dark"] {
  .kr-virt-layout {
    &-header {
      background: #141414;
      border-bottom: 1px solid #303030;
    }

    &-content {
      background: #000000;

      &-wrapper {
        background: #141414;
        border: 1px solid #303030;
      }
    }
  }
}
```

## 21. 安全架构深度实现

### 21.1 完整的安全防护体系

#### CSP 内容安全策略

```typescript
// src/utils/security.ts
export class SecurityManager {
  // 设置 CSP 头
  static setupCSP(): void {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' ws: wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = cspDirectives;
    document.head.appendChild(meta);
  }

  // XSS 防护
  static sanitizeInput(input: string): string {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  // 验证 URL 安全性
  static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ["http:", "https:"].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // 密码强度验证
  static validatePasswordStrength(password: string): {
    score: number;
    level: "weak" | "medium" | "strong" | "very-strong";
    feedback: string[];
  } {
    const checks = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      notCommon: !this.isCommonPassword(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const feedback: string[] = [];

    if (!checks.minLength) feedback.push("密码至少需要8个字符");
    if (!checks.hasUpperCase) feedback.push("需要包含大写字母");
    if (!checks.hasLowerCase) feedback.push("需要包含小写字母");
    if (!checks.hasNumbers) feedback.push("需要包含数字");
    if (!checks.hasSpecialChars) feedback.push("需要包含特殊字符");
    if (!checks.notCommon) feedback.push("密码过于常见，请使用更复杂的密码");

    let level: "weak" | "medium" | "strong" | "very-strong";
    if (score <= 2) level = "weak";
    else if (score <= 3) level = "medium";
    else if (score <= 4) level = "strong";
    else level = "very-strong";

    return { score, level, feedback };
  }

  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      "password",
      "123456",
      "123456789",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
      "welcome",
      "monkey",
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  // JWT Token 解析和验证
  static parseJWT(token: string): any {
    try {
      const payload = token.split(".")[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const payload = this.parseJWT(token);
    if (!payload || !payload.exp) return true;
    return payload.exp * 1000 < Date.now();
  }
}
```

### 21.2 高级 TOTP 认证系统

#### 完整的 TOTP 实现

```typescript
// src/services/totpService.ts - 扩展版
import CryptoJS from "crypto-js";

export interface TOTPConfig {
  secret: string;
  window: number;
  timeStep: number;
  digits: number;
  algorithm: "SHA1" | "SHA256" | "SHA512";
}

export class TOTPService {
  private static readonly DEFAULT_CONFIG: TOTPConfig = {
    secret: "TA2SS5UUTTFSHBELVGVO53NRIR7AQHFM",
    window: 1,
    timeStep: 30,
    digits: 6,
    algorithm: "SHA1",
  };

  // 生成安全的随机密钥
  static generateSecret(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let result = "";
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);

    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
    }

    return result;
  }

  // 生成当前 TOTP 码
  static async generateCurrentCode(
    config: Partial<TOTPConfig> = {},
  ): Promise<string> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const timeStep = Math.floor(Date.now() / 1000 / fullConfig.timeStep);
    return this.generateHOTP(fullConfig.secret, timeStep, fullConfig);
  }

  // 验证 TOTP 码（支持时间窗口）
  static async verifyCode(
    code: string,
    config: Partial<TOTPConfig> = {},
  ): Promise<{ valid: boolean; timeStep?: number }> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const currentTimeStep = Math.floor(Date.now() / 1000 / fullConfig.timeStep);

    // 在时间窗口内验证
    for (let i = -fullConfig.window; i <= fullConfig.window; i++) {
      const timeStep = currentTimeStep + i;
      const expectedCode = await this.generateHOTP(
        fullConfig.secret,
        timeStep,
        fullConfig,
      );

      if (code === expectedCode) {
        return { valid: true, timeStep };
      }
    }

    return { valid: false };
  }

  // 生成 HOTP
  private static async generateHOTP(
    secret: string,
    counter: number,
    config: TOTPConfig,
  ): Promise<string> {
    const key = this.base32Decode(secret);
    const counterBytes = this.intToBytes(counter);

    let hmac: CryptoJS.lib.WordArray;
    switch (config.algorithm) {
      case "SHA256":
        hmac = CryptoJS.HmacSHA256(counterBytes, key);
        break;
      case "SHA512":
        hmac = CryptoJS.HmacSHA512(counterBytes, key);
        break;
      default:
        hmac = CryptoJS.HmacSHA1(counterBytes, key);
    }

    const hmacBytes = this.wordArrayToBytes(hmac);
    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;

    const code =
      (((hmacBytes[offset] & 0x7f) << 24) |
        ((hmacBytes[offset + 1] & 0xff) << 16) |
        ((hmacBytes[offset + 2] & 0xff) << 8) |
        (hmacBytes[offset + 3] & 0xff)) %
      Math.pow(10, config.digits);

    return code.toString().padStart(config.digits, "0");
  }

  // Base32 解码
  private static base32Decode(encoded: string): CryptoJS.lib.WordArray {
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const cleanInput = encoded.replace(/=+$/, "").toUpperCase();
    const bytes: number[] = [];

    let bits = 0;
    let value = 0;

    for (const char of cleanInput) {
      const index = base32Chars.indexOf(char);
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return CryptoJS.lib.WordArray.create(bytes);
  }

  // WordArray 转字节数组
  private static wordArrayToBytes(wordArray: CryptoJS.lib.WordArray): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
      const byte = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      bytes.push(byte);
    }
    return bytes;
  }

  // 整数转字节数组
  private static intToBytes(num: number): CryptoJS.lib.WordArray {
    const bytes: number[] = [];
    for (let i = 7; i >= 0; i--) {
      bytes.push((num >>> (i * 8)) & 0xff);
    }
    return CryptoJS.lib.WordArray.create(bytes);
  }

  // 生成二维码数据
  static generateQRCodeData(
    username: string,
    issuer: string = "KR-virt",
    config: Partial<TOTPConfig> = {},
  ): string {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const label = `${issuer}:${username}`;

    const params = new URLSearchParams({
      secret: fullConfig.secret,
      issuer,
      algorithm: fullConfig.algorithm,
      digits: fullConfig.digits.toString(),
      period: fullConfig.timeStep.toString(),
    });

    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
  }

  // 获取剩余时间
  static getRemainingTime(timeStep: number = 30): number {
    return timeStep - (Math.floor(Date.now() / 1000) % timeStep);
  }
}
```

## 22. 项目文档体系

### 22.1 文档结构规划

```
docs/
├── README.md                    # 项目概述
├── CHANGELOG.md                 # 版本变更日志
├── CONTRIBUTING.md              # 贡献指南
├── DEPLOYMENT.md                # 部署文档
├── API.md                       # API 接口文档
├── ARCHITECTURE.md              # 架构设计文档
├── SECURITY.md                  # 安全指南
├── PERFORMANCE.md               # 性能优化指南
├── TROUBLESHOOTING.md           # 故障排除指南
├── development/                 # 开发文档
│   ├── getting-started.md       # 快速开始
│   ├── coding-standards.md      # 编码规范
│   ├── component-guide.md       # 组件开发指南
│   ├── testing-guide.md         # 测试指南
│   └── git-workflow.md          # Git 工作流
├── user-guide/                  # 用户手册
│   ├── installation.md          # 安装指南
│   ├── configuration.md         # 配置说明
│   ├── features/                # 功能介绍
│   └── tutorials/               # 使用教程
└── assets/                      # 文档资源
    ├── images/                  # 图片资源
    ├── diagrams/                # 架构图
    └── videos/                  # 视频教程
```

## 23. 总结与展望

### 23.1 技术架构总结

KR-virt 前端架构基于现代化技术栈构建，形成了完整的企业级解决方案：

**核心技术栈**

- **React 19.1.0**: 利用最新并发特性，提供优秀的用户体验
- **TypeScript 5.8.3**: 严格类型检查，提高代码质量和开发效率
- **Vite 6.3.5**: 极速构建工具，优化开发体验
- **Ant Design 5.25.2**: 企业级UI组件库，统一设计语言
- **Redux Toolkit 2.8.2**: 现代化状态管理，简化开发流程

**架构特点**

1. **分层清晰**: 展示层、组件层、业务逻辑层、状态管理层、数据访问层
2. **模块化设计**: 高内聚、低耦合的组件设计
3. **类型安全**: 完整的 TypeScript 类型定义
4. **性能优化**: 多层次性能优化策略
5. **安全可靠**: 完善的安全防护机制

### 23.2 项目优势

1. **技术先进性**: 采用最新的前端技术栈，保持技术竞争力
2. **开发效率**: 完善的工具链和开发规范，提高团队协作效率
3. **用户体验**: 现代化UI设计和交互体验
4. **可维护性**: 清晰的代码结构和完善的文档体系
5. **可扩展性**: 模块化设计，支持功能快速迭代

6. **安全性**: 多层次安全防护，保障系统安全

### 23.3 持续改进计划

**短期目标**

- 完善核心功能模块
- 优化性能和用户体验
- 加强测试覆盖率
- 完善文档体系

**中期目标**

- 引入微前端架构
- 实现 PWA 功能
- 构建组件库
- 国际化支持

**长期目标**

- 智能化运维功能
- AI 辅助开发
- 边缘计算支持

### 24.架构特色：

- 分层清晰: 5层架构设计，职责分明
- 类型安全: 完整的 TypeScript 类型定义
- 模块化: 高内聚、低耦合的组件设计
- 安全可靠: 多层次安全防护机制
- 性能优秀: 多种性能优化策略
- 易于维护: 清晰的代码结构和文档
