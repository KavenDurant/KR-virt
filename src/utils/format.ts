/**
 * 格式化工具函数
 */

/**
 * 格式化存储单位（从GB开始往上递增）
 * @param value 数值，单位为GB，可能为null
 * @param precision 小数位数，默认为2
 * @returns 格式化后的字符串，如 "1.23 GB", "1.5 TB", "N/A"
 */
export const formatStorageSize = (
  value: number | null,
  precision: number = 2,
): string => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  const units = ["GB", "TB", "PB", "EB", "ZB", "YB"];
  let unitIndex = 0;
  let size = value;

  // 从GB开始，每1024进位到下一个单位
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // 格式化数值，去除不必要的小数点
  const formattedSize = Number(size.toFixed(precision));

  return `${formattedSize} ${units[unitIndex]}`;
};

/**
 * 格式化内存单位（从GB开始往上递增），用于内存显示
 * @param value 数值，单位为GB，可能为null
 * @param precision 小数位数，默认为2
 * @returns 格式化后的字符串，如 "1.23GB", "1.5TB", "N/A"
 */
export const formatMemorySize = (
  value: number | null,
  precision: number = 2,
): string => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  const units = ["GB", "TB", "PB", "EB"];
  let unitIndex = 0;
  let size = value;

  // 从GB开始，每1024进位到下一个单位
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // 格式化数值，去除不必要的小数点
  const formattedSize = Number(size.toFixed(precision));

  return `${formattedSize}${units[unitIndex]}`;
};

/**
 * 计算百分比
 * @param used 已使用量
 * @param total 总量
 * @returns 百分比数值，如果无法计算则返回null
 */
export const calculatePercentage = (
  used: number | null,
  total: number | null,
): number | null => {
  if (!used || !total || used <= 0 || total <= 0) {
    return null;
  }
  return Math.round((used / total) * 100);
};

/**
 * 格式化资源使用情况显示
 * @param used 已使用量
 * @param total 总量
 * @param unit 单位名称（如 "核", "GB"等）
 * @param precision 小数位数，默认为2
 * @returns 格式化后的资源使用字符串
 */
export const formatResourceUsage = (
  used: number | null,
  total: number | null,
  unit: string = "",
  precision: number = 2,
): { display: string; percentage: number | null } => {
  const percentage = calculatePercentage(used, total);

  if (percentage === null) {
    return {
      display: "N/A",
      percentage: null,
    };
  }

  // 如果是内存单位（GB），使用格式化函数
  if (unit === "GB" || unit === "gb") {
    const usedFormatted = formatMemorySize(used, precision);
    const totalFormatted = formatMemorySize(total, precision);
    return {
      display: `${usedFormatted}/${totalFormatted} (${percentage}%)`,
      percentage,
    };
  }

  // 其他单位直接显示
  const usedFormatted = used ? Number(used.toFixed(precision)) : 0;
  const totalFormatted = total ? Number(total.toFixed(precision)) : 0;

  return {
    display: `${usedFormatted}/${totalFormatted} ${unit} (${percentage}%)`,
    percentage,
  };
};

/**
 * 格式化运行时间（将秒转换为可读格式）
 * @param seconds 运行时间（秒）
 * @returns 格式化后的时间字符串，如 "2天 3小时 45分钟"
 */
export const formatUptime = (seconds: number | null): string => {
  if (!seconds || seconds <= 0) {
    return "未知";
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}天`);
  }
  if (hours > 0) {
    parts.push(`${hours}小时`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}分钟`);
  }

  // 如果小于1分钟，显示秒数
  if (parts.length === 0) {
    parts.push(`${seconds}秒`);
  }

  return parts.join(" ");
};

/**
 * 格式化网络吞吐量
 * @param mbps 网络吞吐量（Mbps）
 * @returns 格式化后的字符串
 */
export const formatNetworkThroughput = (mbps: number | null): string => {
  if (!mbps || mbps <= 0) {
    return "N/A";
  }

  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(1)} Gbps`;
  }

  return `${mbps} Mbps`;
};

/**
 * 格式化系统负载
 * @param loadAverage 系统负载字符串（格式: "0.8,1.2,1.5"）
 * @returns 格式化后的负载信息
 */
export const formatLoadAverage = (
  loadAverage: string | null,
): { display: string; status: "low" | "medium" | "high" } => {
  if (!loadAverage) {
    return { display: "N/A", status: "low" };
  }

  const loads = loadAverage.split(",").map((load) => parseFloat(load.trim()));
  if (loads.length !== 3) {
    return { display: "N/A", status: "low" };
  }

  const [load1, load5, load15] = loads;
  const maxLoad = Math.max(load1, load5, load15);

  let status: "low" | "medium" | "high" = "low";
  if (maxLoad > 2.0) {
    status = "high";
  } else if (maxLoad > 1.0) {
    status = "medium";
  }

  return {
    display: `${load1.toFixed(1)}, ${load5.toFixed(1)}, ${load15.toFixed(1)}`,
    status,
  };
};

/**
 * 获取电源状态的显示信息
 * @param powerState 电源状态
 * @returns 电源状态显示信息
 */
export const formatPowerState = (
  powerState: string | null,
): { text: string; color: string } => {
  switch (powerState) {
    case "powered_on":
      return { text: "已开机", color: "success" };
    case "powered_off":
      return { text: "已关机", color: "error" };
    case "standby":
      return { text: "待机", color: "warning" };
    default:
      return { text: "未知", color: "default" };
  }
};
