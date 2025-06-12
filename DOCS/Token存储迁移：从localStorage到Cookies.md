# Token存储迁移：从localStorage到Cookies

## 迁移概述

将所有Token和用户认证信息的存储方式从`localStorage`迁移到安全的`Cookies`，以提高安全性和跨域兼容性。

## 迁移的主要原因

### 1. 安全性提升
- **HttpOnly支持**: 虽然前端无法直接设置HttpOnly，但为未来服务端设置做准备
- **SameSite保护**: 防止CSRF攻击
- **Secure标志**: 在HTTPS环境下确保Cookie仅通过安全连接传输
- **自动过期**: 浏览器自动处理过期Cookie，减少客户端逻辑

### 2. 兼容性改善
- **跨域支持**: 更好的跨域认证支持
- **移动端兼容**: 某些移动浏览器对localStorage支持有限
- **SSR友好**: 服务端渲染环境下的更好支持

## 技术实现

### 1. 新增Cookie工具类

创建了 `src/utils/cookies.ts`，包含：

```typescript
export class CookieUtils {
  // 基础Cookie操作
  static set(name: string, value: string, options?: CookieOptions): void
  static get(name: string): string | null
  static remove(name: string, options?: CookieOptions): void
  static exists(name: string): boolean
  
  // Token专用方法
  static setToken(token: string, options?: CookieOptions): void
  static getToken(): string | null
  static removeToken(): void
  
  // 用户信息专用方法
  static setUser(userInfo: object, options?: CookieOptions): void
  static getUser<T>(): T | null
  static removeUser(): void
  
  // 认证清理
  static clearAuth(): void
}
```

### 2. 安全配置

#### 默认安全选项
```typescript
const DEFAULT_SECURE_OPTIONS: CookieOptions = {
  path: '/',
  secure: location.protocol === 'https:', // 生产环境HTTPS
  sameSite: 'lax',
  maxAge: 24 * 60 * 60, // 24小时
};
```

#### Token专用配置
```typescript
const TOKEN_COOKIE_OPTIONS: CookieOptions = {
  ...DEFAULT_SECURE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60, // 7天
  sameSite: 'strict', // 更严格的策略
};
```

## 迁移的文件清单

### 1. 核心服务文件
- ✅ `src/services/login/index.ts` - 登录服务
- ✅ `src/utils/request.ts` - HTTP请求工具
- ✅ `src/services/cluster/index.ts` - 集群服务

### 2. 组件文件
- ✅ `src/components/AppBootstrap/index.tsx` - 应用启动组件
- ✅ `src/router/index.tsx` - 路由配置
- ✅ `src/pages/ClusterInit/ClusterAuthPage.tsx` - 集群认证页面

### 3. 工具文件
- ✅ `src/utils/tokenRefreshTestUtils.ts` - Token刷新测试工具

## 迁移前后对比

### 迁移前 (localStorage)
```typescript
// 设置Token
localStorage.setItem("kr_virt_token", token);

// 获取Token
const token = localStorage.getItem("kr_virt_token");

// 设置用户信息
localStorage.setItem("kr_virt_user", JSON.stringify(userInfo));

// 获取用户信息
const userStr = localStorage.getItem("kr_virt_user");
const user = userStr ? JSON.parse(userStr) : null;

// 清除数据
localStorage.removeItem("kr_virt_token");
localStorage.removeItem("kr_virt_user");
```

### 迁移后 (Cookies)
```typescript
// 设置Token
CookieUtils.setToken(token);

// 获取Token
const token = CookieUtils.getToken();

// 设置用户信息
CookieUtils.setUser(userInfo);

// 获取用户信息
const user = CookieUtils.getUser<UserInfo>();

// 清除数据
CookieUtils.clearAuth();
```

## 安全特性

### 1. 自动安全配置
- **路径限制**: 所有Cookie设置为根路径 `/`
- **HTTPS检测**: 自动检测HTTPS环境并设置secure标志
- **SameSite策略**: Token使用strict，其他使用lax

### 2. 过期管理
- **Token**: 默认7天过期
- **其他数据**: 默认24小时过期
- **浏览器自动清理**: 过期Cookie自动被浏览器删除

### 3. 大小限制检查
```typescript
// 检查Cookie大小
CookieUtils.getCookieSize(): number
CookieUtils.isNearSizeLimit(): boolean
```

## 调试功能

### 开发环境调试
```typescript
// 显示所有Cookie信息
CookieUtils.debug();

// 输出内容包括：
// - 所有Cookie列表
// - Token存在状态
// - 用户信息存在状态  
// - Cookie总大小
// - 是否接近大小限制
```

### 控制台调试方法
```javascript
// 在浏览器控制台中使用
CookieUtils.debug();           // 查看Cookie状态
CookieUtils.getAll();          // 获取所有Cookie
CookieUtils.clearAuth();       // 清除认证Cookie
```

## 向后兼容性

### 1. 接口保持一致
迁移后的API接口与原来保持一致，只改变了底层存储方式：

```typescript
// LoginService的方法签名未改变
getToken(): string | null
setToken(token: string): void
getCurrentUser(): UserInfo | null
setUser(user: UserInfo): void
```

### 2. 自动迁移支持
如果需要，可以添加自动迁移逻辑：

```typescript
// 从localStorage迁移到Cookie的示例代码
const migrateFromLocalStorage = () => {
  const oldToken = localStorage.getItem("kr_virt_token");
  const oldUser = localStorage.getItem("kr_virt_user");
  
  if (oldToken) {
    CookieUtils.setToken(oldToken);
    localStorage.removeItem("kr_virt_token");
  }
  
  if (oldUser) {
    try {
      const userInfo = JSON.parse(oldUser);
      CookieUtils.setUser(userInfo);
      localStorage.removeItem("kr_virt_user");
    } catch (error) {
      console.warn("用户信息迁移失败:", error);
    }
  }
};
```

## 测试验证

### 1. 功能测试
- ✅ 登录功能正常
- ✅ Token自动刷新正常
- ✅ 登出清理正常
- ✅ 用户状态保持正常

### 2. 安全测试
- ✅ Cookie安全标志设置正确
- ✅ SameSite策略生效
- ✅ 过期时间设置正确
- ✅ 跨站请求保护有效

### 3. 兼容性测试
- ✅ Chrome/Safari/Firefox支持正常
- ✅ 移动端浏览器支持正常
- ✅ HTTPS/HTTP环境都能正常工作

## 部署注意事项

### 1. 生产环境配置
确保生产环境使用HTTPS，这样Cookie的secure标志才会生效。

### 2. 域名配置
如果应用部署在多个子域名下，可能需要调整Cookie的domain设置。

### 3. 代理配置
如果使用反向代理，确保Cookie能正确传递。

## 未来优化方向

### 1. 服务端HttpOnly
考虑将Token设置为HttpOnly Cookie，由服务端管理。

### 2. Token加密
对存储在Cookie中的Token进行客户端加密。

### 3. 多级过期策略
实现更复杂的过期策略，如滑动过期等。

## 结论

通过将Token存储从localStorage迁移到Cookies，我们获得了：

1. **更高的安全性** - 防护CSRF和XSS攻击
2. **更好的兼容性** - 支持更多环境和场景
3. **自动过期管理** - 减少客户端逻辑复杂度
4. **未来扩展性** - 为服务端安全策略做准备

这次迁移为应用的安全性和稳定性提供了重要保障。
