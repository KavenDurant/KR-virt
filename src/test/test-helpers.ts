import { vi } from "vitest";

// 通用的mock函数
export const createMockFunction = <T extends (...args: unknown[]) => unknown>(
  implementation?: T
) => {
  return vi.fn(implementation);
};

// 模拟localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// 模拟sessionStorage
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// 设置全局mocks
export const setupGlobalMocks = () => {
  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
  });

  Object.defineProperty(window, "sessionStorage", {
    value: mockSessionStorage,
  });

  // 模拟fetch
  global.fetch = vi.fn();

  // 模拟URL.createObjectURL
  global.URL.createObjectURL = vi.fn();
  global.URL.revokeObjectURL = vi.fn();
};

// 清理所有mocks
export const cleanupMocks = () => {
  vi.clearAllMocks();
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.removeItem.mockClear();
  mockLocalStorage.clear.mockClear();

  mockSessionStorage.getItem.mockClear();
  mockSessionStorage.setItem.mockClear();
  mockSessionStorage.removeItem.mockClear();
  mockSessionStorage.clear.mockClear();
};

// 等待异步操作完成的辅助函数
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// 生成测试数据的辅助函数
export const generateTestUser = (overrides = {}) => ({
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "user",
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const generateTestVM = (overrides = {}) => ({
  id: 1,
  name: "test-vm",
  status: "running",
  cpu: 2,
  memory: 4096,
  disk: 50,
  os: "Ubuntu 20.04",
  ...overrides,
});
