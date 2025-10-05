// Enhanced error logging and handling system
export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorData {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  userAgent: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: ErrorData[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  logError(
    error: Error, 
    context: ErrorContext, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorData: ErrorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      severity
    };

    // Add to memory store
    this.errors.push(errorData);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Development logging
    if (import.meta.env.DEV) {
      const styles = {
        low: 'color: #6B7280; background: #F9FAFB;',
        medium: 'color: #D97706; background: #FFFBEB;',
        high: 'color: #DC2626; background: #FEF2F2;',
        critical: 'color: #FFFFFF; background: #7F1D1D; font-weight: bold;'
      };
      
      console.group(`%c🚨 ${severity.toUpperCase()} ERROR in ${context.component}`, styles[severity]);
      console.error('Message:', error.message);
      console.error('Context:', context);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }

    // Production error tracking
    if (import.meta.env.PROD) {
      this.sendToErrorService(errorData, errorId);
    }

    return errorId;
  }

  logWarning(message: string, context: ErrorContext): void {
    const warningData = {
      message,
      context,
      timestamp: new Date().toISOString(),
      type: 'warning'
    };

    if (import.meta.env.DEV) {
      console.warn(`⚠️ WARNING in ${context.component}:`, message, context);
    }

    if (import.meta.env.PROD) {
      // Send warnings to monitoring service
      this.sendToMonitoringService(warningData);
    }
  }

  logInfo(message: string, context: ErrorContext): void {
    if (import.meta.env.DEV) {
      console.info(`ℹ️ INFO in ${context.component}:`, message, context);
    }
  }

  private sendToErrorService(errorData: ErrorData, errorId: string): void {
    // In a real implementation, send to Sentry, LogRocket, etc.
    // For now, we'll use a simple API call
    if (typeof fetch !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...errorData, errorId })
      }).catch(_err => {
        // Fallback: store in localStorage for later retry
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem('pending_errors') ?? '[]';
          const pendingErrors = JSON.parse(stored);
          pendingErrors.push({ ...errorData, errorId });
          localStorage.setItem('pending_errors', JSON.stringify(pendingErrors));
        }
      });
    }
  }

  private sendToMonitoringService(data: unknown): void {
    // Send to monitoring service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'warning', {
        event_category: 'application',
        event_label: (data as any).context.component,
        value: 1
      });
    }
  }

  getRecentErrors(limit = 10): ErrorData[] {
    return this.errors.slice(-limit);
  }

  clearErrors(): void {
    this.errors = [];
  }

  getErrorStats(): { total: number; bySeverity: Record<string, number> } {
    const bySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errors.length,
      bySeverity
    };
  }
}

// Error handling utilities
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  fallbackValue?: T
): Promise<{ data: T | null; error: Error | null }> => {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const errorLogger = ErrorLogger.getInstance();
    errorLogger.logError(error as Error, context, 'high');
    
    return { 
      data: fallbackValue ?? null, 
      error: error as Error 
    };
  }
};

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();