/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-05 10:00:00
 * @Description: TOTP验证服务 - 实现基于时间的一次性密码验证
 */

export interface TOTPVerifyResponse {
  success: boolean;
  message: string;
}

class TOTPService {
  private usedTokens = new Map<string, number>(); // 存储已使用的token和时间戳

  /**
   * 将Base32字符串转换为字节数组
   */
  private base32ToBytes(base32: string): Uint8Array {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";

    // 移除空格和转换为大写
    base32 = base32.replace(/\s/g, "").toUpperCase();

    // 转换为二进制字符串
    for (let i = 0; i < base32.length; i++) {
      const val = alphabet.indexOf(base32[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, "0");
    }

    // 转换为字节数组
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
    }

    return bytes;
  }

  /**
   * HMAC-SHA1实现
   */
  private async hmacSha1(
    key: Uint8Array,
    message: Uint8Array,
  ): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
    return new Uint8Array(signature);
  }

  /**
   * 将数字转换为8字节的大端序字节数组
   */
  private numberToBytes(num: number): Uint8Array {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(4, num, false); // 大端序
    return new Uint8Array(buffer);
  }

  /**
   * 生成TOTP令牌
   */
  private async generateTOTP(
    secret: string,
    timeStep: number,
  ): Promise<string> {
    try {
      // 解码Base32密钥
      const keyBytes = this.base32ToBytes(secret);

      // 生成时间步长的字节数组
      const timeBytes = this.numberToBytes(timeStep);

      // 计算HMAC-SHA1
      const hmac = await this.hmacSha1(keyBytes, timeBytes);

      // 动态截断
      const offset = hmac[hmac.length - 1] & 0xf;
      const code =
        (((hmac[offset] & 0x7f) << 24) |
          ((hmac[offset + 1] & 0xff) << 16) |
          ((hmac[offset + 2] & 0xff) << 8) |
          (hmac[offset + 3] & 0xff)) %
        1000000;

      // 返回6位数字
      return code.toString().padStart(6, "0");
    } catch (error) {
      console.error("生成TOTP失败:", error);
      throw new Error("生成TOTP失败");
    }
  }

  /**
   * 获取当前时间步长
   */
  private getCurrentTimeStep(): number {
    return Math.floor(Date.now() / 1000 / 30);
  }

  /**
   * 验证TOTP密钥是否有效
   */
  public isValidSecret(secret: string): boolean {
    try {
      // 检查Base32格式
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      const cleanSecret = secret.replace(/\s/g, "").toUpperCase();

      if (cleanSecret.length === 0) return false;

      for (const char of cleanSecret) {
        if (!alphabet.includes(char)) return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 生成当前时间的TOTP令牌
   */
  public async generateCurrentToken(secret: string): Promise<string> {
    const currentTimeStep = this.getCurrentTimeStep();
    return await this.generateTOTP(secret, currentTimeStep);
  }

  /**
   * 生成下一个时间步的TOTP令牌
   */
  public async generateNextToken(secret: string): Promise<string> {
    const nextTimeStep = this.getCurrentTimeStep() + 1;
    return await this.generateTOTP(secret, nextTimeStep);
  }

  /**
   * 获取当前时间步剩余秒数
   */
  public getTimeRemaining(): number {
    const currentTime = Math.floor(Date.now() / 1000);
    const stepTime = currentTime % 30;
    return 30 - stepTime;
  }

  /**
   * 验证TOTP令牌
   */
  public async verifyToken(
    secret: string,
    token: string,
  ): Promise<TOTPVerifyResponse> {
    try {
      // 基本验证
      if (!secret || !token) {
        return { success: false, message: "密钥或令牌不能为空" };
      }

      if (!this.isValidSecret(secret)) {
        return { success: false, message: "无效的密钥格式" };
      }

      if (!/^\d{6}$/.test(token)) {
        return { success: false, message: "令牌必须是6位数字" };
      }

      // 防重放攻击检查
      const tokenKey = `${secret}-${token}`;
      const currentTime = Math.floor(Date.now() / 1000);

      if (this.usedTokens.has(tokenKey)) {
        const usedTime = this.usedTokens.get(tokenKey)!;
        // 如果令牌在5分钟内被使用过，拒绝
        if (currentTime - usedTime < 300) {
          return { success: false, message: "令牌已被使用，请等待新的令牌" };
        }
      }

      // 获取当前时间步
      const currentTimeStep = this.getCurrentTimeStep();

      // 验证当前时间窗口和前后各一个窗口（允许时钟偏移）
      const timeWindows = [
        currentTimeStep - 1,
        currentTimeStep,
        currentTimeStep + 1,
      ];

      for (const timeStep of timeWindows) {
        const expectedToken = await this.generateTOTP(secret, timeStep);
        if (expectedToken === token) {
          // 记录已使用的令牌
          this.usedTokens.set(tokenKey, currentTime);

          // 清理过期的令牌记录
          this.cleanupUsedTokens();

          return { success: true, message: "验证成功" };
        }
      }

      return { success: false, message: "令牌无效或已过期" };
    } catch (error) {
      console.error("TOTP验证错误:", error);
      return { success: false, message: "验证过程中发生错误" };
    }
  }

  /**
   * 清理过期的已使用令牌记录
   */
  private cleanupUsedTokens(): void {
    const currentTime = Math.floor(Date.now() / 1000);
    const expiredKeys: string[] = [];

    this.usedTokens.forEach((usedTime, key) => {
      // 清理10分钟前的记录
      if (currentTime - usedTime > 600) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => {
      this.usedTokens.delete(key);
    });
  }

  /**
   * 生成TOTP设置URL（用于生成二维码）
   */
  public generateTOTPUrl(
    secret: string,
    accountName: string,
    issuerName: string = "KR虚拟化管理系统",
  ): string {
    const params = new URLSearchParams({
      secret,
      issuer: issuerName,
      algorithm: "SHA1",
      digits: "6",
      period: "30",
    });

    return `otpauth://totp/${encodeURIComponent(
      issuerName,
    )}:${encodeURIComponent(accountName)}?${params.toString()}`;
  }
}

// 导出单例实例
export const totpService = new TOTPService();

// 也导出类，如果需要创建多个实例
export { TOTPService };
