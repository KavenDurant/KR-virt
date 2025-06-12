# Token 自动刷新系统使用指南

## 概述

Token自动刷新系统是一个全局的、自动化的认证管理解决方案，确保用户在使用应用期间无需手动处理Token过期问题。

## 核心特性

### 🔄 自动刷新机制
- **刷新间隔**: 每3分钟自动刷新一次Token
- **智能检测**: 自动检测Token格式和有效性
- **错误处理**: 自动处理刷新失败和Token无效情况

### 🛡️ 安全机制
- **格式验证**: JWT格式验证和Base64解码检查
- **并发控制**: 防止同时进行多个刷新请求
- **失败处理**: 自动清理无效Token并引导用户重新登录

### 🚀 全局管理
- **单例模式**: 确保全应用只有一个刷新管理器实例
- **生命周期管理**: 自动启动/停止，跟随用户登录状态
- **状态监听**: 监听localStorage变化，响应登录/登出事件

## 使用方法

### 1. 自动启动（推荐）

系统会在应用启动时自动初始化，无需手动调用：

```typescript
// 在 AppBootstrap 组件中自动启动
// 用户登录后自动开始刷新
// 用户登出后自动停止刷新
```

### 2. 手动控制

如果需要手动控制，可以使用以下API：

```typescript
import { loginService } from '@/services/login';

// 启动自动刷新
loginService.startGlobalTokenRefresh();

// 停止自动刷新
loginService.stopGlobalTokenRefresh();

// 检查自动刷新状态
const status = loginService.getAutoRefreshStatus();
console.log('是否运行中:', status.isRunning);
console.log('是否正在刷新:', status.isRefreshing);

// 手动刷新Token（一般不需要）
const result = await loginService.refreshToken();
```

### 3. 调试和监控

在开发环境中，可以使用调试功能：

```typescript
// 查看当前Token信息
loginService.debugTokenInfo();

// 清理无效Token
const hasInvalidToken = loginService.cleanupInvalidToken();
```

## 工作流程

### 登录时
1. 用户成功登录
2. AppBootstrap检测到登录状态
3. 自动启动Token刷新管理器
4. 开始每3分钟的自动刷新循环

### 刷新过程
1. 检查用户是否已登录
2. 验证当前Token格式
3. 调用后端刷新API
4. 更新本地存储的Token
5. 记录刷新结果

### 错误处理
1. Token格式无效 → 清理本地数据
2. 刷新API失败 → 记录错误，继续尝试
3. 认证失败 → 停止刷新，引导重新登录

### 登出时
1. 用户登出
2. 停止自动刷新
3. 清理所有认证数据

## 配置选项

### 刷新间隔

在 `TokenRefreshManager` 中修改：

```typescript
private readonly REFRESH_INTERVAL = 3 * 60 * 1000; // 3分钟
```

### API端点

在 `LoginService` 中修改：

```typescript
const response = await http.get<RefreshTokenApiResponse>("/user/renew_access_token", ...);
```

## 日志说明

### 正常运行日志
```
🔧 应用启动器：初始化Token自动刷新...
👤 用户已登录，启动Token自动刷新
🔄 启动Token自动刷新，间隔: 3分钟
🔄 开始自动刷新Token...
✅ Token自动刷新成功
```

### 错误处理日志
```
⚠️ 发现并清理了无效Token
❌ Token自动刷新失败: Token已失效，请重新登录
🛑 Token已失效，停止自动刷新
```

### 状态变化日志
```
✅ 检测到用户登录，启动Token自动刷新
❌ 检测到用户登出，停止Token自动刷新
🛑 应用关闭，停止Token自动刷新
```

## 最佳实践

### 1. 不要手动刷新
除非特殊情况，不要在业务代码中手动调用 `refreshToken()` 方法。

### 2. 监听状态变化
如果需要响应Token状态变化，监听相应的事件或状态。

### 3. 错误处理
依赖系统的自动错误处理，不要重复实现Token相关的错误处理逻辑。

### 4. 调试信息
在开发环境中，定期检查控制台日志，确保系统正常运行。

## 故障排除

### 问题：刷新不工作
1. 检查用户是否已登录
2. 查看控制台是否有错误日志
3. 验证后端API是否正常

### 问题：频繁重新登录
1. 检查Token格式是否正确
2. 验证后端Token有效期设置
3. 检查网络连接稳定性

### 问题：内存泄漏
1. 确保在应用卸载时调用了停止方法
2. 检查事件监听器是否正确清理

## 技术细节

### 架构设计
- **单例模式**: TokenRefreshManager 确保全局唯一
- **观察者模式**: 监听localStorage变化
- **策略模式**: 不同错误类型的处理策略

### 并发控制
- 使用 `isRefreshing` 标志防止并发刷新
- 队列机制处理同时发起的刷新请求

### 错误恢复
- 自动重试机制（网络错误）
- 降级处理（认证错误）
- 用户引导（Token失效）

## 更新历史

- **v1.0**: 基础自动刷新功能
- **v1.1**: 添加Token格式验证
- **v1.2**: 完善错误处理和日志
- **v1.3**: 集成全局生命周期管理
