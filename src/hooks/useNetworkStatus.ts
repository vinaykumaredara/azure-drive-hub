import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  online: boolean;
  effectiveOnline: boolean;
  lastCheckedAt: Date | null;
  isChecking: boolean;
}

const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const HEARTBEAT_TIMEOUT = 5000; // 5 seconds
const FAILURE_THRESHOLD = 2; // require 2 consecutive failures

/**
 * Hook for comprehensive network status detection
 * Combines navigator.onLine with active connectivity checks
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastCheckedAt: null,
    isChecking: false,
  });
  
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const checkConnectivity = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus(prev => ({
        ...prev,
        online: false,
        effectiveOnline: false,
        lastCheckedAt: new Date(),
      }));
      return false;
    }

    setStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT);

      // Ping a lightweight endpoint with cache-busting
      const response = await fetch('/api/health?_=' + Date.now(), {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setConsecutiveFailures(0);
        setStatus(prev => ({
          ...prev,
          online: true,
          effectiveOnline: true,
          lastCheckedAt: new Date(),
          isChecking: false,
        }));
        return true;
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      const newFailures = consecutiveFailures + 1;
      setConsecutiveFailures(newFailures);

      // Only mark as offline after threshold failures
      const isEffectivelyOffline = newFailures >= FAILURE_THRESHOLD;
      
      setStatus(prev => ({
        ...prev,
        effectiveOnline: !isEffectivelyOffline,
        lastCheckedAt: new Date(),
        isChecking: false,
      }));

      return false;
    }
  }, [consecutiveFailures]);

  useEffect(() => {
    const handleOnline = () => {
      setConsecutiveFailures(0);
      setStatus(prev => ({
        ...prev,
        online: true,
        effectiveOnline: true,
      }));
      checkConnectivity(); // Verify with heartbeat
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        online: false,
        effectiveOnline: false,
        lastCheckedAt: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnectivity();

    // Set up heartbeat interval
    const intervalId = setInterval(checkConnectivity, HEARTBEAT_INTERVAL);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkConnectivity]);

  return status;
}
