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

export async function checkRateLimit(apiKey: string): Promise<RateLimitResult> {
  const keyHash = createHash('sha256').update(apiKey).digest('hex')
  const { data, error } = await getSupabaseAdmin()
    .rpc('increment_api_usage', { p_key_hash: keyHash })
    .single()

  if (error || !data) {
    return { allowed: false, monthlyUsage: 0, rateLimit: 0, userId: null, remaining: 0, apiKeyId: null }
  }
  const r = data as { allowed: boolean; monthly_usage: number; rate_limit: number; user_id: string | null }
  return {
    allowed:      r.allowed,
    monthlyUsage: r.monthly_usage,
    rateLimit:    r.rate_limit,
    userId:       r.user_id,
    remaining:    Math.max(0, r.rate_limit - r.monthly_usage),
    apiKeyId:     null,
  }
}

export async function logApiUsage(p: {
  apiKeyId?: string | null; userId?: string | null
  endpoint: string; method: string; statusCode: number
  responseTimeMs: number; ipAddress?: string | null
  userAgent?: string | null; queryParams?: Record<string, string>
}) {
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
}
