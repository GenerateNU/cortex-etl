import { useEffect } from 'react'
import { supabase } from '../config/supabase.config'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseRealtimeSubscriptionProps {
  table: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema?: string
  onEvent: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void
}

export function useRealtimeSubscription({
  table,
  event,
  schema = 'public',
  onEvent,
}: UseRealtimeSubscriptionProps) {
  // Disable realtime subscription for now
  return

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event,
          schema,
          table,
        },
        onEvent
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event, schema, onEvent])
}
