'use client'
import { useEffect, useState } from 'react'

interface Stats {
  overview: { total_users:number; total_api_keys:number; total_requests:number }
  recent_logs: Array<{ id:string; endpoint:string; status_code:number; response_time_ms:number; created_at:string; profiles?:{email:string} }>
  top_users: Array<{ user_id:string; monthly_usage:number; profiles?:{email:string;full_name:string} }>
  daily_chart: Array<{ date:string; count:number }>
}

export default function AdminPage() {
  const [data,    setData]    = useState<Stats|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch('/api/admin/stats').then(r=>r.json()).then(j=>{setData(j.data);setLoading(false)}) }, [])

  const max = data ? Math.max(...data.daily_chart.map(d=>d.count), 1) : 1
  const sc  = (c:number) => c>=200&&c<300?'#4ade80':c>=400&&c<500?'#fb923c':'#f87171'

  return (
    <div style={{ padding:'clamp(1.25rem,4vw,2.5rem)' }}>
      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.35rem,4vw,1.75rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.2rem' }}>🛡️ Admin Dashboard</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'.85rem' }}>Monitor aktivitas Kograph APIs</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:'.875rem', marginBottom:'1.75rem' }}>
        {[
          { icon:'👥', label:'Pengguna',      value: data?.overview.total_users??'—',                              color:'#60a5fa' },
          { icon:'🔑', label:'API Keys',      value: data?.overview.total_api_keys??'—',                           color:'var(--color-batik)' },
          { icon:'📡', label:'Total Requests',value: data?.overview.total_requests.toLocaleString('id-ID')??'—',   color:'var(--color-emas)' },
        ].map(s=>(
          <div key={s.label} className="nusantara-card" style={{ padding:'1.25rem' }}>
            <div style={{ fontSize:'1.5rem', marginBottom:'.625rem' }}>{s.icon}</div>
            <div style={{ fontSize:'clamp(1.2rem,3vw,1.75rem)', fontWeight:700, color:s.color, fontFamily:'var(--font-display)' }}>{loading?'—':s.value}</div>
            <div style={{ fontSize:'.75rem', color:'var(--text-muted)', marginTop:'.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {data && data.daily_chart.length > 0 && (
        <div className="nusantara-card" style={{ padding:'1.25rem', marginBottom:'1.75rem', overflowX:'auto' }}>
          <h3 style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:'1.25rem', fontSize:'.9rem' }}>📈 Request Harian (30 hari)</h3>
          <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:100, minWidth: data.daily_chart.length*14 }}>
            {data.daily_chart.map((d,i)=>(
              <div key={d.date} title={`${d.date}: ${d.count}`} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, minWidth:10 }}>
                <div style={{ width:'100%', height:`${Math.max(3,(d.count/max)*85)}px`, background:'linear-gradient(180deg,#ef4444,#dc2626)', borderRadius:'2px 2px 0 0', cursor:'pointer' }} />
                {i%5===0 && <div style={{ fontSize:'.5rem', color:'var(--text-muted)', transform:'rotate(-45deg)', transformOrigin:'top', whiteSpace:'nowrap' }}>{d.date.slice(5)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1.25rem' }}>
        <div className="nusantara-card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'.9rem' }}>🏆 Top Pengguna</h3>
          </div>
          {loading ? <div style={{ padding:'2rem', display:'flex', justifyContent:'center' }}><div className="spinner" style={{ width:22, height:22, borderWidth:2 }} /></div> : (
            <div>
              {data?.top_users.map((u,i)=>(
                <div key={u.user_id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.75rem 1.25rem', borderBottom: i<(data.top_users.length-1)?'1px solid rgba(216,135,28,.08)':'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.625rem', minWidth:0 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background: i<3?'rgba(249,160,7,.2)':'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.72rem', fontWeight:700, flexShrink:0 }}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':<span style={{color:'var(--text-muted)'}}>{i+1}</span>}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'.82rem', fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.profiles?.full_name||'User'}</div>
                      <div style={{ fontSize:'.7rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.profiles?.email}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0, marginLeft:'.5rem' }}>
                    <div style={{ fontSize:'.875rem', fontWeight:700, color:'var(--color-batik)' }}>{u.monthly_usage.toLocaleString('id-ID')}</div>
                    <div style={{ fontSize:'.68rem', color:'var(--text-muted)' }}>req/bln</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="nusantara-card" style={{ overflow:'hidden' }}>
          <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'.9rem' }}>🗂 Log Terbaru</h3>
          </div>
          {loading ? <div style={{ padding:'2rem', display:'flex', justifyContent:'center' }}><div className="spinner" style={{ width:22, height:22, borderWidth:2 }} /></div> : (
            <div style={{ overflowY:'auto', maxHeight:360 }}>
              {data?.recent_logs.map(log=>(
                <div key={log.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.625rem 1.25rem', borderBottom:'1px solid rgba(216,135,28,.06)', gap:'.5rem' }}>
                  <div style={{ flex:1, overflow:'hidden' }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'.75rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.endpoint}</div>
                    <div style={{ fontSize:'.68rem', color:'var(--text-muted)' }}>{(log.profiles as {email:string}|undefined)?.email||'Unknown'} · {log.response_time_ms}ms</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'.4rem', flexShrink:0 }}>
                    <span style={{ padding:'2px 7px', borderRadius:20, fontSize:'.7rem', fontWeight:600, color:sc(log.status_code), background:`${sc(log.status_code)}20` }}>{log.status_code}</span>
                    <span style={{ fontSize:'.68rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{new Date(log.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
