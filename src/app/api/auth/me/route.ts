import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('email, full_name, role, is_active')
    .eq('id', session.user.id)
    .single()

  return NextResponse.json({
    id:        session.user.id,
    email:     profile?.email     || session.user.email,
    full_name: profile?.full_name || '',
    role:      profile?.role      || 'user',
    is_active: profile?.is_active ?? true,
  })
}
