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
  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
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
