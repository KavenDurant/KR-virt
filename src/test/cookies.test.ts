/**
 * Cookie工具类基础测试
 */

import { describe, test, expect, beforeEach, vi } from "vitest";

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
});

// Mock location object
const mockLocationProtocol = {
  protocol: "https:",
};

// 使用vi.stubGlobal来Mock location
vi.stubGlobal("location", mockLocationProtocol);

// 动态导入CookieUtils以避免顶层导入问题
const { CookieUtils } = await import("../utils/cookies");

describe("CookieUtils", () => {
  beforeEach(() => {
    // 清除所有Cookie
    document.cookie = "";
  });

  test("设置和获取Cookie", () => {
    // 设置Cookie
    CookieUtils.set("test_key", "test_value");

    // 获取Cookie
    const value = CookieUtils.get("test_key");
    expect(value).toBe("test_value");
  });

  test("检查Cookie是否存在", () => {
    // 设置Cookie
    CookieUtils.set("existing_key", "value");

    expect(CookieUtils.exists("existing_key")).toBe(true);
    expect(CookieUtils.exists("non_existing_key")).toBe(false);
  });

  test("设置和获取Token", () => {
    const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature";

    // 设置Token
    CookieUtils.setToken(testToken);

    // 获取Token
    const retrievedToken = CookieUtils.getToken();
    expect(retrievedToken).toBe(testToken);
  });

  test("设置和获取用户信息", () => {
    const userInfo = {
      username: "testuser",
      role: "admin",
      permissions: ["*"],
    };

    // 设置用户信息
    CookieUtils.setUser(userInfo);

    // 获取用户信息
    const retrievedUser = CookieUtils.getUser();
    expect(retrievedUser).toEqual(userInfo);
  });

  test("清除认证数据", () => {
    // 设置Token和用户信息
    CookieUtils.setToken("test_token");
    CookieUtils.setUser({ username: "test" });

    // 验证设置成功
    expect(CookieUtils.exists("kr_virt_token")).toBe(true);
    expect(CookieUtils.exists("kr_virt_user")).toBe(true);

    // 清除认证数据
    CookieUtils.clearAuth();

    // 验证清除成功
    expect(CookieUtils.exists("kr_virt_token")).toBe(false);
    expect(CookieUtils.exists("kr_virt_user")).toBe(false);
  });

  test("Token过期检查", () => {
    // 没有Token时应该返回过期
    expect(CookieUtils.isTokenExpired()).toBe(true);

    // 有Token时应该返回未过期
    CookieUtils.setToken("valid_token");
    expect(CookieUtils.isTokenExpired()).toBe(false);
  });

  test("获取所有Cookie", () => {
    // 设置多个Cookie
    CookieUtils.set("key1", "value1");
    CookieUtils.set("key2", "value2");

    const allCookies = CookieUtils.getAll();
    expect(allCookies).toHaveProperty("key1", "value1");
    expect(allCookies).toHaveProperty("key2", "value2");
  });

  test("处理JSON序列化错误", () => {
    // 设置无效的JSON
    document.cookie = "kr_virt_user=invalid_json";

    // 应该返回null而不是抛出错误
    const user = CookieUtils.getUser();
    expect(user).toBeNull();
  });
});
