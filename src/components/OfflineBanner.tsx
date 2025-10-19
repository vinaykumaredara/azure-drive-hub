import React from "react";
import { AlertTriangle, Wifi, WifiOff, RefreshCw, Inbox } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { getOutboxCount, processOutbox } from "@/lib/outbox";
import { useToast } from "@/hooks/use-toast";

export default function OfflineBanner() {
  const { effectiveOnline, lastCheckedAt } = useNetworkStatus();
  const [queuedCount, setQueuedCount] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { toast } = useToast();
  
  // Update queued count periodically
  React.useEffect(() => {
    const updateCount = async () => {
      const count = await getOutboxCount();
      setQueuedCount(count);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-process queue when coming online
  React.useEffect(() => {
    if (effectiveOnline && queuedCount > 0 && !isProcessing) {
      handleProcessQueue();
    }
  }, [effectiveOnline]);

  const handleProcessQueue = async () => {
    setIsProcessing(true);
    try {
      const result = await processOutbox();
      
      if (result.succeeded > 0) {
        toast({
          title: "Sync Complete",
          description: `${result.succeeded} queued action(s) synced successfully.`,
        });
      }
      
      if (result.failed > 0) {
        toast({
          title: "Sync Incomplete",
          description: `${result.failed} action(s) failed to sync. Will retry later.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to process queue:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (effectiveOnline && queuedCount === 0) {
    return null;
  }

  return (
    <div 
      role="status" 
      className="fixed top-0 left-0 right-0 z-50 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100 shadow-lg backdrop-blur-sm"
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            {!effectiveOnline && (
              <>
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="font-medium text-sm sm:text-base">
                    You're offline
                  </span>
                  <span className="text-xs sm:text-sm opacity-75">
                    Some features are unavailable
                  </span>
                  {lastCheckedAt && (
                    <span className="text-xs opacity-60">
                      Last checked: {new Date(lastCheckedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {queuedCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/40 rounded-full">
                <Inbox className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {queuedCount} queued
                </span>
              </div>
            )}
            
            {effectiveOnline && queuedCount > 0 && (
              <button
                onClick={handleProcessQueue}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-full text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OnlineStatus() {
  const [online, setOnline] = React.useState<boolean>(navigator.onLine);
  
  React.useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div className="flex items-center space-x-1 text-sm">
      {online ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-green-600">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-red-600">Offline</span>
        </>
      )}
    </div>
  );
}