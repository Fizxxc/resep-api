'use client'
import { useEffect, useState } from 'react'

interface ApiKeyAdmin {
  id: string; name: string; key_prefix: string; is_active: boolean
  monthly_usage: number; usage_count: number; rate_limit: number
  last_used_at: string|null
  profiles?: { email:string; full_name:string }
}

export default function AdminKeysPage() {
  const [keys,    setKeys]    = useState<ApiKeyAdmin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users?limit=100')
      .then(r => r.json())
      .then(json => {
        const all: ApiKeyAdmin[] = []
        ;(json.data || []).forEach((u: { api_keys?: ApiKeyAdmin[]; email:string; full_name:string }) => {
          if (u.api_keys) u.api_keys.forEach(k => all.push({ ...k, profiles:{ email:u.email, full_name:u.full_name } }))
        })
        setKeys(all.sort((a,b) => b.monthly_usage - a.monthly_usage))
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding:'clamp(1.25rem,4vw,2.5rem)' }}>
      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.35rem,4vw,1.75rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.2rem' }}>🔑 Semua API Keys</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'.85rem' }}>Total {keys.length} API key di platform</p>
      </div>

      <div className="nusantara-card" style={{ overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:'3rem', display:'flex', justifyContent:'center' }}>
            <div className="spinner" style={{ width:28, height:28, borderWidth:3 }} />
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="nusantara-table" style={{ minWidth:620 }}>
              <thead>
                <tr>
                  <th>Key / Nama</th>
                  <th>Pemilik</th>
                  <th>Penggunaan</th>
                  <th>Status</th>
                  <th>Terakhir Aktif</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(key => {
                  const pct = Math.min(((key.monthly_usage)/(key.rate_limit||10000))*100, 100)
                  return (
                    <tr key={key.id}>
                      <td>
                        <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'.85rem' }}>{key.name}</div>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:'.7rem', color:'var(--text-muted)' }}>{key.key_prefix}••••</div>
                      </td>
                      <td>
                        <div style={{ fontSize:'.82rem', color:'var(--text-primary)' }}>{key.profiles?.full_name||'—'}</div>
                        <div style={{ fontSize:'.7rem', color:'var(--text-muted)' }}>{key.profiles?.email}</div>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                          <div style={{ width:60, flexShrink:0 }}>
                            <div className="progress-batik">
                              <div className="progress-batik-fill" style={{ width:`${pct}%`, background: pct>=90?'linear-gradient(90deg,#ef4444,#dc2626)':undefined }} />
                            </div>
                          </div>
                          <span style={{ fontSize:'.8rem', color:'var(--color-batik)', fontWeight:600, whiteSpace:'nowrap' }}>
                            {key.monthly_usage.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div style={{ fontSize:'.68rem', color:'var(--text-muted)', marginTop:'.2rem' }}>
                          Total: {(key.usage_count||0).toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td>
                        <div className={`badge ${key.is_active?'badge-daun':'badge-wayang'}`} style={{ fontSize:'.65rem' }}>
                          {key.is_active ? '● Aktif' : '● Off'}
                        </div>
                      </td>
                      <td style={{ fontSize:'.78rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                        {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString('id-ID',{day:'numeric',month:'short'}) : 'Belum pernah'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
