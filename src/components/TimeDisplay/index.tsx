/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-25 15:54:29
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-25 17:33:37
 * @FilePath: /KR-virt/src/components/TimeDisplay/index.tsx
 * @Description: 时间显示组件 - 使用useTimeZone Hook的示例
 */

import React from "react";
import { Tag, Tooltip, Typography } from "antd";
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useTimeZone, useTimezoneInfo } from "@/hooks";

const { Text } = Typography;

/**
 * 时间显示组件的属性接口
 */
export interface TimeDisplayProps {
  /** ISO 8601格式的时间字符串 */
  isoTime: string;
  /** 显示格式，默认为 'YYYY-MM-DD HH:mm:ss' */
  format?: string;
  /** 是否显示时区信息 */
  showTimezone?: boolean;
  /** 是否显示相对时间（如"2小时前"） */
  showRelative?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 是否启用调试模式 */
  debug?: boolean;
}

/**
 * 时间显示组件
 *
 * 使用useTimeZone Hook自动将服务器返回的ISO时间转换为用户本地时间
 *
 * @example
 * ```tsx
 * // 基本使用
 * <TimeDisplay isoTime="2025-06-25T15:54:29+00:00" />
 *
 * // 自定义格式
 * <TimeDisplay
 *   isoTime="2025-06-25T15:54:29+00:00"
 *   format="MM/DD/YYYY HH:mm"
 *   showTimezone
 * />
 *
 * // 显示相对时间
 * <TimeDisplay
 *   isoTime="2025-06-25T15:54:29+00:00"
 *   showRelative
 * />
 * ```
 */
export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  isoTime,
  format = "YYYY-MM-DD HH:mm:ss",
  showTimezone = false,
  showRelative = false,
  className,
  debug = false,
}) => {
  // 使用时区转换Hook
  const { localTime, isValid, error, convertedTime, timezoneInfo } =
    useTimeZone(isoTime, {
      format,
      debug,
    });

  // 获取时区信息
  const timezoneData = useTimezoneInfo();

  // 如果时间无效，显示错误状态
  if (!isValid) {
    return (
      <Tooltip title={error || "时间格式无效"}>
        <Tag
          icon={<ExclamationCircleOutlined />}
          color="error"
          className={className}
        >
          无效时间
        </Tag>
      </Tooltip>
    );
  }

  // 计算相对时间
  const getRelativeTime = () => {
    if (!convertedTime) return "";

    const now = convertedTime.clone();
    const diff = now.diff(convertedTime, "minute");

    if (Math.abs(diff) < 1) return "刚刚";
    if (Math.abs(diff) < 60)
      return `${Math.abs(diff)}分钟${diff > 0 ? "前" : "后"}`;

    const hourDiff = Math.floor(Math.abs(diff) / 60);
    if (hourDiff < 24) return `${hourDiff}小时${diff > 0 ? "前" : "后"}`;

    const dayDiff = Math.floor(hourDiff / 24);
    if (dayDiff < 30) return `${dayDiff}天${diff > 0 ? "前" : "后"}`;

    return localTime; // 超过30天显示具体时间
  };

  // 构建显示内容
  const displayContent = showRelative ? getRelativeTime() : localTime;

  // 构建Tooltip内容
  const tooltipContent = (
    <div>
      <div>
        <strong>本地时间:</strong> {localTime}
      </div>
      <div>
        <strong>原始时间:</strong> {isoTime}
      </div>
      {showTimezone && (
        <>
          <div>
            <strong>时区:</strong> {timezoneInfo.userTimezone}
          </div>
          <div>
            <strong>偏移量:</strong> {timezoneData.offsetString}
          </div>
        </>
      )}
      {showRelative && !showRelative && (
        <div>
          <strong>相对时间:</strong> {getRelativeTime()}
        </div>
      )}
    </div>
  );

  return (
    <Tooltip title={tooltipContent}>
      <Text
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "help",
        }}
      >
        <ClockCircleOutlined />
        {displayContent}
        {showTimezone && (
          <Tag color="blue">{timezoneInfo.userTimezone.split("/").pop()}</Tag>
        )}
      </Text>
    </Tooltip>
  );
};

/**
 * 批量时间显示组件
 * 用于显示多个时间的列表
 */
export interface BatchTimeDisplayProps {
  /** 时间数据数组 */
  timeData: Array<{
    id: string;
    label: string;
    isoTime: string;
  }>;
  /** 显示格式 */
  format?: string;
  /** 自定义样式类名 */
  className?: string;
}

export const BatchTimeDisplay: React.FC<BatchTimeDisplayProps> = ({
  timeData,
  format = "YYYY-MM-DD HH:mm:ss",
  className,
}) => {
  return (
    <div className={className}>
      {timeData.map(({ id, label, isoTime }) => (
        <div key={id} style={{ marginBottom: "8px" }}>
          <Text strong>{label}: </Text>
          <TimeDisplay isoTime={isoTime} format={format} />
        </div>
      ))}
    </div>
  );
};

/**
 * 时区信息显示组件
 * 显示当前用户的时区信息
 */
export const TimezoneInfoDisplay: React.FC<{ className?: string }> = ({
  className,
}) => {
  const timezoneData = useTimezoneInfo();

  return (
    <div className={className}>
      <Tag color="blue">
        <ClockCircleOutlined /> {timezoneData.timezone}
      </Tag>
      <Tag color="green">UTC{timezoneData.offsetString}</Tag>
    </div>
  );
};

export default TimeDisplay;
