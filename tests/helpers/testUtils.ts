/**
 * 通用测试工具
 * 提供测试中常用的工具函数和辅助方法
 */

import { vi } from 'vitest';
import { waitFor } from '@testing-library/react';

// 等待异步操作完成
export const waitForAsync = async (timeout: number = 1000) => {
  await waitFor(() => {}, { timeout });
};

// 模拟延迟
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 创建Mock函数
export const createMockFn = <T extends (...args: any[]) => any>(
  implementation?: T
): vi.MockedFunction<T> => {
  return vi.fn(implementation);
};

// 模拟Console方法
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.info = vi.fn();
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  return {
    expectLogToBeCalled: (message?: string) => {
      if (message) {
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining(message));
      } else {
        expect(console.log).toHaveBeenCalled();
      }
    },
    expectErrorToBeCalled: (message?: string) => {
      if (message) {
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining(message));
      } else {
        expect(console.error).toHaveBeenCalled();
      }
    }
  };
};

// 模拟时间
export const mockTime = (date: string | Date = '2024-01-01T00:00:00Z') => {
  const mockDate = new Date(date);
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  return {
    advanceTime: (ms: number) => vi.advanceTimersByTime(ms),
    setTime: (newDate: string | Date) => vi.setSystemTime(new Date(newDate))
  };
};

// 模拟Window对象属性
export const mockWindowProperty = <T>(property: string, value: T) => {
  const originalValue = (window as any)[property];
  
  beforeEach(() => {
    Object.defineProperty(window, property, {
      writable: true,
      value
    });
  });

  afterEach(() => {
    Object.defineProperty(window, property, {
      writable: true,
      value: originalValue
    });
  });
};

// 模拟环境变量
export const mockEnvVar = (key: string, value: string) => {
  const originalValue = import.meta.env[key];
  
  beforeEach(() => {
    import.meta.env[key] = value;
  });

  afterEach(() => {
    if (originalValue !== undefined) {
      import.meta.env[key] = originalValue;
    } else {
      delete import.meta.env[key];
    }
  });
};

// 创建测试用的Promise
export const createTestPromise = <T>() => {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!
  };
};

// 测试错误边界
export const expectToThrow = async (fn: () => void | Promise<void>, errorMessage?: string) => {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (errorMessage) {
      expect(error).toHaveProperty('message', expect.stringContaining(errorMessage));
    }
  }
};

// 生成随机测试数据
export const generateTestData = {
  string: (length: number = 10) => Math.random().toString(36).substring(2, length + 2),
  number: (min: number = 0, max: number = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
  boolean: () => Math.random() > 0.5,
  email: () => `test${Math.random().toString(36).substring(2)}@example.com`,
  url: () => `https://example.com/${Math.random().toString(36).substring(2)}`,
  date: () => new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
};
