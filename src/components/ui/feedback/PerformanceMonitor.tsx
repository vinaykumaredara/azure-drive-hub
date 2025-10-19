/**
 * Performance Monitor Component
 * Displays real-time performance metrics for debugging
 */
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  loadTime: number;
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memory: 0,
    loadTime: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show only in development
    if (import.meta.env.DEV) {
      setIsVisible(true);
    }

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measurePerformance = () => {
      const currentTime = performance.now();
      frameCount++;

      // Update FPS every second
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Get memory if available
        const memory = (performance as any).memory 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) 
          : 0;

        // Get page load time
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : 0;

        setMetrics({
          fps,
          memory,
          loadTime,
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measurePerformance);
    };

    animationFrameId = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-[10000] bg-black/90 text-white p-3 text-xs font-mono shadow-xl">
      <div className="space-y-1">
        <div>FPS: <span className={metrics.fps < 30 ? 'text-red-400' : 'text-green-400'}>{metrics.fps}</span></div>
        <div>Memory: {metrics.memory}MB</div>
        <div>Load: {metrics.loadTime}ms</div>
      </div>
    </Card>
  );
};
