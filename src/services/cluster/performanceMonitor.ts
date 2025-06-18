import { http } from "@/utils/request";
import type { PerformanceDataPoint } from "@/store";
import { EnvConfig } from "@/config/env";

// 配置区域
const USE_MOCK_DATA = EnvConfig.ENABLE_MOCK; // 通过环境变量控制是否使用模拟数据

interface MonitorResponse {
  value: PerformanceDataPoint[];
}

// 生成模拟数据
const generateMockData = (count: number = 20): PerformanceDataPoint[] => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const time = new Date(now.getTime() - (count - i) * 60000).toISOString();
    return {
      time,
      total: 100,
      used: Math.floor(Math.random() * 100),
      net_in: Math.random() * 10,
      net_out: Math.random() * 5,
    };
  });
};

// CPU监控
export const getCpuMonitor = async (hostname: string, interval: number) => {
  try {
    if (USE_MOCK_DATA) {
      return {
        value: generateMockData().map((data) => ({
          time: data.time,
          total: data.total,
          used: data.used,
        })),
      };
    }

    const response = await http.post<MonitorResponse>("/node/cpu_monitor", {
      hostname,
      interval,
    });
    return response.data;
  } catch (error) {
    console.error("获取CPU监控数据失败:", error);
    throw error;
  }
};

// 内存监控
export const getMemoryMonitor = async (hostname: string, interval: number) => {
  try {
    if (USE_MOCK_DATA) {
      return {
        value: generateMockData().map((data) => ({
          time: data.time,
          total: data.total,
          used: data.used,
        })),
      };
    }

    const response = await http.post<MonitorResponse>("/node/memory_monitor", {
      hostname,
      interval,
    });
    return response.data;
  } catch (error) {
    console.error("获取内存监控数据失败:", error);
    throw error;
  }
};

// 磁盘监控
export const getDiskMonitor = async (hostname: string, interval: number) => {
  try {
    if (USE_MOCK_DATA) {
      return {
        value: generateMockData().map((data) => ({
          time: data.time,
          total: data.total,
          used: data.used,
        })),
      };
    }

    const response = await http.post<MonitorResponse>("/node/disk_monitor", {
      hostname,
      interval,
    });
    return response.data;
  } catch (error) {
    console.error("获取磁盘监控数据失败:", error);
    throw error;
  }
};

// 网络监控
export const getNetworkMonitor = async (hostname: string, interval: number) => {
  try {
    if (USE_MOCK_DATA) {
      return {
        value: generateMockData().map((data) => ({
          time: data.time,
          net_in: data.net_in,
          net_out: data.net_out,
        })),
      };
    }

    const response = await http.post<MonitorResponse>("/node/network_monitor", {
      hostname,
      interval,
    });
    return response.data;
  } catch (error) {
    console.error("获取网络监控数据失败:", error);
    throw error;
  }
};
