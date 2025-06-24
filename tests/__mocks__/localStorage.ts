/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-24 16:48:51
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-24 16:52:13
 * @FilePath: /KR-virt/tests/__mocks__/localStorage.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 浏览器API Mock
 * 用于模拟localStorage、sessionStorage等浏览器API
 */
import { vi } from "vitest";
// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => null),
  setItem: vi.fn((key: string, value: string) => {}),
  removeItem: vi.fn((key: string) => {}),
  clear: vi.fn(() => {}),
  length: 0,
  key: vi.fn((index: number) => null),
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn((key: string) => null),
  setItem: vi.fn((key: string, value: string) => {}),
  removeItem: vi.fn((key: string) => {}),
  clear: vi.fn(() => {}),
  length: 0,
  key: vi.fn((index: number) => null),
};

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
});

// Mock window.location
Object.defineProperty(window, "location", {
  writable: true,
  value: {
    href: "http://localhost:3000",
    origin: "http://localhost:3000",
    pathname: "/",
    search: "",
    hash: "",
    reload: vi.fn(),
    assign: vi.fn(),
    replace: vi.fn(),
  },
});

// 导出Mock对象
export { localStorageMock, sessionStorageMock };

// 全局设置
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});
