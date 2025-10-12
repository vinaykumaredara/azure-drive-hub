import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to subscribe to real-time changes on a Supabase table
 * @param tableName - Name of the table to subscribe to
 * @param onDataChange - Callback function to execute when data changes
 * @param enabled - Whether the subscription is enabled (default: true)
 */
export const useRealtimeTable = (
  tableName: string, 
  onDataChange: () => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`${tableName}-changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        () => {
          console.log(`[Realtime] ${tableName} changed, refreshing data...`);
          onDataChange();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, onDataChange, enabled]);
};
