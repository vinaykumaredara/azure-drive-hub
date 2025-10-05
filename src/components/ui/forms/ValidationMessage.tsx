// src/components/ui/forms/ValidationMessage.tsx
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ValidationMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
}

const ValidationMessage = ({ message, type = 'error' }: ValidationMessageProps) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'destructive';
    }
  };

  if (!message) {return null;}

  return (
    <Alert variant={getVariant()}>
      <div className="flex items-center">
        {getIcon()}
        <AlertDescription className="ml-2">{message}</AlertDescription>
      </div>
    </Alert>
  );
};

export default ValidationMessage;