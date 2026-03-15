'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const NAV = [
  { href:'/admin',        label:'Dashboard', icon:'📊' },
  { href:'/admin/users',  label:'Pengguna',  icon:'👥' },
  { href:'/admin/keys',   label:'API Keys',  icon:'🔑' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [open,  setOpen]  = useState(false)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (data?.role !== 'admin') { router.push('/dashboard'); return }
      setReady(true)
    })()
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const logout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (!ready) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)' }}>
      <div className="spinner" style={{ width:34, height:34, borderWidth:3 }} />
    </div>
  )

  const SidebarInner = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-secondary)', borderRight:'1px solid var(--border)' }}>
      <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)' }}>
        <Link href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'.625rem' }}>
          <div style={{ width:32, height:32, background:'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🛡️</div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-primary)', fontSize:'.9rem' }}>Admin Panel</div>
            <div style={{ fontSize:'.65rem', color:'#ef4444' }}>Kograph APIs</div>
          </div>
        </Link>
      </div>
      <nav style={{ flex:1, padding:'.75rem 0' }}>
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.7rem 1.5rem', textDecoration:'none', color: active?'#ef4444':'var(--text-secondary)', fontWeight: active?600:400, fontSize:'.875rem', background: active?'rgba(239,68,68,.1)':'transparent', borderRight: active?'3px solid #ef4444':'3px solid transparent', transition:'all .15s' }}>
              <span style={{ fontSize:'1rem', width:20, textAlign:'center' }}>{item.icon}</span>{item.label}
            </Link>
          )
        })}
        <div style={{ height:1, background:'var(--border)', margin:'.5rem 1.5rem' }} />
        <Link href="/dashboard" style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.7rem 1.5rem', textDecoration:'none', color:'var(--text-secondary)', fontSize:'.875rem' }}>
          <span style={{ fontSize:'1rem', width:20, textAlign:'center' }}>👤</span>User Dashboard
        </Link>
      </nav>
      <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border)' }}>
        <button onClick={logout} style={{ width:'100%', padding:'.5rem', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, color:'#f87171', cursor:'pointer', fontSize:'.8rem', fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem' }}>
          🚪 Keluar
        </button>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @media(max-width:768px){
          .ad-fixed{display:none!important}
          .ad-main{margin-left:0!important}
          .ad-topbar{display:flex!important}
        }
        .ad-topbar{display:none;position:sticky;top:0;z-index:40;background:var(--bg-secondary);border-bottom:1px solid var(--border);padding:.875rem 1rem;align-items:center;gap:1rem}
      `}</style>
      <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-primary)' }}>
        <div className="ad-fixed" style={{ width:240, position:'fixed', top:0, left:0, bottom:0, zIndex:40 }}><SidebarInner /></div>
        {open && (
          <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex' }}>
            <div style={{ width:240, height:'100%' }}><SidebarInner /></div>
            <div style={{ flex:1, background:'rgba(0,0,0,.6)' }} onClick={()=>setOpen(false)} />
          </div>
        )}
        <div className="ad-main" style={{ flex:1, marginLeft:240, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
          <div className="ad-topbar">
            <button onClick={()=>setOpen(true)} style={{ background:'none', border:'none', color:'var(--text-primary)', cursor:'pointer', fontSize:'1.25rem' }}>☰</button>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'#ef4444', fontSize:'.95rem', flex:1 }}>🛡️ Admin Panel</span>
            <button onClick={logout} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'.8rem' }}>Keluar</button>
          </div>
          <main style={{ flex:1 }}>{children}</main>
        </div>
      </div>
    </>
  )
}
