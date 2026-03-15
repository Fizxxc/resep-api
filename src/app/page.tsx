'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const REGIONS = [
  { name: 'Sumatera', icon: '🌺', recipes: ['Rendang', 'Pempek', 'Soto Padang'] },
  { name: 'Jawa',     icon: '🏯', recipes: ['Nasi Goreng', 'Gado-Gado', 'Soto Ayam'] },
  { name: 'Bali',     icon: '🌸', recipes: ['Babi Guling', 'Lawar', 'Bebek Betutu'] },
  { name: 'Sulawesi', icon: '🐚', recipes: ['Coto Makassar', 'Pallubasa', 'Konro'] },
  { name: 'Papua',    icon: '🌿', recipes: ['Papeda', 'Ikan Bakar', 'Sagu Lempeng'] },
  { name: 'Kalimantan',icon:'🦅', recipes: ['Soto Banjar', 'Ketupat Kandangan', 'Amplang'] },
]

const FEATURES = [
  { icon:'🍜', title:'Resep Lengkap',   desc:'500+ resep dari 34 provinsi, lengkap bahan & langkah masak.' },
  { icon:'📸', title:'Gambar Bawaan',   desc:'Setiap resep punya image_url & thumbnail_url siap pakai.' },
  { icon:'⚡', title:'Cepat & Andal',   desc:'Response < 100ms, uptime 99.9% via Supabase edge.' },
  { icon:'🔑', title:'10K Req / Bulan', desc:'Gratis 10.000 request/bulan. Reset otomatis tiap awal bulan.' },
  { icon:'🪝', title:'Webhook',          desc:'Notifikasi real-time ke URL Anda saat event penting terjadi.' },
  { icon:'🛡️', title:'Aman',            desc:'API key di-hash SHA-256. Full key hanya tampil sekali.' },
]

export default function LandingPage() {
  const [activeRegion, setActiveRegion] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveRegion(i => (i + 1) % REGIONS.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav style={{ borderBottom:'1px solid var(--border)', background:'rgba(15,10,5,.85)', backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between', height:60 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'.625rem' }}>
            <div style={{ width:34, height:34, background:'linear-gradient(135deg,var(--color-batik),var(--color-wayang))', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🍛</div>
            <span style={{ fontFamily:'var(--font-display)', fontSize:'1.15rem', fontWeight:700, color:'var(--text-primary)' }}>
              Kograph <span className="gradient-text">APIs</span>
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'.875rem' }}>
            <Link href="/docs"         style={{ color:'var(--text-secondary)', textDecoration:'none', fontSize:'.875rem' }}>Docs</Link>
            <Link href="/auth/login"   style={{ color:'var(--text-secondary)', textDecoration:'none', fontSize:'.875rem' }}>Masuk</Link>
            <Link href="/auth/register" className="btn-batik" style={{ padding:'.5rem 1.1rem', fontSize:'.85rem', textDecoration:'none' }}>Mulai Gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="kawung-overlay" style={{ padding:'5rem 1.25rem 3.5rem', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'10%', left:'5%', width:300, height:300, background:'radial-gradient(circle,rgba(216,135,28,.1) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'5%', right:'5%', width:400, height:400, background:'radial-gradient(circle,rgba(240,80,16,.07) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ maxWidth:750, margin:'0 auto', position:'relative' }}>
          <div className="badge badge-emas" style={{ marginBottom:'1.25rem', display:'inline-flex' }}>🌺 API Kuliner Nusantara</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2.2rem,6vw,3.75rem)', fontWeight:900, lineHeight:1.15, marginBottom:'1.25rem', color:'var(--text-primary)' }}>
            Resep <span className="gradient-text">Nusantara</span><br />dalam Satu API
          </h1>
          <p style={{ fontSize:'1.05rem', color:'var(--text-secondary)', lineHeight:1.7, marginBottom:'2rem', maxWidth:540, margin:'0 auto 2rem' }}>
            Akses 500+ resep makanan & minuman tradisional Indonesia dari Sabang sampai Merauke — lengkap gambar, bahan, langkah masak, dan nutrisi.
          </p>
          <div style={{ display:'flex', gap:'.875rem', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/auth/register" className="btn-batik" style={{ fontSize:'1rem', padding:'.875rem 1.875rem', textDecoration:'none' }}>🚀 Daftar Gratis</Link>
            <Link href="/docs"          className="btn-outline-batik" style={{ fontSize:'1rem', padding:'.875rem 1.875rem', textDecoration:'none' }}>📖 Dokumentasi</Link>
          </div>
          <div style={{ display:'flex', gap:'2.5rem', justifyContent:'center', marginTop:'2.5rem', flexWrap:'wrap' }}>
            {[['500+','Resep'],['34','Provinsi'],['10K','Req/Bulan'],['<100ms','Response']].map(([n,l])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:700, color:'var(--color-emas)' }}>{n}</div>
                <div style={{ fontSize:'.75rem', color:'var(--text-muted)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regions */}
      <section style={{ padding:'3.5rem 1.25rem', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.875rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'.5rem' }}>Dari Sabang sampai Merauke</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:'.9rem' }}>Kekayaan kuliner 6 wilayah besar Nusantara</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem' }}>
          {REGIONS.map((r,i)=>(
            <div key={r.name} className="nusantara-card" onClick={()=>setActiveRegion(i)} style={{ padding:'1.375rem', cursor:'pointer', textAlign:'center', borderColor: activeRegion===i?'var(--color-batik)':undefined, background: activeRegion===i?'rgba(216,135,28,.1)':undefined }}>
              <div style={{ fontSize:'1.75rem', marginBottom:'.5rem' }}>{r.icon}</div>
              <div style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:'.625rem', fontSize:'.9rem' }}>{r.name}</div>
              {r.recipes.map(x=>(<div key={x} style={{ fontSize:'.72rem', color:'var(--text-muted)' }}>• {x}</div>))}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding:'3.5rem 1.25rem', maxWidth:1200, margin:'0 auto', borderTop:'1px solid var(--border)' }}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.875rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'.5rem' }}>Semua yang Kamu Butuhkan</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:'.9rem' }}>Fitur lengkap untuk membangun aplikasi kuliner</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1rem' }}>
          {FEATURES.map(f=>(
            <div key={f.title} className="nusantara-card" style={{ padding:'1.5rem' }}>
              <div style={{ fontSize:'1.75rem', marginBottom:'.875rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:'.4rem', fontSize:'.95rem' }}>{f.title}</h3>
              <p style={{ color:'var(--text-secondary)', fontSize:'.85rem', lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'4rem 1.25rem', textAlign:'center', borderTop:'1px solid var(--border)' }}>
        <div style={{ maxWidth:520, margin:'0 auto' }}>
          <div style={{ fontSize:'2.75rem', marginBottom:'.875rem' }}>🍛</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'.875rem' }}>Mulai Masak dengan API</h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:'1.75rem', lineHeight:1.7, fontSize:'.9rem' }}>Daftar gratis, 10.000 request/bulan. Tidak perlu kartu kredit.</p>
          <Link href="/auth/register" className="btn-batik" style={{ fontSize:'1rem', padding:'.9rem 2.25rem', textDecoration:'none' }}>🚀 Daftar Sekarang — Gratis</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid var(--border)', padding:'1.75rem 1.25rem', textAlign:'center', color:'var(--text-muted)', fontSize:'.82rem' }}>
        <p>© 2024 Kograph APIs · Dibuat dengan ❤️ untuk kuliner Nusantara 🇮🇩</p>
        <div style={{ display:'flex', justifyContent:'center', gap:'1.5rem', marginTop:'.625rem' }}>
          <Link href="/docs"          style={{ color:'var(--text-muted)', textDecoration:'none' }}>Dokumentasi</Link>
          <Link href="/auth/login"    style={{ color:'var(--text-muted)', textDecoration:'none' }}>Login</Link>
          <Link href="/auth/register" style={{ color:'var(--text-muted)', textDecoration:'none' }}>Daftar</Link>
        </div>
      </footer>
    </div>
  )
}
