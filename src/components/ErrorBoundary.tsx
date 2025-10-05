// Error boundary and error display components

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Check if it's a network-related error
    const isNetworkError = error.message.includes('fetch') || 
                          error.message.includes('network') ||
                          error.message.includes('connection') ||
                          error.message.includes('localhost') ||
                          error.name === 'NetworkError';
    
    this.setState({ errorInfo, hasError: true, error });
    
    // Log additional context for network errors
    if (isNetworkError) {
      console.error('Network Error Details:', {
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  }

  override render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          retry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error?: Error; retry?: () => void }> = ({ 
  error, 
  retry 
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-background min-h-[200px]">
    <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
    <h2 className="text-xl font-semibold text-foreground mb-2">
      Something went wrong
    </h2>
    <p className="text-muted-foreground mb-4 max-w-md">
      {error?.message || 'An unexpected error occurred. Please try again.'}
    </p>
    <Button onClick={retry} variant="outline" className="flex items-center space-x-2">
      <RefreshCw className="w-4 h-4" />
      <span>Try Again</span>
    </Button>
  </div>
);

// Error state component for API failures
export const ApiErrorState: React.FC<{
  error: string;
  onRetry: () => void;
  className?: string;
}> = ({ error, onRetry, className = "" }) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <AlertTriangle className="w-10 h-10 text-destructive mb-3" />
    <h3 className="text-lg font-medium text-foreground mb-2">
      Unable to load cars
    </h3>
    <p className="text-muted-foreground mb-4 max-w-sm">
      {error}
    </p>
    <Button onClick={onRetry} size="sm" className="flex items-center space-x-2">
      <RefreshCw className="w-4 h-4" />
      <span>Retry</span>
    </Button>
  </div>
);

// Empty state component
export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ 
  title = "No cars found", 
  description = "Try adjusting your filters or search terms.",
  action,
  className = ""
}) => (
  <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
      <span className="text-2xl">🚗</span>
    </div>
    <h3 className="text-lg font-medium text-foreground mb-2">
      {title}
    </h3>
    <p className="text-muted-foreground mb-4 max-w-sm">
      {description}
    </p>
    {action}
  </div>
);