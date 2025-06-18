/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-18 18:51:32
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-06-18 19:22:12
 * @FilePath: /KR-virt/src/services/systemSetting/index.ts
 * @Description: 系统设置服务 - 参考cluster集群服务的统一架构
 */

import { api, mockApi, type StandardResponse } from "@/utils/apiHelper";
import { EnvConfig } from "@/config/env";
import type {
  NtpServerConfig,
  TimeSyncStatusResponse,
  TimeSyncExecuteRequest,
  TimeSyncExecuteResponse,
} from "./types";

// 配置区域
const USE_MOCK_DATA = EnvConfig.ENABLE_MOCK; // 通过环境变量控制是否使用模拟数据

class SystemSettingService {
  private readonly BASE_URL = "/system_setting/time_sync";

  /**
   * 获取时间同步服务器配置
   */
  async getNtpServer(): Promise<StandardResponse<NtpServerConfig>> {
    if (USE_MOCK_DATA) {
      return mockApi.get(
        `${this.BASE_URL}/ntp_server`,
        {},
        {
          useMock: true,
          mockData: { address: "pool.ntp.org" },
          defaultSuccessMessage: "获取NTP服务器配置成功",
        }
      );
    }

    return api.get<NtpServerConfig>(
      `${this.BASE_URL}/ntp_server`,
      {},
      {
        defaultSuccessMessage: "获取NTP服务器配置成功",
        defaultErrorMessage: "获取NTP服务器配置失败，请稍后重试",
      }
    );
  }

  /**
   * 设置时间同步服务器
   */
  async setNtpServer(config: NtpServerConfig): Promise<StandardResponse<void>> {
    if (USE_MOCK_DATA) {
      return mockApi.put(`${this.BASE_URL}/ntp_server`, config, {
        useMock: true,
        mockData: {},
        defaultSuccessMessage: "NTP服务器配置保存成功",
      });
    }

    return api.put<void>(`${this.BASE_URL}/ntp_server`, config, {
      defaultSuccessMessage: "NTP服务器配置保存成功",
      defaultErrorMessage: "保存NTP服务器配置失败，请稍后重试",
    });
  }

  /**
   * 获取时间同步状态
   */
  async getTimeSyncStatus(): Promise<StandardResponse<TimeSyncStatusResponse>> {
    if (USE_MOCK_DATA) {
      const mockData: TimeSyncStatusResponse = {
        nodes: {
          "node-1": {
            sync_service: "NTP",
            service_status: "active",
            ntp_server_list: [
              {
                address: "pool.ntp.org",
                status: "synchronized",
              },
            ],
          },
          "node-2": {
            sync_service: "NTP",
            service_status: "active",
            ntp_server_list: [
              {
                address: "pool.ntp.org",
                status: "synchronized",
              },
            ],
          },
          "node-3": {
            sync_service: "NTP",
            service_status: "inactive",
            ntp_server_list: [
              {
                address: "pool.ntp.org",
                status: "unreachable",
              },
            ],
          },
        },
      };

      return mockApi.get(
        `${this.BASE_URL}/status`,
        {},
        {
          useMock: true,
          mockData,
          defaultSuccessMessage: "获取时间同步状态成功",
        }
      );
    }

    return api.get<TimeSyncStatusResponse>(
      `${this.BASE_URL}/status`,
      {},
      {
        defaultSuccessMessage: "获取时间同步状态成功",
        defaultErrorMessage: "获取时间同步状态失败，请稍后重试",
      }
    );
  }

  /**
   * 强制时间同步
   */
  async executeTimeSync(
    params: TimeSyncExecuteRequest = {}
  ): Promise<StandardResponse<TimeSyncExecuteResponse>> {
    if (USE_MOCK_DATA) {
      const mockData: TimeSyncExecuteResponse = {
        task_id: `task_${Date.now()}`,
        status: "running",
        message: "时间同步任务已启动",
      };

      return mockApi.post(`${this.BASE_URL}/execute`, params, {
        useMock: true,
        mockData,
        defaultSuccessMessage: "时间同步任务已启动",
      });
    }

    return api.post<TimeSyncExecuteResponse>(
      `${this.BASE_URL}/execute`,
      params,
      {
        defaultSuccessMessage: "时间同步任务已启动",
        defaultErrorMessage: "启动时间同步失败，请稍后重试",
      }
    );
  }

  /**
   * Mock数据检查集群状态（仅开发模式）
   */
  private async mockGetTimeSyncStatus(): Promise<TimeSyncStatusResponse> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      nodes: {
        "master-node": {
          sync_service: "NTP",
          service_status: "active",
          ntp_server_list: [
            {
              address: "pool.ntp.org",
              status: "synchronized",
            },
          ],
        },
        "worker-node-1": {
          sync_service: "NTP",
          service_status: "active",
          ntp_server_list: [
            {
              address: "pool.ntp.org",
              status: "synchronized",
            },
          ],
        },
        "worker-node-2": {
          sync_service: "NTP",
          service_status: "inactive",
          ntp_server_list: [
            {
              address: "pool.ntp.org",
              status: "unreachable",
            },
          ],
        },
      },
    };
  }
}

// 创建实例并导出
const systemSettingService = new SystemSettingService();

// 兼容原有的timeSyncApi导出
export const timeSyncApi = {
  getNtpServer: () => systemSettingService.getNtpServer(),
  setNtpServer: (config: NtpServerConfig) =>
    systemSettingService.setNtpServer(config),
  getTimeSyncStatus: () => systemSettingService.getTimeSyncStatus(),
  executeTimeSync: (params?: TimeSyncExecuteRequest) =>
    systemSettingService.executeTimeSync(params),
};

export default systemSettingService;
