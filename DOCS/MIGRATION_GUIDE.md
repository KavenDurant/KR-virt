# 侧边栏交互重构迁移指南

## 快速迁移检查清单

### ✅ 已完成的重构
- [x] 集群管理模块 (`src/pages/Cluster/index.tsx`)
- [x] 虚拟机管理模块 (`src/pages/VirtualMachine/index.tsx`)
- [x] 新的 Hook 架构 (`src/hooks/`)

### 🔄 迁移步骤

#### 1. 导入新的 Hooks
```typescript
// 旧的导入
import { useTheme } from "../../hooks/useTheme";

// 新的导入
import { 
  useSidebarSelection, 
  useSidebarRefresh, 
  useSidebarHostActions,
  SidebarRefreshTriggers,
} from "../../hooks";
```

#### 2. 替换状态管理
```typescript
// 旧的状态管理
const [sidebarSelectedHost, setSidebarSelectedHost] = useState(null);
const [sidebarSelectedVM, setSidebarSelectedVM] = useState(null);
const [sidebarSelectedCluster, setSidebarSelectedCluster] = useState(null);

// 新的状态管理
const {
  selectedHost: sidebarSelectedHost,
  selectedVM: sidebarSelectedVM,
  selectedCluster: sidebarSelectedCluster,
  clearSelection,
} = useSidebarSelection();
```

#### 3. 移除手动事件监听
```typescript
// 删除这些代码块
useEffect(() => {
  const handleSidebarSelect = (event: CustomEvent) => {
    // 复杂的事件处理逻辑...
  };
  
  window.addEventListener("hierarchical-sidebar-select", handleSidebarSelect);
  return () => window.removeEventListener("hierarchical-sidebar-select", handleSidebarSelect);
}, []);
```

#### 4. 添加新的 Hook 使用
```typescript
// 添加刷新事件处理
useSidebarRefresh((detail) => {
  if (detail.type === 'cluster') {
    fetchClusterData();
  }
});

// 添加主机操作处理
useSidebarHostActions((operation, hostname) => {
  handleNodeOperation(operation, hostname);
});
```

#### 5. 更新按钮点击处理器
```typescript
// 旧的处理器
<Button onClick={() => setSidebarSelectedHost(null)}>
  返回
</Button>

// 新的处理器
<Button onClick={() => clearSelection()}>
  返回
</Button>
```

#### 6. 更新事件触发
```typescript
// 旧的事件触发
const refreshEvent = new CustomEvent("refresh-sidebar", {
  detail: { type: "cluster", action: "node-added" }
});
window.dispatchEvent(refreshEvent);

// 新的事件触发
SidebarRefreshTriggers.cluster("node-added");
```

## 常见问题解决

### Q1: 类型错误 - selectedCluster 是 unknown 类型
**解决方案**: 添加类型断言
```typescript
const { selectedCluster } = useSidebarSelection();
const sidebarSelectedCluster = selectedCluster as ClusterData | null;
```

### Q2: 找不到 setSidebarSelectedXXX 函数
**解决方案**: 使用 clearSelection 替代
```typescript
// 错误
setSidebarSelectedHost(null);

// 正确
clearSelection();
```

### Q3: 主机操作类型错误
**解决方案**: 添加类型检查
```typescript
useSidebarHostActions((operation, hostname) => {
  const validOperations = ["reboot", "stop", "enter_maintenance", "exit_maintenance", "migrate"];
  if (validOperations.includes(operation)) {
    handleNodeOperation(operation as ValidOperationType, hostname);
  }
});
```

## 验证重构成功

### 1. 功能验证
- [ ] 侧边栏选择功能正常工作
- [ ] 主机操作从侧边栏正确触发
- [ ] 刷新事件正确传播
- [ ] 返回按钮正确清理状态

### 2. 代码质量验证
- [ ] 没有 TypeScript 错误
- [ ] 没有 ESLint 警告
- [ ] 代码覆盖率保持或提升
- [ ] 性能没有明显下降

### 3. 用户体验验证
- [ ] 界面响应速度正常
- [ ] 状态切换流畅
- [ ] 没有视觉闪烁或异常
- [ ] 所有交互功能完整

## 性能优化建议

### 1. Hook 优化
```typescript
// 使用 useMemo 优化计算
const computedData = useMemo(() => {
  if (!sidebarSelectedHost) return null;
  return processHostData(sidebarSelectedHost);
}, [sidebarSelectedHost]);
```

### 2. 事件处理优化
```typescript
// 使用 useCallback 优化事件处理器
const handleRefresh = useCallback((detail) => {
  if (detail.type === 'cluster') {
    fetchClusterData();
  }
}, [fetchClusterData]);

useSidebarRefresh(handleRefresh);
```

### 3. 条件渲染优化
```typescript
// 避免不必要的重渲染
if (!sidebarSelectedHost) {
  return <DefaultView />;
}

return <HostDetailView host={sidebarSelectedHost} />;
```

## 调试技巧

### 1. Hook 状态调试
```typescript
// 添加调试日志
const selection = useSidebarSelection();
console.log('Sidebar selection state:', selection);
```

### 2. 事件流调试
```typescript
// 在事件处理器中添加日志
useSidebarRefresh((detail) => {
  console.log('Refresh event received:', detail);
  // 处理逻辑...
});
```

### 3. 性能调试
```typescript
// 使用 React DevTools Profiler
// 监控组件重渲染频率
```

## 后续维护

### 1. 添加新的选择类型
1. 在 `useSidebarSelection` 中添加新的状态
2. 更新类型定义
3. 添加相应的选择方法

### 2. 扩展事件类型
1. 在相应的 Hook 中添加新的事件处理
2. 更新工具函数
3. 添加类型定义

### 3. 性能监控
1. 定期检查 Hook 性能
2. 监控事件处理效率
3. 优化重渲染频率

## 回滚计划

如果需要回滚到旧架构：

### 1. 保留的备份
- 旧的事件处理逻辑已注释保留
- Git 历史记录完整
- 可以快速恢复

### 2. 回滚步骤
1. 恢复手动事件监听
2. 恢复本地状态管理
3. 移除新的 Hook 使用
4. 恢复旧的事件触发方式

### 3. 风险评估
- 回滚风险：低
- 数据丢失风险：无
- 功能影响：无
