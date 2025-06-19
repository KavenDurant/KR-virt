import { renderHook, act } from '@testing-library/react';
import { useSidebarSelection } from '../useSidebarSelection';
import type { Node, VirtualMachine as VMData } from '../../services/mockData';

// Mock data for testing
const mockHost: Node = {
  id: 'test-host-1',
  name: 'test-host',
  status: 'online',
  type: 'physical',
  cpu: 50,
  memory: 60,
  uptime: '10 days',
  vms: [],
};

const mockVM: VMData = {
  id: 'test-vm-1',
  vmid: '100',
  name: 'test-vm',
  status: 'running',
  node: 'test-host',
  type: 'qemu',
  cpu: 2,
  memory: 4,
  diskSize: 50,
};

describe('useSidebarSelection', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    window.removeEventListener('hierarchical-sidebar-select', jest.fn());
  });

  it('should initialize with null values', () => {
    const { result } = renderHook(() => useSidebarSelection());

    expect(result.current.selectedHost).toBeNull();
    expect(result.current.selectedVM).toBeNull();
    expect(result.current.selectedCluster).toBeNull();
    expect(result.current.selectedNetwork).toBeNull();
    expect(result.current.selectedStorage).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle host selection event', () => {
    const { result } = renderHook(() => useSidebarSelection());

    act(() => {
      const event = new CustomEvent('hierarchical-sidebar-select', {
        detail: {
          selectedKey: 'test-host-1',
          nodeType: 'host',
          nodeData: mockHost,
        },
      });
      window.dispatchEvent(event);
    });

    expect(result.current.selectedHost).toEqual(mockHost);
    expect(result.current.selectedVM).toBeNull();
    expect(result.current.selectedCluster).toBeNull();
  });

  it('should handle VM selection event', () => {
    const { result } = renderHook(() => useSidebarSelection());

    act(() => {
      const event = new CustomEvent('hierarchical-sidebar-select', {
        detail: {
          selectedKey: 'test-vm-1',
          nodeType: 'vm',
          nodeData: mockVM,
        },
      });
      window.dispatchEvent(event);
    });

    expect(result.current.selectedVM).toEqual(mockVM);
    expect(result.current.selectedHost).toBeNull();
    expect(result.current.selectedCluster).toBeNull();
  });

  it('should clear all selections when clearSelection is called', () => {
    const { result } = renderHook(() => useSidebarSelection());

    // First select a host
    act(() => {
      const event = new CustomEvent('hierarchical-sidebar-select', {
        detail: {
          selectedKey: 'test-host-1',
          nodeType: 'host',
          nodeData: mockHost,
        },
      });
      window.dispatchEvent(event);
    });

    expect(result.current.selectedHost).toEqual(mockHost);

    // Then clear selection
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedHost).toBeNull();
    expect(result.current.selectedVM).toBeNull();
    expect(result.current.selectedCluster).toBeNull();
  });

  it('should handle unknown node type gracefully', () => {
    const { result } = renderHook(() => useSidebarSelection());
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    act(() => {
      const event = new CustomEvent('hierarchical-sidebar-select', {
        detail: {
          selectedKey: 'test-unknown',
          nodeType: 'unknown',
          nodeData: {},
        },
      });
      window.dispatchEvent(event);
    });

    expect(consoleSpy).toHaveBeenCalledWith('未知的节点类型: unknown');
    expect(result.current.selectedHost).toBeNull();
    expect(result.current.selectedVM).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useSidebarSelection());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'hierarchical-sidebar-select',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('should provide direct selection methods', () => {
    const { result } = renderHook(() => useSidebarSelection());

    act(() => {
      result.current.selectHost(mockHost);
    });

    expect(result.current.selectedHost).toEqual(mockHost);
    expect(result.current.selectedVM).toBeNull();

    act(() => {
      result.current.selectVM(mockVM);
    });

    expect(result.current.selectedVM).toEqual(mockVM);
    expect(result.current.selectedHost).toBeNull();
  });
});
