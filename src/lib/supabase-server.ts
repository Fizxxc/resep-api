import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SVC, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function getTokensFromCookies(): Promise<{ access_token: string; refresh_token: string } | null> {
  const jar = await cookies()
  const allCookies = jar.getAll()
  const projectRef = SUPABASE_URL.split('//')[1].split('.')[0]

  // Look for chunked cookies (sb-xxx-auth-token.0, .1, ...)
  const chunkKeys = allCookies
    .filter(c => c.name.startsWith(`sb-${projectRef}-auth-token.`))
    .sort((a, b) => a.name.localeCompare(b.name))

  let rawValue: string | null = null

  if (chunkKeys.length > 0) {
    rawValue = chunkKeys.map(c => c.value).join('')
  } else {
    const single = allCookies.find(c => c.name === `sb-${projectRef}-auth-token`)
    if (single) rawValue = single.value
  }

  if (!rawValue) return null

  try {
    // Handle base64- prefix (Vercel production format)
    if (rawValue.startsWith('base64-')) {
      rawValue = Buffer.from(rawValue.slice(7), 'base64').toString('utf-8')
    }

    // Handle URL encoding
    if (rawValue.startsWith('%')) {
      rawValue = decodeURIComponent(rawValue)
    }

    // Handle double-stringified
    if (rawValue.startsWith('"')) {
      rawValue = JSON.parse(rawValue) as string
    }

    // Parse JSON
    if (typeof rawValue === 'string' && rawValue.startsWith('{')) {
      const parsed = JSON.parse(rawValue) as Record<string, string>
      if (parsed.access_token && parsed.refresh_token) {
        return {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        }
      }
    }

    return null
  } catch {
    return null
  }
}

export async function getServerSession() {
  try {
    const tokens = await getTokensFromCookies()
    if (!tokens) return null

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    })

    if (error || !data.user) return null
    return { user: data.user }
  } catch {
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

export async function createServerSupabase() {
  const jar = await cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() { return jar.getAll() },
      setAll(list: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          list.forEach(({ name, value, options }) => jar.set(name, value, options))
        } catch { /* ignore */ }
      },
    },
  })
}