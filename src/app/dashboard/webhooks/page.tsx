'use client'
import { useEffect, useState } from 'react'

interface Webhook { id:string; name:string; url:string; events:string[]; is_active:boolean; last_triggered_at:string|null; failure_count:number; created_at:string }

const ALL_EVENTS = [
  { value:'api.call',           label:'API Call',            desc:'Setiap request API berhasil',  icon:'📡' },
  { value:'rate_limit.reached', label:'Rate Limit Tercapai', desc:'Kuota bulanan habis',           icon:'⚡' },
  { value:'key.created',        label:'API Key Dibuat',      desc:'Key baru berhasil dibuat',     icon:'🔑' },
  { value:'key.deleted',        label:'API Key Dihapus',     desc:'Key dihapus dari akun',        icon:'🗑' },
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [secret,   setSecret]   = useState<{name:string;secret:string}|null>(null)
  const [copied,   setCopied]   = useState(false)
  const [error,    setError]    = useState('')
  const [form,     setForm]     = useState({ name:'', url:'', events:['rate_limit.reached','key.created','key.deleted'] })

  const load = async () => { const r = await fetch('/api/webhooks'); const j = await r.json(); setWebhooks(j.data||[]); setLoading(false) }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.name.trim()||!form.url.trim()) { setError('Nama dan URL wajib'); return }
    if (form.events.length===0) { setError('Pilih minimal satu event'); return }
    setCreating(true); setError('')
    const r = await fetch('/api/webhooks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
    const j = await r.json()
    if (!r.ok) { setError(j.error); setCreating(false); return }
    setSecret({ name: j.data.name, secret: j.data.secret })
    setShowForm(false); setForm({ name:'', url:'', events:['rate_limit.reached','key.created','key.deleted'] }); load(); setCreating(false)
  }
  const del    = async (id:string, name:string) => { if (!confirm(`Hapus "${name}"?`)) return; await fetch(`/api/webhooks/${id}`,{method:'DELETE'}); load() }
  const toggle = async (id:string, is_active:boolean) => { await fetch(`/api/webhooks/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_active:!is_active})}); load() }
  const toggleEv = (ev:string) => setForm(f => ({ ...f, events: f.events.includes(ev)?f.events.filter(e=>e!==ev):[...f.events,ev] }))
  const copy = (t:string) => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(()=>setCopied(false), 2000) }

  return (
    <div style={{ padding:'clamp(1.25rem,4vw,2.5rem)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.75rem', gap:'1rem', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.35rem,4vw,1.75rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.2rem' }}>🪝 Webhooks</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'.85rem' }}>Terima notifikasi event · Maks. 3 webhook</p>
        </div>
        {webhooks.length < 3 && (
          <button className="btn-batik" onClick={()=>setShowForm(true)} style={{ fontSize:'.875rem', padding:'.625rem 1.25rem', whiteSpace:'nowrap' }}>+ Tambah Webhook</button>
        )}
      </div>

      <div style={{ marginBottom:'1.5rem', padding:'1rem 1.25rem', background:'rgba(216,135,28,.06)', border:'1px solid var(--border)', borderRadius:12 }}>
        <div style={{ fontWeight:600, color:'var(--color-emas)', marginBottom:'.5rem', fontSize:'.875rem' }}>ℹ️ Cara Kerja</div>
        <p style={{ color:'var(--text-secondary)', fontSize:'.82rem', lineHeight:1.6 }}>
          Daftarkan URL endpoint Anda. Sistem Kograph akan mengirim POST request saat event terjadi, disertai header <code style={{ fontFamily:'var(--font-mono)', color:'var(--color-batik)', fontSize:'.78rem' }}>X-Kograph-Signature</code> untuk verifikasi.
        </p>
      </div>

      {secret && (
        <div style={{ background:'rgba(33,196,26,.08)', border:'1px solid rgba(33,196,26,.3)', borderRadius:14, padding:'1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'.875rem' }}>
            <span style={{ fontSize:'1.25rem' }}>🎉</span>
            <div>
              <div style={{ fontWeight:700, color:'#4ade80', fontSize:'.9rem' }}>Webhook "{secret.name}" Dibuat!</div>
              <div style={{ fontSize:'.78rem', color:'var(--text-secondary)' }}>⚠️ Simpan Webhook Secret ini — tidak akan ditampilkan lagi!</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'.625rem', background:'rgba(0,0,0,.3)', borderRadius:8, padding:'.75rem', flexWrap:'wrap' }}>
            <code style={{ fontFamily:'var(--font-mono)', fontSize:'.8rem', color:'var(--color-emas)', flex:1, wordBreak:'break-all', minWidth:0 }}>{secret.secret}</code>
            <button onClick={()=>copy(secret.secret)} style={{ padding:'.4rem .875rem', background: copied?'rgba(33,196,26,.2)':'rgba(216,135,28,.2)', border:`1px solid ${copied?'rgba(33,196,26,.4)':'rgba(216,135,28,.4)'}`, borderRadius:6, cursor:'pointer', color: copied?'#4ade80':'var(--color-batik)', fontSize:'.78rem', fontWeight:600, flexShrink:0 }}>
              {copied ? '✓ Disalin!' : '📋 Salin'}
            </button>
          </div>
          <button onClick={()=>setSecret(null)} style={{ marginTop:'.625rem', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'.75rem' }}>Saya sudah menyimpan secret ×</button>
        </div>
      )}

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(8px)', padding:'1rem' }}>
          <div className="nusantara-card" style={{ padding:'1.75rem', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'var(--text-primary)', marginBottom:'1.25rem' }}>Tambah Webhook</h3>
            {error && <div style={{ background:'rgba(240,80,16,.1)', border:'1px solid rgba(240,80,16,.3)', borderRadius:8, padding:'.625rem', color:'#fb923c', fontSize:'.82rem', marginBottom:'1rem' }}>⚠️ {error}</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-secondary)', marginBottom:'.4rem' }}>Nama</label>
                <input className="input-batik" placeholder="cth: Notifikasi Slack" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-secondary)', marginBottom:'.4rem' }}>URL Endpoint</label>
                <input className="input-batik" placeholder="https://yoursite.com/webhook" value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-secondary)', marginBottom:'.6rem' }}>Events</label>
                <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                  {ALL_EVENTS.map(ev => (
                    <label key={ev.value} style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.625rem .875rem', background: form.events.includes(ev.value)?'rgba(216,135,28,.1)':'rgba(255,255,255,.03)', border:`1px solid ${form.events.includes(ev.value)?'rgba(216,135,28,.4)':'var(--border)'}`, borderRadius:8, cursor:'pointer' }}>
                      <input type="checkbox" checked={form.events.includes(ev.value)} onChange={()=>toggleEv(ev.value)} style={{ accentColor:'var(--color-batik)', width:15, height:15, flexShrink:0 }} />
                      <span style={{ fontSize:'1rem' }}>{ev.icon}</span>
                      <div>
                        <div style={{ fontSize:'.82rem', fontWeight:500, color:'var(--text-primary)' }}>{ev.label}</div>
                        <div style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>{ev.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'.625rem', marginTop:'1.5rem' }}>
              <button className="btn-batik" onClick={create} disabled={creating} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem', padding:'.625rem' }}>
                {creating ? <><div className="spinner" style={{ width:15, height:15 }} /> Membuat...</> : '✨ Buat Webhook'}
              </button>
              <button className="btn-outline-batik" onClick={()=>{setShowForm(false);setError('')}} style={{ flex:1, padding:'.625rem' }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><div className="spinner" style={{ width:30, height:30, borderWidth:3 }} /></div>
      ) : webhooks.length===0 ? (
        <div className="nusantara-card" style={{ padding:'3rem', textAlign:'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'.875rem' }}>🪝</div>
          <h3 style={{ fontFamily:'var(--font-display)', color:'var(--text-primary)', marginBottom:'.5rem' }}>Belum Ada Webhook</h3>
          <p style={{ color:'var(--text-secondary)', fontSize:'.875rem', marginBottom:'1.25rem' }}>Tambah webhook untuk terima notifikasi real-time</p>
          <button className="btn-batik" onClick={()=>setShowForm(true)}>+ Tambah Webhook</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'.875rem' }}>
          {webhooks.map(wh => (
            <div key={wh.id} className="nusantara-card" style={{ padding:'1.25rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.875rem', gap:'.75rem', flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.625rem', marginBottom:'.3rem', flexWrap:'wrap' }}>
                    <span>🪝</span>
                    <span style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'.95rem' }}>{wh.name}</span>
                    <div className={`badge ${wh.is_active?'badge-daun':'badge-wayang'}`} style={{ fontSize:'.62rem' }}>{wh.is_active?'● Aktif':'● Off'}</div>
                    {wh.failure_count>0 && <div className="badge badge-wayang" style={{ fontSize:'.62rem' }}>⚠ {wh.failure_count} error</div>}
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:'.72rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{wh.url}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap', marginBottom:'.75rem' }}>
                {wh.events.map(ev => {
                  const meta = ALL_EVENTS.find(e=>e.value===ev)
                  return <span key={ev} style={{ padding:'2px 9px', background:'rgba(216,135,28,.1)', border:'1px solid rgba(216,135,28,.25)', borderRadius:20, fontSize:'.7rem', color:'var(--color-batik)' }}>{meta?.icon} {meta?.label||ev}</span>
                })}
              </div>
              <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginBottom:'.75rem' }}>
                {wh.last_triggered_at ? `Terakhir: ${new Date(wh.last_triggered_at).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}` : 'Belum pernah aktif'}
              </div>
              <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
                <button onClick={()=>toggle(wh.id,wh.is_active)} style={{ padding:'.4rem .875rem', background: wh.is_active?'rgba(240,80,16,.1)':'rgba(33,196,26,.1)', border:`1px solid ${wh.is_active?'rgba(240,80,16,.3)':'rgba(33,196,26,.3)'}`, borderRadius:7, cursor:'pointer', color: wh.is_active?'#fb923c':'#4ade80', fontSize:'.78rem', fontWeight:500 }}>
                  {wh.is_active ? '⏸ Nonaktifkan' : '▶ Aktifkan'}
                </button>
                <button onClick={()=>del(wh.id,wh.name)} style={{ padding:'.4rem .875rem', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:7, cursor:'pointer', color:'#f87171', fontSize:'.78rem', fontWeight:500 }}>🗑 Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
