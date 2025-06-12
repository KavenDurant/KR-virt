/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-11 14:30:00
 * @Description: Token自动刷新系统测试工具
 */

import { loginService, TokenRefreshManager } from "@/services/login";

/**
 * Token自动刷新测试工具类
 */
export class TokenRefreshTestUtils {
  private static originalConsoleLog = console.log;
  private static originalConsoleWarn = console.warn;
  private static originalConsoleError = console.error;
  private static logs: Array<{
    type: string;
    message: string;
    timestamp: number;
  }> = [];

  /**
   * 开始监控日志
   */
  static startLogMonitoring(): void {
    this.logs = [];

    console.log = (...args) => {
      this.logs.push({
        type: "log",
        message: args.join(" "),
        timestamp: Date.now(),
      });
      this.originalConsoleLog(...args);
    };

    console.warn = (...args) => {
      this.logs.push({
        type: "warn",
        message: args.join(" "),
        timestamp: Date.now(),
      });
      this.originalConsoleWarn(...args);
    };

    console.error = (...args) => {
      this.logs.push({
        type: "error",
        message: args.join(" "),
        timestamp: Date.now(),
      });
      this.originalConsoleError(...args);
    };
  }

  /**
   * 停止监控日志
   */
  static stopLogMonitoring(): void {
    console.log = this.originalConsoleLog;
    console.warn = this.originalConsoleWarn;
    console.error = this.originalConsoleError;
  }

  /**
   * 获取监控的日志
   */
  static getLogs(): Array<{
    type: string;
    message: string;
    timestamp: number;
  }> {
    return [...this.logs];
  }

  /**
   * 查找包含特定关键词的日志
   */
  static findLogs(
    keyword: string
  ): Array<{ type: string; message: string; timestamp: number }> {
    return this.logs.filter((log) => log.message.includes(keyword));
  }

  /**
   * 清除所有日志
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * 模拟用户登录
   */
  static async simulateLogin(): Promise<void> {
    const mockLoginData = {
      login_name: "test_user",
      password: "-p0-p0-p0",
      two_factor: "123456",
    };

    await loginService.login(mockLoginData);
  }

  /**
   * 模拟用户登出
   */
  static async simulateLogout(): Promise<void> {
    await loginService.logout();
  }

  /**
   * 创建无效Token
   */
  static setInvalidToken(): void {
    localStorage.setItem("kr_virt_token", "invalid_token_format");
  }

  /**
   * 创建有效的模拟Token
   */
  static setValidMockToken(): void {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: "test_user",
        exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
      })
    );
    const signature = "mock_signature";
    const token = `${header}.${payload}.${signature}`;

    localStorage.setItem("kr_virt_token", token);
    localStorage.setItem(
      "kr_virt_user",
      JSON.stringify({
        username: "test_user",
        role: "administrator",
        permissions: ["*"],
        lastLogin: new Date().toISOString(),
        isFirstLogin: false,
      })
    );
  }

  /**
   * 获取当前刷新状态
   */
  static getRefreshStatus(): { isRunning: boolean; isRefreshing: boolean } {
    return loginService.getAutoRefreshStatus();
  }

  /**
   * 强制触发Token刷新
   */
  static async triggerRefresh(): Promise<void> {
    await loginService.refreshToken();
  }

  /**
   * 等待指定时间
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 运行基础测试套件
   */
  static async runBasicTests(): Promise<void> {
    console.log("🧪 开始运行Token自动刷新基础测试...");

    this.startLogMonitoring();

    try {
      // 测试1: 清理状态
      console.log("\n📋 测试1: 清理初始状态");
      await this.simulateLogout();
      await this.wait(1000);

      // 测试2: 无效Token处理
      console.log("\n📋 测试2: 无效Token处理");
      this.setInvalidToken();
      const cleanedUp = loginService.cleanupInvalidToken();
      console.log("清理无效Token结果:", cleanedUp);

      // 测试3: 有效Token和自动刷新启动
      console.log("\n📋 测试3: 有效Token和自动刷新启动");
      this.setValidMockToken();
      loginService.startGlobalTokenRefresh();
      await this.wait(2000);

      const status = this.getRefreshStatus();
      console.log("自动刷新状态:", status);

      // 测试4: 停止自动刷新
      console.log("\n📋 测试4: 停止自动刷新");
      loginService.stopGlobalTokenRefresh();
      await this.wait(1000);

      const stopStatus = this.getRefreshStatus();
      console.log("停止后状态:", stopStatus);

      // 测试5: Token调试信息
      console.log("\n📋 测试5: Token调试信息");
      loginService.debugTokenInfo();

      console.log("\n✅ 基础测试完成！");
    } catch (error) {
      console.error("❌ 测试过程中出现错误:", error);
    } finally {
      this.stopLogMonitoring();
    }
  }

  /**
   * 运行压力测试
   */
  static async runStressTest(): Promise<void> {
    console.log("🔥 开始运行压力测试...");

    this.startLogMonitoring();

    try {
      this.setValidMockToken();

      // 快速启动/停止测试
      for (let i = 0; i < 10; i++) {
        loginService.startGlobalTokenRefresh();
        await this.wait(100);
        loginService.stopGlobalTokenRefresh();
        await this.wait(100);
      }

      // 并发刷新测试
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(this.triggerRefresh());
      }

      await Promise.allSettled(promises);

      console.log("✅ 压力测试完成！");
    } catch (error) {
      console.error("❌ 压力测试失败:", error);
    } finally {
      this.stopLogMonitoring();
    }
  }

  /**
   * 生成测试报告
   */
  static generateReport(): void {
    const logs = this.getLogs();
    const refreshLogs = this.findLogs("Token自动刷新");
    const errorLogs = logs.filter((log) => log.type === "error");
    const warnLogs = logs.filter((log) => log.type === "warn");

    console.log("\n📊 测试报告");
    console.log("=".repeat(50));
    console.log(`总日志数量: ${logs.length}`);
    console.log(`刷新相关日志: ${refreshLogs.length}`);
    console.log(`错误日志: ${errorLogs.length}`);
    console.log(`警告日志: ${warnLogs.length}`);

    if (errorLogs.length > 0) {
      console.log("\n❌ 错误日志:");
      errorLogs.forEach((log) => console.log(`  - ${log.message}`));
    }

    if (warnLogs.length > 0) {
      console.log("\n⚠️ 警告日志:");
      warnLogs.forEach((log) => console.log(`  - ${log.message}`));
    }

    console.log("=".repeat(50));
  }
}

// 在开发环境中导出到全局对象，方便在控制台中使用
if (import.meta.env.DEV) {
  (window as any).TokenRefreshTestUtils = TokenRefreshTestUtils;
  console.log("🧪 Token刷新测试工具已加载到 window.TokenRefreshTestUtils");
  console.log("使用示例:");
  console.log("  TokenRefreshTestUtils.runBasicTests()");
  console.log("  TokenRefreshTestUtils.runStressTest()");
  console.log("  TokenRefreshTestUtils.generateReport()");
}

export default TokenRefreshTestUtils;
