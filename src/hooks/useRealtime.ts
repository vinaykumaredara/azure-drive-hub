import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Define the type for Supabase realtime payload
interface SupabaseRealtimePayload<T> {
  commit_timestamp: string;
  errors: string[] | null;
  eventType: string;
  id: number;
  new: T;
  old: T;
  schema: string;
  table: string;
}

export function useRealtimeSubscription<T = any>(
  table: string,
  onInsert?: (payload: SupabaseRealtimePayload<T>) => void,
  onUpdate?: (payload: SupabaseRealtimePayload<T>) => void,
  onDelete?: (payload: SupabaseRealtimePayload<T>) => void,
  filter?: string
) {
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupChannel = () => {
      channel = supabase.channel(`${table}-changes`);

      if (onInsert) {
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table,
          },
          (payload) => {
            onInsert(payload as unknown as SupabaseRealtimePayload<T>);
          }
        );
      }

      if (onUpdate) {
        channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table,
          },
          (payload) => {
            onUpdate(payload as unknown as SupabaseRealtimePayload<T>);
          }
        );
      }

      if (onDelete) {
        channel.on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table,
          },
          (payload) => {
            onDelete(payload as unknown as SupabaseRealtimePayload<T>);
          }
        );
      }

      channel.subscribe();
    };

    setupChannel();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, onInsert, onUpdate, onDelete, filter]);
}

export function useRealtimePresence(
  channelName: string,
  userState: any,
  onSync?: (state: any) => void,
  onJoin?: (key: string, newPresences: any) => void,
  onLeave?: (key: string, leftPresences: any) => void
) {
  useEffect(() => {
    const channel = supabase.channel(channelName);

    if (onSync) {
      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        onSync(newState);
      });
    }

    if (onJoin) {
      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        onJoin(key, newPresences);
      });
    }

    if (onLeave) {
      channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        onLeave(key, leftPresences);
      });
    }

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(userState);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, userState, onSync, onJoin, onLeave]);
}