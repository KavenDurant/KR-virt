# 审计模块Loading问题修复

## 问题描述

审计模块的三个选项卡（审计日志、安全事件、登录会话）出现持续loading状态，表格数据无法正常显示。

## 问题根因

在 `/src/pages/Audit/index.tsx` 中，`loadAuditData` 函数使用了 `useCallback` 钩子，但其依赖项数组包含了在组件内部定义的mock数据：

```typescript
const loadAuditData = useCallback(() => {
  // ... 加载逻辑
}, [mockAuditLogs, mockSecurityEvents, mockLoginSessions]);
```

这些mock数据数组在每次组件重新渲染时都会被重新创建，导致React认为依赖项发生了变化，从而重新执行`loadAuditData`函数，造成无限循环的loading状态。

## 解决方案

1. **将mock数据移到组件外部**：将 `mockAuditLogs`、`mockSecurityEvents` 和 `mockLoginSessions` 从组件内部移动到组件外部，使其成为模块级别的常量。

2. **清空useCallback依赖项**：由于mock数据现在是固定的常量，移除了useCallback的依赖项数组，改为空数组 `[]`。

## 修复后的代码结构

```typescript
// 组件外部 - 模块级别的常量
const mockAuditLogs: AuditLog[] = [
  /* ... */
];
const mockSecurityEvents: SecurityEvent[] = [
  /* ... */
];
const mockLoginSessions: LoginSession[] = [
  /* ... */
];

const AuditManagement: React.FC = () => {
  // 组件状态定义...

  const loadAuditData = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setAuditLogs(mockAuditLogs);
      setSecurityEvents(mockSecurityEvents);
      setLoginSessions(mockLoginSessions);
      setLoading(false);
    }, 500);
  }, []); // 空依赖项数组

  // ...
};
```

## 修复效果

- ✅ 三个选项卡的表格数据正常加载显示
- ✅ Loading状态正常，不再出现无限循环
- ✅ 审计日志、安全事件、登录会话数据正确显示
- ✅ 所有功能（筛选、详情查看、导出等）正常工作

## 测试验证

1. 访问 http://localhost:3003/
2. 点击审计模块图标进入审计管理页面
3. 验证三个选项卡都能正常加载数据
4. 验证表格分页、筛选、详情查看等功能正常

## 修复时间

2025年5月26日

## 状态

✅ 已完成并验证
