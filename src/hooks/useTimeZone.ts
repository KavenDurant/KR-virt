/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-25 15:54:29
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-25 17:33:11
 * @FilePath: /KR-virt/src/hooks/useTimeZone.ts
 * @Description: 时区处理和时间格式转换自定义Hook
 */

import { useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// 扩展Day.js插件
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 时区处理Hook的选项接口
 */
export interface UseTimeZoneOptions {
  /** 输出格式，默认为 'YYYY-MM-DD HH:mm:ss' */
  format?: string;
  /** 目标时区，默认为用户本地时区 */
  targetTimezone?: string;
  /** 是否启用调试模式 */
  debug?: boolean;
}

/**
 * 时区处理Hook的返回值接口
 */
export interface UseTimeZoneResult {
  /** 转换后的本地时间字符串 */
  localTime: string;
  /** 时间是否有效 */
  isValid: boolean;
  /** 错误信息（如果有） */
  error?: string;
  /** 原始时间对象 */
  originalTime?: dayjs.Dayjs;
  /** 转换后的时间对象 */
  convertedTime?: dayjs.Dayjs;
  /** 检测到的时区信息 */
  timezoneInfo: {
    /** 用户本地时区 */
    userTimezone: string;
    /** 目标时区 */
    targetTimezone: string;
    /** 时区偏移量（分钟） */
    offset: number;
  };
}

/**
 * 时区处理和时间格式转换自定义Hook
 *
 * @param isoTimeString ISO 8601格式的时间字符串
 * @param options 配置选项
 * @returns 时区处理结果
 *
 * @example
 * ```typescript
 * // 基本使用
 * const { localTime, isValid } = useTimeZone('2025-06-25T15:54:29+00:00');
 *
 * // 自定义格式
 * const { localTime } = useTimeZone('2025-06-25T15:54:29+00:00', {
 *   format: 'MM/DD/YYYY HH:mm'
 * });
 *
 * // 指定目标时区
 * const { localTime } = useTimeZone('2025-06-25T15:54:29+00:00', {
 *   targetTimezone: 'Asia/Shanghai'
 * });
 * ```
 */
export const useTimeZone = (
  isoTimeString: string,
  options: UseTimeZoneOptions = {}
): UseTimeZoneResult => {
  const {
    format = "YYYY-MM-DD HH:mm:ss",
    targetTimezone,
    debug = false,
  } = options;

  const result = useMemo(() => {
    // 获取用户本地时区
    const userTimezone = dayjs.tz.guess();
    const finalTargetTimezone = targetTimezone || userTimezone;

    // 初始化返回值
    const baseResult = {
      localTime: "",
      isValid: false,
      timezoneInfo: {
        userTimezone,
        targetTimezone: finalTargetTimezone,
        offset: 0,
      },
    };

    // 输入验证
    if (!isoTimeString || typeof isoTimeString !== "string") {
      return {
        ...baseResult,
        error: "输入的时间字符串无效",
      };
    }

    try {
      // 解析ISO时间字符串
      const originalTime = dayjs(isoTimeString);

      // 验证时间是否有效
      if (!originalTime.isValid()) {
        return {
          ...baseResult,
          error: "无法解析时间字符串，请确保格式正确",
        };
      }

      // 转换到目标时区
      const convertedTime = originalTime.tz(finalTargetTimezone);

      // 格式化输出
      const localTime = convertedTime.format(format);

      // 计算时区偏移量
      const offset = convertedTime.utcOffset();

      // 调试信息
      if (debug) {
        console.log("[useTimeZone Debug]", {
          input: isoTimeString,
          originalTime: originalTime.format(),
          convertedTime: convertedTime.format(),
          userTimezone,
          targetTimezone: finalTargetTimezone,
          offset,
          output: localTime,
        });
      }

      return {
        localTime,
        isValid: true,
        originalTime,
        convertedTime,
        timezoneInfo: {
          userTimezone,
          targetTimezone: finalTargetTimezone,
          offset,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "时间转换过程中发生未知错误";

      if (debug) {
        console.error("[useTimeZone Error]", {
          input: isoTimeString,
          error: errorMessage,
        });
      }

      return {
        ...baseResult,
        error: errorMessage,
      };
    }
  }, [isoTimeString, format, targetTimezone, debug]);

  return result;
};

/**
 * 批量时间转换Hook
 * 用于处理多个时间字符串的转换
 *
 * @param timeStrings 时间字符串数组
 * @param options 配置选项
 * @returns 转换结果数组
 */
export const useTimeZoneBatch = (
  timeStrings: string[],
  options: UseTimeZoneOptions = {}
): UseTimeZoneResult[] => {
  return useMemo(() => {
    return timeStrings.map((timeString) => {
      // 为每个时间字符串创建独立的转换结果
      const originalTime = dayjs(timeString);
      const userTimezone = dayjs.tz.guess();
      const finalTargetTimezone = options.targetTimezone || userTimezone;

      if (!originalTime.isValid()) {
        return {
          localTime: "",
          isValid: false,
          error: "无效的时间格式",
          timezoneInfo: {
            userTimezone,
            targetTimezone: finalTargetTimezone,
            offset: 0,
          },
        };
      }

      const convertedTime = originalTime.tz(finalTargetTimezone);
      const localTime = convertedTime.format(
        options.format || "YYYY-MM-DD HH:mm:ss"
      );

      return {
        localTime,
        isValid: true,
        originalTime,
        convertedTime,
        timezoneInfo: {
          userTimezone,
          targetTimezone: finalTargetTimezone,
          offset: convertedTime.utcOffset(),
        },
      };
    });
  }, [timeStrings, options.format, options.targetTimezone]);
};

/**
 * 时区信息Hook
 * 获取当前用户的时区信息
 */
export const useTimezoneInfo = () => {
  return useMemo(() => {
    const userTimezone = dayjs.tz.guess();
    const now = dayjs();
    const offset = now.utcOffset();

    return {
      /** 用户时区标识 */
      timezone: userTimezone,
      /** UTC偏移量（分钟） */
      offset,
      /** 格式化的偏移量字符串 */
      offsetString: now.format("Z"),
      /** 当前本地时间 */
      localTime: now.format("YYYY-MM-DD HH:mm:ss"),
      /** 当前UTC时间 */
      utcTime: now.utc().format("YYYY-MM-DD HH:mm:ss"),
    };
  }, []);
};

export default useTimeZone;
