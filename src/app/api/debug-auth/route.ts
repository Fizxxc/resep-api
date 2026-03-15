import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const jar = await cookies()
  const allCookies = jar.getAll()
  const sbCookies = allCookies.filter(c => c.name.includes('sb-'))

  const session = await getServerSession()

  return NextResponse.json({
    hasUrl:    !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnon:   !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSvc:    !!process.env.SUPABASE_SERVICE_ROLE_KEY,

    sessionOk:    !!session,
    sessionEmail: session?.user?.email ?? null,
    sessionId:    session?.user?.id ?? null,

    totalCookies: allCookies.length,
    sbCookies: sbCookies.map(c => ({
      name:        c.name,
      valueLength: c.value?.length ?? 0,
      valueStart:  c.value?.slice(0, 40) ?? 'empty',
    })),
  })
}
