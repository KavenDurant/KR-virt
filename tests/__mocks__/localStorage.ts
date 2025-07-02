/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-24 16:48:51
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-24 16:52:13
 * @FilePath: /KR-virt/tests/__mocks__/localStorage.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * localStorage Mock
 * 用于模拟localStorage功能，确保测试环境的一致性
 */

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (_key: string, _value: string) => {
      // 保存值到store
    },
    removeItem: (_key: string) => {
      // 从store移除key
    },
    clear: () => {
      store = {};
    },
    key: (_index: number) => {
      // 返回指定索引的key
      return null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
};

const createSessionStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (_key: string, _value: string) => {
      // 保存值到store
    },
    removeItem: (_key: string) => {
      // 从store移除key
    },
    clear: () => {
      store = {};
    },
    key: (_index: number) => {
      // 返回指定索引的key
      return null;
    },
    get length() {
      return Object.keys(store).length;
  },
  };
};

// 设置全局mock
Object.defineProperty(window, "localStorage", {
  value: createLocalStorageMock(),
});

Object.defineProperty(window, "sessionStorage", {
  value: createSessionStorageMock(),
});

export {};
