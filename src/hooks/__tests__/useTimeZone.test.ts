/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTimeZone, useTimeZoneBatch, useTimezoneInfo } from "../useTimeZone";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// 扩展Day.js插件
dayjs.extend(utc);
dayjs.extend(timezone);

describe("useTimeZone Hook", () => {
  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();
  });

  describe("useTimeZone", () => {
    it("应该正确转换ISO 8601时间字符串到本地时间", () => {
      const isoTime = "2025-06-25T15:54:29+00:00";
      const { result } = renderHook(() => useTimeZone(isoTime));

      expect(result.current.isValid).toBe(true);
      expect(result.current.localTime).toMatch(
        /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
      );
      expect(result.current.error).toBeUndefined();
      expect(result.current.originalTime).toBeDefined();
      expect(result.current.convertedTime).toBeDefined();
    });

    it("应该使用自定义格式", () => {
      const isoTime = "2025-06-25T15:54:29+00:00";
      const customFormat = "MM/DD/YYYY HH:mm";
      const { result } = renderHook(() =>
        useTimeZone(isoTime, { format: customFormat }),
      );

      expect(result.current.isValid).toBe(true);
      expect(result.current.localTime).toMatch(
        /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/,
      );
    });

    it("应该处理无效的时间字符串", () => {
      const invalidTime = "invalid-time-string";
      const { result } = renderHook(() => useTimeZone(invalidTime));

      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.localTime).toBe("");
    });

    it("应该处理空字符串输入", () => {
      const { result } = renderHook(() => useTimeZone(""));

      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toBe("输入的时间字符串无效");
      expect(result.current.localTime).toBe("");
    });

    it("应该处理null或undefined输入", () => {
      const { result } = renderHook(() => useTimeZone(null as unknown));

      expect(result.current.isValid).toBe(false);
      expect(result.current.error).toBe("输入的时间字符串无效");
    });

    it("应该返回正确的时区信息", () => {
      const isoTime = "2025-06-25T15:54:29+00:00";
      const { result } = renderHook(() => useTimeZone(isoTime));

      expect(result.current.timezoneInfo).toBeDefined();
      expect(result.current.timezoneInfo.userTimezone).toBeDefined();
      expect(result.current.timezoneInfo.targetTimezone).toBeDefined();
      expect(typeof result.current.timezoneInfo.offset).toBe("number");
    });

    it("应该支持指定目标时区", () => {
      const isoTime = "2025-06-25T15:54:29+00:00";
      const targetTimezone = "Asia/Shanghai";
      const { result } = renderHook(() =>
        useTimeZone(isoTime, { targetTimezone }),
      );

      expect(result.current.isValid).toBe(true);
      expect(result.current.timezoneInfo.targetTimezone).toBe(targetTimezone);
    });

    it("应该在调试模式下输出日志", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const isoTime = "2025-06-25T15:54:29+00:00";

      renderHook(() => useTimeZone(isoTime, { debug: true }));

      expect(consoleSpy).toHaveBeenCalledWith(
        "[useTimeZone Debug]",
        expect.any(Object),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("useTimeZoneBatch", () => {
    it("应该正确处理多个时间字符串", () => {
      const timeStrings = [
        "2025-06-25T15:54:29+00:00",
        "2025-06-26T10:30:00+00:00",
        "2025-06-27T08:15:45+00:00",
      ];

      const { result } = renderHook(() => useTimeZoneBatch(timeStrings));

      expect(result.current).toHaveLength(3);
      result.current.forEach((timeResult) => {
        expect(timeResult.isValid).toBe(true);
        expect(timeResult.localTime).toMatch(
          /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
        );
        expect(timeResult.error).toBeUndefined();
      });
    });

    it("应该处理包含无效时间的数组", () => {
      const timeStrings = [
        "2025-06-25T15:54:29+00:00",
        "invalid-time",
        "2025-06-27T08:15:45+00:00",
      ];

      const { result } = renderHook(() => useTimeZoneBatch(timeStrings));

      expect(result.current).toHaveLength(3);
      expect(result.current[0].isValid).toBe(true);
      expect(result.current[1].isValid).toBe(false);
      expect(result.current[1].error).toBe("无效的时间格式");
      expect(result.current[2].isValid).toBe(true);
    });

    it("应该处理空数组", () => {
      const { result } = renderHook(() => useTimeZoneBatch([]));

      expect(result.current).toHaveLength(0);
    });
  });

  describe("useTimezoneInfo", () => {
    it("应该返回当前用户的时区信息", () => {
      const { result } = renderHook(() => useTimezoneInfo());

      expect(result.current.timezone).toBeDefined();
      expect(typeof result.current.offset).toBe("number");
      expect(result.current.offsetString).toMatch(/[+-]\d{2}:\d{2}/);
      expect(result.current.localTime).toMatch(
        /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
      );
      expect(result.current.utcTime).toMatch(
        /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
      );
    });
  });

  describe("边界情况和错误处理", () => {
    it("应该处理极端日期", () => {
      const extremeDates = [
        "1970-01-01T00:00:00+00:00", // Unix纪元开始
        "2038-01-19T03:14:07+00:00", // 32位时间戳上限附近
        "2099-12-31T23:59:59+00:00", // 未来日期
      ];

      extremeDates.forEach((date) => {
        const { result } = renderHook(() => useTimeZone(date));
        expect(result.current.isValid).toBe(true);
      });
    });

    it("应该处理不同的ISO格式", () => {
      const isoFormats = [
        "2025-06-25T15:54:29Z", // UTC标记
        "2025-06-25T15:54:29+08:00", // 带时区偏移
        "2025-06-25T15:54:29.123Z", // 带毫秒
        "2025-06-25T15:54:29.123+08:00", // 带毫秒和时区
      ];

      isoFormats.forEach((format) => {
        const { result } = renderHook(() => useTimeZone(format));
        expect(result.current.isValid).toBe(true);
      });
    });
  });
});
