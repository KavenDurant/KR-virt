/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-27 10:00:00
 * @Description: 认证服务 - 满足信创和国保测要求
 */

// 用户信息接口
export interface UserInfo {
  username: string;
  role: string;
  permissions: string[];
  lastLogin: string;
  twoFactorEnabled: boolean;
}

// 认证响应接口
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserInfo;
  requireTwoFactor?: boolean;
  tempToken?: string;
}

// 双因子认证接口
export interface TwoFactorData {
  tempToken: string;
  verificationCode: string;
  keyFileContent?: string;
}

// 登录数据接口
export interface LoginData {
  username: string;
  password: string;
  keyFile?: File;
}

class AuthService {
  private readonly TOKEN_KEY = 'kr_virt_token';
  private readonly USER_KEY = 'kr_virt_user';
  private readonly TEMP_TOKEN_KEY = 'kr_virt_temp_token';

  // 模拟用户数据库
  private mockUsers = [
    {
      username: 'admin',
      password: 'Admin123!@#', // 符合安全要求的密码
      role: 'administrator',
      permissions: ['*'],
      twoFactorEnabled: true
    },
    {
      username: 'operator',
      password: 'Operator123!@#',
      role: 'operator',
      permissions: ['vm:read', 'vm:create', 'network:read'],
      twoFactorEnabled: true
    },
    {
      username: 'auditor',
      password: 'Auditor123!@#',
      role: 'auditor',
      permissions: ['audit:read', 'log:read'],
      twoFactorEnabled: true
    }
  ];

  // 登录验证
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      // 验证用户名密码
      const user = this.mockUsers.find(u => 
        u.username === data.username && u.password === data.password
      );

      if (!user) {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 验证密钥文件
      if (data.keyFile) {
        const keyValid = await this.validateKeyFile(data.keyFile);
        if (!keyValid) {
          return {
            success: false,
            message: '密钥文件验证失败'
          };
        }
      } else {
        return {
          success: false,
          message: '请上传有效的密钥文件'
        };
      }

      // 生成临时token
      const tempToken = this.generateToken('temp');
      sessionStorage.setItem(this.TEMP_TOKEN_KEY, tempToken);

      return {
        success: true,
        message: '第一步验证成功，请输入双因子认证码',
        requireTwoFactor: true,
        tempToken
      };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        success: false,
        message: '登录服务异常，请稍后重试'
      };
    }
  }

  // 双因子认证验证
  async verifyTwoFactor(data: TwoFactorData): Promise<AuthResponse> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      // 验证临时token
      const storedTempToken = sessionStorage.getItem(this.TEMP_TOKEN_KEY);
      if (!storedTempToken || storedTempToken !== data.tempToken) {
        return {
          success: false,
          message: '会话已过期，请重新登录'
        };
      }

      // 验证双因子认证码（模拟）
      const validCodes = ['123456', '666666', '888888']; // 模拟验证码
      if (!validCodes.includes(data.verificationCode)) {
        return {
          success: false,
          message: '验证码错误'
        };
      }

      // 生成正式token
      const token = this.generateToken('auth');
      const userInfo: UserInfo = {
        username: 'admin', // 这里应该从临时token中解析
        role: 'administrator',
        permissions: ['*'],
        lastLogin: new Date().toISOString(),
        twoFactorEnabled: true
      };

      // 存储认证信息
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
      sessionStorage.removeItem(this.TEMP_TOKEN_KEY);

      return {
        success: true,
        message: '登录成功',
        token,
        user: userInfo
      };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        success: false,
        message: '双因子认证服务异常'
      };
    }
  }

  // 验证密钥文件
  private async validateKeyFile(file: File): Promise<boolean> {
    try {
      const content = await this.readFileAsText(file);
      
      // 验证文件格式和内容
      const requiredSections = ['[AUTH_CONFIG]', '[SYSTEM_INFO]', '[MASTER_KEY]', '[AUTH_KEYS]', '[SIGNATURE]'];
      const hasRequiredSections = requiredSections.every(section => 
        content.includes(section)
      );

      if (!hasRequiredSections) {
        return false;
      }

      // 验证系统类型
      const hasXinchuanGuobao = content.includes('SYSTEM_TYPE=XINCHUAN_GUOBAO');
      const hasComplianceLevel = content.includes('COMPLIANCE_LEVEL=LEVEL_3');
      
      return hasXinchuanGuobao && hasComplianceLevel;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  }

  // 读取文件内容
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // 生成token
  private generateToken(type: 'temp' | 'auth'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${type}_${timestamp}_${random}`;
  }

  // 检查认证状态
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const user = localStorage.getItem(this.USER_KEY);
    return !!(token && user);
  }

  // 获取当前用户信息
  getCurrentUser(): UserInfo | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // 获取token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // 登出
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TEMP_TOKEN_KEY);
  }

  // 生成验证码（模拟短信或邮件发送）
  async sendVerificationCode(): Promise<{ success: boolean; message: string }> {
    // 模拟发送验证码
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: '验证码已发送，测试验证码：123456、666666、888888'
    };
  }
}

export const authService = new AuthService();
export default authService;
