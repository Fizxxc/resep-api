'use client'
import { useEffect, useState } from 'react'

interface ApiKey { id:string; name:string; key_prefix:string; is_active:boolean; monthly_usage:number; rate_limit:number; usage_count:number; last_used_at:string|null; monthly_reset_at:string }
interface NewKey  { key:string; name:string }

export default function KeysPage() {
  const [keys,       setKeys]       = useState<ApiKey[]>([])
  const [loading,    setLoading]    = useState(true)
  const [creating,   setCreating]   = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [showForm,   setShowForm]   = useState(false)
  const [newKey,     setNewKey]     = useState<NewKey|null>(null)
  const [copied,     setCopied]     = useState(false)
  const [error,      setError]      = useState('')

  const load = async () => {
    const r = await fetch('/api/keys/list'); const j = await r.json()
    setKeys(j.data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!newKeyName.trim()) { setError('Nama wajib diisi'); return }
    setCreating(true); setError('')
    const r = await fetch('/api/keys/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: newKeyName }) })
    const j = await r.json()
    if (!r.ok) { setError(j.error || 'Gagal membuat key'); setCreating(false); return }
    setNewKey({ key: j.data.key, name: j.data.name })
    setNewKeyName(''); setShowForm(false); load(); setCreating(false)
  }

  const toggle = async (id:string, is_active:boolean) => {
    await fetch(`/api/keys/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ is_active: !is_active }) }); load()
  }
  const del = async (id:string, name:string) => {
    if (!confirm(`Hapus "${name}"?`)) return
    await fetch(`/api/keys/${id}`, { method:'DELETE' }); load()
  }
  const copy = (t:string) => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(()=>setCopied(false), 2000) }

  return (
    <div style={{ padding:'clamp(1.25rem,4vw,2.5rem)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.75rem', gap:'1rem', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.35rem,4vw,1.75rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.2rem' }}>🔑 API Keys</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'.85rem' }}>Kelola API key · Maks. 5 per akun</p>
        </div>
        {keys.length < 5 && (
          <button className="btn-batik" onClick={()=>setShowForm(true)} style={{ fontSize:'.875rem', padding:'.625rem 1.25rem', whiteSpace:'nowrap' }}>+ Buat Key</button>
        )}
      </div>

      {newKey && (
        <div style={{ background:'rgba(33,196,26,.08)', border:'1px solid rgba(33,196,26,.3)', borderRadius:14, padding:'1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'.875rem' }}>
            <span style={{ fontSize:'1.25rem' }}>🎉</span>
            <div>
              <div style={{ fontWeight:700, color:'#4ade80', fontSize:'.9rem' }}>API Key Berhasil Dibuat!</div>
              <div style={{ fontSize:'.78rem', color:'var(--text-secondary)' }}>⚠️ Simpan key ini — tidak akan ditampilkan lagi!</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'.625rem', background:'rgba(0,0,0,.3)', borderRadius:8, padding:'.75rem', flexWrap:'wrap' }}>
            <code style={{ fontFamily:'var(--font-mono)', fontSize:'.8rem', color:'var(--color-emas)', flex:1, wordBreak:'break-all', minWidth:0 }}>{newKey.key}</code>
            <button onClick={()=>copy(newKey.key)} style={{ padding:'.4rem .875rem', background: copied?'rgba(33,196,26,.2)':'rgba(216,135,28,.2)', border:`1px solid ${copied?'rgba(33,196,26,.4)':'rgba(216,135,28,.4)'}`, borderRadius:6, cursor:'pointer', color: copied?'#4ade80':'var(--color-batik)', fontSize:'.78rem', fontWeight:600, whiteSpace:'nowrap', flexShrink:0 }}>
              {copied ? '✓ Disalin!' : '📋 Salin'}
            </button>
          </div>
          <button onClick={()=>setNewKey(null)} style={{ marginTop:'.625rem', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'.75rem' }}>Saya sudah menyimpan key ini ×</button>
        </div>
      )}

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(8px)', padding:'1rem' }}>
          <div className="nusantara-card" style={{ padding:'1.75rem', width:'100%', maxWidth:420 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--text-primary)', marginBottom:'1.25rem' }}>Buat API Key Baru</h3>
            {error && <div style={{ background:'rgba(240,80,16,.1)', border:'1px solid rgba(240,80,16,.3)', borderRadius:8, padding:'.625rem .875rem', color:'#fb923c', fontSize:'.82rem', marginBottom:'1rem' }}>⚠️ {error}</div>}
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-secondary)', marginBottom:'.4rem' }}>Nama API Key</label>
              <input className="input-batik" value={newKeyName} onChange={e=>setNewKeyName(e.target.value)} placeholder="cth: Aplikasi Resep Web" onKeyDown={e=>e.key==='Enter'&&create()} autoFocus />
            </div>
            <div style={{ display:'flex', gap:'.625rem' }}>
              <button className="btn-batik" onClick={create} disabled={creating} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem', padding:'.625rem' }}>
                {creating ? <><div className="spinner" style={{ width:15, height:15 }} /> Membuat...</> : '✨ Buat Key'}
              </button>
              <button className="btn-outline-batik" onClick={()=>{setShowForm(false);setError('')}} style={{ flex:1, padding:'.625rem' }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><div className="spinner" style={{ width:30, height:30, borderWidth:3 }} /></div>
      ) : keys.length === 0 ? (
        <div className="nusantara-card" style={{ padding:'3rem', textAlign:'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'.875rem' }}>🔑</div>
          <h3 style={{ fontFamily:'var(--font-display)', color:'var(--text-primary)', marginBottom:'.5rem' }}>Belum Ada API Key</h3>
          <p style={{ color:'var(--text-secondary)', fontSize:'.875rem', marginBottom:'1.25rem' }}>Buat API key untuk mulai menggunakan Kograph APIs</p>
          <button className="btn-batik" onClick={()=>setShowForm(true)}>+ Buat API Key</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'.875rem' }}>
          {keys.map(key => {
            const pct = Math.round((key.monthly_usage/key.rate_limit)*100)
            const reset = new Date(key.monthly_reset_at).toLocaleDateString('id-ID',{day:'numeric',month:'short'})
            return (
              <div key={key.id} className="nusantara-card" style={{ padding:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem', gap:'.75rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.75rem', flex:1, minWidth:0 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background: key.is_active?'rgba(216,135,28,.15)':'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>
                      {key.is_active ? '🔑' : '🔒'}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'.95rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{key.name}</div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:'.72rem', color:'var(--text-muted)' }}>{key.key_prefix}••••••••••••••••••••</div>
                    </div>
                  </div>
                  <div className={`badge ${key.is_active?'badge-daun':'badge-wayang'}`} style={{ flexShrink:0, fontSize:'.65rem' }}>{key.is_active?'● Aktif':'● Off'}</div>
                </div>
                <div style={{ marginBottom:'1rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', color:'var(--text-secondary)', marginBottom:'.375rem', flexWrap:'wrap', gap:'.25rem' }}>
                    <span>Penggunaan bulan ini</span>
                    <span>{key.monthly_usage.toLocaleString('id-ID')} / {key.rate_limit.toLocaleString('id-ID')} · Reset {reset}</span>
                  </div>
                  <div className="progress-batik">
                    <div className="progress-batik-fill" style={{ width:`${Math.min(pct,100)}%`, background: pct>=90?'linear-gradient(90deg,#ef4444,#dc2626)': pct>=70?'linear-gradient(90deg,var(--color-emas),var(--color-wayang))':undefined }} />
                  </div>
                  <div style={{ fontSize:'.7rem', color:'var(--text-muted)', marginTop:'.3rem' }}>
                    {pct}% · Total: {key.usage_count.toLocaleString('id-ID')} req{key.last_used_at?` · Terakhir: ${new Date(key.last_used_at).toLocaleDateString('id-ID')}`:''}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                  <button onClick={()=>toggle(key.id,key.is_active)} style={{ padding:'.425rem .875rem', background: key.is_active?'rgba(240,80,16,.1)':'rgba(33,196,26,.1)', border:`1px solid ${key.is_active?'rgba(240,80,16,.3)':'rgba(33,196,26,.3)'}`, borderRadius:7, cursor:'pointer', color: key.is_active?'#fb923c':'#4ade80', fontSize:'.78rem', fontWeight:500 }}>
                    {key.is_active ? '⏸ Nonaktifkan' : '▶ Aktifkan'}
                  </button>
                  <button onClick={()=>del(key.id,key.name)} style={{ padding:'.425rem .875rem', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:7, cursor:'pointer', color:'#f87171', fontSize:'.78rem', fontWeight:500 }}>🗑 Hapus</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ marginTop:'1.5rem', padding:'1rem 1.25rem', background:'rgba(216,135,28,.06)', border:'1px solid var(--border)', borderRadius:10, fontSize:'.82rem', color:'var(--text-secondary)', lineHeight:1.6 }}>
        <strong style={{ color:'var(--color-emas)' }}>💡 Tips:</strong> API key hanya ditampilkan sekali. Jika hilang, hapus dan buat key baru. Limit 10.000 req/bulan reset otomatis.
      </div>
    </div>
  )
}
