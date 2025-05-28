/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-05-27 10:00:00
 * @Description: 密码强度验证和安全工具
 */

// 密码强度等级
export const PasswordStrength = {
  WEAK: "weak",
  MEDIUM: "medium", 
  STRONG: "strong",
  VERY_STRONG: "very_strong",
} as const;

export type PasswordStrength = typeof PasswordStrength[keyof typeof PasswordStrength];

// 密码验证结果
export interface PasswordValidationResult {
  strength: PasswordStrength;
  score: number;
  suggestions: string[];
  isValid: boolean;
}

// 密码强度验证器
class PasswordValidator {
  // 验证密码强度
  validatePassword(password: string): PasswordValidationResult {
    const suggestions: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length >= 8) {
      score += 1;
    } else {
      suggestions.push("密码长度至少8位");
    }

    if (password.length >= 12) {
      score += 1;
    } else {
      suggestions.push("建议密码长度12位以上");
    }

    // 字符类型检查
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      suggestions.push("包含小写字母");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      suggestions.push("包含大写字母");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      suggestions.push("包含数字");
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      score += 1;
    } else {
      suggestions.push("包含特殊字符");
    }

    // 复杂度检查
    if (!/(.)\1{2,}/.test(password)) {
      score += 1; // 无连续重复字符
    } else {
      suggestions.push("避免连续重复字符");
    }

    if (
      !/123|234|345|456|567|678|789|890|abc|bcd|cde/.test(
        password.toLowerCase()
      )
    ) {
      score += 1; // 无常见序列
    } else {
      suggestions.push("避免常见字符序列");
    }

    // 常见密码检查
    const commonPasswords = [
      "password",
      "123456",
      "admin",
      "root",
      "user",
      "guest",
      "test",
      "demo",
      "qwerty",
      "abc123",
    ];

    if (
      !commonPasswords.some((common) => password.toLowerCase().includes(common))
    ) {
      score += 1;
    } else {
      suggestions.push("避免使用常见密码");
    }

    // 确定强度等级
    let strength: PasswordStrength;
    if (score <= 3) {
      strength = PasswordStrength.WEAK;
    } else if (score <= 5) {
      strength = PasswordStrength.MEDIUM;
    } else if (score <= 7) {
      strength = PasswordStrength.STRONG;
    } else {
      strength = PasswordStrength.VERY_STRONG;
    }

    // 满足国保测要求的最低标准
    const isValid = score >= 6 && password.length >= 8;

    return {
      strength,
      score,
      suggestions,
      isValid,
    };
  }

  // 获取强度颜色
  getStrengthColor(strength: PasswordStrength): string {
    switch (strength) {
      case PasswordStrength.WEAK:
        return "#ff4d4f";
      case PasswordStrength.MEDIUM:
        return "#faad14";
      case PasswordStrength.STRONG:
        return "#52c41a";
      case PasswordStrength.VERY_STRONG:
        return "#1890ff";
      default:
        return "#d9d9d9";
    }
  }

  // 获取强度文本
  getStrengthText(strength: PasswordStrength): string {
    switch (strength) {
      case PasswordStrength.WEAK:
        return "弱";
      case PasswordStrength.MEDIUM:
        return "中等";
      case PasswordStrength.STRONG:
        return "强";
      case PasswordStrength.VERY_STRONG:
        return "很强";
      default:
        return "未知";
    }
  }
}

// 安全工具类
export class SecurityUtils {
  private static passwordValidator = new PasswordValidator();

  // 验证密码
  static validatePassword(password: string): PasswordValidationResult {
    return this.passwordValidator.validatePassword(password);
  }

  // 生成安全的随机字符串
  static generateSecureString(length: number = 32): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 简单的加密函数（用于演示，实际项目应使用更安全的加密方法）
  static simpleEncrypt(text: string, key: string): string {
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result);
  }

  // 简单的解密函数
  static simpleDecrypt(encryptedText: string, key: string): string {
    try {
      const decoded = atob(encryptedText);
      let result = "";
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch {
      return "";
    }
  }

  // 验证文件签名
  static async validateFileSignature(
    file: File,
    expectedHash?: string
  ): Promise<boolean> {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // 如果提供了期望的哈希值，进行比较
      if (expectedHash) {
        return hashHex === expectedHash;
      }

      // 否则返回true，表示哈希计算成功
      return true;
    } catch (error) {
      console.error("文件签名验证失败:", error);
      return false;
    }
  }

  // 检查文件内容安全性
  static validateFileContent(content: string): {
    isValid: boolean;
    risks: string[];
  } {
    const risks: string[] = [];

    // 检查恶意脚本
    if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(content)) {
      risks.push("包含可疑的脚本内容");
    }

    // 检查SQL注入模式
    if (
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/gi.test(content)
    ) {
      risks.push("包含可疑的SQL命令");
    }

    // 检查命令注入模式
    if (/(\b(exec|eval|system|shell_exec)\b)/gi.test(content)) {
      risks.push("包含可疑的系统命令");
    }

    return {
      isValid: risks.length === 0,
      risks,
    };
  }

  // 格式化文件大小
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // 检查用户名安全性
  static validateUsername(username: string): {
    isValid: boolean;
    message?: string;
  } {
    // 长度检查
    if (username.length < 3) {
      return { isValid: false, message: "用户名至少3个字符" };
    }

    if (username.length > 20) {
      return { isValid: false, message: "用户名不能超过20个字符" };
    }

    // 字符检查
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, message: "用户名只能包含字母、数字和下划线" };
    } // 保留字检查
    const reservedWords = ["root", "system", "guest", "anonymous"];
    if (reservedWords.includes(username.toLowerCase())) {
      return { isValid: false, message: "不能使用系统保留用户名" };
    }

    return { isValid: true };
  }
}

export default SecurityUtils;
