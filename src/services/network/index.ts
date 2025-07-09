/*
 * @Author: KavenDurant luojiaxin888@gmail.com
 * @Date: 2025-01-29 14:30:00
 * @LastEditors: KavenDurant luojiaxin888@gmail.com
 * @LastEditTime: 2025-07-09 17:20:40
 * @FilePath: /KR-virt/src/services/network/index.ts
 * @Description: 网络管理模块服务实现
 */
import { api, mockApi, type StandardResponse } from "@/utils/apiHelper";
import { EnvConfig } from "@/config/env";
import type {
  NetworkConfig,
  NetworkConfigListResponse,
  CreateNetworkRequest,
  DeleteNetworkRequest,
  NetworkOperationResponse,
  NodeNetwork,
  NodeNetworkListResponse,
} from "./types";
import { NETWORK_TYPE_MAP, DRIVER_TYPE_MAP, FORWARD_MODE_MAP } from "./types";

// 配置区域
const USE_MOCK_DATA = EnvConfig.ENABLE_MOCK;

/**
 * 网络服务类
 */
class NetworkService {
  /**
   * 获取网络配置列表
   *
   * @returns 网络配置列表
   */
  async getNetworkConfig(): Promise<
    StandardResponse<NetworkConfigListResponse>
  > {
    if (USE_MOCK_DATA) {
      const mockNetworks: NetworkConfig[] = [
        {
          net_name: "default",
          hostname: "node216",
          mac: "52:54:00:29:ef:21",
          driver: "virtio",
          net_type: "nat",
          bridge: "virbr0",
          vlan_id: null,
          ip_addr: "192.168.122.1",
          netmask: "255.255.255.0",
          dhcp_start: "192.168.122.2",
          dhcp_end: "192.168.122.254",
        },
        {
          net_name: "default",
          hostname: "node105",
          mac: "52:54:00:05:00:fd",
          driver: "virtio",
          net_type: "nat",
          bridge: "virbr0",
          vlan_id: null,
          ip_addr: "192.168.122.1",
          netmask: "255.255.255.0",
          dhcp_start: "192.168.122.2",
          dhcp_end: "192.168.122.254",
        },
        {
          net_name: "isolated_net",
          hostname: "node216",
          mac: "52:54:00:12:34:56",
          driver: "virtio",
          net_type: "isolated",
          bridge: "virbr1",
          vlan_id: 100,
          ip_addr: "10.0.0.1",
          netmask: "255.255.255.0",
          dhcp_start: "10.0.0.2",
          dhcp_end: "10.0.0.254",
        },
      ];

      return mockApi.get(
        "/network/config",
        {},
        {
          useMock: true,
          mockData: {
            networks: mockNetworks,
          },
          defaultSuccessMessage: "网络配置列表获取成功",
        }
      );
    }

    try {
      const response = await api.get<NetworkConfigListResponse>(
        "/network/config",
        {},
        {
          defaultSuccessMessage: "网络配置列表获取成功",
          defaultErrorMessage: "网络配置列表获取失败",
        }
      );

      return response;
    } catch (error) {
      console.error("获取网络配置列表失败:", error);
      throw error;
    }
  }

  /**
   * 获取节点网络列表
   *
   * @param hostname 主机名
   * @returns 节点网络列表
   */
  async getNodeNetworks(
    hostname?: string
  ): Promise<StandardResponse<NodeNetworkListResponse>> {
    if (USE_MOCK_DATA) {
      const mockNodeNetworks: NodeNetwork[] = [
        {
          is_physical: false,
          device: "vmbr0",
          type: "bridge",
          slave: null,
          mac: "E8:61:1F:64:11:4D",
          mtu: 1500,
          state: "100（已连接）",
          connection: "vmbr0",
          ip4_addresses: [{ index: 1, value: "192.168.1.214/24" }],
          ip4_gateway: "192.168.1.1",
          ip4_dns: [{ index: 1, value: "192.168.1.1" }],
          ip4_routes: [
            { dst: "0.0.0.0/0", nh: "192.168.1.1", mt: 425 },
            { dst: "192.168.1.0/24", nh: "0.0.0.0", mt: 425 },
          ],
          ip6_addresses: [{ index: 1, value: "192.168.1.214/24" }],
          ip6_gateway: "--",
          ip6_routes: [{ dst: "fe80::/64", nh: "::", mt: 1024 }],
          ip6_dns: [{ index: 1, value: "fe80::6424:3dff:fe33:ef61" }],
        },
        {
          is_physical: false,
          device: "virbr0",
          type: "bridge",
          slave: null,
          mac: "52:54:00:04:7B:0C",
          mtu: 1500,
          state: "100（连接（外部））",
          connection: "virbr0",
          ip4_addresses: [{ index: 1, value: "192.168.122.1/24" }],
          ip4_gateway: "--",
          ip4_dns: [],
          ip4_routes: [{ dst: "192.168.122.0/24", nh: "0.0.0.0", mt: 0 }],
          ip6_addresses: [{ index: 1, value: "192.168.122.1/24" }],
          ip6_gateway: "--",
          ip6_routes: [],
          ip6_dns: [],
        },
        {
          is_physical: false,
          device: "virbr1",
          type: "bridge",
          slave: null,
          mac: "52:54:00:C5:BF:73",
          mtu: 1500,
          state: "100（连接（外部））",
          connection: "virbr1",
          ip4_addresses: [{ index: 1, value: "192.168.100.1/24" }],
          ip4_gateway: "--",
          ip4_dns: [],
          ip4_routes: [{ dst: "192.168.100.0/24", nh: "0.0.0.0", mt: 0 }],
          ip6_addresses: [{ index: 1, value: "192.168.100.1/24" }],
          ip6_gateway: "--",
          ip6_routes: [],
          ip6_dns: [],
        },
      ];

      return mockApi.post(
        "/node/networks",
        { hostname },
        {
          useMock: true,
          mockData: {
            hostname: hostname || "node214",
            networks: mockNodeNetworks,
          },
          defaultSuccessMessage: "节点网络列表获取成功",
        }
      );
    }

    try {
      const response = await api.post<NodeNetworkListResponse>(
        "/node/networks",
        { hostname },
        {
          defaultSuccessMessage: "节点网络列表获取成功",
          defaultErrorMessage: "节点网络列表获取失败",
        }
      );
      return response;
    } catch (error) {
      console.error("获取节点网络列表失败:", error);
      throw error;
    }
  }

  /**
   * 创建网络
   *
   * @param params 创建网络参数
   * @returns 创建结果
   */
  async createNetwork(
    params: CreateNetworkRequest
  ): Promise<StandardResponse<NetworkOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/network/create", params, {
        useMock: true,
        mockData: {
          message: "创建网络配置成功",
        },
        defaultSuccessMessage: "网络创建成功",
      });
    }

    return api.post<NetworkOperationResponse>("/network/create", params, {
      defaultSuccessMessage: "网络创建成功",
      defaultErrorMessage: "网络创建失败",
    });
  }

  /**
   * 删除网络
   *
   * @param params 删除网络参数
   * @returns 删除结果
   */
  async deleteNetwork(
    params: DeleteNetworkRequest
  ): Promise<StandardResponse<NetworkOperationResponse>> {
    if (USE_MOCK_DATA) {
      return mockApi.post("/network/delete", params, {
        useMock: true,
        mockData: {
          message: "删除网络配置成功",
        },
        defaultSuccessMessage: "网络删除成功",
      });
    }

    return api.post<NetworkOperationResponse>("/network/delete", params, {
      defaultSuccessMessage: "网络删除成功",
      defaultErrorMessage: "网络删除失败",
    });
  }

  /**
   * 获取网络类型文本
   * @param netType 网络类型
   * @returns 网络类型文本
   */
  getNetworkTypeText(netType: string): string {
    return (
      NETWORK_TYPE_MAP[netType as keyof typeof NETWORK_TYPE_MAP] || netType
    );
  }

  /**
   * 获取驱动类型文本
   * @param driver 驱动类型
   * @returns 驱动类型文本
   */
  getDriverTypeText(driver: string): string {
    return DRIVER_TYPE_MAP[driver as keyof typeof DRIVER_TYPE_MAP] || driver;
  }

  /**
   * 获取Forward模式文本
   * @param forward Forward模式
   * @returns Forward模式文本
   */
  getForwardModeText(forward: string): string {
    return (
      FORWARD_MODE_MAP[forward as keyof typeof FORWARD_MODE_MAP] || forward
    );
  }

  /**
   * 验证IP地址格式
   * @param ip IP地址
   * @returns 是否有效
   */
  validateIP(ip: string): boolean {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;

    const parts = ip.split(".");
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  /**
   * 验证MAC地址格式
   * @param mac MAC地址
   * @returns 是否有效
   */
  validateMAC(mac: string): boolean {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  }
}

// 创建服务实例
const networkService = new NetworkService();

// 导出服务方法
export const getNetworkConfig = () => networkService.getNetworkConfig();

export const getNodeNetworks = (hostname?: string) =>
  networkService.getNodeNetworks(hostname);

export const createNetwork = (params: CreateNetworkRequest) =>
  networkService.createNetwork(params);

export const deleteNetwork = (params: DeleteNetworkRequest) =>
  networkService.deleteNetwork(params);

export const getNetworkTypeText = (netType: string) =>
  networkService.getNetworkTypeText(netType);

export const getDriverTypeText = (driver: string) =>
  networkService.getDriverTypeText(driver);

export const getForwardModeText = (forward: string) =>
  networkService.getForwardModeText(forward);

export const validateIP = (ip: string) => networkService.validateIP(ip);

export const validateMAC = (mac: string) => networkService.validateMAC(mac);

// 导出类型
export type {
  NetworkConfig,
  NetworkConfigListResponse,
  CreateNetworkRequest,
  DeleteNetworkRequest,
  NetworkOperationResponse,
  NodeNetwork,
  NodeNetworkListResponse,
} from "./types";

// 导出常量
export {
  NETWORK_TYPE,
  NETWORK_TYPE_MAP,
  DRIVER_TYPE,
  DRIVER_TYPE_MAP,
  FORWARD_MODE,
  FORWARD_MODE_MAP,
} from "./types";

// 默认导出服务实例
export default networkService;
