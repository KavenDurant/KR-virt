# Token自动刷新功能测试指南

## 测试环境
- 开发服务器：http://localhost:3002/
- 测试工具：token-refresh-test.html

## 测试步骤

### 1. 打开应用和测试工具

1. 在浏览器中打开两个标签：
   - 标签1：http://localhost:3002/ （主应用）
   - 标签2：http://localhost:3002/token-refresh-test.html （测试工具）

### 2. 检查初始状态

在主应用标签中：
1. 打开浏览器开发者工具（F12）
2. 在Console中查看是否有以下日志：
   ```
   🛠️ Token调试工具已加载!
   ❌ 用户未登录，跳过Token自动刷新
   ```

### 3. 执行登录测试

#### 方法1：使用测试工具
1. 切换到测试工具标签
2. 在"登录测试"区域：
   - 用户名：test_user
   - 密码：-p0-p0-p0
   - 验证码：123456
3. 点击"测试登录"按钮
4. 观察日志记录区域的输出

#### 方法2：手动登录
1. 在主应用中，导航到登录页面
2. 填写登录信息：
   - 用户名：test_user
   - 密码：-p0-p0-p0
   - 验证码：123456
3. 点击"安全登录"按钮

### 4. 验证自动刷新启动

登录成功后，在浏览器Console中查看：
```
🚀 登录成功，启动Token自动刷新
👤 用户已登录，启动Token自动刷新
🔄 启动Token自动刷新，间隔: 3分钟
✅ Token自动刷新已设置
```

### 5. 使用调试工具验证

在浏览器Console中执行以下命令：

```javascript
// 查看当前状态
debugToken.status()

// 手动触发一次刷新来测试API
debugToken.refresh()

// 查看自动刷新状态
window.loginService.getAutoRefreshStatus()
```

### 6. 监控自动刷新

#### 方法1：使用测试工具
1. 在测试工具中点击"开始监控"
2. 观察日志记录，每30秒会有状态更新
3. 等待3分钟，观察是否有自动刷新调用

#### 方法2：使用Console监控
在Console中设置监控：
```javascript
// 监控刷新调用
let originalRefresh = window.loginService.refreshToken;
window.loginService.refreshToken = async function(...args) {
  console.log('🔄 Token自动刷新被调用!', new Date().toLocaleString());
  const result = await originalRefresh.apply(this, args);
  console.log('刷新结果:', result);
  return result;
};
```

### 7. 测试网络请求

打开浏览器Network标签，观察：
1. 每3分钟是否有对 `/user/renew_access_token` 的GET请求
2. 请求头是否包含正确的 `Authorization: Bearer <token>` 
3. 响应是否返回新的 access_token

### 8. 测试异常情况

#### 测试Token失效
```javascript
// 清除Token并观察自动刷新停止
debugToken.clear()
```

#### 测试手动停止
```javascript
// 停止自动刷新
debugToken.stop()

// 重新启动
debugToken.start()
```

## 预期结果

### ✅ 正常情况下应该看到：

1. **登录时**：
   - Console显示启动自动刷新的日志
   - 自动刷新状态为 `isRunning: true`

2. **运行时**：
   - 每3分钟自动调用一次 `/user/renew_access_token`
   - Network中可以看到定期的API请求
   - Console中显示刷新成功的日志

3. **登出时**：
   - 自动刷新停止
   - Console显示停止自动刷新的日志

### ❌ 如果出现问题：

1. **LoginService未找到**：
   - 检查是否在正确的页面上
   - 确认开发服务器正常运行

2. **自动刷新未启动**：
   - 检查用户是否成功登录
   - 手动调用 `debugToken.start()`

3. **API调用失败**：
   - 检查后端服务是否运行
   - 检查Token格式是否正确
   - 查看Network标签中的错误信息

## 调试命令参考

```javascript
// 调试工具
debugToken.status()      // 查看状态
debugToken.refresh()     // 手动刷新
debugToken.start()       // 启动自动刷新  
debugToken.stop()        // 停止自动刷新
debugToken.clear()       // 清除Token

// 直接访问服务
window.loginService.isAuthenticated()           // 检查登录状态
window.loginService.getToken()                  // 获取Token
window.loginService.getCurrentUser()            // 获取用户信息
window.loginService.getAutoRefreshStatus()      // 获取自动刷新状态
window.loginService.refreshToken()              // 手动刷新Token
window.loginService.startGlobalTokenRefresh()   // 启动自动刷新
window.loginService.stopGlobalTokenRefresh()    // 停止自动刷新
```

## 测试检查清单

- [ ] 开发服务器正常运行
- [ ] 登录功能正常工作
- [ ] 登录后自动启动token刷新
- [ ] 每3分钟自动调用刷新API
- [ ] 刷新成功后更新本地Token
- [ ] 登出时停止自动刷新
- [ ] 异常情况下正确处理错误
- [ ] 调试工具功能正常
