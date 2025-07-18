# TokenRefreshFailureModal 组件使用指南

## 概述

`TokenRefreshFailureModal` 是一个专门用于处理Token刷新失败情况的Modal组件。它替换了原来的原生`alert`，提供了更好的用户体验，包括倒计时、自动跳转、重试等功能。

## 功能特性

1. **优雅的用户界面**：使用Ant Design Modal组件，提供一致的设计风格
2. **倒计时功能**：显示自动跳转倒计时，用户可以清楚知道剩余时间
3. **自动跳转**：倒计时结束后自动跳转到登录页
4. **重试机制**：支持重试刷新Token功能
5. **键盘支持**：支持Enter键确认，Esc键被禁用（安全考虑）
6. **主题适配**：自动适配深色/浅色主题
7. **响应式设计**：在移动设备上也能良好显示

## 组件API

### TokenRefreshFailureModalProps

```typescript
interface TokenRefreshFailureModalProps {
  /** 是否显示Modal */
  visible: boolean;
  /** 关闭Modal的回调 */
  onClose?: () => void;
  /** 确认跳转到登录页的回调 */
  onConfirm?: () => void;
  /** 重试刷新Token的回调 */
  onRetry?: () => Promise<void>;
  /** 错误消息 */
  message: string;
  /** 失败原因 */
  reason?: string;
  /** 自动跳转倒计时时间（秒），默认5秒 */
  countdown?: number;
  /** 是否显示重试按钮 */
  showRetry?: boolean;
  /** 是否自动跳转 */
  autoRedirect?: boolean;
}
```

## 使用方法

### 1. 基本使用

```typescript
import { showTokenRefreshFailureModal } from "@/components/TokenRefreshFailureModal/utils";

// 显示Token刷新失败Modal
showTokenRefreshFailureModal({
  message: "登录状态已过期，系统将自动退出登录",
  reason: "Token已失效",
  countdown: 5,
  autoRedirect: true,
  onConfirm: () => {
    window.location.href = "/login";
  },
});
```

### 2. 带重试功能的使用

```typescript
import { showTokenRefreshFailureModal } from "@/components/TokenRefreshFailureModal/utils";

showTokenRefreshFailureModal({
  message: "网络连接异常，为了您的账户安全，系统将自动退出登录",
  reason: "网络连接超时",
  countdown: 10,
  showRetry: true,
  onRetry: async () => {
    // 重试刷新Token的逻辑
    const result = await loginService.refreshToken();
    if (!result.success) {
      throw new Error("重试失败");
    }
  },
  onConfirm: () => {
    window.location.href = "/login";
  },
});
```

### 3. 在Token刷新管理器中的集成

在`src/services/login/index.ts`中，已经将原来的`alert`替换为这个Modal组件：

```typescript
// 原来的代码
alert(errorMessage);

// 替换为
showTokenRefreshFailureModal({
  message: errorMessage,
  reason,
  countdown: 5,
  autoRedirect: true,
  showRetry: false,
  onConfirm: () => {
    console.log("🔄 用户确认跳转到登录页面");
    window.location.href = "/login";
  },
});
```

## 工具函数

### showTokenRefreshFailureModal

显示Token刷新失败Modal

```typescript
showTokenRefreshFailureModal(options: TokenRefreshFailureOptions): void
```

### hideTokenRefreshFailureModal

隐藏Token刷新失败Modal

```typescript
hideTokenRefreshFailureModal(): void
```

### isTokenRefreshFailureModalVisible

检查Modal是否可见

```typescript
isTokenRefreshFailureModalVisible(): boolean
```

### destroyTokenRefreshFailureModal

销毁Modal管理器，清理资源

```typescript
destroyTokenRefreshFailureModal(): void
```

## 样式定制

组件提供了完整的样式定制支持，包括：

- 深色主题适配
- 响应式设计
- 动画效果
- 进度条样式

样式文件位于：`src/components/TokenRefreshFailureModal/index.less`

## 键盘交互

- **Enter键**：确认并跳转到登录页
- **Esc键**：被禁用（安全考虑，防止用户意外关闭）

## 注意事项

1. **单例模式**：Modal管理器使用单例模式，确保同时只有一个Modal显示
2. **自动清理**：Modal会在隐藏后自动清理DOM节点
3. **错误降级**：如果Modal显示失败，会降级到原生alert
4. **主题同步**：自动检测并应用当前的主题设置

## 错误类型处理

组件会根据不同的错误原因显示不同的提示：

- **网络错误**：显示为警告类型，建议重试
- **Token过期**：显示为错误类型，需要重新登录
- **认证失败**：显示为错误类型，需要重新登录

## 测试

组件包含完整的测试用例，位于：
`tests/components/TokenRefreshFailureModal.test.tsx`

运行测试：

```bash
npm run test -- TokenRefreshFailureModal
```

## 替换原有alert的优势

1. **用户体验更好**：提供倒计时和进度显示
2. **样式一致**：与应用整体设计保持一致
3. **功能更丰富**：支持重试、自定义操作等
4. **主题适配**：自动适配深色/浅色主题
5. **键盘支持**：更好的可访问性
6. **响应式**：在移动设备上也能良好显示

这个组件成功地将原生的`alert`替换为更现代、功能更丰富的Modal，提供了更好的用户体验。
