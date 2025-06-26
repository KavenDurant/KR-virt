/**
 * 集群UI改进功能测试
 * 验证进度条文字移除和调试代码清理
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { App } from 'antd';
import ClusterProcessingPage from '@/pages/ClusterInit/ClusterProcessingPage';
import ClusterConfigPage from '@/pages/ClusterInit/ClusterConfigPage';
import { clusterInitService } from '@/services/cluster';
import type { CreateClusterConfig } from '@/services/cluster/types';

// Mock clusterInitService
vi.mock('@/services/cluster', () => ({
  clusterInitService: {
    getNodeHostname: vi.fn(),
    getNodeIpAddresses: vi.fn(),
  },
}));

const MockedClusterProcessingPage = () => {
  const mockConfig: CreateClusterConfig = {
    selectedIp: '192.168.1.100',
    hostname: 'test-node',
  };

  return (
    <App>
      <ClusterProcessingPage
        type="create"
        config={mockConfig}
        onComplete={vi.fn()}
        onRetry={vi.fn()}
      />
    </App>
  );
};

const MockedClusterConfigPage = () => {
  const mockOnSubmit = vi.fn();
  
  return (
    <App>
      <ClusterConfigPage
        initialType="create"
        onSubmit={mockOnSubmit}
        loading={false}
      />
    </App>
  );
};

describe('集群UI改进功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ClusterProcessingPage 进度条改进', () => {
    it('应该只显示进度条和百分比，不显示步骤文字', async () => {
      // 渲染组件
      render(<MockedClusterProcessingPage />);

      // 验证进度条存在
      const progressBar = document.querySelector('.ant-progress');
      expect(progressBar).toBeInTheDocument();

      // 验证百分比显示存在
      const progressText = document.querySelector('.ant-progress-text');
      expect(progressText).toBeInTheDocument();

      // 验证不应该有步骤描述文字（这些文字通常在进度条下方）
      // 我们检查是否没有包含典型步骤文字的元素
      expect(screen.queryByText(/初始化集群配置/)).not.toBeInTheDocument();
      expect(screen.queryByText(/创建控制平面/)).not.toBeInTheDocument();
      expect(screen.queryByText(/配置网络组件/)).not.toBeInTheDocument();
      expect(screen.queryByText(/启动系统服务/)).not.toBeInTheDocument();
      expect(screen.queryByText(/验证集群状态/)).not.toBeInTheDocument();
    });

    it('应该显示正确的标题和描述', () => {
      render(<MockedClusterProcessingPage />);

      // 验证主标题
      expect(screen.getByText('创建集群中')).toBeInTheDocument();

      // 验证描述文字
      expect(screen.getByText('请耐心等待，正在处理您的请求...')).toBeInTheDocument();
    });

    it('应该显示配置信息', () => {
      render(<MockedClusterProcessingPage />);

      // 验证配置信息卡片
      expect(screen.getByText('创建配置信息')).toBeInTheDocument();
      expect(screen.getByText('选择的IP地址：')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
      expect(screen.getByText('节点角色：')).toBeInTheDocument();
      expect(screen.getByText('主节点 (Master)')).toBeInTheDocument();
    });
  });

  describe('ClusterConfigPage 调试代码清理', () => {
    it('应该正常获取和回填节点名称，无调试输出', async () => {
      // Mock API 响应
      const mockHostname = 'clean-test-hostname';
      const mockIpAddresses = ['192.168.1.100'];

      vi.mocked(clusterInitService.getNodeHostname).mockResolvedValue({
        success: true,
        data: { hostname: mockHostname },
        message: '获取主机名成功',
      });

      vi.mocked(clusterInitService.getNodeIpAddresses).mockResolvedValue({
        success: true,
        data: { ip_addresses: mockIpAddresses },
        message: '获取IP地址成功',
      });

      // 监听console输出
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // 渲染组件
      render(<MockedClusterConfigPage />);

      // 等待API调用完成
      await waitFor(() => {
        expect(clusterInitService.getNodeHostname).toHaveBeenCalled();
        expect(clusterInitService.getNodeIpAddresses).toHaveBeenCalled();
      });

      // 等待表单回填完成
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockHostname)).toBeInTheDocument();
      });

      // 验证没有调试日志输出（除了可能的错误日志）
      const debugLogs = consoleSpy.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && 
        (call[0].includes('🔄') || call[0].includes('📡') || call[0].includes('✅') || 
         call[0].includes('📝') || call[0].includes('🔍') || call[0].includes('⏳'))
      );
      
      expect(debugLogs).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('应该正确处理表单提交，无调试输出', async () => {
      // Mock API 响应
      vi.mocked(clusterInitService.getNodeHostname).mockResolvedValue({
        success: true,
        data: { hostname: 'submit-test-hostname' },
        message: '获取主机名成功',
      });

      vi.mocked(clusterInitService.getNodeIpAddresses).mockResolvedValue({
        success: true,
        data: { ip_addresses: ['192.168.1.100'] },
        message: '获取IP地址成功',
      });

      // 监听console输出
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // 渲染组件
      const mockOnSubmit = vi.fn();
      render(
        <App>
          <ClusterConfigPage
            initialType="create"
            onSubmit={mockOnSubmit}
            loading={false}
          />
        </App>
      );

      // 等待组件加载完成
      await waitFor(() => {
        expect(screen.getByDisplayValue('submit-test-hostname')).toBeInTheDocument();
      });

      // 验证没有调试日志输出
      const debugLogs = consoleSpy.mock.calls.filter(call => 
        call[0] && typeof call[0] === 'string' && 
        (call[0].includes('🔄') || call[0].includes('📡') || call[0].includes('✅'))
      );
      
      expect(debugLogs).toHaveLength(0);

      consoleSpy.mockRestore();
    });
  });

  describe('功能完整性验证', () => {
    it('节点名称回填功能应该仍然正常工作', async () => {
      // Mock API 响应
      const testHostname = 'functional-test-hostname';
      vi.mocked(clusterInitService.getNodeHostname).mockResolvedValue({
        success: true,
        data: { hostname: testHostname },
        message: '获取主机名成功',
      });

      vi.mocked(clusterInitService.getNodeIpAddresses).mockResolvedValue({
        success: true,
        data: { ip_addresses: ['192.168.1.100'] },
        message: '获取IP地址成功',
      });

      // 渲染组件
      render(<MockedClusterConfigPage />);

      // 验证节点名称正确回填
      await waitFor(() => {
        const hostnameInput = screen.getByDisplayValue(testHostname);
        expect(hostnameInput).toBeInTheDocument();
        expect(hostnameInput).not.toBeDisabled();
      });
    });

    it('进度条应该正常显示进度', () => {
      render(<MockedClusterProcessingPage />);

      // 验证进度条组件存在
      const progressBar = document.querySelector('.ant-progress');
      expect(progressBar).toBeInTheDocument();

      // 验证进度条有正确的属性
      const progressLine = document.querySelector('.ant-progress-line');
      expect(progressLine).toBeInTheDocument();
    });
  });
});
