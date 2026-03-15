import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import { getSupabaseAdmin } from '@/lib/supabase-server'

async function handler(req: NextRequest, ctx: ApiContext) {
  const { data, error } = await getSupabaseAdmin()
    .from('recipes').select('region, province').eq('is_published', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const map: Record<string, Set<string>> = {}
  data?.forEach(({ region, province }) => {
    if (!map[region]) map[region] = new Set()
    if (province) map[region].add(province)
  })

  const regions = Object.entries(map).map(([region, provinces]) => ({
    region,
    provinces: [...provinces].sort(),
    total_recipes: data?.filter(r => r.region === region).length || 0,
  }))

  return NextResponse.json({ success: true, data: regions, meta: { remaining_requests: ctx.remaining } })
}

export const GET = withApiAuth(handler)
