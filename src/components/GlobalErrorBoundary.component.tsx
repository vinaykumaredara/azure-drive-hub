import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { errorLogger } from '@/utils/errorLogger';

// Enhanced Error Boundary Component
export class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorId?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log with enhanced error logger
    const errorId = errorLogger.logError(error, {
      component: 'GlobalErrorBoundary',
      action: 'componentDidCatch',
      metadata: {
        componentStack: errorInfo.componentStack,
      }
    }, 'critical');

    this.setState({ errorId });
    console.error('Global Error Boundary:', error, errorInfo);
  }

  private getUserFriendlyMessage(error?: Error): string {
    if (!error) return "An unexpected error occurred.";
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return "We couldn't connect to the server. Please check your internet connection.";
    }
    if (message.includes('timeout')) {
      return "The request took too long. Please try again.";
    }
    if (message.includes('unauthorized') || message.includes('auth')) {
      return "Your session expired. Please sign in again.";
    }
    if (message.includes('not found')) {
      return "We couldn't find what you're looking for.";
    }
    
    return "Something unexpected happened. Please try refreshing the page.";
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-accent-purple/5 flex items-center justify-center p-4">
          <Card className="max-w-md w-full mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We're having trouble loading this page. Don't worry - your data is safe, and our team has been notified.
              </p>
              
              {/* User-friendly error message (NOT technical) */}
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-1">What happened?</p>
                <p className="text-sm text-muted-foreground">
                  {this.getUserFriendlyMessage(this.state.error)}
                </p>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Refresh Page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
              
              {/* Technical details HIDDEN by default (for support only) */}
              {import.meta.env.DEV && (
                <details className="mt-4">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Technical Details (for developers)
                  </summary>
                  <pre className="text-xs text-muted-foreground font-mono mt-2 bg-muted p-2 rounded overflow-auto max-h-32">
                    {this.state.error?.message}
                    {this.state.errorId && `\nError ID: ${this.state.errorId}`}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}