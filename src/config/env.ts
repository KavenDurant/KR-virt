/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-16 11:30:00
 * @Description: 环境配置工具 - 统一管理环境变量
 */

/**
 * 环境配置类
 */
export class EnvConfig {
  /** 应用标题 */
  static readonly APP_TITLE =
    import.meta.env.VITE_APP_TITLE || "KR-Virt 虚拟化平台";

  /** 应用版本 */
  static readonly APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";

  /** 当前环境 */
  static readonly ENV = import.meta.env.VITE_ENV || "development";

  /** API基础地址 */
  static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

  /** 端口号 */
  static readonly PORT = parseInt(import.meta.env.VITE_PORT) || 3000;

  /** 是否启用Mock数据 */
  static readonly ENABLE_MOCK = import.meta.env.VITE_ENABLE_MOCK === "true";

  /** 是否启用开发工具 */
  static readonly ENABLE_DEV_TOOLS =
    import.meta.env.VITE_ENABLE_DEV_TOOLS === "true";

  /** 是否为开发环境 */
  static readonly IS_DEV = import.meta.env.DEV;

  /** 是否为生产环境 */
  static readonly IS_PROD = import.meta.env.PROD;

  /** 构建版本（编译时注入） */
  static readonly BUILD_VERSION =
    typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "unknown";

  /** 构建时间（编译时注入） */
  static readonly BUILD_TIME =
    typeof __BUILD_TIME__ !== "undefined" ? __BUILD_TIME__ : "unknown";

  /** 构建模式（编译时注入） */
  static readonly BUILD_MODE =
    typeof __BUILD_MODE__ !== "undefined" ? __BUILD_MODE__ : "unknown";

  /**
   * 获取完整的环境信息
   */
  static getEnvInfo() {
    return {
      appTitle: this.APP_TITLE,
      appVersion: this.APP_VERSION,
      env: this.ENV,
      apiBaseUrl: this.API_BASE_URL,
      port: this.PORT,
      enableMock: this.ENABLE_MOCK,
      enableDevTools: this.ENABLE_DEV_TOOLS,
      isDev: this.IS_DEV,
      isProd: this.IS_PROD,
      buildVersion: this.BUILD_VERSION,
      buildTime: this.BUILD_TIME,
      buildMode: this.BUILD_MODE,
    };
  }

  /**
   * 打印环境信息到控制台
   */
  static printEnvInfo() {
    if (!this.IS_PROD) {
      console.group("🌍 环境配置信息");
      console.table(this.getEnvInfo());
      console.groupEnd();
    }
  }

  /**
   * 根据环境返回不同的配置
   */
  static getConfig<T>(devConfig: T, prodConfig: T): T {
    return this.IS_PROD ? prodConfig : devConfig;
  }

  /**
   * Mock数据控制助手
   * @param mockFn Mock数据函数
   * @param apiFn 真实API函数
   * @returns 根据环境变量返回对应的函数结果
   */
  static async mockOrApi<T>(
    mockFn: () => T | Promise<T>,
    apiFn: () => T | Promise<T>,
  ): Promise<T> {
    if (this.ENABLE_MOCK) {
      console.log("🎭 使用Mock数据");
      return await mockFn();
    } else {
      console.log("🌐 使用真实API");
      return await apiFn();
    }
  }
}

// 开发环境自动打印环境信息
if (EnvConfig.IS_DEV) {
  EnvConfig.printEnvInfo();
}

export default EnvConfig;
