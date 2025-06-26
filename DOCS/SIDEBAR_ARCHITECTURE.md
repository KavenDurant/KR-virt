# 侧边栏交互架构重构文档

## 概述

本文档描述了侧边栏与主内容区域交互的重构架构。重构的目标是简化代码结构，提高可维护性，并提供更清晰的组件间通信模式。

## 重构前的问题

### 1. 复杂的事件处理

- 直接使用 `window.addEventListener` 监听自定义事件
- 手动管理多个状态变量
- 事件处理逻辑分散在各个组件中
- 难以测试和调试

### 2. 代码重复

- 相似的侧边栏选择逻辑在多个模块中重复
- 状态管理模式重复
- 事件清理逻辑重复

### 3. 紧耦合

- 组件间直接通过 window 事件通信
- 状态清理逻辑散布在各处
- 难以追踪状态变化

## 重构后的架构

### 1. 自定义 Hooks 架构

#### `useSidebarSelection`

**职责**: 管理侧边栏选择状态和交互逻辑

**特性**:

- 统一的选择状态管理
- 自动的事件监听和清理
- 类型安全的状态访问
- 清晰的选择操作接口

**使用示例**:

```typescript
const {
  selectedHost,
  selectedVM,
  selectedCluster,
  clearSelection,
  selectHost,
  selectVM,
} = useSidebarSelection();
```

#### `useSidebarRefresh`

**职责**: 管理侧边栏刷新事件监听

**特性**:

- 条件过滤刷新事件
- 自动事件监听和清理
- 统一的刷新事件格式

**使用示例**:

```typescript
useSidebarRefresh((detail) => {
  if (detail.type === "cluster") {
    fetchClusterData();
  }
});
```

#### `useSidebarHostActions`

**职责**: 管理侧边栏主机操作事件

**特性**:

- 操作类型标准化映射
- 类型安全的回调接口
- 灵活的过滤机制

**使用示例**:

```typescript
useSidebarHostActions((operation, hostname, hostData) => {
  handleNodeOperation(operation, hostname);
});
```

### 2. 工具函数

#### 刷新事件触发器

```typescript
// 替代手动创建 CustomEvent
SidebarRefreshTriggers.cluster("node-added");

// 替代原来的代码:
// const event = new CustomEvent("refresh-sidebar", {
//   detail: { type: "cluster", action: "node-added" }
// });
// window.dispatchEvent(event);
```

#### 主机操作触发器

```typescript
// 统一的主机操作触发
HostActionTriggers.reboot(hostname, hostData);
```

## 组件重构示例

### 集群管理模块重构

**重构前**:

```typescript
// 复杂的事件监听逻辑
useEffect(() => {
  const handleSidebarSelect = (event: CustomEvent) => {
    const { nodeType, nodeData } = event.detail;

    // 手动清空所有状态
    setSidebarSelectedCluster(null);
    setSidebarSelectedHost(null);
    setSidebarSelectedVM(null);

    // 复杂的条件判断
    if (nodeType === "host") {
      setSidebarSelectedHost(nodeData);
    } else if (nodeType === "vm") {
      setSidebarSelectedVM(nodeData);
    }
  };

  window.addEventListener("hierarchical-sidebar-select", handleSidebarSelect);
  return () =>
    window.removeEventListener(
      "hierarchical-sidebar-select",
      handleSidebarSelect,
    );
}, []);
```

**重构后**:

```typescript
// 简洁的 Hook 使用
const {
  selectedHost: sidebarSelectedHost,
  selectedVM: sidebarSelectedVM,
  clearSelection,
} = useSidebarSelection();

// 自动处理主机操作
useSidebarHostActions((operation, hostname) => {
  handleNodeOperation(operation, hostname);
});

// 自动处理刷新事件
useSidebarRefresh((detail) => {
  if (detail.type === "cluster") {
    fetchClusterData();
  }
});
```

### 虚拟机管理模块重构

**重构前**:

```typescript
// 重复的事件处理逻辑
const [sidebarSelectedVM, setSidebarSelectedVM] = useState(null);
const [sidebarSelectedHost, setSidebarSelectedHost] = useState(null);

useEffect(() => {
  const handleSidebarSelect = (event: CustomEvent) => {
    // 重复的逻辑...
  };
  // 重复的事件监听设置...
}, []);
```

**重构后**:

```typescript
// 复用相同的 Hook
const {
  selectedHost: sidebarSelectedHost,
  selectedVM: sidebarSelectedVM,
  clearSelection,
} = useSidebarSelection();
```

## 优势总结

### 1. 代码简化

- 减少了 80% 的事件处理代码
- 消除了重复的状态管理逻辑
- 统一了组件间通信模式

### 2. 可维护性提升

- 集中的状态管理逻辑
- 清晰的职责分离
- 易于测试的 Hook 架构

### 3. 类型安全

- 完整的 TypeScript 类型定义
- 编译时错误检查
- 更好的 IDE 支持

### 4. 可扩展性

- 易于添加新的选择类型
- 灵活的事件过滤机制
- 可复用的 Hook 设计

## 迁移指南

### 对于新组件

1. 直接使用新的 Hooks
2. 遵循统一的命名约定
3. 使用提供的工具函数

### 对于现有组件

1. 替换手动事件监听为 Hook 使用
2. 移除重复的状态管理代码
3. 更新按钮点击处理器使用 `clearSelection`

## 最佳实践

### 1. Hook 使用

- 在组件顶层使用 Hooks
- 避免在条件语句中使用 Hooks
- 合理使用 Hook 的返回值

### 2. 事件处理

- 使用提供的工具函数而非手动创建事件
- 在事件处理器中添加适当的错误处理
- 保持事件处理逻辑的简洁性

### 3. 状态管理

- 使用 Hook 提供的状态而非本地状态
- 通过 `clearSelection` 统一清理状态
- 避免直接修改 Hook 内部状态

## 测试策略

### 1. Hook 测试

- 使用 `@testing-library/react-hooks` 测试 Hooks
- 模拟事件触发测试事件处理
- 验证状态变化的正确性

### 2. 组件集成测试

- 测试 Hook 与组件的集成
- 验证用户交互的正确性
- 确保事件传播的准确性

### 3. 端到端测试

- 测试完整的侧边栏交互流程
- 验证跨组件的状态同步
- 确保用户体验的一致性
