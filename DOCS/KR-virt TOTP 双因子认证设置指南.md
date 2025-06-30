# KR-virt TOTP 双因子认证设置指南

## 📋 功能概述

KR-virt 虚拟化管理系统集成了基于 RFC 6238 标准的 TOTP（Time-based One-Time Password）双因子认证功能，为系统提供更高级别的安全保护。

### 核心特性

- ✅ **标准兼容**: 基于 RFC 6238 TOTP 标准实现
- ✅ **多应用支持**: 兼容所有主流认证器应用
- ✅ **防重放攻击**: 防止验证码重复使用
- ✅ **时间容差**: 支持 ±30 秒时间偏差
- ✅ **安全加密**: 使用 HMAC-SHA1 加密算法
- ✅ **用户友好**: 简化的设置流程和清晰的指导

## 🔐 测试账户配置

### 首次登录账户（需要设置 TOTP）

| 用户名   | 初始密码       | 角色          | 权限范围                         |
| -------- | -------------- | ------------- | -------------------------------- |
| test     | 123456         | administrator | 全部系统权限                     |
| operator | Operator123!@# | operator      | vm:read, vm:create, network:read |
| auditor  | Auditor123!@#  | auditor       | audit:read, log:read             |

### 已配置账户（直接登录）

| 用户名 | 密码        | 角色          | TOTP 状态 |
| ------ | ----------- | ------------- | --------- |
| admin  | Admin123!@# | administrator | 已配置    |

## 🚀 完整设置流程

### 第一步：系统访问和登录

1. **访问系统**

   ```
   浏览器打开: http://localhost:3000/
   ```

2. **首次登录**
   - 使用测试账户登录（推荐：test/123456）
   - 系统检测到首次登录状态
   - 自动弹出"安全设置向导"

### 第二步：密码安全升级

1. **密码修改对话框**
   - 标题：🔒 安全升级 - 修改初始密码
   - 输入新密码（建议：`KRvirt2025!@#`）
   - 确认新密码
   - 实时查看密码强度指示器

2. **密码要求**
   - 最少 8 个字符
   - 包含大写字母 (A-Z)
   - 包含小写字母 (a-z)
   - 包含数字 (0-9)
   - 包含特殊字符 (!@#$%^&\*)
   - 避免常见密码

3. **完成密码修改**
   - 点击"确认修改"
   - 显示成功提示："密码修改成功！接下来设置双因子认证"
   - 自动进入 TOTP 设置流程

### 第三步：TOTP 双因子认证设置

#### 步骤 1: 扫描配置二维码

1. **界面展示**
   - 步骤指示器：🔍 扫描二维码 → 验证设置
   - 显示 QR 码图片（200x200px）
   - 显示密钥：`TA2SS5UUTTFSHBELVGVO53NRIR7AQHFM`
   - 提供设置指导说明

2. **认证器应用配置**

   ```
   推荐认证器应用：
   • Google Authenticator (免费)
   • Microsoft Authenticator (免费)
   • Authy (多设备同步)
   • 1Password (付费，功能丰富)
   • LastPass Authenticator (免费)
   ```

3. **配置方法**
   - **自动方式**: 打开认证器应用 → 扫描 QR 码
   - **手动方式**: 选择"手动输入" → 输入密钥

4. **验证配置**
   - 认证器应用显示：KR虚拟化管理系统 (test)
   - 每 30 秒生成新的 6 位验证码
   - 点击"下一步"继续

#### 步骤 2: 验证码验证和激活

1. **验证界面**
   - 步骤指示器：扫描二维码 → ✅ 验证设置
   - 6 位数字输入框
   - 剩余时间倒计时显示
   - 验证按钮和重新生成选项

2. **验证码获取**
   - **生产方式**: 从认证器应用获取当前 6 位验证码
   - **开发调试**: 点击"🔧 获取测试验证码"按钮

3. **完成验证**
   - 输入正确的 6 位验证码
   - 点击"验证并完成设置"
   - 系统验证成功显示："🎉 双因子认证设置完成！"

### 第四步：进入系统

1. **设置完成**
   - 显示 3 秒成功提示
   - 自动跳转到系统仪表板
   - 用户状态更新：`isFirstLogin: false`

2. **后续登录**
   - 使用新密码登录
   - 每次登录需要输入 TOTP 验证码
   - 验证码每 30 秒更新一次

## 🛠️ 验证码获取方法

### 方法 1: 认证器应用（推荐生产环境）

1. **下载认证器应用**

   | 应用名称                | 平台                | 特点                 | 下载链接                |
   | ----------------------- | ------------------- | -------------------- | ----------------------- |
   | Google Authenticator    | iOS/Android         | 简单可靠，官方支持   | App Store / Google Play |
   | Microsoft Authenticator | iOS/Android         | 云备份，微软账户集成 | App Store / Google Play |
   | Authy                   | iOS/Android/Desktop | 多设备同步，备份恢复 | 官网下载                |
   | 1Password               | 全平台              | 密码管理器集成       | 1password.com           |

2. **配置步骤**

   ```
   1. 打开认证器应用
   2. 点击"添加账户"或"+"按钮
   3. 选择"扫描二维码"
   4. 扫描页面上的 QR 码
   5. 账户显示为：KR虚拟化管理系统 (用户名)
   6. 每 30 秒自动生成新的 6 位验证码
   ```

3. **手动输入方式**
   ```
   账户名称：KR虚拟化管理系统
   用户名：你的登录用户名
   密钥：TA2SS5UUTTFSHBELVGVO53NRIR7AQHFM
   类型：基于时间
   算法：SHA1
   位数：6
   周期：30 秒
   ```

### 方法 2: 开发调试（仅开发环境）

1. **页面调试工具**
   - 在验证码输入页面点击"🔧 获取测试验证码"按钮
   - 控制台显示当前和下一个验证码
   - 显示剩余有效时间
   - 页面弹出当前验证码提示

2. **控制台信息**
   ```javascript
   [TOTP Debug] 当前验证码: 123456
   [TOTP Debug] 下一个验证码: 789012
   [TOTP Debug] 剩余时间: 15 秒
   [TOTP Debug] 时间窗口: 允许 ±30 秒偏差
   ```

### 方法 3: 在线工具（测试环境）

1. **在线 TOTP 生成器**

   ```
   推荐网站：
   • https://totp.danhersam.com/
   • https://stefansundin.github.io/2fa-qr/

   使用方法：
   1. 访问工具网站
   2. 输入密钥：TA2SS5UUTTFSHBELVGVO53NRIR7AQHFM
   3. 选择 SHA1, 6 位, 30 秒
   4. 获取当前验证码
   ```

2. **命令行工具（开发者）**
   ```bash
   # 项目根目录提供的测试工具
   node totp-quick-test.js    # 快速获取当前验证码
   node totp-monitor.js       # 实时监控验证码变化
   ```

## ⚙️ 技术实现详解

### 系统架构

```
┌─────────────────────────────────────────┐
│              用户界面层                   │
├─────────────────────────────────────────┤
│  登录页面  │  密码修改  │  TOTP设置      │
├─────────────────────────────────────────┤
│              业务逻辑层                   │
├─────────────────────────────────────────┤
│  认证服务  │  TOTP服务  │  安全工具      │
├─────────────────────────────────────────┤
│              数据存储层                   │
├─────────────────────────────────────────┤
│  用户状态  │  Token记录 │  安全日志      │
└─────────────────────────────────────────┘
```

### 核心组件

#### 1. TOTP 服务 (`src/services/totpService.ts`)

```typescript
class TOTPService {
  // 核心功能
  generateCurrentToken(); // 生成当前验证码
  verifyToken(); // 验证输入的验证码
  isValidSecret(); // 验证密钥格式
  generateTOTPUrl(); // 生成二维码URL

  // 安全特性
  防重放攻击保护; // 记录已使用的验证码
  时间窗口容差; // ±30秒时间偏差
  自动清理过期记录; // 定期清理旧数据
}
```

#### 2. 认证服务 (`src/services/authService.ts`)

```typescript
interface UserInfo {
  username: string;
  role: string;
  permissions: string[];
  isFirstLogin: boolean; // 首次登录标识
  totpEnabled: boolean; // TOTP启用状态
}
```

#### 3. 安全工具 (`src/utils/security.ts`)

```typescript
class SecurityUtils {
  validatePassword(); // 密码强度验证
  encryptData(); // 数据加密
  generateHash(); // 哈希生成
  sanitizeInput(); // 输入清理
}
```

### 状态管理

#### React 状态设计

```typescript
interface LoginState {
  // 登录流程控制
  isLoading: boolean;
  currentStep: "login" | "changePassword" | "setupTOTP" | "complete";

  // 对话框状态
  showChangePasswordModal: boolean;
  showTOTPModal: boolean;
  totpStep: 0 | 1; // 0: 扫码, 1: 验证

  // 用户数据
  currentUser: UserInfo | null;
  passwordStrength: PasswordValidation;

  // TOTP 相关
  totpSecret: string;
  totpQRUrl: string;
  verificationCode: string;
}
```

#### 流程控制逻辑

```typescript
const handleLoginSuccess = (user: UserInfo) => {
  if (user.isFirstLogin) {
    setCurrentStep("changePassword");
    setShowChangePasswordModal(true);
  } else {
    navigateToDashboard();
  }
};

const handlePasswordChanged = () => {
  setShowChangePasswordModal(false);
  setCurrentStep("setupTOTP");
  setupTOTPFlow();
};

const setupTOTPFlow = () => {
  const secret = "TA2SS5UUTTFSHBELVGVO53NRIR7AQHFM";
  const qrUrl = totpService.generateTOTPUrl(secret, username);
  setTotpSecret(secret);
  setTotpQRUrl(qrUrl);
  setShowTOTPModal(true);
  setTotpStep(0);
};
```

### 安全机制

#### 1. TOTP 算法实现

```
标准：RFC 6238 (Time-Based One-Time Password)
算法：HMAC-SHA1
时间步长：30 秒
验证码长度：6 位数字
时间容差：±1 个周期（总共 90 秒有效窗口）
密钥格式：Base32 编码
```

#### 2. 防重放攻击

```typescript
private usedTokens = new Map<string, number>();

verifyToken(token: string) {
  const tokenKey = `${secret}-${token}`;
  const currentTime = Math.floor(Date.now() / 1000);

  // 检查是否已使用
  if (this.usedTokens.has(tokenKey)) {
    const usedTime = this.usedTokens.get(tokenKey)!;
    if (currentTime - usedTime < 300) { // 5分钟内
      return { success: false, message: "令牌已被使用" };
    }
  }

  // 验证成功后记录
  this.usedTokens.set(tokenKey, currentTime);
}
```

#### 3. 密码安全策略

```typescript
interface PasswordRequirements {
  minLength: 8; // 最小长度
  requireUppercase: true; // 需要大写字母
  requireLowercase: true; // 需要小写字母
  requireNumbers: true; // 需要数字
  requireSpecialChars: true; // 需要特殊字符
  blockCommonPasswords: true; // 阻止常见密码
}
```

## 🔍 故障排除指南

### 常见问题和解决方案

#### 1. 登录相关问题

| 问题描述           | 可能原因             | 解决方案                           |
| ------------------ | -------------------- | ---------------------------------- |
| 无法访问登录页面   | 开发服务器未启动     | 运行 `npm run dev` 启动服务器      |
| 账户密码错误       | 输入错误或账户不存在 | 检查测试账户列表，确认用户名和密码 |
| 页面空白或加载失败 | 前端构建错误         | 检查控制台错误，重新构建项目       |

#### 2. 密码修改问题

| 问题描述       | 可能原因         | 解决方案                       |
| -------------- | ---------------- | ------------------------------ |
| 密码强度不够   | 不符合安全要求   | 确保包含大小写、数字、特殊字符 |
| 两次密码不一致 | 确认密码输入错误 | 重新输入确认密码               |
| 修改按钮无响应 | 表单验证失败     | 检查所有字段是否正确填写       |

#### 3. TOTP 设置问题

| 问题描述       | 可能原因             | 解决方案                           |
| -------------- | -------------------- | ---------------------------------- |
| 二维码无法显示 | 图片文件缺失         | 确认 `/public/QRCode.png` 文件存在 |
| 无法扫描二维码 | 认证器应用问题       | 尝试手动输入密钥                   |
| 验证码验证失败 | 时间不同步或输入错误 | 检查设备时间，确认验证码正确       |
| 验证码已过期   | 验证码超时           | 等待新验证码生成（最多30秒）       |

#### 4. 认证器应用问题

| 问题描述                      | 解决方案                           |
| ----------------------------- | ---------------------------------- |
| Google Authenticator 无法扫码 | 确保应用有相机权限，或使用手动输入 |
| Authy 同步问题                | 检查网络连接，重新登录 Authy 账户  |
| 验证码不匹配                  | 检查设备时间是否准确，允许30秒误差 |
| 多个设备验证码不同            | 确保所有设备时间同步               |

### 调试工具使用

#### 1. 浏览器开发者工具

```javascript
// 打开控制台 (F12)，查看以下日志：
[Login] 用户登录: test
[Password] 密码强度: strong
[TOTP] 生成验证码: 123456
[TOTP] 验证结果: success
```

#### 2. 网络请求调试

```javascript
// 在 Network 标签页检查：
POST / api / auth / login; // 登录请求
PUT / api / auth / change - password; // 密码修改
POST / api / auth / setup - totp; // TOTP设置
POST / api / auth / verify - totp; // TOTP验证
```

#### 3. 本地存储检查

```javascript
// 在 Application 标签页检查 localStorage：
kr_virt_token; // 认证令牌
kr_virt_user; // 用户信息
kr_virt_theme; // 主题设置
```

### 开发环境特殊功能

#### 1. 快速验证码获取

```typescript
// 在验证码页面，开发环境提供调试按钮
onClick="getDebugTOTPCode()"

// 控制台输出：
[TOTP Debug] 当前验证码: 123456
[TOTP Debug] 剩余时间: 15秒
[TOTP Debug] 下一个验证码: 789012
```

#### 2. 跳过 TOTP 设置（开发模式）

```typescript
// 在开发环境可以临时跳过 TOTP
if (process.env.NODE_ENV === "development") {
  // 显示"跳过设置"按钮
  setShowTOTPModal(false);
  navigate("/dashboard");
}
```

#### 3. 模拟不同用户场景

```typescript
// 修改用户数据进行测试
const testScenarios = {
  firstLogin: { isFirstLogin: true, totpEnabled: false },
  normalUser: { isFirstLogin: false, totpEnabled: true },
  adminUser: { role: "administrator", permissions: ["*"] },
};
```

### 性能监控

#### 1. 页面加载性能

```javascript
// 使用 Performance API 监控
const perfData = performance.getEntriesByType("navigation")[0];
console.log("页面加载时间:", perfData.loadEventEnd - perfData.fetchStart, "ms");
```

#### 2. TOTP 生成性能

```javascript
// 监控验证码生成时间
const startTime = performance.now();
const code = await totpService.generateCurrentToken(secret);
const endTime = performance.now();
console.log("TOTP生成耗时:", endTime - startTime, "ms");
```
