import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

// Enhanced Error Boundary Component
export class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Global Error Boundary:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/5 to-accent-purple/5 flex items-center justify-center p-4">
          <Card className="max-w-md w-full mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Application Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Refresh Page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => this.setState({ hasError: false })}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}