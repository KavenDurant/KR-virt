/**
 * 示例测试文件
 * 验证测试环境配置是否正确
 */

import { describe, it, expect, vi } from 'vitest';

describe('测试环境验证', () => {
  it('应该能够正常使用vi', () => {
    const mockFn = vi.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('应该能够正常使用expect', () => {
    expect(1 + 1).toBe(2);
  });

  it('应该能够创建Mock函数', () => {
    const mockCallback = vi.fn();
    mockCallback('arg1', 'arg2');
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
