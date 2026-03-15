import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, logApiUsage } from './ratelimit'

export interface ApiContext {
  userId: string
  apiKeyId: string | null
  remaining: number
  monthlyUsage: number
  rateLimit: number
}

export type ApiHandler = (req: NextRequest, ctx: ApiContext) => Promise<NextResponse>

export function withApiAuth(handler: ApiHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const t0       = Date.now()
    const endpoint = req.nextUrl.pathname
    const auth     = req.headers.get('authorization')
    const qKey     = req.nextUrl.searchParams.get('api_key')
    const apiKey   = auth?.startsWith('Bearer ') ? auth.slice(7) : qKey

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required', docs: `${process.env.NEXT_PUBLIC_APP_URL}/docs` },
        { status: 401 }
      )
    }
    if (!apiKey.startsWith('kograph_')) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 })
    }

    const rl = await checkRateLimit(apiKey)

    if (!rl.userId) {
      return NextResponse.json({ error: 'API key tidak valid atau tidak aktif' }, { status: 401 })
    }

    if (!rl.allowed) {
      const reset = new Date(); reset.setMonth(reset.getMonth() + 1); reset.setDate(1); reset.setHours(0,0,0,0)
      logApiUsage({ userId: rl.userId, endpoint, method: req.method, statusCode: 429, responseTimeMs: Date.now() - t0, ipAddress: req.headers.get('x-forwarded-for'), userAgent: req.headers.get('user-agent') })
      return NextResponse.json(
        { error: 'Rate limit exceeded', monthly_usage: rl.monthlyUsage, rate_limit: rl.rateLimit, reset_at: reset.toISOString() },
        { status: 429, headers: { 'X-RateLimit-Limit': String(rl.rateLimit), 'X-RateLimit-Remaining': '0' } }
      )
    }

    const ctx: ApiContext = { userId: rl.userId, apiKeyId: rl.apiKeyId, remaining: rl.remaining, monthlyUsage: rl.monthlyUsage, rateLimit: rl.rateLimit }

    try {
      const res  = await handler(req, ctx)
      const hdrs = new Headers(res.headers)
      hdrs.set('X-RateLimit-Limit',     String(rl.rateLimit))
      hdrs.set('X-RateLimit-Remaining', String(rl.remaining))
      hdrs.set('X-RateLimit-Used',      String(rl.monthlyUsage))
      logApiUsage({ userId: rl.userId, endpoint, method: req.method, statusCode: res.status, responseTimeMs: Date.now() - t0, ipAddress: req.headers.get('x-forwarded-for'), userAgent: req.headers.get('user-agent'), queryParams: Object.fromEntries(req.nextUrl.searchParams) })
      return new NextResponse(res.body, { status: res.status, headers: hdrs })
    } catch (e) {
      console.error('[api]', e)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
