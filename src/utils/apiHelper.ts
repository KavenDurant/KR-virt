/**
 * API 调用辅助工具
 * 提供统一的 API 调用方法，简化服务层代码
 */

import {
  http,
  type RequestConfig,
  type ApiError,
} from "./request";

// 标准响应格式
export interface StandardResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
}

// API 配置选项
export interface ApiOptions extends RequestConfig {
  /** 成功时的默认消息 */
  defaultSuccessMessage?: string;
  /** 失败时的默认消息 */
  defaultErrorMessage?: string;
  /** 是否返回原始响应数据 */
  returnRawData?: boolean;
}

/**
 * 统一的 API 调用工具类
 */
export class ApiHelper {
  /**
   * GET 请求
   */
  static async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    options: ApiOptions = {}
  ): Promise<StandardResponse<T>> {
    const {
      defaultSuccessMessage = "获取数据成功",
      defaultErrorMessage = "获取数据失败",
      returnRawData = false,
      ...requestConfig
    } = options;

    try {
      const response = await http.get<T>(url, params, {
        showErrorMessage: false, // 我们自己处理错误
        ...requestConfig,
      });

      const data = returnRawData ? response.data : (response.data as T);

      return {
        success: true,
        data,
        message: defaultSuccessMessage,
      };
    } catch (error) {
      return this.handleError(error as ApiError, defaultErrorMessage);
    }
  }

  /**
   * POST 请求
   */
  static async post<T = unknown>(
    url: string,
    data?: unknown,
    options: ApiOptions = {}
  ): Promise<StandardResponse<T>> {
    const {
      defaultSuccessMessage = "操作成功",
      defaultErrorMessage = "操作失败",
      returnRawData = false,
      ...requestConfig
    } = options;

    try {
      const response = await http.post<T>(url, data, {
        showErrorMessage: false,
        ...requestConfig,
      });

      const responseData = returnRawData
        ? response.data
        : (response.data as T);

      return {
        success: true,
        data: responseData,
        message: defaultSuccessMessage,
      };
    } catch (error) {
      return this.handleError(error as ApiError, defaultErrorMessage);
    }
  }

  /**
   * PUT 请求
   */
  static async put<T = unknown>(
    url: string,
    data?: unknown,
    options: ApiOptions = {}
  ): Promise<StandardResponse<T>> {
    const {
      defaultSuccessMessage = "更新成功",
      defaultErrorMessage = "更新失败",
      returnRawData = false,
      ...requestConfig
    } = options;

    try {
      const response = await http.put<T>(url, data, {
        showErrorMessage: false,
        ...requestConfig,
      });

      const responseData = returnRawData
        ? response.data
        : (response.data as T);

      return {
        success: true,
        data: responseData,
        message: defaultSuccessMessage,
      };
    } catch (error) {
      return this.handleError(error as ApiError, defaultErrorMessage);
    }
  }

  /**
   * DELETE 请求
   */
  static async delete<T = unknown>(
    url: string,
    options: ApiOptions = {}
  ): Promise<StandardResponse<T>> {
    const {
      defaultSuccessMessage = "删除成功",
      defaultErrorMessage = "删除失败",
      returnRawData = false,
      ...requestConfig
    } = options;

    try {
      const response = await http.delete<T>(url, {
        showErrorMessage: false,
        ...requestConfig,
      });

      const responseData = returnRawData
        ? response.data
        : (response.data as T);

      return {
        success: true,
        data: responseData,
        message: defaultSuccessMessage,
      };
    } catch (error) {
      return this.handleError(error as ApiError, defaultErrorMessage);
    }
  }

  /**
   * 统一错误处理
   */
  private static handleError<T>(
    error: ApiError,
    defaultMessage: string
  ): StandardResponse<T> {
    // request.ts 已经处理了错误显示，这里只需要返回统一格式
    return {
      success: false,
      message: error.message || defaultMessage,
    };
  }

  /**
   * 批量请求（并发）
   */
  static async all<T extends readonly unknown[] | []>(
    requests: T
  ): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
    return http.all(requests);
  }

  /**
   * 请求竞速
   */
  static async race<T extends readonly unknown[] | []>(
    requests: T
  ): Promise<Awaited<T[number]>> {
    return http.race(requests);
  }

  /**
   * 文件上传
   */
  static async upload<T = unknown>(
    url: string,
    formData: FormData,
    options: ApiOptions & { onProgress?: (progress: number) => void } = {}
  ): Promise<StandardResponse<T>> {
    const {
      defaultSuccessMessage = "上传成功",
      defaultErrorMessage = "上传失败",
      onProgress,
      ...requestConfig
    } = options;

    try {
      const response = await http.upload<T>(
        url,
        formData,
        {
          showErrorMessage: false,
          ...requestConfig,
        },
        onProgress
      );

      return {
        success: true,
        data: response.data,
        message: defaultSuccessMessage,
      };
    } catch (error) {
      return this.handleError(error as ApiError, defaultErrorMessage);
    }
  }

  /**
   * 文件下载
   */
  static async download(
    url: string,
    filename?: string,
    options: ApiOptions & { onProgress?: (progress: number) => void } = {}
  ): Promise<StandardResponse<void>> {
    const {
      defaultSuccessMessage = "下载成功",
      defaultErrorMessage = "下载失败",
      onProgress,
      ...requestConfig
    } = options;

    try {
      await http.download(
        url,
        filename,
        {
          showErrorMessage: false,
          ...requestConfig,
        },
        onProgress
      );

      return {
        success: true,
        message: defaultSuccessMessage,
      };
    } catch (error) {
      return this.handleError(error as ApiError, defaultErrorMessage);
    }
  }
}

/**
 * 便捷的导出方法
 */
export const api = ApiHelper;

/**
 * 专门用于 Mock 模式的 API 调用
 * 可以根据环境变量自动选择真实 API 或 Mock 数据
 */
export class MockableApiHelper extends ApiHelper {
  /**
   * 可 Mock 的 GET 请求
   */
  static async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    options: ApiOptions & {
      mockData?: T;
      useMock?: boolean;
    } = {}
  ): Promise<StandardResponse<T>> {
    const { mockData, useMock, ...apiOptions } = options;

    // 如果启用 Mock 且提供了 Mock 数据
    if ((useMock || process.env.NODE_ENV === "development") && mockData) {
      // 模拟网络延迟
      await new Promise((resolve) =>
        setTimeout(resolve, 300 + Math.random() * 700)
      );

      return {
        success: true,
        data: mockData,
        message: apiOptions.defaultSuccessMessage || "获取数据成功",
      };
    }

    return super.get<T>(url, params, apiOptions);
  }

  /**
   * 可 Mock 的 POST 请求
   */
  static async post<T = unknown>(
    url: string,
    data?: unknown,
    options: ApiOptions & {
      mockData?: T;
      useMock?: boolean;
    } = {}
  ): Promise<StandardResponse<T>> {
    const { mockData, useMock, ...apiOptions } = options;

    if ((useMock || process.env.NODE_ENV === "development") && mockData) {
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 1000)
      );

      return {
        success: true,
        data: mockData,
        message: apiOptions.defaultSuccessMessage || "操作成功",
      };
    }

    return super.post<T>(url, data, apiOptions);
  }
}

export const mockApi = MockableApiHelper;
