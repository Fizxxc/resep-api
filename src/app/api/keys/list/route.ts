import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await getSupabaseAdmin()
    .from('api_keys')
    .select('id, name, key_prefix, is_active, last_used_at, usage_count, monthly_usage, monthly_reset_at, rate_limit, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}
