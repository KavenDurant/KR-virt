import { api, mockApi, type StandardResponse } from "@/utils/apiHelper";
import { EnvConfig } from "@/config/env";
import type {
  CreateVMRequest,
  CreateVMResponse,
  VMListResponse,
  VMListUIResponse,
  VMInfo,
  VMApiInfo,
  VMOperationRequest,
  DeleteVMRequest,
  VMOperationResponse,
  VMTreeResponse,
  VMNetworkMountRequest,
  VMNATMountRequest,
  VMVLANMountRequest,
  VMNetworkUnmountRequest,
  VMCDRomMountRequest,
  VMCDRomUnmountRequest,
  VMUSBMountRequest,
  VMUSBUnmountRequest,
  VMUSBPlugRequest,
  VMUSBUnplugRequest,
  VMDiskMountRequest,
  VMDiskUnmountRequest,
} from "./types";

// 配置区域
const USE_MOCK_DATA = EnvConfig.ENABLE_MOCK;

/**
 * 数据适配函数：将API返回的VMApiInfo转换为UI需要的VMInfo格式
 *
 * 优化说明：
 * - 增强了状态推断逻辑，支持更多状态类型
 * - 添加了配置验证和错误处理
 * - 提供了更详细的状态映射
 */
const adaptVMApiInfoToVMInfo = (apiInfo: VMApiInfo): VMInfo => {
  // 生成虚拟机UUID（如果API没有提供，可以用vm_name + hostname组合）
  const uuid = `${apiInfo.vm_name}-${apiInfo.hostname}`;

  // 优化的状态推断逻辑
  let status = apiInfo.status || "unknown"; // 优先使用API返回的实际状态

  // 1. 首先检查是否有错误
  if (apiInfo.error !== null && apiInfo.error.trim() !== "") {
    status = "error";
  }
  // 2. 检查配置状态 - 但不覆盖已有的运行状态
  else if (!apiInfo.config_status) {
    status = apiInfo.status || "configuring"; // 如果有实际状态则保持，否则设为配置中
  }
  // 3. 检查配置完整性 - 但不覆盖已有的运行状态
  else if (
    !apiInfo.config ||
    !apiInfo.config.cpu_num ||
    !apiInfo.config.memory_gb
  ) {
    status = apiInfo.status || "configuring"; // 如果有实际状态则保持，否则设为配置中
  }
  // 4. 配置正常，使用API返回的实际状态
  else {
    status = apiInfo.status || "stopped"; // 如果API没有状态信息则默认为停止
  }

  // 安全地获取配置信息，提供默认值
  const config = apiInfo.config || {};
  const cpu_count = config.cpu_num || 0;
  const memory_gb = config.memory_gb || 0;

  return {
    vm_name: apiInfo.vm_name,
    hostname: apiInfo.hostname,
    uuid,
    status,
    cpu_count,
    memory_gb,
    config_status: apiInfo.config_status,
    error: apiInfo.error,
    // 新增：包含完整的配置信息
    config: apiInfo.config,
    boot_order: apiInfo.config?.boot || [],
    disk_info: apiInfo.config?.disk || [],
    network_info: apiInfo.config?.net || [],
    metadata: apiInfo.config?.metadata,
    created_at: apiInfo.config?.metadata?.updated_at
      ? new Date(
          parseFloat(apiInfo.config.metadata.updated_at) * 1000
        ).toLocaleString("zh-CN")
      : undefined,
    updated_at: apiInfo.config?.metadata?.updated_at
      ? new Date(
          parseFloat(apiInfo.config.metadata.updated_at) * 1000
        ).toLocaleString("zh-CN")
      : undefined,
  };
};

/**
 * 虚拟机服务类
 */
class VMService {
  /**
   * 创建虚拟机
   * @param params 创建虚拟机参数
   * @returns 创建结果
   */
  async createVM(
    params: CreateVMRequest
  ): Promise<StandardResponse<CreateVMResponse["data"]>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/create", params, {
        useMock: true,
        mockData: {
          vm_uuid: `vm-${Date.now()}`,
          vm_name: params.vm_name,
        },
        defaultSuccessMessage: "虚拟机创建成功",
      });
    }

    return api.post<CreateVMResponse["data"]>("/vm/create", params, {
      defaultSuccessMessage: "虚拟机创建成功",
      defaultErrorMessage: "虚拟机创建失败",
    });
  }

  /**
   * 获取虚拟机列表
   *
   * 优化说明：
   * - 增强了空数据处理逻辑
   * - 添加了数据验证和错误恢复机制
   * - 优化了错误信息提示
   * - 支持部分数据加载失败的场景
   *
   * @param params 筛选参数
   * @returns 虚拟机列表
   */
  async getVMList(
    params: {
      hostnames: string[] | null;
      vm_names: string[] | null;
    } = {
      hostnames: null,
      vm_names: null,
    }
  ): Promise<StandardResponse<VMListUIResponse>> {
    const payload = {
      hostnames: params.hostnames,
      vm_names: params.vm_names,
    };

    if (USE_MOCK_DATA) {
      const mockVMs: VMApiInfo[] = [
        {
          vm_name: "web-server-01",
          hostname: "node215",
          status: "running",
          config_status: true,
          config: {
            cpu_num: 4,
            memory_gb: 8.0,
            boot: ["hd"],
            disk: [
              {
                name: "vda",
                bus_type: "virtio",
                path: "/var/lib/libvirt/images/web-server-01.qcow2",
                format: "qcow2",
              },
            ],
            cdrom: [
              {
                name: "hdc",
                bus_type: "sata", 
                path: "/var/lib/libvirt/my_iso/Ubuntu-20.04.iso",
                format: "raw",
              },
              {
                name: "hdd",
                bus_type: "sata",
                path: "",
                format: "raw",
              },
            ],
            net: [
              {
                name: "virbr0",
                mac: "52:54:00:dd:24:8f",
                driver: "virtio",
                net_type: "bridge",
                bridge: "virbr0",
              },
            ],
            usb: [],
            pci: [],
            metadata: {
              digested: "76fb73078489bd37491d76c0bd8a2472",
              digesting: "76fb73078489bd37491d76c0bd8a2472",
              updated_at: "1751446505.9947593",
            },
          },
          error: null,
        },
        {
          vm_name: "database-server-01",
          hostname: "node216",
          status: "stopped",
          config_status: true,
          config: {
            cpu_num: 8,
            memory_gb: 16.0,
            boot: ["hd"],
            disk: [
              {
                name: "vda",
                bus_type: "virtio",
                path: "/var/lib/libvirt/images/database-server-01.qcow2",
                format: "qcow2",
              },
            ],
            cdrom: [],
            net: [
              {
                name: "virbr0",
                mac: "52:54:00:dd:24:90",
                driver: "virtio",
                net_type: "bridge",
                bridge: "virbr0",
              },
            ],
            usb: [],
            pci: [],
            metadata: {
              digested: "76fb73078489bd37491d76c0bd8a2473",
              digesting: "76fb73078489bd37491d76c0bd8a2473",
              updated_at: "1751446506.9947593",
            },
          },
          error: null,
        },
      ];

      // 转换mock数据格式
      const adaptedMockVMs = mockVMs.map(adaptVMApiInfoToVMInfo);

      return mockApi.post("/vm/config", payload, {
        useMock: true,
        mockData: { vms: adaptedMockVMs },
        defaultSuccessMessage: "获取虚拟机列表成功",
      });
    }

    try {
      // 调用实际API
      const apiResponse = await api.post<VMListResponse>(
        "/vm/config",
        payload,
        {
          defaultSuccessMessage: "获取虚拟机列表成功",
          defaultErrorMessage: "获取虚拟机列表失败",
        }
      );

      // 优化的数据处理逻辑
      if (apiResponse.success) {
        // 处理API成功但数据为空的情况
        if (!apiResponse.data || !Array.isArray(apiResponse.data.vms)) {
          console.warn("API返回数据格式异常，使用空数组", apiResponse.data);
          return {
            success: true,
            message: "获取虚拟机列表成功，但暂无数据",
            data: { vms: [] },
          };
        }

        // 处理空数组的情况
        if (apiResponse.data.vms.length === 0) {
          return {
            success: true,
            message: "获取虚拟机列表成功",
            data: { vms: [] },
          };
        }

        // 处理有数据的情况，进行数据适配和验证
        const validVMs: VMInfo[] = [];
        const invalidVMs: string[] = [];

        apiResponse.data.vms.forEach((vmApiInfo, index) => {
          try {
            // 基本数据验证
            if (!vmApiInfo.vm_name || !vmApiInfo.hostname) {
              invalidVMs.push(`第${index + 1}条记录：缺少必要字段`);
              return;
            }

            const adaptedVM = adaptVMApiInfoToVMInfo(vmApiInfo);
            validVMs.push(adaptedVM);
          } catch (error) {
            console.error(`适配第${index + 1}条虚拟机数据失败:`, error);
            invalidVMs.push(`第${index + 1}条记录：数据格式错误`);
          }
        });

        // 构建响应消息
        let message = "获取虚拟机列表成功";
        if (invalidVMs.length > 0) {
          message += `，但有 ${invalidVMs.length} 条记录存在问题`;
          console.warn("无效的虚拟机数据:", invalidVMs);
        }

        return {
          success: true,
          message,
          data: { vms: validVMs },
        };
      }

      // API调用失败的情况
      return {
        success: false,
        message: apiResponse.message || "获取虚拟机列表失败",
        data: { vms: [] },
      };
    } catch (error) {
      console.error("获取虚拟机列表时发生异常:", error);
      return {
        success: false,
        message: "网络错误或服务异常，请稍后重试",
        data: { vms: [] },
      };
    }
  }

  /**
   * 启动虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async startVM(
    vmName: string,
    hostname: string
  ): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/start", payload, {
        useMock: true,
        mockData: { message: "虚拟机启动成功" },
        defaultSuccessMessage: "虚拟机启动成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/start", payload, {
      defaultSuccessMessage: "虚拟机启动成功",
      defaultErrorMessage: "虚拟机启动失败",
    });
  }

  /**
   * 停止虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async stopVM(
    vmName: string,
    hostname: string
  ): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/stop", payload, {
        useMock: true,
        mockData: { message: "虚拟机停止成功" },
        defaultSuccessMessage: "虚拟机停止成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/stop", payload, {
      defaultSuccessMessage: "虚拟机停止成功",
      defaultErrorMessage: "虚拟机停止失败",
    });
  }

  /**
   * 重启虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async restartVM(
    vmName: string,
    hostname: string
  ): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/reboot", payload, {
        useMock: true,
        mockData: { message: "虚拟机重启成功" },
        defaultSuccessMessage: "虚拟机重启成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/reboot", payload, {
      defaultSuccessMessage: "虚拟机重启成功",
      defaultErrorMessage: "虚拟机重启失败",
    });
  }

  /**
   * 删除虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @param deleteDisk 是否删除磁盘
   * @returns 操作结果
   */
  async deleteVM(
    vmName: string,
    hostname: string,
    deleteDisk: boolean = true
  ): Promise<StandardResponse<VMOperationResponse>> {
    const payload: DeleteVMRequest = {
      vm_name: vmName,
      hostname: hostname,
      delete_disk: deleteDisk,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/delete", payload, {
        useMock: true,
        mockData: { message: "虚拟机删除成功" },
        defaultSuccessMessage: "虚拟机删除成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/delete", payload, {
      defaultSuccessMessage: "虚拟机删除成功",
      defaultErrorMessage: "虚拟机删除失败",
    });
  }

  /**
   * 强制停止虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async destroyVM(
    vmName: string,
    hostname: string
  ): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/destroy", payload, {
        useMock: true,
        mockData: { message: "虚拟机强制停止成功" },
        defaultSuccessMessage: "虚拟机强制停止成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/destroy", payload, {
      defaultSuccessMessage: "虚拟机强制停止成功",
      defaultErrorMessage: "虚拟机强制停止失败",
    });
  }

  /**
   * 挂起虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async pauseVM(
    vmName: string,
    hostname: string
  ): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/pause", payload, {
        useMock: true,
        mockData: { message: "虚拟机挂起成功" },
        defaultSuccessMessage: "虚拟机挂起成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/pause", payload, {
      defaultSuccessMessage: "虚拟机挂起成功",
      defaultErrorMessage: "虚拟机挂起失败",
    });
  }

  /**
   * 恢复虚拟机
   * @param vmName 虚拟机名称
   * @param hostname 主机名
   * @returns 操作结果
   */
  async resumeVM(
    vmName: string,
    hostname: string
  ): Promise<StandardResponse<VMOperationResponse>> {
    const payload: VMOperationRequest = {
      vm_name: vmName,
      hostname: hostname,
    };

    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/resume", payload, {
        useMock: true,
        mockData: { message: "虚拟机恢复成功" },
        defaultSuccessMessage: "虚拟机恢复成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/resume", payload, {
      defaultSuccessMessage: "虚拟机恢复成功",
      defaultErrorMessage: "虚拟机恢复失败",
    });
  }

  /**
   * 获取虚拟机详情
   * @param vmUuid 虚拟机UUID
   * @returns 虚拟机详情
   */
  async getVMDetail(vmUuid: string): Promise<StandardResponse<VMInfo>> {
    if (USE_MOCK_DATA) {
      const mockVM: VMInfo = {
        vm_name: "mock-vm",
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

  /**
   * 添加普通桥接网卡
   * @param data 网卡挂载请求参数
   * @returns 操作结果
   */
  async mountNetwork(
    data: VMNetworkMountRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/mount/network", data, {
        useMock: true,
        mockData: { message: "添加网络任务已发送成功" },
        defaultSuccessMessage: "添加网络任务已发送成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/mount/network", data, {
      defaultSuccessMessage: "添加网络任务已发送成功",
      defaultErrorMessage: "添加网络任务发送失败",
    });
  }

  /**
   * 添加NAT网络
   * @param data NAT网络挂载请求参数
   * @returns 操作结果
   */
  async mountNAT(
    data: VMNATMountRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/mount/nat", data, {
        useMock: true,
        mockData: { message: "添加NAT网络任务已发送成功" },
        defaultSuccessMessage: "添加NAT网络任务已发送成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/mount/nat", data, {
      defaultSuccessMessage: "添加NAT网络任务已发送成功",
      defaultErrorMessage: "添加NAT网络任务发送失败",
    });
  }

  /**
   * 添加VLAN网卡
   * @param data VLAN网卡挂载请求参数
   * @returns 操作结果
   */
  async mountVLAN(
    data: VMVLANMountRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/mount/vlan", data, {
        useMock: true,
        mockData: { message: "添加VLAN网络任务已发送成功" },
        defaultSuccessMessage: "添加VLAN网络任务已发送成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/mount/vlan", data, {
      defaultSuccessMessage: "添加VLAN网络任务已发送成功",
      defaultErrorMessage: "添加VLAN网络任务发送失败",
    });
  }

  /**
   * 移除网卡
   * @param data 网卡卸载请求参数
   * @returns 操作结果
   */
  async unmountNetwork(
    data: VMNetworkUnmountRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/unmount/network", data, {
        useMock: true,
        mockData: { message: "移除网络任务已发送成功" },
        defaultSuccessMessage: "移除网络任务已发送成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/unmount/network", data, {
      defaultSuccessMessage: "移除网络任务已发送成功",
      defaultErrorMessage: "移除网络任务发送失败",
    });
  }

  /**
   * 挂载虚拟光驱（加载ISO）
   * @param data 光驱挂载请求参数
   * @returns 操作结果
   */
  async mountCDRom(
    data: VMCDRomMountRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/mount/cdrom", data, {
        useMock: true,
        mockData: { message: "虚拟光驱挂载任务已发送成功" },
        defaultSuccessMessage: "虚拟光驱挂载任务已发送成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/mount/cdrom", data, {
      defaultSuccessMessage: "虚拟光驱挂载任务已发送成功",
      defaultErrorMessage: "虚拟光驱挂载任务发送失败",
    });
  }

  /**
   * 卸载虚拟光驱（移除ISO）
   * @param data 光驱卸载请求参数
   * @returns 操作结果
   */
  async unmountCDRom(
    data: VMCDRomUnmountRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/unmount/cdrom", data, {
        useMock: true,
        mockData: { message: "虚拟光驱卸载任务已发送成功" },
        defaultSuccessMessage: "虚拟光驱卸载任务已发送成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/unmount/cdrom", data, {
      defaultSuccessMessage: "虚拟光驱卸载任务已发送成功",
      defaultErrorMessage: "虚拟光驱卸载任务发送失败",
    });
  }

  /**
   * 挂载USB设备
   * @param data USB设备挂载请求参数
   * @returns 操作结果
   */
  async mountUSB(
    data: VMUSBMountRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/mount/usb", data, {
        useMock: true,
        mockData: { message: "USB设备挂载任务已发送成功" },
        defaultSuccessMessage: "USB设备挂载任务已发送成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/mount/usb", data, {
      defaultSuccessMessage: "USB设备挂载任务已发送成功",
      defaultErrorMessage: "USB设备挂载任务发送失败",
    });
  }

  /**
   * 卸载USB设备
   * @param data USB设备卸载请求参数
   * @returns 操作结果
   */
  async unmountUSB(
    data: VMUSBUnmountRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/unmount/usb", data, {
        useMock: true,
        mockData: { message: "USB设备卸载任务已发送成功" },
        defaultSuccessMessage: "USB设备卸载任务已发送成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/unmount/usb", data, {
      defaultSuccessMessage: "USB设备卸载任务已发送成功",
      defaultErrorMessage: "USB设备卸载任务发送失败",
    });
  }

  /**
   * 插拔USB设备
   * @param data USB设备插拔请求参数
   * @returns 操作结果
   */
  async plugUSB(
    data: VMUSBPlugRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/plug/usb", data, {
        useMock: true,
        mockData: { message: "USB设备插拔成功" },
        defaultSuccessMessage: "USB设备插拔成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/plug/usb", data, {
      defaultSuccessMessage: "USB设备插拔成功",
      defaultErrorMessage: "USB设备插拔失败",
    });
  }

  /**
   * 拔出USB设备
   * @param data USB设备拔出请求参数
   * @returns 操作结果
   */
  async unplugUSB(
    data: VMUSBUnplugRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/unplug/usb", data, {
        useMock: true,
        mockData: { message: "USB设备拔出成功" },
        defaultSuccessMessage: "USB设备拔出成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/unplug/usb", data, {
      defaultSuccessMessage: "USB设备拔出成功",
      defaultErrorMessage: "USB设备拔出失败",
    });
  }

  /**
   * 挂载磁盘
   * @param data 磁盘挂载请求参数
   * @returns 操作结果
   */
  async mountDisk(
    data: VMDiskMountRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/mount/disk", data, {
        useMock: true,
        mockData: { message: "磁盘挂载任务已发送成功" },
        defaultSuccessMessage: "磁盘挂载任务已发送成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/mount/disk", data, {
      defaultSuccessMessage: "磁盘挂载任务已发送成功",
      defaultErrorMessage: "磁盘挂载任务发送失败",
    });
  }

  /**
   * 卸载磁盘
   * @param data 磁盘卸载请求参数
   * @returns 操作结果
   */
  async unmountDisk(
    data: VMDiskUnmountRequest
  ): Promise<StandardResponse<VMOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/vm/unmount/disk", data, {
        useMock: true,
        mockData: { message: "磁盘卸载任务已发送成功" },
        defaultSuccessMessage: "磁盘卸载任务已发送成功",
      });
    }

    return api.post<VMOperationResponse>("/vm/unmount/disk", data, {
      defaultSuccessMessage: "磁盘卸载任务已发送成功",
      defaultErrorMessage: "磁盘卸载任务发送失败",
    });
  }
}

// 导出虚拟机服务实例
export const vmService = new VMService();

// 导出类型
export * from "./types";
