import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, getSupabaseAdmin } from '@/lib/supabase-server'
import { generateWebhookSecret } from '@/lib/crypto'

const ALLOWED_EVENTS = ['api.call', 'rate_limit.reached', 'key.created', 'key.deleted'] as const

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabaseAdmin()
    .from('webhooks')
    .select('id, name, url, events, is_active, last_triggered_at, failure_count, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json().catch(() => ({}))
  const { name, url, events } = body

  if (!name?.trim() || !url?.trim())
    return NextResponse.json({ error: 'Name dan URL wajib diisi' }, { status: 400 })

  try { new URL(url) } catch {
    return NextResponse.json({ error: 'URL tidak valid' }, { status: 400 })
  }

  const validEvents = Array.isArray(events)
    ? events.filter((e: string) => (ALLOWED_EVENTS as readonly string[]).includes(e))
    : [...ALLOWED_EVENTS]

  if (validEvents.length === 0)
    return NextResponse.json({ error: 'Pilih minimal satu event' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { count } = await admin
    .from('webhooks').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id)

  if ((count || 0) >= 3)
    return NextResponse.json({ error: 'Maksimal 3 webhook per akun' }, { status: 400 })

  const secret = generateWebhookSecret()

  const { data, error } = await admin
    .from('webhooks')
    .insert({ user_id: session.user.id, name: name.trim(), url: url.trim(), secret, events: validEvents })
    .select('id, name, url, events, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    data: { ...data, secret },
    message: 'Webhook berhasil dibuat. Simpan secret ini — tidak akan ditampilkan lagi!',
  })
}
