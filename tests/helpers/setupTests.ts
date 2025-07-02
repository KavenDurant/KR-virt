/**
 * 测试环境配置
 * 配置测试环境的全局设置和Mock
 */

import { vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";

// Mock console方法以避免测试时的日志输出
const originalConsole = {
  warn: console.warn,
  error: console.error,
  log: console.log,
};

// Mock全局对象
(global as Record<string, unknown>).fetch = vi.fn();
(global as Record<string, unknown>).ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
(global as Record<string, unknown>).IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock MediaQueryList
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
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

// Mock URL.createObjectURL
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "mock-object-url"),
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
});

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock window.scrollTo
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

// Mock Element.scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock requestAnimationFrame
Object.defineProperty(window, "requestAnimationFrame", {
  writable: true,
  value: vi.fn((callback: FrameRequestCallback) => {
    setTimeout(callback, 16);
    return 1;
  }),
});

// Mock cancelAnimationFrame
Object.defineProperty(window, "cancelAnimationFrame", {
  writable: true,
  value: vi.fn(),
});

// Mock getComputedStyle
Object.defineProperty(window, "getComputedStyle", {
  writable: true,
  value: vi.fn(() => ({
    getPropertyValue: vi.fn(() => ""),
  })),
});

// Mock document.createRange
document.createRange = vi.fn(() => ({
  setStart: vi.fn(),
  setEnd: vi.fn(),
  selectNodeContents: vi.fn(),
  cloneContents: vi.fn(),
  deleteContents: vi.fn(),
  insertNode: vi.fn(),
  surroundContents: vi.fn(),
  compareBoundaryPoints: vi.fn(),
  collapse: vi.fn(),
  detach: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: vi.fn(),
  })),
  getClientRects: vi.fn(() => ({
    length: 0,
    item: vi.fn(),
    [Symbol.iterator]: vi.fn(),
  })),
  startContainer: document.body,
  endContainer: document.body,
  startOffset: 0,
  endOffset: 0,
  collapsed: false,
  commonAncestorContainer: document.body,
})) as Range;

// Mock WebSocket
(global as Record<string, unknown>).WebSocket = vi.fn(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}));

// Mock performance
Object.defineProperty(window, "performance", {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  },
});

// 测试钩子
beforeEach(() => {
  // 清理所有mock
  vi.clearAllMocks();

  // 重置console
  console.warn = vi.fn();
  console.error = vi.fn();
  console.log = vi.fn();

  // 重置DOM
  document.body.innerHTML = "";
  document.head.innerHTML = "";
});

afterEach(() => {
  // 恢复console
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.log = originalConsole.log;

  // 清理定时器
  vi.useRealTimers();
});

// 导出常用的测试工具
export const mockConsoleMethod = (
  method: "log" | "warn" | "error",
): jest.MockedFunction<(...args: unknown[]) => void> => {
  return console[method] as jest.MockedFunction<(...args: unknown[]) => void>;
};

export const mockFetch = (response: Response | Promise<Response>) => {
  (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
    response instanceof Promise ? await response : response,
  );
};

export const createMockResponse = (
  data: unknown,
  options: ResponseInit = {},
): Response => {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
};

// 通用的测试数据工厂
export const createTestData = {
  user: (overrides: Record<string, unknown> = {}) => ({
    id: "1",
    username: "testuser",
    email: "test@example.com",
    role: "user",
    ...overrides,
  }),
  
  response: <T>(data: T, overrides: Record<string, unknown> = {}) => ({
    success: true,
    data,
    message: "Success",
    ...overrides,
  }),
};
