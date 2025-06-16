# Mock数据控制使用指南

## 🎯 功能说明

通过环境变量 `VITE_ENABLE_MOCK` 来统一控制整个项目是否使用Mock数据，无需修改代码。

## 🚀 使用方法

### 1. 环境变量控制

**开启Mock数据：**
```bash
# 修改 .env.development 文件
VITE_ENABLE_MOCK=true
```

**使用真实API：**
```bash
# 修改 .env.development 文件  
VITE_ENABLE_MOCK=false
```

### 2. 启动项目

```bash
# 重新启动开发服务器（环境变量修改后需要重启）
npm run dev
```

启动时会显示当前Mock状态：
```
🚀 构建模式: development
📡 API地址: /api
🎯 代理目标: http://192.168.1.187:8001
🎭 Mock数据: 禁用  # 或 "启用"
```

## 📋 支持Mock控制的服务

目前已经集成Mock控制的服务：

### 1. 登录服务 (`src/services/login/index.ts`)
- ✅ 登录验证
- ✅ Token刷新
- ✅ 用户信息获取

### 2. 集群服务 (`src/services/cluster/index.ts`)
- ✅ 集群状态检查
- ✅ 集群创建
- ✅ 集群加入
- ✅ 集群解散
- ✅ 节点管理
- ✅ 资源监控

## 🛠️ 为新服务添加Mock控制

### 方法1：使用EnvConfig.ENABLE_MOCK

```typescript
import { EnvConfig } from "@/config/env";

class YourService {
  async getData() {
    if (EnvConfig.ENABLE_MOCK) {
      // 返回Mock数据
      return this.getMockData();
    } else {
      // 调用真实API
      return this.getApiData();
    }
  }
}
```

### 方法2：使用EnvConfig.mockOrApi助手

```typescript
import { EnvConfig } from "@/config/env";

class YourService {
  async getData() {
    return await EnvConfig.mockOrApi(
      () => this.getMockData(),    // Mock数据函数
      () => this.getApiData()      // 真实API函数
    );
  }
}
```

## 🎭 Mock数据示例

### 创建Mock数据文件

```typescript
// src/services/yourService/mockData.ts
export const mockUserList = [
  { id: 1, name: "用户1", email: "user1@example.com" },
  { id: 2, name: "用户2", email: "user2@example.com" },
];

export const mockApiResponse = {
  success: true,
  data: mockUserList,
  message: "获取成功"
};
```

### 在服务中使用

```typescript
// src/services/yourService/index.ts
import { EnvConfig } from "@/config/env";
import { mockApiResponse } from "./mockData";
import { http } from "@/utils/request";

class YourService {
  async getUsers() {
    return await EnvConfig.mockOrApi(
      // Mock数据
      async () => {
        await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
        return mockApiResponse;
      },
      // 真实API
      async () => {
        const response = await http.get("/users");
        return response.data;
      }
    );
  }
}
```

## 🔧 开发工作流

### 开发阶段
1. **前端先行开发**：设置 `VITE_ENABLE_MOCK=true`，使用Mock数据进行界面开发
2. **API联调**：设置 `VITE_ENABLE_MOCK=false`，切换到真实API进行联调
3. **快速切换**：需要时可以随时切换Mock/API模式进行对比测试

### 测试阶段
- 可以在Mock模式下测试各种边界情况和异常场景
- 在API模式下测试真实的网络情况和数据格式

## 🌍 环境配置

### 开发环境 (.env.development)
```properties
VITE_ENABLE_MOCK=false          # 根据需要设置
VITE_API_BASE_URL=/api
VITE_PROXY_TARGET=http://192.168.1.187:8001
```

### 生产环境 (.env.production)
```properties
VITE_ENABLE_MOCK=false          # 生产环境通常禁用Mock
VITE_API_BASE_URL=https://api.kr-virt.com
```

## 📊 调试信息

在开发环境中，控制台会显示当前使用的数据源：

```
🎭 使用Mock数据  # 当 VITE_ENABLE_MOCK=true 时
🌐 使用真实API   # 当 VITE_ENABLE_MOCK=false 时
```

## ⚠️ 注意事项

1. **重启必需**：修改环境变量后必须重启开发服务器
2. **一致性**：确保Mock数据格式与真实API返回格式一致
3. **性能**：Mock数据应该模拟合理的网络延迟
4. **错误场景**：Mock数据也应该包含错误场景的测试用例

## 🔍 故障排除

### Mock数据不生效
- 检查环境变量是否正确设置
- 确认已重启开发服务器
- 查看控制台是否显示正确的Mock状态

### 切换后出现错误
- 检查Mock数据格式是否与API格式一致
- 确认真实API地址配置正确
- 查看浏览器开发者工具的网络面板
