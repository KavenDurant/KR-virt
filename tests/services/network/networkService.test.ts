/**
 * 网络服务单元测试
 * 测试网络服务的核心功能和数据结构
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import networkService from "@/services/network";

describe("NetworkService", () => {
  beforeEach(() => {
    // 清除所有模拟调用记录
    vi.clearAllMocks();
  });

  describe("getNodeNetworks", () => {
    it("应该能够调用 getNodeNetworks 方法", () => {
      expect(typeof networkService.getNodeNetworks).toBe("function");
    });

    it("应该返回正确的数据结构", async () => {
      const hostname = "test-node";
      const result = await networkService.getNodeNetworks(hostname);

      // 验证返回的基本结构
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("message");

      if (result.success && result.data) {
        // 验证数据结构
        expect(result.data).toHaveProperty("hostname");
        expect(result.data).toHaveProperty("networks");
        expect(Array.isArray(result.data.networks)).toBe(true);
        expect(result.data.hostname).toBe(hostname);
      }
    });

    it("应该返回包含正确字段的网络设备数据", async () => {
      const result = await networkService.getNodeNetworks("test-node");

      if (result.success && result.data && result.data.networks.length > 0) {
        const network = result.data.networks[0];

        // 验证必需字段
        expect(network).toHaveProperty("device");
        expect(network).toHaveProperty("type");
        expect(network).toHaveProperty("mac");
        expect(network).toHaveProperty("is_physical");
        expect(network).toHaveProperty("state");
        expect(network).toHaveProperty("mtu");
        expect(network).toHaveProperty("connection");
        expect(network).toHaveProperty("ip4_addresses");
        expect(network).toHaveProperty("ip4_gateway");
        expect(network).toHaveProperty("ip4_dns");
        expect(network).toHaveProperty("ip4_routes");
        expect(network).toHaveProperty("ip6_addresses");
        expect(network).toHaveProperty("ip6_gateway");
        expect(network).toHaveProperty("ip6_dns");
        expect(network).toHaveProperty("ip6_routes");

        // 验证数据类型
        expect(typeof network.device).toBe("string");
        expect(typeof network.type).toBe("string");
        expect(typeof network.mac).toBe("string");
        expect(typeof network.is_physical).toBe("boolean");
        expect(typeof network.state).toBe("string");
        expect(typeof network.mtu).toBe("number");
        expect(typeof network.connection).toBe("string");
        expect(Array.isArray(network.ip4_addresses)).toBe(true);
        expect(Array.isArray(network.ip4_dns)).toBe(true);
        expect(Array.isArray(network.ip4_routes)).toBe(true);
        expect(Array.isArray(network.ip6_addresses)).toBe(true);
        expect(Array.isArray(network.ip6_dns)).toBe(true);
        expect(Array.isArray(network.ip6_routes)).toBe(true);
      }
    });

    it("应该处理空主机名参数", async () => {
      const result = await networkService.getNodeNetworks();

      expect(result).toHaveProperty("success");
      if (result.success && result.data) {
        expect(result.data).toHaveProperty("hostname");
        expect(result.data).toHaveProperty("networks");
      }
    });
  });

  describe("数据验证方法", () => {
    describe("validateIP", () => {
      it("应该验证有效的 IPv4 地址", () => {
        expect(networkService.validateIP("192.168.1.1")).toBe(true);
        expect(networkService.validateIP("10.0.0.1")).toBe(true);
        expect(networkService.validateIP("172.16.0.1")).toBe(true);
        expect(networkService.validateIP("127.0.0.1")).toBe(true);
        expect(networkService.validateIP("0.0.0.0")).toBe(true);
        expect(networkService.validateIP("255.255.255.255")).toBe(true);
      });

      it("应该拒绝无效的 IPv4 地址", () => {
        expect(networkService.validateIP("256.1.1.1")).toBe(false);
        expect(networkService.validateIP("192.168.1")).toBe(false);
        expect(networkService.validateIP("192.168.1.1.1")).toBe(false);
        expect(networkService.validateIP("192.168.-1.1")).toBe(false);
        expect(networkService.validateIP("192.168.1.300")).toBe(false);
        expect(networkService.validateIP("")).toBe(false);
        expect(networkService.validateIP("invalid")).toBe(false);
      });
    });

    describe("validateMAC", () => {
      it("应该验证有效的 MAC 地址", () => {
        expect(networkService.validateMAC("00:11:22:33:44:55")).toBe(true);
        expect(networkService.validateMAC("AA:BB:CC:DD:EE:FF")).toBe(true);
        expect(networkService.validateMAC("aa:bb:cc:dd:ee:ff")).toBe(true);
        expect(networkService.validateMAC("00-11-22-33-44-55")).toBe(true);
        expect(networkService.validateMAC("AA-BB-CC-DD-EE-FF")).toBe(true);
      });

      it("应该拒绝无效的 MAC 地址", () => {
        expect(networkService.validateMAC("00:11:22:33:44")).toBe(false);
        expect(networkService.validateMAC("00:11:22:33:44:55:66")).toBe(false);
        expect(networkService.validateMAC("GG:11:22:33:44:55")).toBe(false);
        expect(networkService.validateMAC("00-11-22-33-44")).toBe(false);
        expect(networkService.validateMAC("")).toBe(false);
        expect(networkService.validateMAC("invalid")).toBe(false);
      });
    });
  });

  describe("文本映射方法", () => {
    it("应该正确映射网络类型文本", () => {
      expect(networkService.getNetworkTypeText("nat")).toBe("NAT网络");
      expect(networkService.getNetworkTypeText("bridge")).toBe("桥接网络");
      expect(networkService.getNetworkTypeText("isolated")).toBe("隔离网络");
      expect(networkService.getNetworkTypeText("unknown")).toBe("unknown");
    });

    it("应该正确映射驱动类型文本", () => {
      expect(networkService.getDriverTypeText("virtio")).toBe("VirtIO");
      expect(networkService.getDriverTypeText("e1000")).toBe("Intel E1000");
      expect(networkService.getDriverTypeText("rtl8139")).toBe("RTL8139");
      expect(networkService.getDriverTypeText("unknown")).toBe("unknown");
    });

    it("应该正确映射 Forward 模式文本", () => {
      expect(networkService.getForwardModeText("nat")).toBe("NAT");
      expect(networkService.getForwardModeText("route")).toBe("路由");
      expect(networkService.getForwardModeText("bridge")).toBe("桥接");
      expect(networkService.getForwardModeText("unknown")).toBe("unknown");
    });
  });

  describe("Mock 数据验证", () => {
    it("应该包含预期的网络设备", async () => {
      const result = await networkService.getNodeNetworks("test-node");

      if (result.success && result.data) {
        const networks = result.data.networks;
        const deviceNames = networks.map((n) => n.device);

        // 验证包含预期的设备
        expect(deviceNames).toContain("vmbr0");
        expect(deviceNames).toContain("virbr0");
        expect(deviceNames).toContain("virbr1");
      }
    });

    it("应该包含不同类型的网络设备", async () => {
      const result = await networkService.getNodeNetworks("test-node");

      if (result.success && result.data) {
        const networks = result.data.networks;

        // 应该包含bridge类型的设备
        const bridgeDevices = networks.filter((n) => n.type === "bridge");
        expect(bridgeDevices.length).toBeGreaterThan(0);

        // 验证设备具有有效的配置
        networks.forEach((network) => {
          expect(network.mtu).toBeGreaterThan(0);
          expect(network.mac).toMatch(
            /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
          );

          // IPv4地址格式验证
          if (network.ip4_addresses && network.ip4_addresses.length > 0) {
            network.ip4_addresses.forEach((addr) => {
              expect(addr).toHaveProperty("index");
              expect(addr).toHaveProperty("value");
              expect(typeof addr.index).toBe("number");
              expect(typeof addr.value).toBe("string");
            });
          }
        });
      }
    });
  });
});
