import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import { getSupabaseAdmin } from '@/lib/supabase-server'

async function handler(req: NextRequest, ctx: ApiContext) {
  const sp       = req.nextUrl.searchParams
  const page     = Math.max(1, parseInt(sp.get('page')  || '1'))
  const limit    = Math.min(50, parseInt(sp.get('limit') || '10'))
  const offset   = (page - 1) * limit
  const category = sp.get('category')
  const region   = sp.get('region')
  const difficulty = sp.get('difficulty')
  const is_halal = sp.get('is_halal')
  const is_vegan = sp.get('is_vegan')

  let q = getSupabaseAdmin()
    .from('recipes')
    .select('id,slug,name,name_local,description,region,province,category,image_url,thumbnail_url,cooking_time_minutes,serving_size,difficulty,calories,tags,is_halal,is_vegan,created_at', { count: 'exact' })
    .eq('is_published', true)
    .order('name')
    .range(offset, offset + limit - 1)

  if (category)   q = q.eq('category', category)
  if (region)     q = q.ilike('region', `%${region}%`)
  if (difficulty) q = q.eq('difficulty', difficulty)
  if (is_halal === 'true') q = q.eq('is_halal', true)
  if (is_vegan === 'true') q = q.eq('is_vegan', true)

  const { data, error, count } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true, data,
    meta: { page, limit, total: count||0, total_pages: Math.ceil((count||0)/limit), remaining_requests: ctx.remaining, monthly_usage: ctx.monthlyUsage },
  })
}

export const GET = withApiAuth(handler)
