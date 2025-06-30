# useTimeZone Hook

## 📋 概述

`useTimeZone` 是一个专为 KR-virt 项目开发的自定义 React Hook，用于处理时区转换和时间格式化。它能够将后端返回的 ISO 8601 格式时间字符串自动转换为用户本地时区的时间。

## 🚀 主要功能

- ✅ **ISO 8601 时间解析**：支持各种 ISO 格式的时间字符串
- ✅ **自动时区转换**：自动检测用户本地时区并转换
- ✅ **自定义格式输出**：支持灵活的时间格式配置
- ✅ **完善的错误处理**：输入验证和错误提示
- ✅ **批量处理支持**：`useTimeZoneBatch` 用于处理多个时间
- ✅ **时区信息获取**：`useTimezoneInfo` 获取当前用户时区信息
- ✅ **TypeScript 支持**：完整的类型定义

## 📦 文件结构

```
src/hooks/
├── useTimeZone.ts              # 主要 Hook 实现
├── __tests__/
│   └── useTimeZone.test.ts     # 单元测试
└── index.ts                    # 导出配置
```

## 🔧 快速开始

### 基本使用

```typescript
import { useTimeZone } from '@/hooks';

const MyComponent = ({ serverTime }: { serverTime: string }) => {
  const { localTime, isValid, error } = useTimeZone(serverTime);

  if (!isValid) {
    return <span>时间格式错误: {error}</span>;
  }

  return <span>本地时间: {localTime}</span>;
};
```

### 自定义格式

```typescript
const { localTime } = useTimeZone("2025-06-25T15:54:29+00:00", {
  format: "MM/DD/YYYY HH:mm",
});
// 输出: 06/25/2025 23:54 (假设用户在 UTC+8 时区)
```

### 批量处理

```typescript
const timeStrings = ["2025-06-25T15:54:29+00:00", "2025-06-26T10:30:00+08:00"];
const results = useTimeZoneBatch(timeStrings);
```

### 获取时区信息

```typescript
const timezoneInfo = useTimezoneInfo();
console.log(timezoneInfo.timezone); // 'Asia/Shanghai'
console.log(timezoneInfo.offsetString); // '+08:00'
```

## 🧪 测试

Hook 包含完整的单元测试，覆盖以下场景：

- ✅ 正常时间转换
- ✅ 自定义格式
- ✅ 错误处理
- ✅ 边界情况
- ✅ 批量处理
- ✅ 时区信息获取

运行测试：

```bash
npm test src/hooks/__tests__/useTimeZone.test.ts
```

## 📚 相关文档

- [详细使用指南](../../../DOCS/useTimeZone-Hook使用指南.md)
- [演示页面](../pages/TimeZoneDemo/index.tsx)
- [TimeDisplay 组件示例](../components/TimeDisplay/index.tsx)

## 🔗 依赖

- `dayjs` ^1.11.13
- `dayjs/plugin/utc`
- `dayjs/plugin/timezone`

## 📝 注意事项

1. **时区插件**：Hook 会自动加载 Day.js 的 UTC 和时区插件
2. **性能考虑**：使用 `useMemo` 优化性能，避免不必要的重新计算
3. **错误处理**：始终检查 `isValid` 字段并处理错误情况
4. **调试模式**：可以启用 `debug` 选项查看详细的转换过程

## 🎯 使用场景

- 用户管理页面的创建时间显示
- 集群管理页面的节点状态时间
- 系统设置页面的许可证到期时间
- 审计日志的时间戳显示
- 任何需要显示服务器时间的场景

---

_此 Hook 专为 KR-virt 项目设计，确保了时间显示的一致性和用户体验。_
