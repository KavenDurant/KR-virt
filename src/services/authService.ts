/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-27 10:00:00
 * @Description: 认证服务 - 简化版
 */

// 用户信息接口
export interface UserInfo {
  username: string;
  role: string;
  permissions: string[];
  lastLogin: string;
}

// 认证响应接口
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserInfo;
}

// 登录数据接口
export interface LoginData {
  username: string;
  password: string;
}

class AuthService {
  private readonly TOKEN_KEY = "kr_virt_token";
  private readonly USER_KEY = "kr_virt_user";
  
  // 模拟用户数据库
  private mockUsers = [
    {
      username: "admin",
      password: "Admin123!@#",
      role: "administrator",
      permissions: ["*"],
    },
    {
      username: "test",
      password: "123456",
      role: "administrator",
      permissions: ["*"],
    },
    {
      username: "operator",
      password: "Operator123!@#",
      role: "operator",
      permissions: ["vm:read", "vm:create", "network:read"],
    },
    {
      username: "auditor",
      password: "Auditor123!@#",
      role: "auditor",
      permissions: ["audit:read", "log:read"],
    },
  ];

  // 登录验证
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 验证用户名密码
      const user = this.mockUsers.find(
        (u) => u.username === data.username && u.password === data.password
      );

      if (!user) {
        return {
          success: false,
          message: "用户名或密码错误",
        };
      }

      // 直接登录成功
      const token = this.generateToken();
      const userInfo: UserInfo = {
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        lastLogin: new Date().toISOString(),
      };

      // 保存登录状态
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));

      return {
        success: true,
        message: "登录成功",
        token,
        user: userInfo,
      };
    } catch {
      return {
        success: false,
        message: "登录失败，请稍后重试",
      };
    }
  }

  // 生成token
  private generateToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const token = `kr_virt_${timestamp}_${random}`;
    return btoa(token);
  }

  // 检查认证状态
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // 获取当前用户信息
  getCurrentUser(): UserInfo | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // 获取token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // 登出
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

// 创建并导出单个实例
const authService = new AuthService();
export { authService };
export default authService;
