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
  isFirstLogin?: boolean; // 是否第一次登录
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
interface ChangePasswordData {
  username: string;
  oldPassword: string;
  newPassword: string;
}
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
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
      isFirstLogin: false,
    },
    {
      username: "test",
      password: "123456",
      role: "administrator",
      permissions: ["*"],
      isFirstLogin: true,
    },
    {
      username: "operator",
      password: "Operator123!@#",
      role: "operator",
      permissions: ["vm:read", "vm:create", "network:read"],
      isFirstLogin: true,
    },
    {
      username: "auditor",
      password: "Auditor123!@#",
      role: "auditor",
      permissions: ["audit:read", "log:read"],
      isFirstLogin: true,
    },
  ];

  // 登录验证
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 验证用户名密码
      const user = this.mockUsers.find(
        (u) => u.username === data.username && u.password === data.password,
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
        isFirstLogin: user.isFirstLogin, // 使用用户数据中的实际值
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
  async changePassword(
    data: ChangePasswordData,
  ): Promise<ChangePasswordResponse> {
    try {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 800));

      console.log("模拟修改密码请求:", data);

      // 查找用户
      const userIndex = this.mockUsers.findIndex(
        (u) => u.username === data.username,
      );

      if (userIndex === -1) {
        return {
          success: false,
          message: "用户不存在",
        };
      }

      const user = this.mockUsers[userIndex];

      // 验证旧密码
      if (user.password !== data.oldPassword) {
        return {
          success: false,
          message: "原密码不正确",
        };
      }

      // 验证新密码不能与旧密码相同
      if (data.newPassword === data.oldPassword) {
        return {
          success: false,
          message: "新密码不能与原密码相同",
        };
      }

      // 模拟密码强度验证
      if (data.newPassword.length < 6) {
        return {
          success: false,
          message: "新密码长度不能少于6位",
        };
      }

      // 更新模拟数据库中的密码
      this.mockUsers[userIndex].password = data.newPassword;
      this.mockUsers[userIndex].isFirstLogin = false; // 修改密码后不再是第一次登录

      // 更新本地存储的用户信息
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        currentUser.isFirstLogin = false;
        localStorage.setItem(this.USER_KEY, JSON.stringify(currentUser));
      }

      console.log("密码修改成功，新的用户数据:", this.mockUsers[userIndex]);

      return {
        success: true,
        message: "密码修改成功",
      };
    } catch (error) {
      console.error("修改密码失败:", error);
      return {
        success: false,
        message: "网络错误，请稍后重试",
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
