import { createBrowserClient } from '@supabase/ssr'

// Singleton so we don't create multiple GoTrue clients
let _client: ReturnType<typeof createBrowserClient> | undefined

export function getSupabaseBrowser() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}
