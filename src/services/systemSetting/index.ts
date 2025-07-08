/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-06-18 18:51:32
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-08 18:21:56
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
  LicenseInfo,
  LicenseUploadResponse,
  LoginPolicyUpdateRequest,
  LoginPolicyResponse,
  StoragePolicyResponse,
  StoragePolicyUpdateRequest,
  StoragePolicySetResponse,
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
        },
      );
    }

    return api.get<NtpServerConfig>(
      `${this.BASE_URL}/ntp_server`,
      {},
      {
        defaultSuccessMessage: "获取NTP服务器配置成功",
        defaultErrorMessage: "获取NTP服务器配置失败，请稍后重试",
      },
    );
  }

  /**
   * 设置时间同步服务器
   */
  async setNtpServer(config: NtpServerConfig): Promise<StandardResponse<void>> {
    if (USE_MOCK_DATA) {
      return mockApi.put(`${this.BASE_URL}/ntp_server`, config, {
        useMock: true,
        mockData: undefined,
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
        },
      );
    }

    return api.get<TimeSyncStatusResponse>(
      `${this.BASE_URL}/status`,
      {},
      {
        defaultSuccessMessage: "获取时间同步状态成功",
        defaultErrorMessage: "获取时间同步状态失败，请稍后重试",
      },
    );
  }

  /**
   * 强制时间同步
   */
  async executeTimeSync(
    params: TimeSyncExecuteRequest = {},
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
      },
    );
  }

  // ===== 许可证管理相关方法 =====

  /**
   * 获取许可证信息
   */
  async getLicenseInfo(): Promise<StandardResponse<LicenseInfo>> {
    if (USE_MOCK_DATA) {
      const mockData: LicenseInfo = {
        device_code: "KR-VIRT-ENT-2024-001",
        expiry_date: "2025-12-31T23:59:59Z",
        active_status: "active",
      };

      return mockApi.get(
        "/system_setting/license",
        {},
        {
          useMock: true,
          mockData,
          defaultSuccessMessage: "获取许可证信息成功",
        },
      );
    }

    return api.get<LicenseInfo>(
      "/system_setting/license",
      {},
      {
        defaultSuccessMessage: "获取许可证信息成功",
        defaultErrorMessage: "获取许可证信息失败，请稍后重试",
      },
    );
  }

  /**
   * 上传许可证文件
   */
  async uploadLicense(
    file: File,
  ): Promise<StandardResponse<LicenseUploadResponse>> {
    if (USE_MOCK_DATA) {
      const mockData: LicenseUploadResponse = {
        message: "许可证上传成功",
        success: true,
      };

      return mockApi.post(
        "/system_setting/license/upload",
        { file },
        {
          useMock: true,
          mockData,
          defaultSuccessMessage: "许可证上传成功",
        },
      );
    }

    const formData = new FormData();
    formData.append("file", file);

    return api.post<LicenseUploadResponse>(
      "/system_setting/license/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        defaultSuccessMessage: "许可证上传成功",
        defaultErrorMessage: "许可证上传失败，请检查文件格式",
      },
    );
  }

  // ===== 登录策略管理相关方法 =====

  /**
   * 获取登录策略配置
   */
  async getLoginPolicy(): Promise<StandardResponse<LoginPolicyResponse>> {
    if (USE_MOCK_DATA) {
      const mockData: LoginPolicyResponse = {
        login_timeout_value: 30,
        login_max_retry_times: 5,
        enable_two_factor_auth: false,
      };

      return mockApi.get(
        "/system_setting/login_policy",
        {},
        {
          useMock: true,
          mockData,
          defaultSuccessMessage: "获取登录策略成功",
        },
      );
    }

    return api.get<LoginPolicyResponse>(
      "/system_setting/login_policy",
      {},
      {
        defaultSuccessMessage: "获取登录策略成功",
        defaultErrorMessage: "获取登录策略失败，请稍后重试",
      },
    );
  }

  /**
   * 更新登录策略配置
   */
  async updateLoginPolicy(
    policy: LoginPolicyUpdateRequest,
  ): Promise<StandardResponse<void>> {
    if (USE_MOCK_DATA) {
      return mockApi.put("/system_setting/login_policy", policy, {
        useMock: true,
        mockData: undefined,
        defaultSuccessMessage: "登录策略更新成功",
      });
    }

    return api.put<void>("/system_setting/login_policy", policy, {
      defaultSuccessMessage: "登录策略更新成功",
      defaultErrorMessage: "登录策略更新失败，请稍后重试",
    });
  }

  // ===== 存储策略管理相关方法 =====

  /**
   * 获取存储策略配置
   */
  async getStoragePolicy(): Promise<StandardResponse<StoragePolicyResponse>> {
    if (USE_MOCK_DATA) {
      const mockData: StoragePolicyResponse = {
        system_storage_id: 1,
        storage_threshold: 80,
        system_storage_threshold: 90,
      };

      return mockApi.get(
        "/system_setting/storage_policy",
        {},
        {
          useMock: true,
          mockData,
          defaultSuccessMessage: "获取存储策略成功",
        },
      );
    }

    return api.get<StoragePolicyResponse>(
      "/system_setting/storage_policy",
      {},
      {
        defaultSuccessMessage: "获取存储策略成功",
        defaultErrorMessage: "获取存储策略失败，请稍后重试",
      },
    );
  }

  /**
   * 设置存储策略配置
   */
  async setStoragePolicy(
    policy: StoragePolicyUpdateRequest,
  ): Promise<StandardResponse<StoragePolicySetResponse>> {
    if (USE_MOCK_DATA) {
      const mockData: StoragePolicySetResponse = {
        message: "存储策略设置成功",
      };

      return mockApi.put("/system_setting/storage_policy", policy, {
        useMock: true,
        mockData,
        defaultSuccessMessage: "存储策略设置成功",
      });
    }

    return api.put<StoragePolicySetResponse>("/system_setting/storage_policy", policy, {
      defaultSuccessMessage: "存储策略设置成功",
      defaultErrorMessage: "存储策略设置失败，请稍后重试",
    });
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

// 创建并导出系统设置服务实例
export const systemSettingService = new SystemSettingService();

// 导出类型
export * from "./types";

// 导出类（用于测试或特殊需求）
export { SystemSettingService };

// 默认导出
export default systemSettingService;
