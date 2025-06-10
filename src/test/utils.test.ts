import { describe, it, expect } from "vitest";

// 示例：测试一个简单的工具函数
function add(a: number, b: number): number {
  return a + b;
}

function multiply(a: number, b: number): number {
  return a * b;
}

describe("数学工具函数", () => {
  describe("add 函数", () => {
    it("应该正确计算两个正数的和", () => {
      expect(add(2, 3)).toBe(5);
      expect(add(1, 1)).toBe(2);
    });

    it("应该正确处理负数", () => {
      expect(add(-2, 3)).toBe(1);
      expect(add(-1, -1)).toBe(-2);
    });

    it("应该正确处理零", () => {
      expect(add(0, 5)).toBe(5);
      expect(add(0, 0)).toBe(0);
    });
  });

  describe("multiply 函数", () => {
    it("应该正确计算两个数的乘积", () => {
      expect(multiply(2, 3)).toBe(6);
      expect(multiply(4, 5)).toBe(20);
    });

    it("应该正确处理零", () => {
      expect(multiply(0, 5)).toBe(0);
      expect(multiply(10, 0)).toBe(0);
    });
  });
});
