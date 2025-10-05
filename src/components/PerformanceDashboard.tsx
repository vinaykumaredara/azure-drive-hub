
// src/components/PerformanceDashboard.tsx
// Performance dashboard to display application metrics

import { useState, useEffect } from 'react';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Get initial metrics
    const initialMetrics = performanceMonitor.getMetrics();
    setMetrics({
      fcp: initialMetrics.fcp || 0,
      lcp: initialMetrics.lcp || 0,
      fid: initialMetrics.fid || 0,
      cls: initialMetrics.cls || 0,
      ttfb: initialMetrics.ttfb || 0
    });
  }, []);

  const refreshMetrics = () => {
    const updatedMetrics = performanceMonitor.getMetrics();
    setMetrics({
      fcp: updatedMetrics.fcp || 0,
      lcp: updatedMetrics.lcp || 0,
      fid: updatedMetrics.fid || 0,
      cls: updatedMetrics.cls || 0,
      ttfb: updatedMetrics.ttfb || 0
    });
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    const interval = setInterval(() => {
      refreshMetrics();
    }, 5000); // Update every 5 seconds

    // Clean up interval on unmount
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  // Format metrics for display
  const formatMetric = (value: number, unit: string = 'ms') => {
    return value > 0 ? `${value.toFixed(2)} ${unit}` : 'N/A';
  };

  // Get performance score based on Core Web Vitals
  const getPerformanceScore = () => {
    // Simplified scoring - in a real app, you'd use more sophisticated scoring
    const scores = [
      metrics.fcp < 1800 ? 100 : metrics.fcp < 3000 ? 50 : 0,
      metrics.lcp < 2500 ? 100 : metrics.lcp < 4000 ? 50 : 0,
      metrics.fid < 100 ? 100 : metrics.fid < 300 ? 50 : 0,
      metrics.cls < 0.1 ? 100 : metrics.cls < 0.25 ? 50 : 0
    ];
    
    const totalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return totalScore.toFixed(0);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Performance Dashboard</span>
          <div className="flex gap-2">
            <Button 
              onClick={refreshMetrics}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
            {isMonitoring ? (
              <Button 
                onClick={stopMonitoring}
                variant="destructive"
                size="sm"
              >
                Stop Monitoring
              </Button>
            ) : (
              <Button 
                onClick={startMonitoring}
                variant="default"
                size="sm"
              >
                Start Monitoring
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-primary/10">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-primary">First Contentful Paint</h3>
              <p className="text-2xl font-bold">{formatMetric(metrics.fcp)}</p>
              <p className="text-xs text-muted-foreground">Good: &lt;1.8s</p>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/10">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-primary">Largest Contentful Paint</h3>
              <p className="text-2xl font-bold">{formatMetric(metrics.lcp)}</p>
              <p className="text-xs text-muted-foreground">Good: &lt;2.5s</p>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/10">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-primary">First Input Delay</h3>
              <p className="text-2xl font-bold">{formatMetric(metrics.fid)}</p>
              <p className="text-xs text-muted-foreground">Good: &lt;100ms</p>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/10">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-primary">Cumulative Layout Shift</h3>
              <p className="text-2xl font-bold">{formatMetric(metrics.cls, '')}</p>
              <p className="text-xs text-muted-foreground">Good: &lt;0.1</p>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/10">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-primary">Time to First Byte</h3>
              <p className="text-2xl font-bold">{formatMetric(metrics.ttfb)}</p>
              <p className="text-xs text-muted-foreground">Good: &lt;200ms</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-primary to-accent-purple text-white">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium">Performance Score</h3>
              <p className="text-2xl font-bold">{getPerformanceScore()}/100</p>
              <p className="text-xs opacity-90">Core Web Vitals</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Performance Tips</h4>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>FCP measures when the first content is rendered</li>
            <li>LCP measures when the largest content is rendered</li>
            <li>FID measures the responsiveness to user input</li>
            <li>CLS measures visual stability</li>
            <li>TTFB measures server response time</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};