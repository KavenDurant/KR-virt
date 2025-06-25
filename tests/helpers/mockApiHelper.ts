/**
 * API Mock辅助函数
 * 提供API调用的Mock工具和辅助函数
 */

import { vi } from "vitest";
import type { StandardResponse } from "@/utils/apiHelper";

// Mock API响应生成器
export const createMockResponse = <T>(
  data: T,
  success: boolean = true,
  message: string = "操作成功"
): StandardResponse<T> => ({
  success,
  data,
  message,
});

// Mock API错误响应生成器
export const createMockErrorResponse = (
  message: string = "操作失败",
  status: number = 500
): StandardResponse => ({
  success: false,
  message,
  status,
});

// Mock API Helper类
export class MockApiHelper {
  // Mock GET请求
  static mockGet = vi.fn();

  // Mock POST请求
  static mockPost = vi.fn();

  // Mock PUT请求
  static mockPut = vi.fn();

  // Mock DELETE请求
  static mockDelete = vi.fn();

  // Mock PATCH请求
  static mockPatch = vi.fn();

  // 重置所有Mock
  static resetAllMocks() {
    this.mockGet.mockReset();
    this.mockPost.mockReset();
    this.mockPut.mockReset();
    this.mockDelete.mockReset();
    this.mockPatch.mockReset();
  }

  // 设置成功响应
  static mockSuccessResponse<T>(
    method: "get" | "post" | "put" | "delete" | "patch",
    data: T
  ) {
    const mockMethod =
      this[`mock${method.charAt(0).toUpperCase() + method.slice(1)}`];
    mockMethod.mockResolvedValue(createMockResponse(data));
  }

  // 设置错误响应
  static mockErrorResponse(
    method: "get" | "post" | "put" | "delete" | "patch",
    message: string,
    status: number = 500
  ) {
    const mockMethod =
      this[`mock${method.charAt(0).toUpperCase() + method.slice(1)}`];
    mockMethod.mockRejectedValue(createMockErrorResponse(message, status));
  }

  // 设置网络错误
  static mockNetworkError(method: "get" | "post" | "put" | "delete" | "patch") {
    const mockMethod =
      this[`mock${method.charAt(0).toUpperCase() + method.slice(1)}`];
    mockMethod.mockRejectedValue(new Error("Network Error"));
  }
}

// Mock服务类生成器
export const createMockService = (_serviceName: string) => {
  const mockMethods: Record<string, any> = {};

  return new Proxy(mockMethods, {
    get(target, prop) {
      if (typeof prop === "string") {
        if (!target[prop]) {
          target[prop] = vi.fn();
        }
        return target[prop];
      }
      return undefined;
    },
  });
};

// 常用的Mock响应模板
export const mockResponseTemplates = {
  // 成功响应
  success: <T>(data: T) => createMockResponse(data, true, "操作成功"),

  // 创建成功
  created: <T>(data: T) => createMockResponse(data, true, "创建成功"),

  // 更新成功
  updated: <T>(data: T) => createMockResponse(data, true, "更新成功"),

  // 删除成功
  deleted: () => createMockResponse(null, true, "删除成功"),

  // 验证错误
  validationError: (_errors: Record<string, string[]>) =>
    createMockErrorResponse("验证失败", 422),

  // 未授权
  unauthorized: () => createMockErrorResponse("未授权访问", 401),

  // 禁止访问
  forbidden: () => createMockErrorResponse("权限不足", 403),

  // 资源不存在
  notFound: () => createMockErrorResponse("资源不存在", 404),

  // 服务器错误
  serverError: () => createMockErrorResponse("服务器内部错误", 500),
};
