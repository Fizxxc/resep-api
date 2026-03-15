import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const page  = parseInt(searchParams.get('page')  || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const { data, error, count } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, email, full_name, role, is_active, created_at, api_keys(id, monthly_usage, usage_count, is_active)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    success: true, data,
    meta: { page, limit, total: count||0, total_pages: Math.ceil((count||0)/limit) },
  })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  if (!body.user_id) return NextResponse.json({ error: 'user_id wajib' }, { status: 400 })

  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.is_active === 'boolean') fields.is_active = body.is_active
  if (typeof body.role      === 'string')  fields.role      = body.role

  const { data, error } = await getSupabaseAdmin()
    .from('profiles').update(fields).eq('id', body.user_id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
