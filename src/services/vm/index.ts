import { api, mockApi, type StandardResponse } from "@/utils/apiHelper";
import { EnvConfig } from "@/config/env";
import type {
  CreateVMRequest,
  CreateVMResponse,
  VMListResponse,
  VMInfo,
  VMOperationRequest,
  DeleteVMRequest,
  VMOperationResponse,
  VMTreeResponse,
  SidebarHostNode,
  SidebarVMInfo,
} from "./types";

// 配置区域
const USE_MOCK_DATA = EnvConfig.ENABLE_MOCK;

/**
 * 虚拟机服务类
 */
class VMService {
  /**
   * 创建虚拟机
   * @param params 创建虚拟机参数
   * @returns 创建结果
   */
  async createVM(params: CreateVMRequest): Promise<StandardResponse<CreateVMResponse["data"]>> {
    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/vm/create",
        params,
        {
          useMock: true,
          mockData: {
            vm_uuid: `vm-${Date.now()}`,
            vm_name: params.vm_name,
          },
          defaultSuccessMessage: "虚拟机创建成功",
        }
      );
    }

    return api.post<CreateVMResponse["data"]>(
      "/vm/create",
      params,
      {
        defaultSuccessMessage: "虚拟机创建成功",
        defaultErrorMessage: "虚拟机创建失败",
      }
    );
  }

  /**
   * 获取虚拟机列表
   * @returns 虚拟机列表
   */
  async getVMList(): Promise<StandardResponse<VMListResponse>> {
    if (USE_MOCK_DATA) {
      const mockVMs: VMInfo[] = [
        {
          name: "web-server-01",
          hostname: "web-server-01",
          uuid: "vm-001-uuid",
          status: "running",
          cpu_count: 4,
          memory_gb: 8,
        },
        {
          name: "database-server-01",
          hostname: "db-server-01",
          uuid: "vm-002-uuid",
          status: "stopped",
          cpu_count: 8,
          memory_gb: 16,
        },
        {
          name: "app-server-01",
          hostname: "app-server-01",
          uuid: "vm-003-uuid",
          status: "running",
          cpu_count: 6,
          memory_gb: 12,
        },
      ];

      return mockApi.get(
        "/vm/summary",
        {},
        {
          useMock: true,
          mockData: { vms: mockVMs },
          defaultSuccessMessage: "获取虚拟机列表成功",
        }
      );
    }

    return api.get<VMListResponse>(
      "/vm/summary",
      {},
      {
        defaultSuccessMessage: "获取虚拟机列表成功",
        defaultErrorMessage: "获取虚拟机列表失败",
      }
    );
  }

  /**
   * 启动虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async startVM(vmName: string, hostname: string): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/vm/start",
        payload,
        {
          useMock: true,
          mockData: { message: "虚拟机启动成功" },
          defaultSuccessMessage: "虚拟机启动成功",
        }
      );
    }

    return api.post<VMOperationResponse>(
      "/vm/start",
      payload,
      {
        defaultSuccessMessage: "虚拟机启动成功",
        defaultErrorMessage: "虚拟机启动失败",
      }
    );
  }

  /**
   * 停止虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async stopVM(vmName: string, hostname: string): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/vm/stop",
        payload,
        {
          useMock: true,
          mockData: { message: "虚拟机停止成功" },
          defaultSuccessMessage: "虚拟机停止成功",
        }
      );
    }

    return api.post<VMOperationResponse>(
      "/vm/stop",
      payload,
      {
        defaultSuccessMessage: "虚拟机停止成功",
        defaultErrorMessage: "虚拟机停止失败",
      }
    );
  }

  /**
   * 重启虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async restartVM(vmName: string, hostname: string): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/vm/reboot",
        payload,
        {
          useMock: true,
          mockData: { message: "虚拟机重启成功" },
          defaultSuccessMessage: "虚拟机重启成功",
        }
      );
    }

    return api.post<VMOperationResponse>(
      "/vm/reboot",
      payload,
      {
        defaultSuccessMessage: "虚拟机重启成功",
        defaultErrorMessage: "虚拟机重启失败",
      }
    );
  }

  /**
   * 删除虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @param deleteDisk 是否删除磁盘
   * @returns 操作结果
   */
  async deleteVM(vmName: string, hostname: string, deleteDisk: boolean = true): Promise<StandardResponse<VMOperationResponse>> {
    const payload: DeleteVMRequest = {
      vm_name: vmName,
      hostname: hostname,
      delete_disk: deleteDisk,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/vm/delete",
        payload,
        {
          useMock: true,
          mockData: { message: "虚拟机删除成功" },
          defaultSuccessMessage: "虚拟机删除成功",
        }
      );
    }

    return api.post<VMOperationResponse>(
      "/vm/delete",
      payload,
      {
        defaultSuccessMessage: "虚拟机删除成功",
        defaultErrorMessage: "虚拟机删除失败",
      }
    );
  }

  /**
   * 强制停止虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async destroyVM(vmName: string, hostname: string): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/vm/destroy",
        payload,
        {
          useMock: true,
          mockData: { message: "虚拟机强制停止成功" },
          defaultSuccessMessage: "虚拟机强制停止成功",
        }
      );
    }

    return api.post<VMOperationResponse>(
      "/vm/destroy",
      payload,
      {
        defaultSuccessMessage: "虚拟机强制停止成功",
        defaultErrorMessage: "虚拟机强制停止失败",
      }
    );
  }

  /**
   * 挂起虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async pauseVM(vmName: string, hostname: string): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/vm/pause",
        payload,
        {
          useMock: true,
          mockData: { message: "虚拟机挂起成功" },
          defaultSuccessMessage: "虚拟机挂起成功",
        }
      );
    }

    return api.post<VMOperationResponse>(
      "/vm/pause",
      payload,
      {
        defaultSuccessMessage: "虚拟机挂起成功",
        defaultErrorMessage: "虚拟机挂起失败",
      }
    );
  }

  /**
   * 恢复虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async resumeVM(vmName: string, hostname: string): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post(
        "/vm/resume",
        payload,
        {
          useMock: true,
          mockData: { message: "虚拟机恢复成功" },
          defaultSuccessMessage: "虚拟机恢复成功",
        }
      );
    }

    return api.post<VMOperationResponse>(
      "/vm/resume",
      payload,
      {
        defaultSuccessMessage: "虚拟机恢复成功",
        defaultErrorMessage: "虚拟机恢复失败",
      }
    );
  }

  /**
   * 获取虚拟机详情
   * @param vmUuid 虚拟机UUID
   * @returns 虚拟机详情
   */
  async getVMDetail(vmUuid: string): Promise<StandardResponse<VMInfo>> {
    if (USE_MOCK_DATA) {
      const mockVM: VMInfo = {
        name: "mock-vm",
        hostname: "mock-vm-hostname",
        uuid: vmUuid,
        status: "running",
        cpu_count: 4,
        memory_gb: 8,
      };

      return mockApi.get(
        `/vm/${vmUuid}`,
        {},
        {
          useMock: true,
          mockData: mockVM,
          defaultSuccessMessage: "获取虚拟机详情成功",
        }
      );
    }

    return api.get<VMInfo>(
      `/vm/${vmUuid}`,
      {},
      {
        defaultSuccessMessage: "获取虚拟机详情成功",
        defaultErrorMessage: "获取虚拟机详情失败",
      }
    );
  }

  /**
   * 获取虚拟机树形结构（侧边栏用）
   * @returns 虚拟机树形结构数据
   */
  async getVMTree(): Promise<StandardResponse<VMTreeResponse>> {
    if (USE_MOCK_DATA) {
      const mockTreeData: VMTreeResponse = {
        nodes: [
          {
            hostname: "node-187",
            status: "online",
            vms: [
              {
                name: "web-server-01",
                hostname: "node-187",
                uuid: "vm-001-uuid",
                status: "running",
                cpu_count: 4,
                memory_gb: 8,
              },
              {
                name: "database-server-01",
                hostname: "node-187",
                uuid: "vm-002-uuid",
                status: "stopped",
                cpu_count: 8,
                memory_gb: 16,
              },
            ],
          },
          {
            hostname: "node-188",
            status: "online",
            vms: [
              {
                name: "app-server-01",
                hostname: "node-188",
                uuid: "vm-003-uuid",
                status: "running",
                cpu_count: 6,
                memory_gb: 12,
              },
            ],
          },
        ],
      };

      return mockApi.get(
        "/vm/tree",
        {},
        {
          useMock: true,
          mockData: mockTreeData,
          defaultSuccessMessage: "获取虚拟机树形结构成功",
        }
      );
    }

    return api.get<VMTreeResponse>(
      "/vm/tree",
      {},
      {
        defaultSuccessMessage: "获取虚拟机树形结构成功",
        defaultErrorMessage: "获取虚拟机树形结构失败",
      }
    );
  }
}

// 导出虚拟机服务实例
export const vmService = new VMService();

// 导出类型
export * from "./types"; 