'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Log { id:string; endpoint:string; method:string; status_code:number; response_time_ms:number; created_at:string }

export default function UsagePage() {
  const [logs,    setLogs]    = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [stats,   setStats]   = useState({ total:0, success:0, errors:0, avgTime:0 })
  const [daily,   setDaily]   = useState<{date:string;count:number}[]>([])

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('api_usage_logs')
        .select('id,endpoint,method,status_code,response_time_ms,created_at')
        .eq('user_id', session.user.id).order('created_at',{ascending:false}).limit(100)
      const l = data || []
      setLogs(l)
      setStats({
        total:   l.length,
        success: l.filter(x=>x.status_code>=200&&x.status_code<300).length,
        errors:  l.filter(x=>x.status_code>=400).length,
        avgTime: l.length ? Math.round(l.reduce((s,x)=>s+(x.response_time_ms||0),0)/l.length) : 0,
      })
      const dm: Record<string,number> = {}
      l.forEach(x => { const d=x.created_at.split('T')[0]; dm[d]=(dm[d]||0)+1 })
      setDaily(Object.entries(dm).map(([date,count])=>({date,count})).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14))
      setLoading(false)
    })()
  }, [])

  const maxCount = Math.max(...daily.map(d=>d.count), 1)
  const sc = (c:number) => c>=200&&c<300?'#4ade80':c>=400&&c<500?'#fb923c':'#f87171'

  return (
    <div style={{ padding:'clamp(1.25rem,4vw,2.5rem)' }}>
      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.35rem,4vw,1.75rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.2rem' }}>📊 Statistik Penggunaan</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'.85rem' }}>100 request terakhir</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:'.875rem', marginBottom:'1.75rem' }}>
        {[
          {label:'Total',       value:stats.total,             icon:'📡', color:'var(--color-batik)'},
          {label:'Sukses 2xx',  value:stats.success,           icon:'✅', color:'#4ade80'},
          {label:'Error 4xx+',  value:stats.errors,            icon:'❌', color:'#f87171'},
          {label:'Avg Response',value:`${stats.avgTime}ms`,    icon:'⚡', color:'var(--color-emas)'},
        ].map(s=>(
          <div key={s.label} className="nusantara-card" style={{ padding:'1.1rem' }}>
            <div style={{ fontSize:'1.25rem', marginBottom:'.5rem' }}>{s.icon}</div>
            <div style={{ fontSize:'clamp(1.1rem,3vw,1.4rem)', fontWeight:700, color:s.color, fontFamily:'var(--font-display)' }}>{loading?'—':s.value}</div>
            <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {daily.length > 0 && (
        <div className="nusantara-card" style={{ padding:'1.25rem', marginBottom:'1.75rem', overflowX:'auto' }}>
          <h3 style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:'1.25rem', fontSize:'.9rem' }}>📈 Request 14 Hari Terakhir</h3>
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:90, minWidth: daily.length*22 }}>
            {daily.map(d=>(
              <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:18 }}>
                <div title={`${d.date}: ${d.count}`} style={{ width:'100%', height:`${Math.max(4,(d.count/maxCount)*70)}px`, background:'linear-gradient(180deg,var(--color-batik),var(--color-wayang))', borderRadius:'3px 3px 0 0', cursor:'pointer' }} />
                <div style={{ fontSize:'.55rem', color:'var(--text-muted)', transform:'rotate(-45deg)', transformOrigin:'top center', whiteSpace:'nowrap' }}>{d.date.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="nusantara-card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'.9rem' }}>🗂 Log Terbaru</h3>
        </div>
        {loading ? (
          <div style={{ padding:'3rem', display:'flex', justifyContent:'center' }}><div className="spinner" style={{ width:26, height:26, borderWidth:3 }} /></div>
        ) : logs.length===0 ? (
          <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-muted)', fontSize:'.875rem' }}>
            <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>📭</div>Belum ada log
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="nusantara-table" style={{ minWidth:480 }}>
              <thead><tr><th>Endpoint</th><th>Status</th><th>Response</th><th>Waktu</th></tr></thead>
              <tbody>
                {logs.map(log=>(
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:'.78rem', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:'.4rem', flexWrap:'wrap' }}>
                        <span style={{ padding:'1px 6px', background:'rgba(216,135,28,.15)', borderRadius:4, fontSize:'.68rem', color:'var(--color-batik)', whiteSpace:'nowrap' }}>{log.method}</span>
                        <span style={{ wordBreak:'break-all' }}>{log.endpoint}</span>
                      </div>
                    </td>
                    <td><span style={{ padding:'2px 8px', borderRadius:20, fontSize:'.72rem', fontWeight:600, color:sc(log.status_code), background:`${sc(log.status_code)}20` }}>{log.status_code}</span></td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:'.78rem', whiteSpace:'nowrap' }}>{log.response_time_ms}ms</td>
                    <td style={{ fontSize:'.75rem', whiteSpace:'nowrap' }}>{new Date(log.created_at).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
