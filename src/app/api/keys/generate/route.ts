import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, getSupabaseAdmin } from '@/lib/supabase-server'
import { generateApiKey } from '@/lib/crypto'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const name = (body.name as string)?.trim() || 'My API Key'

  const admin = getSupabaseAdmin()

  const { count } = await admin
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)

  if ((count || 0) >= 5) {
    return NextResponse.json(
      { error: 'Maksimal 5 API key per akun. Hapus key yang tidak terpakai.' },
      { status: 400 }
    )
  }

  const { key, prefix, hash } = generateApiKey()

  const { data, error } = await admin
    .from('api_keys')
    .insert({ user_id: session.user.id, name, key_hash: hash, key_prefix: prefix, rate_limit: 10000 })
    .select('id, name, key_prefix, created_at, rate_limit')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    message: 'API key berhasil dibuat. Simpan key ini sekarang — tidak akan ditampilkan lagi!',
    data: { ...data, key },
  })
}
