'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnon) {
      setError('Konfigurasi Supabase tidak ditemukan.')
      setLoading(false)
      return
    }

    const supabase = createBrowserClient(supabaseUrl, supabaseAnon)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setError('Login gagal - session tidak terbuat')
      setLoading(false)
      return
    }

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    // Force router refresh to sync server-side session
    router.refresh()

    // Small delay to ensure cookie is set before navigation
    await new Promise(resolve => setTimeout(resolve, 300))

    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="batik-bg kawung-overlay" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <Link href="/" style={{ position:'fixed', top:'1.25rem', left:'1.25rem', color:'var(--text-secondary)', textDecoration:'none', fontSize:'.85rem', display:'flex', alignItems:'center', gap:'.4rem' }}>← Kembali</Link>

      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg,var(--color-batik),var(--color-wayang))', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto .875rem' }}>🍛</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.4rem,4vw,1.75rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.25rem' }}>Selamat Datang</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'.875rem' }}>Masuk ke akun Kograph APIs Anda</p>
        </div>

        <div className="nusantara-card" style={{ padding:'clamp(1.25rem,4vw,2rem)' }}>
          {error && (
            <div style={{ background:'rgba(240,80,16,.1)', border:'1px solid rgba(240,80,16,.3)', borderRadius:9, padding:'.75rem 1rem', color:'#fb923c', fontSize:'.85rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-secondary)', marginBottom:'.4rem', fontWeight:500 }}>Email</label>
              <input className="input-batik" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" required autoComplete="email" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-secondary)', marginBottom:'.4rem', fontWeight:500 }}>Password</label>
              <input className="input-batik" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn-batik" disabled={loading} style={{ width:'100%', padding:'.8rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem' }}>
              {loading ? <><div className="spinner" style={{ width:17, height:17 }} /> Masuk...</> : '🚀 Masuk'}
            </button>
          </form>
          <div className="batik-divider" />
          <p style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:'.85rem' }}>
            Belum punya akun?{' '}
            <Link href="/auth/register" style={{ color:'var(--color-batik)', fontWeight:600, textDecoration:'none' }}>Daftar gratis</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
