# 测试环境说明

这个项目已经配置了完整的 Vitest 测试环境，包括以下功能：

## 已安装的测试工具

- **Vitest** - 现代化的测试框架，与 Vite 完美集成
- **@vitest/ui** - 测试界面，提供可视化的测试结果
- **jsdom** - 模拟浏览器环境
- **@testing-library/react** - React 组件测试工具
- **@testing-library/jest-dom** - 额外的 DOM 断言
- **@testing-library/user-event** - 用户交互模拟
- **@vitest/coverage-v8** - 代码覆盖率工具

## 可用的脚本命令

```bash
# 启动监听模式的测试
npm run test

# 启动测试界面
npm run test:ui

# 运行所有测试
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 文件结构

```
src/test/
├── setup.ts              # 测试环境设置
├── test-helpers.ts        # 测试辅助函数
├── utils.test.ts          # 工具函数测试示例
├── components.test.tsx    # 组件测试示例
└── App.test.tsx          # 应用测试示例
```

## 配置文件

- **vitest.config.ts** - Vitest 主配置文件
- **tsconfig.test.json** - 测试专用的 TypeScript 配置

## 测试文件命名规范

测试文件应该遵循以下命名规范：

- `*.test.ts` - 单元测试
- `*.test.tsx` - 组件测试
- `*.spec.ts` - 规格测试
- `*.spec.tsx` - 组件规格测试

## 编写测试的最佳实践

1. **测试文件位置**：测试文件可以放在 `src/test/` 目录下，或者与被测试文件在同一目录
2. **测试描述**：使用中文描述测试用例，便于理解
3. **测试分组**：使用 `describe` 对相关测试进行分组
4. **异步测试**：对于异步操作，使用 `async/await` 或 `waitFor`
5. **模拟数据**：使用 `test-helpers.ts` 中的辅助函数生成测试数据

## 示例测试

### 单元测试示例

```typescript
import { describe, it, expect } from "vitest";

describe("工具函数", () => {
  it("应该正确计算两个数的和", () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

### 组件测试示例

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

describe('Button 组件', () => {
  it('应该正确响应点击事件', () => {
    render(<Button onClick={mockFn}>点击</Button>)
    fireEvent.click(screen.getByText('点击'))
    expect(mockFn).toHaveBeenCalled()
  })
})
```

## 代码覆盖率

运行 `npm run test:coverage` 后，覆盖率报告将生成在 `coverage/` 目录中。你可以打开 `coverage/index.html` 查看详细的覆盖率报告。

## 注意事项

1. 测试环境已经配置了全局的 `describe`、`it`、`expect` 等函数
2. 自动导入了 `@testing-library/jest-dom` 的断言方法
3. 配置了 ResizeObserver 和 matchMedia 的模拟
4. 支持 Less 样式文件的导入和变量
