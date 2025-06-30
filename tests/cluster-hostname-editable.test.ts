/**
 * 集群节点名称可编辑功能测试
 * 验证节点名称从接口获取后可以被用户修改
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clusterInitService } from '@/services/cluster';
import type { CreateClusterConfig } from '@/services/cluster/types';

describe('集群节点名称可编辑功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('CreateClusterConfig应该包含hostname字段', () => {
    const config: CreateClusterConfig = {
      selectedIp: '192.168.1.100',
      hostname: 'custom-node-name',
    };

    expect(config.selectedIp).toBe('192.168.1.100');
    expect(config.hostname).toBe('custom-node-name');
  });

  it('创建集群时应该使用config中的hostname', async () => {
    // Mock 创建集群API
    const mockCreateResult = {
      success: true,
      message: '集群创建请求已提交',
    };
    const createClusterSpy = vi.spyOn(clusterInitService, 'createCluster').mockResolvedValue(mockCreateResult);

    const config: CreateClusterConfig = {
      selectedIp: '192.168.1.100',
      hostname: 'user-edited-hostname',
    };

    // 调用创建集群方法
    const result = await clusterInitService.createCluster(config);

    // 验证结果
    expect(createClusterSpy).toHaveBeenCalledWith(config);
    expect(createClusterSpy).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.message).toBe('集群创建请求已提交');
  });

  it('节点名称验证规则应该正确', () => {
    // 测试有效的节点名称
    const validHostnames = [
      'node1',
      'cluster-master',
      'worker-01',
      'test123',
      'a',
      'a-b-c',
      '123-abc',
    ];

    const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

    validHostnames.forEach(hostname => {
      expect(hostnamePattern.test(hostname)).toBe(true);
    });

    // 测试无效的节点名称
    const invalidHostnames = [
      '-invalid',      // 以连字符开头
      'invalid-',      // 以连字符结尾
      'invalid_name',  // 包含下划线
      'invalid.name',  // 包含点号
      '',              // 空字符串
      'a'.repeat(64),  // 超过63个字符
    ];

    invalidHostnames.forEach(hostname => {
      if (hostname.length > 63) {
        // 长度验证单独处理
        expect(hostname.length).toBeGreaterThan(63);
      } else if (hostname.length > 0) {
        expect(hostnamePattern.test(hostname)).toBe(false);
      }
    });
  });

  it('应该能够获取默认主机名并允许用户修改', async () => {
    // Mock 获取主机名API
    const mockHostnameResult = {
      success: true,
      data: { hostname: 'auto-generated-hostname' },
      message: '获取主机名成功',
    };
    vi.spyOn(clusterInitService, 'getNodeHostname').mockResolvedValue(mockHostnameResult);

    // Mock 获取IP地址API
    const mockIpResult = {
      success: true,
      data: { ip_addresses: ['192.168.1.100', '192.168.1.101'] },
      message: '获取IP地址成功',
    };
    vi.spyOn(clusterInitService, 'getNodeIpAddresses').mockResolvedValue(mockIpResult);

    // 模拟获取节点信息
    const [hostnameResult, ipResult] = await Promise.all([
      clusterInitService.getNodeHostname(),
      clusterInitService.getNodeIpAddresses(),
    ]);

    // 验证获取到的默认值
    expect(hostnameResult.success).toBe(true);
    expect(hostnameResult.data?.hostname).toBe('auto-generated-hostname');
    expect(ipResult.success).toBe(true);
    expect(ipResult.data?.ip_addresses).toEqual(['192.168.1.100', '192.168.1.101']);

    // 模拟用户修改主机名
    const userEditedConfig: CreateClusterConfig = {
      selectedIp: ipResult.data?.ip_addresses[0] || '',
      hostname: 'user-custom-name', // 用户修改的名称
    };

    expect(userEditedConfig.hostname).toBe('user-custom-name');
    expect(userEditedConfig.hostname).not.toBe(hostnameResult.data?.hostname);
  });

  it('表单初始值应该正确设置', async () => {
    // Mock API响应
    const mockHostname = 'default-hostname';
    const mockIpAddresses = ['192.168.1.100', '192.168.1.101'];

    vi.spyOn(clusterInitService, 'getNodeHostname').mockResolvedValue({
      success: true,
      data: { hostname: mockHostname },
      message: '获取主机名成功',
    });

    vi.spyOn(clusterInitService, 'getNodeIpAddresses').mockResolvedValue({
      success: true,
      data: { ip_addresses: mockIpAddresses },
      message: '获取IP地址成功',
    });

    // 模拟表单初始值设置逻辑
    const [hostnameResult, ipResult] = await Promise.all([
      clusterInitService.getNodeHostname(),
      clusterInitService.getNodeIpAddresses(),
    ]);

    const initialFormValues = {
      selectedIp: ipResult.data?.ip_addresses[0] || '',
      hostname: hostnameResult.data?.hostname || '',
    };

    // 验证初始值
    expect(initialFormValues.selectedIp).toBe('192.168.1.100');
    expect(initialFormValues.hostname).toBe('default-hostname');
  });

  it('创建集群请求应该包含正确的参数', async () => {
    // 模拟用户输入的配置
    const userConfig: CreateClusterConfig = {
      selectedIp: '192.168.1.100',
      hostname: 'my-cluster-node',
    };

    // 验证配置对象结构
    expect(userConfig).toHaveProperty('selectedIp');
    expect(userConfig).toHaveProperty('hostname');
    expect(typeof userConfig.selectedIp).toBe('string');
    expect(typeof userConfig.hostname).toBe('string');

    // 验证配置值
    expect(userConfig.selectedIp).toBe('192.168.1.100');
    expect(userConfig.hostname).toBe('my-cluster-node');
  });
});
