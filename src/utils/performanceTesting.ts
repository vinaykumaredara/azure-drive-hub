import { performance } from 'perf_hooks';

// Performance testing utilities
export class PerformanceTester {
  private results: Map<string, number[]> = new Map();

  measureFunction<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.then(data => {
        const end = performance.now();
        this.recordResult(name, end - start);
        return data;
      });
    } else {
      const end = performance.now();
      this.recordResult(name, end - start);
      return result;
    }
  }

  private recordResult(name: string, time: number): void {
    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    this.results.get(name)!.push(time);
  }

  getStats(name: string) {
    const times = this.results.get(name) || [];
    if (times.length === 0) {return null;}

    const sorted = [...times].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      average: times.reduce((a, b) => a + b, 0) / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      count: times.length,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [name] of this.results) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }

  reset(): void {
    this.results.clear();
  }

  // Memory usage tracking
  measureMemory(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  // Component render performance
  measureComponentRender<T extends React.ComponentType<any>>(
    Component: T,
    name?: string
  ): React.ComponentType<any> {
    const componentName = name || Component.displayName || Component.name || 'Anonymous';
    
    const WrappedComponent = React.memo((props: any) => {
      const renderStart = performance.now();
      
      React.useEffect(() => {
        const renderEnd = performance.now();
        this.recordResult(`${componentName}_render`, renderEnd - renderStart);
      });

      return React.createElement(Component, props);
    });

    WrappedComponent.displayName = `Measured(${componentName})`;
    return WrappedComponent;
  }

  // Network request performance
  async measureNetworkRequest(url: string, options?: RequestInit): Promise<Response> {
    const start = performance.now();
    try {
      const response = await fetch(url, options);
      const end = performance.now();
      this.recordResult(`network_${url}`, end - start);
      return response;
    } catch (error) {
      const end = performance.now();
      this.recordResult(`network_${url}_error`, end - start);
      throw error;
    }
  }

  // Database query performance
  async measureDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await queryFn();
      const end = performance.now();
      this.recordResult(`db_${queryName}`, end - start);
      return result;
    } catch (error) {
      const end = performance.now();
      this.recordResult(`db_${queryName}_error`, end - start);
      throw error;
    }
  }

  // Load testing simulation
  async loadTest(
    testName: string,
    testFn: () => Promise<any>,
    options: {
      concurrency?: number;
      iterations?: number;
      duration?: number; // in milliseconds
    } = {}
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageTime: number;
    requestsPerSecond: number;
    errors: Error[];
  }> {
    const { concurrency = 10, iterations = 100, duration } = options;
    const results: Array<{ success: boolean; time: number; error?: Error }> = [];
    const startTime = performance.now();

    if (duration) {
      // Duration-based load test
      const endTime = startTime + duration;
      while (performance.now() < endTime) {
        const promises = Array(concurrency).fill(0).map(async () => {
          const testStart = performance.now();
          try {
            await testFn();
            const testEnd = performance.now();
            return { success: true, time: testEnd - testStart };
          } catch (error) {
            const testEnd = performance.now();
            return { success: false, time: testEnd - testStart, error: error as Error };
          }
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
      }
    } else {
      // Iteration-based load test
      const batches = Math.ceil(iterations / concurrency);
      for (let i = 0; i < batches; i++) {
        const batchSize = Math.min(concurrency, iterations - (i * concurrency));
        const promises = Array(batchSize).fill(0).map(async () => {
          const testStart = performance.now();
          try {
            await testFn();
            const testEnd = performance.now();
            return { success: true, time: testEnd - testStart };
          } catch (error) {
            const testEnd = performance.now();
            return { success: false, time: testEnd - testStart, error: error as Error };
          }
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.filter(r => !r.success).length;
    const averageTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const requestsPerSecond = (results.length / totalTime) * 1000;
    const errors = results.filter(r => r.error).map(r => r.error!);

    return {
      totalRequests: results.length,
      successfulRequests,
      failedRequests,
      averageTime,
      requestsPerSecond,
      errors
    };
  }

  // Report generation
  generateReport(): string {
    const stats = this.getAllStats();
    const memory = this.measureMemory();
    
    let report = '=== Performance Report ===\n\n';
    
    if (memory) {
      report += `Memory Usage:\n`;
      report += `  Used JS Heap: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB\n`;
      report += `  Total JS Heap: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB\n`;
      report += `  JS Heap Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB\n\n`;
    }
    
    report += 'Function Performance:\n';
    for (const [name, stat] of Object.entries(stats)) {
      if (stat) {
        report += `  ${name}:\n`;
        report += `    Count: ${stat.count}\n`;
        report += `    Average: ${stat.average.toFixed(2)}ms\n`;
        report += `    Median: ${stat.median.toFixed(2)}ms\n`;
        report += `    Min: ${stat.min.toFixed(2)}ms\n`;
        report += `    Max: ${stat.max.toFixed(2)}ms\n`;
        report += `    P95: ${stat.p95.toFixed(2)}ms\n`;
        report += `    P99: ${stat.p99.toFixed(2)}ms\n\n`;
      }
    }
    
    return report;
  }
}

// Import React for component measurement
import React from 'react';

// Global performance tester instance
export const performanceTester = new PerformanceTester();

// Quick performance test for the admin dashboard
export const runAdminDashboardPerformanceTest = async () => {
  console.log('Starting Admin Dashboard Performance Test...');
  
  // Test database queries
  await performanceTester.measureDatabaseQuery('fetch_cars', async () => {
    // Simulate database query
    return new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  });
  
  await performanceTester.measureDatabaseQuery('fetch_bookings', async () => {
    // Simulate database query
    return new Promise(resolve => setTimeout(resolve, Math.random() * 150));
  });
  
  await performanceTester.measureDatabaseQuery('fetch_licenses', async () => {
    // Simulate database query
    return new Promise(resolve => setTimeout(resolve, Math.random() * 80));
  });
  
  // Test load scenarios
  const loadTestResults = await performanceTester.loadTest(
    'admin_dashboard_load',
    async () => {
      // Simulate admin dashboard operations
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    },
    { concurrency: 5, iterations: 50 }
  );
  
  console.log('Load Test Results:', loadTestResults);
  console.log(performanceTester.generateReport());
};

export default PerformanceTester;