import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = getSupabaseAdmin()

  const [
    { count: totalUsers },
    { count: totalKeys },
    { count: totalRequests },
    { data: recentLogs },
    { data: topUsers },
    { data: dailyUsage },
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('api_keys').select('id', { count: 'exact', head: true }),
    db.from('api_usage_logs').select('id', { count: 'exact', head: true }),
    db.from('api_usage_logs')
      .select('id, endpoint, status_code, response_time_ms, created_at, profiles(email)')
      .order('created_at', { ascending: false }).limit(20),
    db.from('api_keys')
      .select('user_id, monthly_usage, usage_count, profiles(email, full_name)')
      .order('monthly_usage', { ascending: false }).limit(10),
    db.from('api_usage_logs')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 86400 * 1000).toISOString()),
  ])

  const dailyMap: Record<string, number> = {}
  dailyUsage?.forEach(({ created_at }) => {
    const day = (created_at as string).split('T')[0]
    dailyMap[day] = (dailyMap[day] || 0) + 1
  })
  const dailyChart = Object.entries(dailyMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)

  return NextResponse.json({
    success: true,
    data: {
      overview: { total_users: totalUsers||0, total_api_keys: totalKeys||0, total_requests: totalRequests||0 },
      recent_logs: recentLogs || [],
      top_users:   topUsers   || [],
      daily_chart: dailyChart,
    },
  })
}
