'use client'
import { useEffect, useState } from 'react'

interface User {
  id: string; email: string; full_name: string; role: string
  is_active: boolean; created_at: string
  api_keys: Array<{ id:string; monthly_usage:number; usage_count:number; is_active:boolean }>
}

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)
  const [search,  setSearch]  = useState('')

  const load = async () => {
    setLoading(true)
    const r = await fetch(`/api/admin/users?page=${page}&limit=20`)
    const j = await r.json()
    setUsers(j.data || [])
    setTotal(j.meta?.total || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [page])

  const toggleUser = async (userId: string, is_active: boolean) => {
    await fetch('/api/admin/users', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: userId, is_active: !is_active }) })
    load()
  }

  const setRole = async (userId: string, role: string) => {
    await fetch('/api/admin/users', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: userId, role }) })
    load()
  }

  const filtered = users.filter(u =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding:'clamp(1.25rem,4vw,2.5rem)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.75rem', gap:'1rem', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.35rem,4vw,1.75rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.2rem' }}>👥 Pengguna</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'.85rem' }}>Total {total} pengguna terdaftar</p>
        </div>
        <input
          className="input-batik"
          placeholder="🔍 Cari email / nama..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width:'min(100%,260px)' }}
        />
      </div>

      <div className="nusantara-card" style={{ overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:'3rem', display:'flex', justifyContent:'center' }}>
            <div className="spinner" style={{ width:28, height:28, borderWidth:3 }} />
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="nusantara-table" style={{ minWidth:700 }}>
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Role</th>
                  <th>Keys / Usage</th>
                  <th>Status</th>
                  <th>Bergabung</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const totalUsage = user.api_keys?.reduce((s, k) => s + k.monthly_usage, 0) || 0
                  const activeKeys = user.api_keys?.filter(k => k.is_active).length || 0
                  return (
                    <tr key={user.id}>
                      <td>
                        <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'.85rem' }}>{user.full_name || '—'}</div>
                        <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>{user.email}</div>
                      </td>
                      <td>
                        <select
                          value={user.role}
                          onChange={e => setRole(user.id, e.target.value)}
                          style={{ background: user.role==='admin'?'rgba(239,68,68,.15)':'rgba(255,255,255,.05)', border:`1px solid ${user.role==='admin'?'rgba(239,68,68,.4)':'var(--border)'}`, color: user.role==='admin'?'#f87171':'var(--text-secondary)', borderRadius:6, padding:'3px 8px', fontSize:'.78rem', cursor:'pointer' }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ fontSize:'.82rem', color:'var(--text-secondary)' }}>{activeKeys}/{user.api_keys?.length||0} aktif</div>
                        <div style={{ fontSize:'.72rem', color:'var(--color-batik)', fontWeight:600 }}>{totalUsage.toLocaleString('id-ID')} req</div>
                      </td>
                      <td>
                        <div className={`badge ${user.is_active?'badge-daun':'badge-wayang'}`} style={{ fontSize:'.65rem' }}>
                          {user.is_active ? '● Aktif' : '● Diblokir'}
                        </div>
                      </td>
                      <td style={{ fontSize:'.78rem' }}>
                        {new Date(user.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleUser(user.id, user.is_active)}
                          style={{ padding:'4px 10px', background: user.is_active?'rgba(239,68,68,.1)':'rgba(33,196,26,.1)', border:`1px solid ${user.is_active?'rgba(239,68,68,.3)':'rgba(33,196,26,.3)'}`, borderRadius:6, cursor:'pointer', color: user.is_active?'#f87171':'#4ade80', fontSize:'.75rem', fontWeight:500, whiteSpace:'nowrap' }}
                        >
                          {user.is_active ? '🚫 Blokir' : '✅ Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding:'.875rem 1.25rem', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'.5rem' }}>
          <span style={{ fontSize:'.78rem', color:'var(--text-muted)' }}>Halaman {page} · {total} pengguna</span>
          <div style={{ display:'flex', gap:'.4rem' }}>
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{ padding:'5px 10px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor: page===1?'not-allowed':'pointer', fontSize:'.78rem', opacity: page===1?.4:1 }}>← Prev</button>
            <button onClick={() => setPage(p => p+1)} disabled={page*20>=total} style={{ padding:'5px 10px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text-secondary)', cursor: page*20>=total?'not-allowed':'pointer', fontSize:'.78rem', opacity: page*20>=total?.4:1 }}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
