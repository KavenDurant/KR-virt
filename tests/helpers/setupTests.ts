/**
 * 测试环境设置
 * 配置全局测试环境和Mock
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// 导入全局Mock
import '../__mocks__/localStorage';

// 设置全局Mock
(global as any).vi = vi;

// Mock IntersectionObserver
(global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: vi.fn(() => [])
}));

// Mock ResizeObserver
(global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
});

// Mock HTMLElement.scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
});

// Mock HTMLElement.offsetHeight and offsetWidth
Object.defineProperties(HTMLElement.prototype, {
  offsetHeight: {
    get() { return parseFloat(this.style.height) || 1; }
  },
  offsetWidth: {
    get() { return parseFloat(this.style.width) || 1; }
  }
});

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
})) as any;

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'mocked-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
});

// 全局测试配置
beforeEach(() => {
  // 清理所有Mock
  vi.clearAllMocks();
  
  // 重置DOM
  document.body.innerHTML = '';
  
  // 重置localStorage和sessionStorage
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  // 清理定时器
  vi.clearAllTimers();
});

// 全局错误处理
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// 抑制特定的控制台警告
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
     args[0].includes('Warning: componentWillReceiveProps has been renamed'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
