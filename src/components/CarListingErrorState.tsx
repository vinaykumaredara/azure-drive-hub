import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface CarListingErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const CarListingErrorState = ({ error, onRetry }: CarListingErrorStateProps) => {
  return (
    <div className="flex items-center justify-center py-12">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="mb-4">
          {error || "Failed to load cars. Please try again."}
        </AlertDescription>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </Alert>
    </div>
  );
};