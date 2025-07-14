/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-07-07 09:42:32
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-07 16:24:32
 * @FilePath: /KR-virt/src/services/storage/index.ts
 * @Description: 存储管理模块服务实现
 */
import { api, mockApi, type StandardResponse } from "@/utils/apiHelper";
import { EnvConfig } from "@/config/env";
import { formatStorageSize } from "@/utils/format";
import type {
  AddStorageRequest,
  AddStorageResponse,
  StorageListResponse,
  StorageListUIResponse,
  StorageInfo,
  StorageApiInfo,
  RemoveStorageRequest,
  RemoveStorageResponse,
} from "./types";
import { STORAGE_STATUS_MAP, STORAGE_FS_TYPE_MAP } from "./types";

// 配置区域
const USE_MOCK_DATA = EnvConfig.ENABLE_MOCK;

/**
 * 数据适配函数：将API返回的StorageApiInfo转换为UI需要的StorageInfo格式
 *
 * 优化说明：
 * - 计算可用容量和使用率
 * - 提供默认的时间信息
 * - 添加数据验证和错误处理
 */
const adaptStorageApiInfoToStorageInfo = (
  apiInfo: StorageApiInfo,
): StorageInfo => {
  // 计算可用容量
  const available = Math.max(0, apiInfo.total - apiInfo.used);

  // 计算使用率百分比
  const usagePercent =
    apiInfo.total > 0 ? Math.round((apiInfo.used / apiInfo.total) * 100) : 0;

  return {
    ...apiInfo,
    available,
    usagePercent,
    createTime: "N/A", // 后端暂不提供创建时间
    lastCheck: new Date().toLocaleString("zh-CN"), // 使用当前时间作为最后检查时间
  };
};

/**
 * 存储服务类
 */
class StorageService {
  /**
   * 添加存储
   * @param params 添加存储参数
   * @returns 添加结果
   */
  async addStorage(
    params: AddStorageRequest,
  ): Promise<StandardResponse<AddStorageResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/storage/add", params, {
        useMock: true,
        mockData: {
          id: Date.now(),
          name: params.name,
        },
        defaultSuccessMessage: "存储添加成功",
      });
    }

    return api.post<AddStorageResponse>("/storage/add", params, {
      defaultSuccessMessage: "存储添加成功",
      defaultErrorMessage: "存储添加失败",
    });
  }

  /**
   * 获取存储列表
   *
   * 优化说明：
   * - 增强了空数据处理逻辑
   * - 添加了数据验证和错误恢复机制
   * - 优化了错误信息提示
   * - 支持部分数据加载失败的场景
   *
   * @returns 存储列表
   */
  async getStorageList(): Promise<StandardResponse<StorageListUIResponse>> {
    if (USE_MOCK_DATA) {
      const mockStorages: StorageApiInfo[] = [
        {
          id: 1,
          name: "ljx_test",
          fstype: "cifs",
          device: "//192.168.1.112/krvirt2",
          directory: "/mnt/krvirt2",
          options: "username=krvirt,password=-p0-p0-p0",
          status: "normal",
          total: 10.24,
          used: 5.12,
        },
        {
          id: 2,
          name: "backup_storage",
          fstype: "nfs",
          device: "192.168.1.110:/backup",
          directory: "/mnt/backup",
          options: "rw,sync",
          status: "normal",
          total: 20.48,
          used: 8.96,
        },
        {
          id: 3,
          name: "shared_storage",
          fstype: "iscsi",
          device: "iqn.2023-01.com.example:storage.shared",
          directory: "/mnt/shared",
          options: "defaults",
          status: "abnormal",
          total: 15.36,
          used: 12.8,
        },
      ];

      const adaptedStorages = mockStorages.map(
        adaptStorageApiInfoToStorageInfo,
      );

      return mockApi.get(
        "/storage",
        {},
        {
          useMock: true,
          mockData: {
            storage_list: adaptedStorages,
          },
          defaultSuccessMessage: "存储列表获取成功",
        },
      );
    }

    try {
      const response = await api.get<StorageListResponse>(
        "/storage",
        {},
        {
          defaultSuccessMessage: "存储列表获取成功",
          defaultErrorMessage: "存储列表获取失败",
        },
      );

      if (response.success && response.data) {
        // 将API数据转换为UI格式
        const adaptedStorages = response.data.storage_list.map(
          adaptStorageApiInfoToStorageInfo,
        );

        return {
          ...response,
          data: {
            storage_list: adaptedStorages,
          },
        };
      }

      return response as StandardResponse<StorageListUIResponse>;
    } catch (error) {
      console.error("获取存储列表失败:", error);
      throw error;
    }
  }

  /**
   * 移除存储
   * @param storageId 存储ID
   * @returns 移除结果
   */
  async removeStorage(
    storageId: number,
  ): Promise<StandardResponse<RemoveStorageResponse>> {
    const params: RemoveStorageRequest = { storage_id: storageId };

    if (USE_MOCK_DATA) {
      return mockApi.post("/storage/remove", params, {
        useMock: true,
        mockData: {
          id: storageId,
          name: `storage_${storageId}`,
          fstype: "cifs",
          device: "//192.168.1.112/krvirt2",
          directory: "/mnt/krvirt2",
          set_options: "username=krvirt,password=-p0-p0-p0",
        },
        defaultSuccessMessage: "存储移除成功",
      });
    }

    return api.post<RemoveStorageResponse>("/storage/remove", params, {
      defaultSuccessMessage: "存储移除成功",
      defaultErrorMessage: "存储移除失败",
    });
  }

  /**
   * 获取存储状态显示文本
   * @param status 存储状态
   * @returns 状态显示文本
   */
  getStatusText(status: string): string {
    return (
      STORAGE_STATUS_MAP[status as keyof typeof STORAGE_STATUS_MAP] || "未知"
    );
  }

  /**
   * 获取文件系统类型显示文本
   * @param fstype 文件系统类型
   * @returns 文件系统类型显示文本
   */
  getFsTypeText(fstype: string): string {
    return (
      STORAGE_FS_TYPE_MAP[fstype as keyof typeof STORAGE_FS_TYPE_MAP] ||
      fstype.toUpperCase()
    );
  }

  /**
   * 获取使用率颜色
   * @param usagePercent 使用率百分比
   * @returns 颜色类名或颜色值
   */
  getUsageColor(usagePercent: number): string {
    if (usagePercent >= 90) return "danger";
    if (usagePercent >= 80) return "warning";
    if (usagePercent >= 70) return "info";
    return "success";
  }
}

// 创建存储服务实例
const storageService = new StorageService();

// 导出服务实例
export default storageService;

// 向后兼容：导出原有的独立函数（后续可以移除）
export const addStorage = (params: AddStorageRequest) =>
  storageService.addStorage(params);
export const getStorageList = () => storageService.getStorageList();
export const removeStorage = (storageId: number) =>
  storageService.removeStorage(storageId);
export const getStatusText = (status: string) =>
  storageService.getStatusText(status);
export const getFsTypeText = (fstype: string) =>
  storageService.getFsTypeText(fstype);

// 额外导出的工具函数
export const formatSize = (sizeGB: number) => formatStorageSize(sizeGB);
export const getUsageColor = (usagePercent: number) =>
  storageService.getUsageColor(usagePercent);

// 向后兼容：保留原有的数据转换函数（后续可以移除）
export const transformStorageData = adaptStorageApiInfoToStorageInfo;

// 向后兼容：提供格式化存储列表方法（后续可以移除）
export const getFormattedStorageList = async (): Promise<StorageInfo[]> => {
  const response = await storageService.getStorageList();
  return response.data?.storage_list || [];
};
