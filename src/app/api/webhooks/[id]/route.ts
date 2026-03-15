import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, getSupabaseAdmin } from '@/lib/supabase-server'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await getSupabaseAdmin()
    .from('webhooks').delete().eq('id', params.id).eq('user_id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => ({}))
  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.name      === 'string')  fields.name      = body.name
  if (typeof body.url       === 'string')  fields.url       = body.url
  if (Array.isArray(body.events))          fields.events    = body.events
  if (typeof body.is_active === 'boolean') fields.is_active = body.is_active

  const { data, error } = await getSupabaseAdmin()
    .from('webhooks').update(fields)
    .eq('id', params.id).eq('user_id', session.user.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
