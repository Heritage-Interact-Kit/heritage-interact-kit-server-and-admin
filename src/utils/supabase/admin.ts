import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase admin client with service role key
 * This bypasses RLS policies and should only be used for server-side admin operations
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
} 