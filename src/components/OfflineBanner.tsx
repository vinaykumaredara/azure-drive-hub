import React from "react";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";

export default function OfflineBanner() {
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

  if (online) {
    return null;
  }

  return (
    <div 
      role="status" 
      className="fixed top-0 left-0 right-0 z-50 p-3 bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-center shadow-lg"
    >
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-5 h-5" />
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium">
          You are offline. Please check your network connection or restart the dev server.
        </span>
        <span className="text-sm">
          If this persists, run: <code className="bg-yellow-200 px-1 rounded">npm run dev</code>
        </span>
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