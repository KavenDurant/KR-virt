import { describe, it, expect, beforeEach, vi } from 'vitest';
import { vmService } from '@/services/vm';

// Mock apiHelper
vi.mock('@/utils/apiHelper', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
  mockApi: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock env config
vi.mock('@/config/env', () => ({
  EnvConfig: {
    USE_MOCK_DATA: false,
  },
}));

describe('VM Operations Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('VM Start Operation', () => {
    it('应该成功启动虚拟机', async () => {
      const mockResponse = {
        success: true,
        data: { message: '虚拟机启动成功' },
        message: '虚拟机启动成功',
      };

      const { api } = await import('@/utils/apiHelper');
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await vmService.startVM('test-vm', 'test-hostname');

      expect(api.post).toHaveBeenCalledWith(
        '/vm/start',
        {
          vm_name: 'test-vm',
          hostname: 'test-hostname',
        },
        {
          defaultSuccessMessage: '虚拟机启动成功',
          defaultErrorMessage: '虚拟机启动失败',
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('VM Stop Operation', () => {
    it('应该成功停止虚拟机', async () => {
      const mockResponse = {
        success: true,
        data: { message: '虚拟机停止成功' },
        message: '虚拟机停止成功',
      };

      const { api } = await import('@/utils/apiHelper');
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await vmService.stopVM('test-vm', 'test-hostname');

      expect(api.post).toHaveBeenCalledWith(
        '/vm/stop',
        {
          vm_name: 'test-vm',
          hostname: 'test-hostname',
        },
        {
          defaultSuccessMessage: '虚拟机停止成功',
          defaultErrorMessage: '虚拟机停止失败',
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('VM Restart Operation', () => {
    it('应该成功重启虚拟机', async () => {
      const mockResponse = {
        success: true,
        data: { message: '虚拟机重启成功' },
        message: '虚拟机重启成功',
      };

      const { api } = await import('@/utils/apiHelper');
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await vmService.restartVM('test-vm', 'test-hostname');

      expect(api.post).toHaveBeenCalledWith(
        '/vm/reboot',
        {
          vm_name: 'test-vm',
          hostname: 'test-hostname',
        },
        {
          defaultSuccessMessage: '虚拟机重启成功',
          defaultErrorMessage: '虚拟机重启失败',
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('VM Force Stop Operation', () => {
    it('应该成功强制停止虚拟机', async () => {
      const mockResponse = {
        success: true,
        data: { message: '虚拟机强制停止成功' },
        message: '虚拟机强制停止成功',
      };

      const { api } = await import('@/utils/apiHelper');
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await vmService.destroyVM('test-vm', 'test-hostname');

      expect(api.post).toHaveBeenCalledWith(
        '/vm/destroy',
        {
          vm_name: 'test-vm',
          hostname: 'test-hostname',
        },
        {
          defaultSuccessMessage: '虚拟机强制停止成功',
          defaultErrorMessage: '虚拟机强制停止失败',
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('VM Delete Operation', () => {
    it('应该成功删除虚拟机（包含磁盘）', async () => {
      const mockResponse = {
        success: true,
        data: { message: '虚拟机删除成功' },
        message: '虚拟机删除成功',
      };

      const { api } = await import('@/utils/apiHelper');
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await vmService.deleteVM('test-vm', 'test-hostname', true);

      expect(api.post).toHaveBeenCalledWith(
        '/vm/delete',
        {
          vm_name: 'test-vm',
          hostname: 'test-hostname',
          delete_disk: true,
        },
        {
          defaultSuccessMessage: '虚拟机删除成功',
          defaultErrorMessage: '虚拟机删除失败',
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('应该成功删除虚拟机（保留磁盘）', async () => {
      const mockResponse = {
        success: true,
        data: { message: '虚拟机删除成功' },
        message: '虚拟机删除成功',
      };

      const { api } = await import('@/utils/apiHelper');
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await vmService.deleteVM('test-vm', 'test-hostname', false);

      expect(api.post).toHaveBeenCalledWith(
        '/vm/delete',
        {
          vm_name: 'test-vm',
          hostname: 'test-hostname',
          delete_disk: false,
        },
        {
          defaultSuccessMessage: '虚拟机删除成功',
          defaultErrorMessage: '虚拟机删除失败',
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('VM Pause Operation', () => {
    it('应该成功挂起虚拟机', async () => {
      const mockResponse = {
        success: true,
        data: { message: '虚拟机挂起成功' },
        message: '虚拟机挂起成功',
      };

      const { api } = await import('@/utils/apiHelper');
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await vmService.pauseVM('test-vm', 'test-hostname');

      expect(api.post).toHaveBeenCalledWith(
        '/vm/pause',
        {
          vm_name: 'test-vm',
          hostname: 'test-hostname',
        },
        {
          defaultSuccessMessage: '虚拟机挂起成功',
          defaultErrorMessage: '虚拟机挂起失败',
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('VM Resume Operation', () => {
    it('应该成功恢复虚拟机', async () => {
      const mockResponse = {
        success: true,
        data: { message: '虚拟机恢复成功' },
        message: '虚拟机恢复成功',
      };

      const { api } = await import('@/utils/apiHelper');
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await vmService.resumeVM('test-vm', 'test-hostname');

      expect(api.post).toHaveBeenCalledWith(
        '/vm/resume',
        {
          vm_name: 'test-vm',
          hostname: 'test-hostname',
        },
        {
          defaultSuccessMessage: '虚拟机恢复成功',
          defaultErrorMessage: '虚拟机恢复失败',
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Mock Mode Tests', () => {
    beforeEach(() => {
      // 重新加载模块以应用新的环境配置
      vi.doUnmock('@/config/env');
      vi.doMock('@/config/env', () => ({
        EnvConfig: {
          USE_MOCK_DATA: true,
        },
      }));
    });

    it('Mock模式下应该返回模拟数据', async () => {
      const mockResponse = {
        success: true,
        data: { message: '虚拟机启动成功' },
        message: '虚拟机启动成功',
      };

      const { mockApi } = await import('@/utils/apiHelper');
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      // 重新导入服务以使用新的环境配置
      const { vmService: mockVmService } = await import('@/services/vm');
      
      const result = await mockVmService.startVM('test-vm', 'test-hostname');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('应该正确处理API错误', async () => {
      const errorResponse = {
        success: false,
        message: '虚拟机启动失败',
        error: 'Network error',
      };

      const { api } = await import('@/utils/apiHelper');
      vi.mocked(api.post).mockResolvedValue(errorResponse);

      const result = await vmService.startVM('test-vm', 'test-hostname');

      expect(result.success).toBe(false);
      expect(result.message).toBe('虚拟机启动失败');
    });

    it('应该正确处理网络异常', async () => {
      const { api } = await import('@/utils/apiHelper');
      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

      try {
        await vmService.startVM('test-vm', 'test-hostname');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });
}); 