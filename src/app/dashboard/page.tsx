'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

interface ApiKey { id:string; name:string; key_prefix:string; is_active:boolean; monthly_usage:number; rate_limit:number; usage_count:number; last_used_at:string|null; monthly_reset_at:string }

export default function DashboardPage() {
  const [keys,    setKeys]    = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting,setGreeting]= useState('')
  const [name,    setName]    = useState('')

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h<11?'Selamat Pagi':h<15?'Selamat Siang':h<18?'Selamat Sore':'Selamat Malam')
  }, [])

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const [{ data: p }, { data: k }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', session.user.id).single(),
        supabase.from('api_keys').select('id,name,key_prefix,is_active,monthly_usage,rate_limit,usage_count,last_used_at,monthly_reset_at').eq('user_id', session.user.id).order('created_at', { ascending:false }),
      ])
      setName(p?.full_name?.split(' ')[0] || 'Kawan')
      setKeys(k || [])
      setLoading(false)
    })()
  }, [])

  const totalUsage = keys.reduce((s,k) => s+k.monthly_usage, 0)
  const totalLimit = keys.reduce((s,k) => s+k.rate_limit,    0)
  const activeKeys = keys.filter(k=>k.is_active).length
  const resetDate  = keys[0]?.monthly_reset_at ? new Date(keys[0].monthly_reset_at).toLocaleDateString('id-ID',{day:'numeric',month:'long'}) : '-'

  return (
    <div style={{ padding:'clamp(1.25rem,4vw,2.5rem)' }}>
      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.35rem,4vw,1.75rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.25rem' }}>
          {greeting}, {name}! 👋
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'.875rem' }}>Ringkasan penggunaan API Anda</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'.875rem', marginBottom:'1.75rem' }}>
        {[
          { icon:'🔑', label:'API Keys Aktif',     value:`${activeKeys}/${keys.length}`,                                sub:'Maks. 5 key' },
          { icon:'📈', label:'Request Bulan Ini',  value: totalUsage.toLocaleString('id-ID'),                           sub:`dari ${totalLimit.toLocaleString('id-ID')}` },
          { icon:'🔄', label:'Reset Berikutnya',   value: resetDate,                                                    sub:'Otomatis' },
          { icon:'📊', label:'Total Semua Waktu',  value: keys.reduce((s,k)=>s+k.usage_count,0).toLocaleString('id-ID'), sub:'Total request' },
        ].map(s => (
          <div key={s.label} className="nusantara-card" style={{ padding:'1.25rem' }}>
            <div style={{ fontSize:'1.35rem', marginBottom:'.5rem' }}>{s.icon}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.1rem,3vw,1.4rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.2rem' }}>
              {loading ? '—' : s.value}
            </div>
            <div style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>{s.label}</div>
            <div style={{ fontSize:'.7rem',  color:'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {keys.length > 0 && !loading && totalLimit > 0 && (
        <div className="nusantara-card" style={{ padding:'1.25rem', marginBottom:'1.75rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'.5rem', marginBottom:'.625rem' }}>
            <span style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'.9rem' }}>Penggunaan Bulan Ini</span>
            <span style={{ fontSize:'.8rem', color:'var(--text-secondary)' }}>{totalUsage.toLocaleString('id-ID')} / {totalLimit.toLocaleString('id-ID')}</span>
          </div>
          <div className="progress-batik">
            <div className="progress-batik-fill" style={{ width:`${Math.min((totalUsage/totalLimit)*100,100)}%` }} />
          </div>
          <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.4rem' }}>
            {Math.round((totalUsage/totalLimit)*100)}% terpakai · Reset {resetDate}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1.25rem' }}>
        <div className="nusantara-card" style={{ padding:'1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h3 style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'.9rem' }}>🔑 API Keys</h3>
            <Link href="/dashboard/keys" style={{ fontSize:'.8rem', color:'var(--color-batik)', textDecoration:'none' }}>Kelola →</Link>
          </div>
          {loading ? <p style={{ color:'var(--text-muted)', fontSize:'.875rem' }}>Memuat...</p>
          : keys.length === 0 ? (
            <div style={{ textAlign:'center', padding:'1.5rem 0' }}>
              <div style={{ fontSize:'1.75rem', marginBottom:'.5rem' }}>🔑</div>
              <p style={{ color:'var(--text-secondary)', fontSize:'.8rem', marginBottom:'.875rem' }}>Belum ada API key</p>
              <Link href="/dashboard/keys" className="btn-batik" style={{ textDecoration:'none', display:'inline-block', padding:'.5rem 1rem', fontSize:'.8rem' }}>Buat Key Pertama</Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'.625rem' }}>
              {keys.slice(0,3).map(key => (
                <div key={key.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.625rem .875rem', background:'rgba(255,255,255,.03)', borderRadius:8, border:'1px solid var(--border)' }}>
                  <div style={{ overflow:'hidden' }}>
                    <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'.8rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{key.name}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'.7rem', color:'var(--text-muted)' }}>{key.key_prefix}...</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0, marginLeft:'.5rem' }}>
                    <div className={`badge ${key.is_active?'badge-daun':'badge-wayang'}`} style={{ fontSize:'.62rem' }}>{key.is_active?'● Aktif':'● Off'}</div>
                    <div style={{ fontSize:'.68rem', color:'var(--text-muted)', marginTop:'.2rem' }}>{key.monthly_usage.toLocaleString()} req</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="nusantara-card" style={{ padding:'1.25rem' }}>
          <h3 style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'.9rem', marginBottom:'1rem' }}>🚀 Quick Start</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
            {[
              { step:'1', text:'Buat API key',           href:'/dashboard/keys',     done: keys.length > 0 },
              { step:'2', text:'Baca dokumentasi',       href:'/docs',               done: false },
              { step:'3', text:'Integrasikan ke aplikasi',href:'/docs',              done: false },
              { step:'4', text:'Atur webhook (opsional)', href:'/dashboard/webhooks',done: false },
            ].map(item => (
              <Link key={item.step} href={item.href} style={{ display:'flex', alignItems:'center', gap:'.625rem', padding:'.625rem .875rem', background:'rgba(255,255,255,.03)', borderRadius:8, border:'1px solid var(--border)', textDecoration:'none' }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background: item.done?'rgba(33,196,26,.2)':'rgba(216,135,28,.2)', border:`1px solid ${item.done?'rgba(33,196,26,.5)':'rgba(216,135,28,.4)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.68rem', fontWeight:700, flexShrink:0, color: item.done?'#4ade80':'var(--color-batik)' }}>
                  {item.done ? '✓' : item.step}
                </div>
                <span style={{ fontSize:'.82rem', color: item.done?'var(--text-muted)':'var(--text-secondary)', textDecoration: item.done?'line-through':'none' }}>{item.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
