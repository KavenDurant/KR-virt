import axios, { type AxiosError, type AxiosInstance } from "axios";
import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { message } from "antd";

// 环境配置
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// 扩展的请求配置接口
export interface RequestConfig extends AxiosRequestConfig {
  /** 是否显示错误提示 */
  showErrorMessage?: boolean;
  /** 是否显示成功提示 */
  showSuccessMessage?: boolean;
  /** 自定义成功提示 */
  successMessage?: string;
  /** 跳过认证 */
  skipAuth?: boolean;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 自定义错误处理 */
  customErrorHandler?: (error: ApiError) => void;
  /** 请求重试次数 */
  retryCount?: number;
  /** 重试延迟 */
  retryDelay?: number;
}

// 通用响应接口（用于包装响应数据）
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, unknown>;
  config: AxiosRequestConfig;
}

// 错误响应数据接口
interface ErrorResponseData {
  message?: string;
  error?: string;
  errors?: string[] | Record<string, string[]>;
  [key: string]: unknown;
}

// 错误响应接口
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: ErrorResponseData;
  timestamp?: string;
}

// 请求队列管理
class RequestQueue {
  private static pendingRequests = new Map<string, AbortController>();

  static add(key: string, controller: AbortController): void {
    this.pendingRequests.set(key, controller);
  }

  static remove(key: string): void {
    this.pendingRequests.delete(key);
  }

  static cancel(key: string): void {
    const controller = this.pendingRequests.get(key);
    if (controller) {
      controller.abort();
      this.remove(key);
    }
  }

  static cancelAll(): void {
    this.pendingRequests.forEach((controller) => controller.abort());
    this.pendingRequests.clear();
  }
}

// Token 管理
class TokenManager {
  private static readonly TOKEN_KEY = "kr_virt_token";
  private static readonly REFRESH_TOKEN_KEY = "kr_virt_refresh_token";
  private static readonly TOKEN_EXPIRES_KEY = "kr_virt_token_expires";
  private static refreshPromise: Promise<string> | null = null;

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string, expiresIn?: number): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (expiresIn) {
      const expiresAt = Date.now() + expiresIn * 1000;
      localStorage.setItem(this.TOKEN_EXPIRES_KEY, expiresAt.toString());
    }
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRES_KEY);
    this.refreshPromise = null;
  }

  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // 检查存储的过期时间
      const expiresAt = localStorage.getItem(this.TOKEN_EXPIRES_KEY);
      if (expiresAt && parseInt(expiresAt) < Date.now()) {
        return false;
      }

      // JWT token 格式检查
      const parts = token.split(".");
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  static async refreshTokenIfNeeded(): Promise<string | null> {
    if (this.isTokenValid()) {
      return this.getToken();
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    // 防止并发刷新
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      return newToken;
    } catch {
      this.refreshPromise = null;
      this.clearTokens();
      throw new Error("Token refresh failed");
    }
  }

  private static async performTokenRefresh(
    refreshToken: string
  ): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, expiresIn } = response.data;
      this.setToken(accessToken, expiresIn);

      return accessToken;
    } catch {
      throw new Error("Token refresh failed");
    }
  }
}

// 加载状态管理
class LoadingManager {
  private static loadingCount = 0;
  private static callbacks: Array<(loading: boolean) => void> = [];

  static subscribe(callback: (loading: boolean) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  static start(): void {
    this.loadingCount++;
    if (this.loadingCount === 1) {
      this.notifyCallbacks(true);
    }
  }

  static end(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      this.notifyCallbacks(false);
    }
  }

  private static notifyCallbacks(loading: boolean): void {
    this.callbacks.forEach((callback) => callback(loading));
  }
}

// HTTP状态码映射
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: "请求参数错误",
  401: "未授权，请重新登录",
  403: "权限不足",
  404: "请求的资源不存在",
  405: "请求方法不被允许",
  408: "请求超时",
  409: "数据冲突",
  410: "请求的资源已被永久删除",
  422: "数据验证失败",
  429: "请求过于频繁，请稍后重试",
  500: "服务器内部错误",
  501: "服务器不支持该功能",
  502: "网关错误",
  503: "服务不可用",
  504: "网关超时",
  505: "HTTP版本不受支持",
};

// 重试配置
interface RetryConfig {
  count: number;
  delay: number;
  condition?: (error: AxiosError) => boolean;
}

// 默认重试条件
const defaultRetryCondition = (error: AxiosError): boolean => {
  return (
    !error.response ||
    error.response.status >= 500 ||
    error.code === "ECONNABORTED" ||
    error.code === "NETWORK_ERROR"
  );
};

// 重试函数
const retryRequest = async (
  axiosInstance: AxiosInstance,
  config: InternalAxiosRequestConfig & RequestConfig,
  retryConfig: RetryConfig
): Promise<AxiosResponse> => {
  let lastError: AxiosError | undefined;

  for (let attempt = 0; attempt <= retryConfig.count; attempt++) {
    try {
      if (attempt > 0) {
        // 等待重试延迟
        await new Promise((resolve) =>
          setTimeout(resolve, retryConfig.delay * attempt)
        );

        if (isDevelopment) {
          console.log(
            `🔄 Retrying request (${attempt}/${
              retryConfig.count
            }): ${config.method?.toUpperCase()} ${config.url}`
          );
        }
      }

      return await axiosInstance.request(config);
    } catch (error) {
      lastError = error as AxiosError;

      // 检查是否应该重试
      if (attempt >= retryConfig.count || !retryConfig.condition?.(lastError)) {
        break;
      }
    }
  }

  throw lastError;
};

// 创建 axios 实例
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30秒超时
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    // 允许跨域携带cookie
    withCredentials: false,
  });

  // 请求拦截器
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const customConfig = config as InternalAxiosRequestConfig & RequestConfig;

      // 生成请求唯一标识
      const requestId = Math.random().toString(36).substr(2, 9);
      config.headers["X-Request-ID"] = requestId;

      // 添加到请求队列
      const abortController = new AbortController();
      config.signal = abortController.signal;
      RequestQueue.add(requestId, abortController);

      // 处理认证
      if (!customConfig.skipAuth) {
        try {
          const token = await TokenManager.refreshTokenIfNeeded();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch {
          // Token刷新失败，跳转到登录页
          window.location.href = "/login";
          return Promise.reject(new Error("Authentication failed"));
        }
      }

      // 处理请求参数（过滤空值）
      if (config.method === "get" && config.params) {
        const filteredParams: Record<string, unknown> = {};
        Object.keys(config.params).forEach((key) => {
          const value = config.params[key];
          if (value !== null && value !== undefined && value !== "") {
            filteredParams[key] = value;
          }
        });
        config.params = filteredParams;
      }

      // 显示加载状态
      if (customConfig.showLoading !== false) {
        LoadingManager.start();
      }

      // 开发环境下打印请求信息
      if (isDevelopment) {
        console.group(
          `🚀 API Request [${requestId}]: ${config.method?.toUpperCase()} ${
            config.url
          }`
        );
        console.log("Config:", config);
        console.log("Headers:", config.headers);
        console.log("Data:", config.data);
        console.log("Params:", config.params);
        console.groupEnd();
      }

      return config;
    },
    (error: AxiosError) => {
      console.error("Request Configuration Error:", error);
      message.error("请求配置错误");
      LoadingManager.end();
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
      const customConfig = response.config as AxiosRequestConfig &
        RequestConfig;
      const requestId = response.config.headers["X-Request-ID"] as string;

      // 从请求队列中移除
      if (requestId) {
        RequestQueue.remove(requestId);
      }

      // 结束加载状态
      if (customConfig.showLoading !== false) {
        LoadingManager.end();
      }

      // 开发环境下打印响应信息
      if (isDevelopment) {
        console.group(
          `✅ API Response [${requestId}]: ${response.config.method?.toUpperCase()} ${
            response.config.url
          }`
        );
        console.log("Status:", response.status);
        console.log("Headers:", response.headers);
        console.log("Data:", response.data);
        console.groupEnd();
      }

      // 显示成功消息
      if (customConfig.showSuccessMessage) {
        const successMsg = customConfig.successMessage || "操作成功";
        message.success(successMsg);
      }

      // 直接返回原始响应，在 createRequest 函数中进行包装
      return response;
    },
    async (error: AxiosError) => {
      const customConfig = error.config as
        | (AxiosRequestConfig & RequestConfig)
        | undefined;
      const requestId = error.config?.headers?.["X-Request-ID"] as string;

      // 从请求队列中移除
      if (requestId) {
        RequestQueue.remove(requestId);
      }

      // 结束加载状态
      if (customConfig?.showLoading !== false) {
        LoadingManager.end();
      }

      // 开发环境下打印错误信息
      if (isDevelopment) {
        console.group(
          `❌ API Error [${requestId}]: ${error.config?.method?.toUpperCase()} ${
            error.config?.url
          }`
        );
        console.log("Error:", error);
        console.log("Response:", error.response);
        console.groupEnd();
      }

      // 处理重试逻辑
      if (customConfig?.retryCount && customConfig.retryCount > 0) {
        try {
          const retryConfig: RetryConfig = {
            count: customConfig.retryCount,
            delay: customConfig.retryDelay || 1000,
            condition: defaultRetryCondition,
          };

          return await retryRequest(
            instance,
            error.config as InternalAxiosRequestConfig & RequestConfig,
            retryConfig
          );
        } catch {
          // 重试失败，继续处理原始错误
        }
      }

      let errorMessage = "网络错误，请稍后重试";
      let errorCode = "NETWORK_ERROR";
      let errorDetails: ErrorResponseData | undefined;

      if (error.response) {
        const { status, data } = error.response;
        errorDetails = data as ErrorResponseData;

        // 根据状态码处理
        switch (status) {
          case 401:
            // Token过期或无效
            TokenManager.clearTokens();
            errorMessage = "登录已过期，请重新登录";
            // 延迟跳转，避免影响当前错误处理
            setTimeout(() => {
              window.location.href = "/login";
            }, 1500);
            break;

          case 403:
            errorMessage = "权限不足，无法访问该资源";
            break;

          case 422:
            // 验证错误处理
            errorMessage = "数据验证失败";
            if (errorDetails?.message) {
              errorMessage = errorDetails.message;
            } else if (errorDetails?.errors) {
              if (Array.isArray(errorDetails.errors)) {
                errorMessage = errorDetails.errors.join(", ");
              } else if (typeof errorDetails.errors === "object") {
                const fieldErrors = Object.entries(errorDetails.errors)
                  .map(
                    ([field, msgs]) =>
                      `${field}: ${
                        Array.isArray(msgs) ? msgs.join(", ") : msgs
                      }`
                  )
                  .join("; ");
                errorMessage = fieldErrors || errorMessage;
              }
            }
            break;

          default:
            errorMessage =
              HTTP_STATUS_MESSAGES[status] || `请求失败 (${status})`;

            // 尝试从响应中获取错误信息
            if (errorDetails) {
              if (typeof errorDetails === "string") {
                errorMessage = errorDetails;
              } else if (errorDetails.message) {
                errorMessage = errorDetails.message;
              } else if (errorDetails.error) {
                errorMessage = errorDetails.error;
              }
            }
        }

        errorCode = `HTTP_${status}`;
      } else if (error.request) {
        // 网络错误
        if (error.code === "ECONNABORTED") {
          errorMessage = "请求超时，请检查网络连接";
          errorCode = "TIMEOUT";
        } else if (error.code === "ERR_NETWORK") {
          errorMessage = "网络连接失败，请检查网络设置";
          errorCode = "NETWORK_ERROR";
        } else {
          errorMessage = "网络连接异常";
          errorCode = error.code || "NETWORK_ERROR";
        }
      } else if (error.message === "Authentication failed") {
        errorMessage = "身份验证失败";
        errorCode = "AUTH_FAILED";
      }

      const apiError: ApiError = {
        message: errorMessage,
        status: error.response?.status,
        code: errorCode,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      };

      // 自定义错误处理
      if (customConfig?.customErrorHandler) {
        customConfig.customErrorHandler(apiError);
      } else if (customConfig?.showErrorMessage !== false) {
        // 显示错误消息
        message.error(errorMessage);
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// 创建实例
const request = createAxiosInstance();

// 请求方法类型定义
type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// 通用请求函数
const createRequest = <T = unknown>(
  method: RequestMethod,
  url: string,
  data?: unknown,
  config?: RequestConfig
): Promise<ApiResponse<T>> => {
  const requestConfig: AxiosRequestConfig = {
    method: method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete",
    url,
    ...config,
  };

  if (method === "GET") {
    requestConfig.params = data;
  } else {
    requestConfig.data = data;
  }

  return request(requestConfig).then((response) => ({
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Record<string, unknown>,
    config: response.config,
  }));
};

// 导出便捷方法
export const http = {
  // GET 请求
  get: <T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => createRequest<T>("GET", url, params, config),

  // POST 请求
  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => createRequest<T>("POST", url, data, config),

  // PUT 请求
  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => createRequest<T>("PUT", url, data, config),

  // PATCH 请求
  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> => createRequest<T>("PATCH", url, data, config),

  // DELETE 请求
  delete: <T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> =>
    createRequest<T>("DELETE", url, undefined, config),

  // 文件上传
  upload: <T = unknown>(
    url: string,
    formData: FormData,
    config?: RequestConfig,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> =>
    request.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress
        ? (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            onProgress(progress);
          }
        : undefined,
    }),

  // 文件下载
  download: async (
    url: string,
    filename?: string,
    config?: RequestConfig,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    const response = await request.get(url, {
      ...config,
      responseType: "blob",
      onDownloadProgress: onProgress
        ? (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            onProgress(progress);
          }
        : undefined,
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || `download_${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // 并发请求
  all: <T extends readonly unknown[] | []>(
    requests: T
  ): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> =>
    Promise.all(requests),

  // 请求竞速
  race: <T extends readonly unknown[] | []>(
    requests: T
  ): Promise<Awaited<T[number]>> => Promise.race(requests),

  // 取消所有请求
  cancelAll: (): void => {
    RequestQueue.cancelAll();
  },

  // 取消特定请求
  cancel: (requestId: string): void => {
    RequestQueue.cancel(requestId);
  },
};

// 导出工具类和类型
export { TokenManager, LoadingManager, RequestQueue, type ErrorResponseData };

// 默认导出
export default request;
