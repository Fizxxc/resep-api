import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Service-role client — bypasses RLS */
export function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SVC, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Parse the Supabase cookie and extract access + refresh tokens.
 * Supabase stores the session as JSON: {"access_token":"...","refresh_token":"..."}
 * OR as a URL-encoded chunked cookie in newer versions.
 */
async function getTokensFromCookies(): Promise<{ access_token: string; refresh_token: string } | null> {
  const jar = await cookies()
  const allCookies = jar.getAll()

  // Find the supabase auth cookie for this project
  const projectRef = SUPABASE_URL.split('//')[1].split('.')[0] // e.g. "otowzsbsbihlumaqipsc"
  
  // Look for chunked cookies first (sb-{ref}-auth-token.0, .1, etc.)
  const chunkKeys = allCookies
    .filter(c => c.name.startsWith(`sb-${projectRef}-auth-token.`))
    .sort((a, b) => a.name.localeCompare(b.name))

  let rawValue: string | null = null

  if (chunkKeys.length > 0) {
    // Reassemble chunked cookie
    rawValue = chunkKeys.map(c => c.value).join('')
  } else {
    // Single cookie
    const single = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)
    if (single) rawValue = single.value
  }

  if (!rawValue) return null

  try {
    // Try parsing as JSON directly
    let parsed: Record<string, string>
    
    if (rawValue.startsWith('%')) {
      // URL encoded
      rawValue = decodeURIComponent(rawValue)
    }
    
    if (rawValue.startsWith('"')) {
      // Double-stringified
      rawValue = JSON.parse(rawValue)
    }

    if (typeof rawValue === 'string' && rawValue.startsWith('{')) {
      parsed = JSON.parse(rawValue)
    } else {
      return null
    }

    if (parsed.access_token && parsed.refresh_token) {
      return {
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
      }
    }
    return null
  } catch (e) {
    console.error('[getTokensFromCookies] parse error:', e)
    return null
  }
}

/**
 * Get authenticated user by manually setting the session from cookie tokens.
 * This bypasses the @supabase/ssr cookie parsing issue.
 */
export async function getServerSession() {
  try {
    const tokens = await getTokensFromCookies()
    
    if (!tokens) {
      console.error('[getServerSession] No tokens found in cookies')
      return null
    }

    // Create a fresh client and manually set the session
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    // Set the session manually using the tokens from cookie
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    })

    if (error) {
      console.error('[getServerSession] setSession error:', error.message)
      return null
    }

    if (data.user) {
      console.log('[getServerSession] SUCCESS:', data.user.email)
      return { user: data.user }
    }

    return null
  } catch (err) {
    console.error('[getServerSession] exception:', err)
    return null
  }
}

export async function requireAdmin() {
  const session = await getServerSession()
  if (!session) return null

  const { data } = await getSupabaseAdmin()
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (data?.role !== 'admin') return null
  return { session, userId: session.user.id }
}

// Keep createServerSupabase for auth callback
export async function createServerSupabase() {
  const { createServerClient } = await import('@supabase/ssr')
  const jar = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll()  { return jar.getAll() },
      setAll(list) {
        try { list.forEach(({ name, value, options }) => jar.set(name, value, options)) }
        catch { /* ignore */ }
      },
    },
  })
}
