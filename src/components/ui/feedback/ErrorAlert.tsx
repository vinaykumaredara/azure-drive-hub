// Enhanced error alert component with actionable suggestions
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  title?: string;
  message: string;
  suggestion?: string;
  onRetry?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
  variant?: 'default' | 'destructive';
}

export const ErrorAlert = ({
  title = 'Error',
  message,
  suggestion,
  onRetry,
  onAction,
  actionLabel = 'Try Again',
  className,
  variant = 'destructive'
}: ErrorAlertProps) => {
  return (
    <Alert variant={variant} className={cn('mb-4', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{message}</p>
        
        {suggestion && (
          <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3 py-1">
            <span className="font-medium">Suggestion:</span> {suggestion}
          </p>
        )}
        
        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
          
          {onAction && (
            <Button
              variant="default"
              size="sm"
              onClick={onAction}
              className="gap-2"
            >
              {actionLabel}
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
