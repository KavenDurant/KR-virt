/**
 * Token自动刷新快速测试版本
 * 将刷新间隔设置为30秒，方便测试
 */

// 备份原始间隔设置
const ORIGINAL_REFRESH_INTERVAL = 3 * 60 * 1000; // 3分钟
const TEST_REFRESH_INTERVAL = 30 * 1000; // 30秒

console.log("🧪 Token自动刷新测试模式");
console.log("将刷新间隔从3分钟改为30秒，方便测试");

// 检查是否在测试环境
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  console.log("✅ 检测到开发环境，将启用快速测试模式");

  // 等待页面加载完成
  window.addEventListener("load", function () {
    setTimeout(() => {
      if (window.loginService && window.TokenRefreshManager) {
        console.log("🔧 正在修改Token刷新间隔为30秒...");

        // 获取TokenRefreshManager实例
        const refreshManager = window.TokenRefreshManager.getInstance();

        // 停止现有的刷新
        refreshManager.stopAutoRefresh();

        // 修改刷新间隔
        refreshManager.REFRESH_INTERVAL = TEST_REFRESH_INTERVAL;

        // 重新启动自动刷新
        if (window.loginService.isAuthenticated()) {
          console.log("🚀 重新启动Token自动刷新 (30秒间隔)");
          refreshManager.startAutoRefresh();

          // 设置监控
          let refreshCount = 0;
          const originalRefreshToken = window.loginService.refreshToken;

          window.loginService.refreshToken = async function (...args) {
            refreshCount++;
            const timestamp = new Date().toLocaleString();
            console.log(
              `🔄 [${timestamp}] 第${refreshCount}次自动刷新 (测试模式)`,
            );

            try {
              const result = await originalRefreshToken.apply(this, args);
              console.log(`✅ [${timestamp}] 刷新成功:`, result);
              return result;
            } catch (error) {
              console.error(`❌ [${timestamp}] 刷新失败:`, error);
              throw error;
            }
          };

          console.log("📊 监控已设置，将显示每次自动刷新");
          console.log("⏰ 首次自动刷新将在30秒后执行");

          // 倒计时显示
          let countdown = 30;
          const countdownTimer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
              console.log(`⏰ 距离下次自动刷新还有 ${countdown} 秒`);
            } else {
              console.log("🎯 自动刷新时间到！");
              clearInterval(countdownTimer);
            }
          }, 1000);
        } else {
          console.log("❌ 用户未登录，请先登录");
        }
      } else {
        console.log("❌ LoginService或TokenRefreshManager未找到");
      }
    }, 2000);
  });
} else {
  console.log("⚠️ 非开发环境，保持原始3分钟刷新间隔");
}
