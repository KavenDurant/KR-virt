/**
 * 格式化工具函数
 */

/**
 * 格式化存储单位（从GB开始往上递增）
 * @param value 数值，单位为GB，可能为null
 * @param precision 小数位数，默认为2
 * @returns 格式化后的字符串，如 "1.23 GB", "1.5 TB", "N/A"
 */
export const formatStorageSize = (value: number | null, precision: number = 2): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const units = ['GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
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
export const formatMemorySize = (value: number | null, precision: number = 2): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const units = ['GB', 'TB', 'PB', 'EB'];
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
export const calculatePercentage = (used: number | null, total: number | null): number | null => {
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
  unit: string = '',
  precision: number = 2
): { display: string; percentage: number | null } => {
  const percentage = calculatePercentage(used, total);
  
  if (percentage === null) {
    return {
      display: 'N/A',
      percentage: null
    };
  }

  // 如果是内存单位（GB），使用格式化函数
  if (unit === 'GB' || unit === 'gb') {
    const usedFormatted = formatMemorySize(used, precision);
    const totalFormatted = formatMemorySize(total, precision);
    return {
      display: `${usedFormatted}/${totalFormatted} (${percentage}%)`,
      percentage
    };
  }

  // 其他单位直接显示
  const usedFormatted = used ? Number(used.toFixed(precision)) : 0;
  const totalFormatted = total ? Number(total.toFixed(precision)) : 0;
  
  return {
    display: `${usedFormatted}/${totalFormatted} ${unit} (${percentage}%)`,
    percentage
  };
};
