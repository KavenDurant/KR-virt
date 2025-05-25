# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

## 侧边栏拖拽卡顿问题修复总结

🐛 问题原因分析
频繁的 React 状态更新：每次 mousemove 都触发 setSidebarWidth 导致组件重新渲染
频繁的 localStorage 写入：每次拖拽都写入本地存储，造成 I/O 阻塞
useCallback 依赖项问题：handleSidebarResize 依赖 sidebarWidth，导致函数频繁重新创建
CSS 过渡效果干扰：拖拽手柄的 transition 效果在拖拽时造成性能损耗
✅ 优化方案

1. 性能优化的拖拽逻辑
   立即 DOM 更新：直接操作 DOM 样式，提供流畅的视觉反馈
   节流状态更新：使用 16ms 节流（约 60FPS），减少 React 重新渲染
   延迟持久化：仅在拖拽结束时写入 localStorage
2. CSS 性能优化
   移除过渡效果：在拖拽时禁用 transition，提高性能
   扩大响应区域：通过 ::before 伪元素扩大拖拽手柄的响应范围
   拖拽状态样式：添加 .sidebar-dragging 类，禁用文本选择和不必要的事件
3. 函数优化
   移除依赖项：从 useCallback 中移除 sidebarWidth 依赖，避免函数重新创建
   分离关注点：将 DOM 更新和状态更新分离
4. 用户体验优化
   拖拽状态管理：添加 isDragging 状态，在拖拽时应用特殊样式
   防止文本选择：在拖拽时禁用页面文本选择
   // 优化后的拖拽逻辑

```Typescript
const handleMouseMove = (moveEvent: MouseEvent) => {
  const now = Date.now();
  const newWidth = startWidth + (moveEvent.clientX - startX);

  if (newWidth >= 200 && newWidth <= 400) {
    // 1. 立即更新DOM - 流畅视觉反馈
    handleSidebarResize(newWidth, false);

    // 2. 节流更新ref - 减少重新渲染
    if (now - lastUpdateTime > 16) {
      originalWidthRef.current = Math.max(200, Math.min(newWidth, 400));
      lastUpdateTime = now;
    }
  }
};

const handleMouseUp = () => {
  // 3. 拖拽结束时才更新状态和localStorage
  const finalWidth = originalWidthRef.current;
  setSidebarWidth(finalWidth);
  localStorage.setItem("sidebarWidth", finalWidth.toString());
};
```

-- 性能提升

1. 减少重新渲染：从每次 mousemove 重新渲染减少到 60FPS 节流更新
2. 更流畅的视觉反馈：DOM 直接更新，无渲染延迟
3. 减少 I/O 操作：从频繁 localStorage 写入改为拖拽结束时一次性写入（I/O 操作通常是阻塞性的，会暂停程序执行直到操作完成。）
4. 更好的响应性：扩大拖拽区域，更容易抓取
