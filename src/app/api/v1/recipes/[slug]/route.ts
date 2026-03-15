import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth, ApiContext } from '@/lib/api-middleware'
import { getSupabaseAdmin } from '@/lib/supabase-server'

async function handler(req: NextRequest, ctx: ApiContext, slug: string) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('recipes').select('*').eq('slug', slug).eq('is_published', true).single()

  if (error || !data)
    return NextResponse.json({ error: 'Resep tidak ditemukan', slug }, { status: 404 })

  // increment view count (fire-and-forget)
  admin.from('recipes').update({ view_count: (data.view_count || 0) + 1 }).eq('id', data.id).then(() => {})

  return NextResponse.json({
    success: true, data,
    meta: { remaining_requests: ctx.remaining, monthly_usage: ctx.monthlyUsage },
  })
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  return withApiAuth((r, c) => handler(r, c, params.slug))(req)
}
