import { createHash } from 'crypto'
import { getSupabaseAdmin } from './supabase-server'

export interface RateLimitResult {
  allowed: boolean
  monthlyUsage: number
  rateLimit: number
  userId: string | null
  remaining: number
  apiKeyId: string | null
}

/**
 * Check rate limit and increment usage.
 * This does NOT use the RPC function — it queries directly using service role
 * to avoid all RLS and permission issues.
 */
export async function checkRateLimit(apiKey: string): Promise<RateLimitResult> {
  const keyHash = createHash('sha256').update(apiKey).digest('hex')
  const admin = getSupabaseAdmin()

  // Step 1: Find the key
  const { data: key, error: findError } = await admin
    .from('api_keys')
    .select('id, user_id, monthly_usage, rate_limit, monthly_reset_at, usage_count, is_active')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (findError || !key) {
    console.error('[checkRateLimit] key not found:', findError?.message, 'hash:', keyHash.slice(0, 16))
    return { allowed: false, monthlyUsage: 0, rateLimit: 0, userId: null, remaining: 0, apiKeyId: null }
  }

  // Step 2: Check if monthly reset is needed
  const resetAt = new Date(key.monthly_reset_at)
  const now = new Date()
  let currentUsage = key.monthly_usage

  if (resetAt <= now) {
    // Reset monthly usage
    await admin
      .from('api_keys')
      .update({
        monthly_usage: 1,
        usage_count: key.usage_count + 1,
        monthly_reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        last_used_at: now.toISOString(),
      })
      .eq('id', key.id)

    return {
      allowed: true,
      monthlyUsage: 1,
      rateLimit: key.rate_limit,
      userId: key.user_id,
      remaining: key.rate_limit - 1,
      apiKeyId: key.id,
    }
  }

  // Step 3: Check rate limit
  if (currentUsage >= key.rate_limit) {
    return {
      allowed: false,
      monthlyUsage: currentUsage,
      rateLimit: key.rate_limit,
      userId: key.user_id,
      remaining: 0,
      apiKeyId: key.id,
    }
  }

  // Step 4: Increment usage
  const newUsage = currentUsage + 1
  await admin
    .from('api_keys')
    .update({
      monthly_usage: newUsage,
      usage_count: key.usage_count + 1,
      last_used_at: now.toISOString(),
    })
    .eq('id', key.id)

  return {
    allowed: true,
    monthlyUsage: newUsage,
    rateLimit: key.rate_limit,
    userId: key.user_id,
    remaining: key.rate_limit - newUsage,
    apiKeyId: key.id,
  }
}

export async function logApiUsage(p: {
  apiKeyId?: string | null
  userId?: string | null
  endpoint: string
  method: string
  statusCode: number
  responseTimeMs: number
  ipAddress?: string | null
  userAgent?: string | null
  queryParams?: Record<string, string>
}) {
  try {
    await getSupabaseAdmin().from('api_usage_logs').insert({
      api_key_id:       p.apiKeyId     || null,
      user_id:          p.userId       || null,
      endpoint:         p.endpoint,
      method:           p.method,
      status_code:      p.statusCode,
      response_time_ms: p.responseTimeMs,
      ip_address:       p.ipAddress    || null,
      user_agent:       p.userAgent    || null,
      query_params:     p.queryParams  || null,
    })
  } catch (e) {
    // Non-critical, don't throw
    console.error('[logApiUsage] error:', e)
  }
}