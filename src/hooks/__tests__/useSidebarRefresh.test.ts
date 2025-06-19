import { renderHook } from '@testing-library/react';
import { useSidebarRefresh, triggerSidebarRefresh, SidebarRefreshTriggers } from '../useSidebarRefresh';

describe('useSidebarRefresh', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    window.removeEventListener('refresh-sidebar', jest.fn());
  });

  it('should call callback when refresh event is triggered', () => {
    const mockCallback = jest.fn();
    renderHook(() => useSidebarRefresh(mockCallback));

    const detail = { type: 'cluster', action: 'node-added' };
    triggerSidebarRefresh(detail);

    expect(mockCallback).toHaveBeenCalledWith(detail);
  });

  it('should not call callback when disabled', () => {
    const mockCallback = jest.fn();
    renderHook(() => useSidebarRefresh(mockCallback, { enabled: false }));

    const detail = { type: 'cluster', action: 'node-added' };
    triggerSidebarRefresh(detail);

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should apply filter when provided', () => {
    const mockCallback = jest.fn();
    const filter = (detail: any) => detail.type === 'cluster';
    
    renderHook(() => useSidebarRefresh(mockCallback, { filter }));

    // This should be filtered out
    triggerSidebarRefresh({ type: 'vm', action: 'updated' });
    expect(mockCallback).not.toHaveBeenCalled();

    // This should pass the filter
    triggerSidebarRefresh({ type: 'cluster', action: 'updated' });
    expect(mockCallback).toHaveBeenCalledWith({ type: 'cluster', action: 'updated' });
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useSidebarRefresh(jest.fn()));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'refresh-sidebar',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});

describe('SidebarRefreshTriggers', () => {
  it('should trigger cluster refresh events', () => {
    const mockCallback = jest.fn();
    renderHook(() => useSidebarRefresh(mockCallback));

    SidebarRefreshTriggers.cluster('node-added');

    expect(mockCallback).toHaveBeenCalledWith({
      type: 'cluster',
      action: 'node-added',
    });
  });

  it('should trigger host refresh events', () => {
    const mockCallback = jest.fn();
    renderHook(() => useSidebarRefresh(mockCallback));

    SidebarRefreshTriggers.host('status-changed', { hostname: 'test-host' });

    expect(mockCallback).toHaveBeenCalledWith({
      type: 'host',
      action: 'status-changed',
      hostname: 'test-host',
    });
  });

  it('should trigger VM refresh events', () => {
    const mockCallback = jest.fn();
    renderHook(() => useSidebarRefresh(mockCallback));

    SidebarRefreshTriggers.vm('configuration-changed', { vmId: '100' });

    expect(mockCallback).toHaveBeenCalledWith({
      type: 'vm',
      action: 'configuration-changed',
      vmId: '100',
    });
  });
});

describe('triggerSidebarRefresh', () => {
  it('should dispatch custom event with correct detail', () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    
    const detail = { type: 'cluster', action: 'node-added' };
    triggerSidebarRefresh(detail);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'refresh-sidebar',
        detail,
      })
    );

    dispatchEventSpy.mockRestore();
  });
});
