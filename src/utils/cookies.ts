/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-12 14:30:00
 * @Description: Cookie工具类 - 用于安全地存储Token和其他敏感信息
 */

/**
 * Cookie配置选项
 */
export interface CookieOptions {
  expires?: Date | number; // 过期时间
  maxAge?: number; // 最大有效期（秒）
  domain?: string; // 域名
  path?: string; // 路径
  secure?: boolean; // 仅HTTPS
  httpOnly?: boolean; // 仅HTTP（服务端设置）
  sameSite?: "strict" | "lax" | "none"; // SameSite策略
}

/**
 * 默认的安全Cookie配置
 */
const DEFAULT_SECURE_OPTIONS: CookieOptions = {
  path: "/",
  secure: location.protocol === "https:", // 生产环境使用HTTPS
  sameSite: "lax",
  maxAge: 24 * 60 * 60, // 24小时
};

/**
 * Token专用的安全Cookie配置
 */
const TOKEN_COOKIE_OPTIONS: CookieOptions = {
  ...DEFAULT_SECURE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60, // 7天
  sameSite: "strict", // 更严格的策略
};

/**
 * Cookie工具类
 */
export class CookieUtils {
  /**
   * 设置Cookie
   */
  static set(name: string, value: string, options: CookieOptions = {}): void {
    try {
      const finalOptions = { ...DEFAULT_SECURE_OPTIONS, ...options };
      let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(
        value,
      )}`;

      // 设置过期时间
      if (finalOptions.expires) {
        const expires =
          finalOptions.expires instanceof Date
            ? finalOptions.expires
            : new Date(Date.now() + finalOptions.expires * 1000);
        cookieString += `; expires=${expires.toUTCString()}`;
      }

      // 设置最大有效期
      if (finalOptions.maxAge) {
        cookieString += `; max-age=${finalOptions.maxAge}`;
      }

      // 设置域名
      if (finalOptions.domain) {
        cookieString += `; domain=${finalOptions.domain}`;
      }

      // 设置路径
      if (finalOptions.path) {
        cookieString += `; path=${finalOptions.path}`;
      }

      // 设置安全标志
      if (finalOptions.secure) {
        cookieString += `; secure`;
      }

      // 设置SameSite策略
      if (finalOptions.sameSite) {
        cookieString += `; samesite=${finalOptions.sameSite}`;
      }

      document.cookie = cookieString;

      console.log(`🍪 Cookie已设置: ${name}`);
    } catch (error) {
      console.error("设置Cookie失败:", error);
      throw new Error(`设置Cookie失败: ${error}`);
    }
  }

  /**
   * 获取Cookie
   */
  static get(name: string): string | null {
    try {
      const encodedName = encodeURIComponent(name);
      const cookies = document.cookie.split(";");

      for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split("=");
        if (cookieName === encodedName) {
          return decodeURIComponent(cookieValue);
        }
      }

      return null;
    } catch (error) {
      console.error("获取Cookie失败:", error);
      return null;
    }
  }

  /**
   * 删除Cookie
   */
  static remove(name: string, options: Partial<CookieOptions> = {}): void {
    try {
      const removeOptions = {
        ...options,
        expires: new Date(0), // 设置为过期
        maxAge: 0,
      };

      this.set(name, "", removeOptions);
      console.log(`🗑️ Cookie已删除: ${name}`);
    } catch (error) {
      console.error("删除Cookie失败:", error);
    }
  }

  /**
   * 检查Cookie是否存在
   */
  static exists(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * 获取所有Cookie
   */
  static getAll(): Record<string, string> {
    try {
      const cookies: Record<string, string> = {};
      const cookieString = document.cookie;

      if (cookieString) {
        cookieString.split(";").forEach((cookie) => {
          const [name, value] = cookie.trim().split("=");
          if (name && value) {
            cookies[decodeURIComponent(name)] = decodeURIComponent(value);
          }
        });
      }

      return cookies;
    } catch (error) {
      console.error("获取所有Cookie失败:", error);
      return {};
    }
  }

  /**
   * 清除所有Cookie（仅限当前域名和路径）
   */
  static clearAll(options: Partial<CookieOptions> = {}): void {
    try {
      const cookies = this.getAll();
      Object.keys(cookies).forEach((name) => {
        this.remove(name, options);
      });
      console.log("🧹 已清除所有Cookie");
    } catch (error) {
      console.error("清除所有Cookie失败:", error);
    }
  }

  /**
   * 设置Token到安全Cookie
   */
  static setToken(token: string, options: CookieOptions = {}): void {
    const tokenOptions = { ...TOKEN_COOKIE_OPTIONS, ...options };
    this.set("kr_virt_token", token, tokenOptions);

    // 立即验证保存的Token
    const savedToken = this.getToken();
    console.log("保存后读取的Token:", savedToken);
  }

  /**
   * 获取Token from Cookie
   */
  static getToken(): string | null {
    return this.get("kr_virt_token");
  }

  /**
   * 删除Token Cookie
   */
  static removeToken(): void {
    this.remove("kr_virt_token", { path: TOKEN_COOKIE_OPTIONS.path });
  }

  /**
   * 设置用户信息到Cookie
   */
  static setUser(userInfo: object, options: CookieOptions = {}): void {
    try {
      const userOptions = { ...TOKEN_COOKIE_OPTIONS, ...options };
      const userString = JSON.stringify(userInfo);
      this.set("kr_virt_user", userString, userOptions);
    } catch (error) {
      console.error("设置用户信息Cookie失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户信息 from Cookie
   */
  static getUser<T = Record<string, unknown>>(): T | null {
    try {
      const userString = this.get("kr_virt_user");
      if (userString) {
        return JSON.parse(userString) as T;
      }
      return null;
    } catch (error) {
      console.error("获取用户信息Cookie失败:", error);
      return null;
    }
  }

  /**
   * 删除用户信息Cookie
   */
  static removeUser(): void {
    this.remove("kr_virt_user", { path: TOKEN_COOKIE_OPTIONS.path });
  }

  /**
   * 清除所有认证相关的Cookie
   */
  static clearAuth(): void {
    this.removeToken();
    this.removeUser();
    console.log("🔐 已清除所有认证Cookie");
  }

  /**
   * 检查Token是否过期（基于Cookie的maxAge）
   */
  static isTokenExpired(): boolean {
    // 如果Cookie存在，说明还未过期（浏览器会自动处理过期）
    return !this.exists("kr_virt_token");
  }

  /**
   * 设置带过期时间的数据
   */
  static setWithExpiry(
    name: string,
    value: string,
    expiryMinutes: number,
  ): void {
    const expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000);
    this.set(name, value, { expires: expiryTime });
  }

  /**
   * 获取Cookie的大小（字节）
   */
  static getCookieSize(): number {
    return new Blob([document.cookie]).size;
  }

  /**
   * 检查是否接近Cookie大小限制
   */
  static isNearSizeLimit(): boolean {
    const currentSize = this.getCookieSize();
    const limit = 4096; // 4KB 标准限制
    return currentSize > limit * 0.8; // 超过80%发出警告
  }

  /**
   * 调试信息 - 显示所有Cookie信息
   */
  static debug(): void {
    if (import.meta.env.DEV) {
      console.group("🍪 Cookie调试信息");
      console.log("所有Cookie:", this.getAll());
      console.log("Token存在:", this.exists("kr_virt_token"));
      console.log("用户信息存在:", this.exists("kr_virt_user"));
      console.log("Cookie总大小:", this.getCookieSize(), "bytes");
      console.log("接近大小限制:", this.isNearSizeLimit());
      console.groupEnd();
    }
  }
}

export default CookieUtils;
