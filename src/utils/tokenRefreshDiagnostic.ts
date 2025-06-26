/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-17
 * @Description: Token自动刷新诊断工具
 */

import { loginService } from "@/services/login";

export class TokenRefreshDiagnostic {
  /**
   * 全面诊断Token自动刷新状态
   */
  static diagnose(): void {
    console.group("🔍 Token自动刷新诊断报告");

    try {
      // 1. 检查登录状态
      const isAuthenticated = loginService.isAuthenticated();
      console.log(
        "1️⃣ 用户登录状态:",
        isAuthenticated ? "✅ 已登录" : "❌ 未登录",
      );

      // 2. 检查Token
      const token = loginService.getToken();
      console.log(
        "2️⃣ Token状态:",
        token ? `✅ 存在 (${token.substring(0, 20)}...)` : "❌ 不存在",
      );

      // 3. 检查用户信息
      const user = loginService.getCurrentUser();
      console.log(
        "3️⃣ 用户信息:",
        user ? `✅ 存在 (用户名: ${user.username})` : "❌ 不存在",
      );

      // 4. 检查自动刷新状态
      const refreshStatus = loginService.getAutoRefreshStatus();
      console.log("4️⃣ 自动刷新状态:");
      console.log(
        "   - 是否运行:",
        refreshStatus.isRunning ? "✅ 是" : "❌ 否",
      );
      console.log(
        "   - 是否刷新中:",
        refreshStatus.isRefreshing ? "⏳ 是" : "💤 否",
      );

      // 5. 检查环境信息
      const isDev = import.meta.env.DEV;
      const mode = import.meta.env.MODE;
      const expectedInterval = isDev ? 30 : 180; // 秒
      console.log("5️⃣ 环境信息:");
      console.log("   - 开发模式:", isDev ? "✅ 是" : "❌ 否");
      console.log("   - 环境:", mode);
      console.log("   - 预期刷新间隔:", `${expectedInterval}秒`);

      // 6. 测试Token格式
      if (token) {
        try {
          const parts = token.split(".");
          const isValidFormat = parts.length === 3;
          console.log(
            "6️⃣ Token格式检查:",
            isValidFormat ? "✅ 有效" : "❌ 无效",
          );

          if (isValidFormat) {
            try {
              const payload = JSON.parse(atob(parts[1]));
              const exp = payload.exp;
              if (exp) {
                const expDate = new Date(exp * 1000);
                const isExpired = Date.now() > exp * 1000;
                console.log("   - 过期时间:", expDate.toLocaleString());
                console.log("   - 是否过期:", isExpired ? "❌ 是" : "✅ 否");
              }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
              console.log("   - Payload解析:", "❌ 失败");
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          console.log("6️⃣ Token格式检查:", "❌ 解析失败");
        }
      }

      // 7. 提供建议
      console.log("\n🛠️ 诊断建议:");

      if (!isAuthenticated) {
        console.log("❌ 用户未登录，请先登录");
      } else if (!refreshStatus.isRunning) {
        console.log("❌ Token自动刷新未启动，尝试手动启动");
        console.log("   执行: loginService.startGlobalTokenRefresh()");
      } else {
        console.log("✅ Token自动刷新正常运行");
        console.log(`⏰ 下次刷新将在${expectedInterval}秒内触发`);
      }
    } catch (error) {
      console.error("❌ 诊断过程中发生错误:", error);
    }

    console.groupEnd();
  }

  /**
   * 手动启动Token自动刷新
   */
  static startRefresh(): void {
    console.log("🚀 手动启动Token自动刷新...");
    try {
      loginService.startGlobalTokenRefresh();
      const status = loginService.getAutoRefreshStatus();
      console.log("✅ 启动完成，当前状态:", status);
    } catch (error) {
      console.error("❌ 启动失败:", error);
    }
  }

  /**
   * 手动停止Token自动刷新
   */
  static stopRefresh(): void {
    console.log("🛑 手动停止Token自动刷新...");
    try {
      loginService.stopGlobalTokenRefresh();
      const status = loginService.getAutoRefreshStatus();
      console.log("✅ 停止完成，当前状态:", status);
    } catch (error) {
      console.error("❌ 停止失败:", error);
    }
  }

  /**
   * 手动执行一次Token刷新
   */
  static async manualRefresh(): Promise<void> {
    console.log("🔄 手动执行Token刷新...");
    try {
      const result = await loginService.refreshToken();
      console.log("刷新结果:", result);
      if (result.success) {
        console.log("✅ Token刷新成功");
      } else {
        console.log("❌ Token刷新失败:", result.message);
      }
    } catch (error) {
      console.error("❌ 刷新过程中发生错误:", error);
    }
  }

  /**
   * 监控Token自动刷新活动
   */
  static startMonitoring(): () => void {
    console.log("👁️ 开始监控Token自动刷新活动...");

    const originalRefreshToken = loginService.refreshToken.bind(loginService);

    // 拦截refreshToken方法
    loginService.refreshToken = async function (...args) {
      console.log("🔄 监控到Token刷新请求:", new Date().toLocaleString());
      const result = await originalRefreshToken.apply(this, args);
      console.log(
        "🔄 Token刷新完成:",
        result.success ? "✅ 成功" : "❌ 失败",
        result.message,
      );
      return result;
    };

    // 返回停止监控的函数
    return () => {
      console.log("👁️ 停止监控Token自动刷新活动");
      loginService.refreshToken = originalRefreshToken;
    };
  }

  /**
   * 清理并重新初始化Token自动刷新
   */
  static resetRefresh(): void {
    console.log("🔄 重置Token自动刷新...");
    try {
      // 1. 停止当前的自动刷新
      loginService.stopGlobalTokenRefresh();
      console.log("1️⃣ 已停止当前自动刷新");

      // 2. 等待一下，确保定时器清理完成
      setTimeout(() => {
        // 3. 重新启动自动刷新
        if (loginService.isAuthenticated()) {
          loginService.startGlobalTokenRefresh();
          console.log("2️⃣ 已重新启动自动刷新");

          // 4. 检查状态
          const status = loginService.getAutoRefreshStatus();
          console.log("3️⃣ 重置后状态:", status);
        } else {
          console.log("2️⃣ 用户未登录，跳过重新启动");
        }
      }, 1000);
    } catch (error) {
      console.error("❌ 重置过程中发生错误:", error);
    }
  }
}

// 在开发环境中添加到全局对象
if (import.meta.env.DEV) {
  interface WindowWithDiagnostic extends Window {
    tokenDiagnostic: typeof TokenRefreshDiagnostic;
  }

  (window as unknown as WindowWithDiagnostic).tokenDiagnostic =
    TokenRefreshDiagnostic;

  console.log("🛠️ Token自动刷新诊断工具已加载!");
  console.log("在控制台中使用以下命令:");
  console.log("- tokenDiagnostic.diagnose() - 完整诊断");
  console.log("- tokenDiagnostic.startRefresh() - 手动启动");
  console.log("- tokenDiagnostic.stopRefresh() - 手动停止");
  console.log("- tokenDiagnostic.manualRefresh() - 手动刷新");
  console.log("- tokenDiagnostic.startMonitoring() - 开始监控");
  console.log("- tokenDiagnostic.resetRefresh() - 重置自动刷新");
}

export default TokenRefreshDiagnostic;
