/**
 * Vitest全局类型声明
 * 提供vi、describe、it、expect等全局函数的类型支持
 */

/// <reference types="vitest/globals" />

declare global {
  const vi: typeof import("vitest").vi;
}

export {};
