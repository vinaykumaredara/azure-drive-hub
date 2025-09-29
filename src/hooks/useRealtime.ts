import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeSubscription(
  table: string,
  onInsert?: (payload: any) => void,
  onUpdate?: (payload: any) => void,
  onDelete?: (payload: any) => void,
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
            filter,
          },
          onInsert
        );
      }

      if (onUpdate) {
        channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table,
            filter,
          },
          onUpdate
        );
      }

      if (onDelete) {
        channel.on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table,
            filter,
          },
          onDelete
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