import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import { getSupabaseAdmin } from '@/lib/supabase-server'

async function handler(req: NextRequest, ctx: ApiContext) {
  const sp    = req.nextUrl.searchParams
  const q     = sp.get('q') || ''
  const page  = Math.max(1, parseInt(sp.get('page')  || '1'))
  const limit = Math.min(50, parseInt(sp.get('limit') || '10'))
  const offset = (page - 1) * limit

  if (q.length < 2)
    return NextResponse.json({ error: 'Parameter "q" minimal 2 karakter' }, { status: 400 })

  const { data, error, count } = await getSupabaseAdmin()
    .from('recipes')
    .select('id,slug,name,name_local,description,region,province,category,image_url,thumbnail_url,cooking_time_minutes,difficulty,tags,is_halal,is_vegan', { count: 'exact' })
    .eq('is_published', true)
    .or(`name.ilike.%${q}%,description.ilike.%${q}%,region.ilike.%${q}%,name_local.ilike.%${q}%`)
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true, query: q, data,
    meta: { page, limit, total: count||0, total_pages: Math.ceil((count||0)/limit), remaining_requests: ctx.remaining },
  })
}

export const GET = withApiAuth(handler)
