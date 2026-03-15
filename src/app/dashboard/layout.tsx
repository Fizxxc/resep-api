'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const NAV = [
  { href:'/dashboard',           label:'Beranda',      icon:'🏠' },
  { href:'/dashboard/keys',      label:'API Keys',     icon:'🔑' },
  { href:'/dashboard/webhooks',  label:'Webhooks',     icon:'🪝' },
  { href:'/dashboard/usage',     label:'Penggunaan',   icon:'📊' },
  { href:'/docs',                label:'Dokumentasi',  icon:'📖' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user,    setUser]    = useState<{ email: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [open,    setOpen]    = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      // Use /api/auth/me which uses service role — bypasses RLS
      const res = await fetch('/api/auth/me')
      if (!res.ok) { router.push('/auth/login'); return }

      const profile = await res.json()

      if (profile.role === 'admin') {
        router.push('/admin')
        return
      }

      setUser({ email: profile.email || session.user.email || '', name: profile.full_name || '' })
      setLoading(false)
    })()
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const logout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ width:36, height:36, margin:'0 auto 1rem', borderWidth:3 }} />
        <p style={{ color:'var(--text-secondary)', fontSize:'.875rem' }}>Memuat...</p>
      </div>
    </div>
  )

  const SidebarInner = () => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg-secondary)', borderRight:'1px solid var(--border)' }}>
      <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)' }}>
        <Link href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'.625rem' }}>
          <div style={{ width:32, height:32, background:'linear-gradient(135deg,var(--color-batik),var(--color-wayang))', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🍛</div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-primary)', fontSize:'.9rem' }}>Kograph APIs</div>
            <div style={{ fontSize:'.65rem', color:'var(--text-muted)' }}>Dashboard</div>
          </div>
        </Link>
      </div>
      <nav style={{ flex:1, padding:'.75rem 0', overflowY:'auto' }}>
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.7rem 1.5rem', textDecoration:'none', color: active?'var(--color-batik)':'var(--text-secondary)', fontWeight: active?600:400, fontSize:'.875rem', background: active?'rgba(216,135,28,.1)':'transparent', borderRight: active?'3px solid var(--color-batik)':'3px solid transparent', transition:'all .15s' }}>
              <span style={{ fontSize:'1rem', width:20, textAlign:'center' }}>{item.icon}</span>{item.label}
            </Link>
          )
        })}
      </nav>
      <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border)' }}>
        <div style={{ marginBottom:'.625rem', padding:'.5rem .75rem', background:'rgba(255,255,255,.03)', borderRadius:8, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:'.8rem', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name || 'User'}</div>
          <div style={{ fontSize:'.7rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
        </div>
        <button onClick={logout} style={{ width:'100%', padding:'.5rem', background:'rgba(240,80,16,.08)', border:'1px solid rgba(240,80,16,.2)', borderRadius:8, color:'#fb923c', cursor:'pointer', fontSize:'.8rem', fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem' }}>
          🚪 Keluar
        </button>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @media(max-width:768px){
          .ds-fixed{display:none!important}
          .ds-main{margin-left:0!important}
          .ds-topbar{display:flex!important}
        }
        .ds-topbar{display:none;position:sticky;top:0;z-index:40;background:var(--bg-secondary);border-bottom:1px solid var(--border);padding:.875rem 1rem;align-items:center;gap:1rem}
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-primary)' }}>
        <div className="ds-fixed" style={{ width:240, position:'fixed', top:0, left:0, bottom:0, zIndex:40 }}>
          <SidebarInner />
        </div>

        {open && (
          <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex' }}>
            <div style={{ width:240, height:'100%' }}><SidebarInner /></div>
            <div style={{ flex:1, background:'rgba(0,0,0,.6)' }} onClick={() => setOpen(false)} />
          </div>
        )}

        <div className="ds-main" style={{ flex:1, marginLeft:240, display:'flex', flexDirection:'column', minHeight:'100vh' }}>
          <div className="ds-topbar">
            <button onClick={() => setOpen(true)} style={{ background:'none', border:'none', color:'var(--text-primary)', cursor:'pointer', fontSize:'1.25rem' }}>☰</button>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-primary)', fontSize:'.95rem', flex:1 }}>🍛 Kograph APIs</span>
            <button onClick={logout} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'.8rem' }}>Keluar</button>
          </div>
          <main style={{ flex:1 }}>{children}</main>
        </div>
      </div>
    </>
  )
}
