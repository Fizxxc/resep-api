import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const LABELS: Record<string, string> = {
  makanan: 'Makanan', minuman: 'Minuman', snack: 'Camilan', dessert: 'Dessert / Kue',
}

async function handler(req: NextRequest, ctx: ApiContext) {
  const { data, error } = await getSupabaseAdmin()
    .from('recipes').select('category').eq('is_published', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts: Record<string, number> = {}
  data?.forEach(({ category }) => { counts[category] = (counts[category] || 0) + 1 })

  return NextResponse.json({
    success: true,
    data: Object.entries(counts).map(([category, total_recipes]) => ({
      category, label: LABELS[category] || category, total_recipes,
    })),
    meta: { remaining_requests: ctx.remaining },
  })
}

export const GET = withApiAuth(handler)
