'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export default function RegisterPage() {
  const [form,    setForm]    = useState({ email:'', password:'', full_name:'', confirm:'' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (form.password !== form.confirm) { setError('Password tidak cocok'); return }
    if (form.password.length < 8)       { setError('Password minimal 8 karakter'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true); setLoading(false)
  }

  if (success) return (
    <div className="batik-bg kawung-overlay" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div className="nusantara-card" style={{ padding:'clamp(1.5rem,4vw,3rem)', maxWidth:420, textAlign:'center' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'.875rem' }}>📧</div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'var(--text-primary)', marginBottom:'.875rem' }}>Cek Email Anda</h2>
        <p style={{ color:'var(--text-secondary)', lineHeight:1.6, marginBottom:'1.5rem', fontSize:'.9rem' }}>
          Link verifikasi dikirim ke <strong style={{ color:'var(--color-batik)' }}>{form.email}</strong>.
        </p>
        <Link href="/auth/login" className="btn-batik" style={{ textDecoration:'none', display:'inline-block' }}>Ke Halaman Login</Link>
      </div>
    </div>
  )

  return (
    <div className="batik-bg kawung-overlay" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <Link href="/" style={{ position:'fixed', top:'1.25rem', left:'1.25rem', color:'var(--text-secondary)', textDecoration:'none', fontSize:'.85rem' }}>← Kembali</Link>

      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg,var(--color-batik),var(--color-wayang))', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto .875rem' }}>🍛</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.4rem,4vw,1.75rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.25rem' }}>Daftar Gratis</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'.875rem' }}>Mulai dengan 10.000 request/bulan</p>
        </div>

        <div className="nusantara-card" style={{ padding:'clamp(1.25rem,4vw,2rem)' }}>
          {error && <div style={{ background:'rgba(240,80,16,.1)', border:'1px solid rgba(240,80,16,.3)', borderRadius:9, padding:'.75rem 1rem', color:'#fb923c', fontSize:'.85rem', marginBottom:'1.25rem' }}>⚠️ {error}</div>}
          <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
            {[
              { label:'Nama Lengkap', key:'full_name', type:'text',     ph:'Budi Santoso' },
              { label:'Email',        key:'email',     type:'email',    ph:'nama@email.com' },
              { label:'Password',     key:'password',  type:'password', ph:'Minimal 8 karakter' },
              { label:'Konfirmasi',   key:'confirm',   type:'password', ph:'Ulangi password' },
            ].map(f=>(
              <div key={f.key}>
                <label style={{ display:'block', fontSize:'.82rem', color:'var(--text-secondary)', marginBottom:'.4rem', fontWeight:500 }}>{f.label}</label>
                <input className="input-batik" type={f.type} placeholder={f.ph} value={(form as Record<string,string>)[f.key]} onChange={e=>setForm(prev=>({...prev,[f.key]:e.target.value}))} required />
              </div>
            ))}
            <button type="submit" className="btn-batik" disabled={loading} style={{ width:'100%', padding:'.8rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem' }}>
              {loading ? <><div className="spinner" style={{ width:17, height:17 }} /> Mendaftar...</> : '🚀 Daftar Sekarang'}
            </button>
          </form>
          <div className="batik-divider" />
          <p style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:'.85rem' }}>
            Sudah punya akun?{' '}
            <Link href="/auth/login" style={{ color:'var(--color-batik)', fontWeight:600, textDecoration:'none' }}>Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
