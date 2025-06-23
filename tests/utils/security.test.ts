/**
 * 安全工具函数测试
 * 测试覆盖：密码验证、用户名验证、输入清理、安全检查等
 */


// 设置测试超时时间
vi.setConfig({
  testTimeout: 10000, // 10秒超时
  hookTimeout: 5000,  // 5秒Hook超时
});

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { SecurityUtils } from "@/utils/security";
import type { PasswordValidationResult } from "@/utils/security";
import { boundaryTestData } from "../helpers/testData";

describe("SecurityUtils", () => {
  describe("密码验证", () => {
    test("应该验证强密码", () => {
      const strongPasswords = [
        "StrongPassword123!",  // 应该得到高分
        "MySecure@Pass2024",   // 应该得到高分
        "Complex#Password$789", // 应该得到高分
      ];

      strongPasswords.forEach(password => {
        const result = SecurityUtils.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(6); // 实际的验证标准
      });
    });

    test("应该拒绝弱密码", () => {
      const weakPasswords = [
        "123456",      // 太短，常见密码
        "password",    // 常见密码
        "abc123",      // 常见密码，字符序列
        "qwerty",      // 太短，常见模式
        "123456789",   // 字符序列，常见密码
      ];

      weakPasswords.forEach(password => {
        const result = SecurityUtils.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.score).toBeLessThan(6); // 实际的验证标准
        expect(result.suggestions.length).toBeGreaterThan(0);
      });
    });

    test("应该提供密码改进建议", () => {
      const result = SecurityUtils.validatePassword("weak");

      expect(result.isValid).toBe(false);
      expect(result.suggestions).toContain("密码长度至少8位");
      expect(result.suggestions).toContain("包含大写字母");
      expect(result.suggestions).toContain("包含数字");
      expect(result.suggestions).toContain("包含特殊字符");
    });

    test("应该处理空密码", () => {
      const result = SecurityUtils.validatePassword("");

      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(6);
      expect(result.suggestions).toContain("密码长度至少8位");
    });

    test("应该处理极长密码", () => {
      const longPassword = "StrongPassword123!" + "a".repeat(1000);
      const result = SecurityUtils.validatePassword(longPassword);

      // 极长密码应该被接受（如果其他条件满足）
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(6);
    });

    test("应该检测常见密码", () => {
      const commonPasswords = [
        "password123",
        "admin123",
        "test123",
        "user123",
        "guest123",
      ];

      commonPasswords.forEach(password => {
        const result = SecurityUtils.validatePassword(password);
        expect(result.suggestions).toContain("避免使用常见密码");
      });
    });

    test("应该检测字符序列", () => {
      const sequencePasswords = [
        "abc123def",
        "123456789",
        "abcdefgh",
      ];

      sequencePasswords.forEach(password => {
        const result = SecurityUtils.validatePassword(password);
        expect(result.suggestions).toContain("避免常见字符序列");
      });
    });

    test("应该评估密码复杂度等级", () => {
      // 测试不同强度等级
      const weakPassword = "123";
      const weakResult = SecurityUtils.validatePassword(weakPassword);
      expect(weakResult.strength).toBe("weak");

      const strongPassword = "StrongPassword123!";
      const strongResult = SecurityUtils.validatePassword(strongPassword);
      // 根据实际的评分逻辑，这个密码应该是"strong"等级
      expect(strongResult.strength).toBe("strong");
      expect(strongResult.score).toBeGreaterThanOrEqual(6);
    });
  });

  describe("用户名验证", () => {
    test("应该验证有效用户名", () => {
      const validUsernames = [
        "user123",
        "test_user",
        "admin",
        "User123",
      ];

      validUsernames.forEach(username => {
        const result = SecurityUtils.validateUsername(username);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });

    test("应该拒绝无效用户名", () => {
      const invalidUsernames = [
        "",           // 空用户名
        "a",          // 太短
        "ab",         // 太短
        "user@name",  // 包含@
        "user name",  // 包含空格
        "user#name",  // 包含特殊字符
        "用户名",      // 中文字符
        "user.name",  // 包含点号
        "user-name",  // 包含连字符
      ];

      invalidUsernames.forEach(username => {
        const result = SecurityUtils.validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.message).toBeDefined();
      });
    });

    test("应该处理边界长度用户名", () => {
      // 最小长度（3位）
      const minUsername = "abc";
      const minResult = SecurityUtils.validateUsername(minUsername);
      expect(minResult.isValid).toBe(true);

      // 最大长度（20位）
      const maxUsername = "a".repeat(20);
      const maxResult = SecurityUtils.validateUsername(maxUsername);
      expect(maxResult.isValid).toBe(true);

      // 超过最大长度
      const tooLongUsername = "a".repeat(21);
      const tooLongResult = SecurityUtils.validateUsername(tooLongUsername);
      expect(tooLongResult.isValid).toBe(false);
      expect(tooLongResult.message).toBe("用户名不能超过20个字符");
    });

    test("应该检测保留用户名", () => {
      const reservedUsernames = [
        "root",
        "system",
        "guest",
        "anonymous",
        "ROOT", // 大小写不敏感
        "System",
      ];

      reservedUsernames.forEach(username => {
        const result = SecurityUtils.validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe("不能使用系统保留用户名");
      });
    });

    test("应该检测非法字符", () => {
      const invalidCharUsernames = [
        "user@name",
        "user name",
        "user#name",
        "user.name",
        "user-name",
        "用户名",
      ];

      invalidCharUsernames.forEach(username => {
        const result = SecurityUtils.validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe("用户名只能包含字母、数字和下划线");
      });
    });
  });

  describe("简单加密解密", () => {
    test("应该加密和解密数据", () => {
      const originalData = "sensitive information";
      const password = "encryption_key_123";

      const encrypted = SecurityUtils.simpleEncrypt(originalData, password);
      expect(encrypted).not.toBe(originalData);
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = SecurityUtils.simpleDecrypt(encrypted, password);
      expect(decrypted).toBe(originalData);
    });

    test("应该处理错误的解密密钥", () => {
      const originalData = "sensitive information";
      const correctPassword = "correct_key";
      const wrongPassword = "wrong_key";

      const encrypted = SecurityUtils.simpleEncrypt(originalData, correctPassword);

      // 使用错误密钥解密应该返回不同结果
      const decrypted = SecurityUtils.simpleDecrypt(encrypted, wrongPassword);
      expect(decrypted).not.toBe(originalData);
    });

    test("应该处理空数据加密", () => {
      const password = "test_key";

      const encrypted = SecurityUtils.simpleEncrypt("", password);
      const decrypted = SecurityUtils.simpleDecrypt(encrypted, password);

      expect(decrypted).toBe("");
    });

    test("应该处理长数据加密", () => {
      const longData = "long data ".repeat(100);
      const password = "test_key";

      const encrypted = SecurityUtils.simpleEncrypt(longData, password);
      const decrypted = SecurityUtils.simpleDecrypt(encrypted, password);

      expect(decrypted).toBe(longData);
    });

    test("应该处理无效的加密数据", () => {
      const invalidEncrypted = "invalid_base64_data";
      const password = "test_key";

      const result = SecurityUtils.simpleDecrypt(invalidEncrypted, password);
      expect(result).toBe("");
    });
  });

  describe("安全随机字符串生成", () => {
    test("应该生成指定长度的随机字符串", () => {
      const lengths = [8, 16, 32, 64];
      
      lengths.forEach(length => {
        const randomString = SecurityUtils.generateSecureString(length);
        expect(randomString.length).toBe(length);
      });
    });

    test("应该生成不同的随机字符串", () => {
      const strings = Array.from({ length: 10 }, () => 
        SecurityUtils.generateSecureString(32)
      );
      
      // 所有字符串应该不同
      const uniqueStrings = new Set(strings);
      expect(uniqueStrings.size).toBe(strings.length);
    });

    test("应该包含预期的字符集", () => {
      const randomString = SecurityUtils.generateSecureString(100);
      
      // 应该包含大小写字母、数字和特殊字符
      expect(/[A-Z]/.test(randomString)).toBe(true);
      expect(/[a-z]/.test(randomString)).toBe(true);
      expect(/[0-9]/.test(randomString)).toBe(true);
      expect(/[!@#$%^&*]/.test(randomString)).toBe(true);
    });

    test("应该处理默认长度", () => {
      const randomString = SecurityUtils.generateSecureString();
      expect(randomString.length).toBe(32); // 默认长度
    });
  });

  describe("文件内容安全检查", () => {
    test("应该检测恶意脚本", () => {
      const maliciousContents = [
        "<script>alert('xss')</script>",
        "<script src='evil.js'></script>",
        "some text <script>malicious()</script> more text",
      ];

      maliciousContents.forEach(content => {
        const result = SecurityUtils.validateFileContent(content);
        expect(result.isValid).toBe(false);
        expect(result.risks).toContain("包含可疑的脚本内容");
      });
    });

    test("应该检测SQL注入", () => {
      const sqlContents = [
        "SELECT * FROM users",
        "DROP TABLE users",
        "INSERT INTO users VALUES",
        "DELETE FROM users WHERE",
      ];

      sqlContents.forEach(content => {
        const result = SecurityUtils.validateFileContent(content);
        expect(result.isValid).toBe(false);
        expect(result.risks).toContain("包含可疑的SQL命令");
      });
    });

    test("应该检测命令注入", () => {
      const commandContents = [
        "exec('rm -rf /')",
        "eval(malicious_code)",
        "system('cat /etc/passwd')",
        "shell_exec('ls -la')",
      ];

      commandContents.forEach(content => {
        const result = SecurityUtils.validateFileContent(content);
        expect(result.isValid).toBe(false);
        expect(result.risks).toContain("包含可疑的系统命令");
      });
    });

    test("应该接受安全内容", () => {
      const safeContents = [
        "This is normal text content",
        "Configuration file with settings",
        "JSON data: {\"key\": \"value\"}",
        "Regular document content",
      ];

      safeContents.forEach(content => {
        const result = SecurityUtils.validateFileContent(content);
        expect(result.isValid).toBe(true);
        expect(result.risks).toHaveLength(0);
      });
    });

    test("应该处理空文件内容", () => {
      const result = SecurityUtils.validateFileContent("");
      expect(result.isValid).toBe(true);
      expect(result.risks).toHaveLength(0);
    });
  });

  describe("文件大小格式化", () => {
    test("应该正确格式化文件大小", () => {
      expect(SecurityUtils.formatFileSize(0)).toBe("0 B");
      expect(SecurityUtils.formatFileSize(1024)).toBe("1 KB");
      expect(SecurityUtils.formatFileSize(1048576)).toBe("1 MB");
      expect(SecurityUtils.formatFileSize(1073741824)).toBe("1 GB");
    });

    test("应该处理小数文件大小", () => {
      expect(SecurityUtils.formatFileSize(1536)).toBe("1.5 KB");
      expect(SecurityUtils.formatFileSize(1572864)).toBe("1.5 MB");
    });

    test("应该处理极大文件大小", () => {
      const largeSize = 1024 * 1024 * 1024 * 10; // 10GB
      const result = SecurityUtils.formatFileSize(largeSize);
      expect(result).toContain("GB");
    });
  });

  describe("边界情况和错误处理", () => {
    test("应该处理极端用户名长度", () => {
      // 测试极长用户名
      const longUsername = "a".repeat(100);
      const result = SecurityUtils.validateUsername(longUsername);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("用户名不能超过20个字符");
    });

    test("应该处理空用户名", () => {
      const result = SecurityUtils.validateUsername("");
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("用户名至少3个字符");
    });

    test("应该处理特殊字符密码", () => {
      const specialPassword = "P@ssw0rd!#$%^&*()";
      const result = SecurityUtils.validatePassword(specialPassword);
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
      expect(typeof result.score).toBe("number");
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    test("应该处理Unicode字符", () => {
      const unicodeUsername = "用户名123";
      const result = SecurityUtils.validateUsername(unicodeUsername);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe("用户名只能包含字母、数字和下划线");
    });
  });
});
