import { renderHook, act, waitFor } from '@testing-library/react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

// Mock fetch
global.fetch = jest.fn();

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with navigator.onLine status', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    expect(result.current.online).toBeDefined();
    expect(result.current.effectiveOnline).toBeDefined();
  });

  it('should handle online event', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(result.current.online).toBe(true);
    });
  });

  it('should handle offline event', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(result.current.online).toBe(false);
      expect(result.current.effectiveOnline).toBe(false);
    });
  });

  it('should run heartbeat check', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });

    renderHook(() => useNetworkStatus());

    // Fast-forward past initial check
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it('should require multiple failures before marking offline', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNetworkStatus());

    // First failure - should still be online
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Need second failure to mark as offline
    await act(async () => {
      jest.advanceTimersByTime(15100);
    });

    await waitFor(() => {
      expect(result.current.effectiveOnline).toBe(false);
    });
  });
});
