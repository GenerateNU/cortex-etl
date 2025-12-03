import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
)
