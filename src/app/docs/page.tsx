'use client'
import { useState } from 'react'
import Link from 'next/link'

const ENDPOINTS = [
  {
    method:'GET', path:'/api/v1/recipes', title:'Daftar Resep', category:'Resep',
    desc:'Ambil daftar semua resep dengan filter dan pagination.',
    params:[
      {name:'category',   type:'string',  req:false, desc:'makanan | minuman | snack | dessert'},
      {name:'region',     type:'string',  req:false, desc:'Filter wilayah (cth: Jawa, Sumatera)'},
      {name:'difficulty', type:'string',  req:false, desc:'easy | medium | hard'},
      {name:'is_halal',   type:'boolean', req:false, desc:'true/false'},
      {name:'is_vegan',   type:'boolean', req:false, desc:'true/false'},
      {name:'page',       type:'integer', req:false, desc:'Nomor halaman (default: 1)'},
      {name:'limit',      type:'integer', req:false, desc:'Per halaman (default:10, maks:50)'},
    ],
    example:`curl "https://api-kograph.vercel.app/api/v1/recipes?category=makanan&limit=5" \\
  -H "Authorization: Bearer kograph_your_key"`,
    response:`{
  "success": true,
  "data": [{
    "slug": "rendang-sapi",
    "name": "Rendang Sapi",
    "region": "Sumatera",
    "category": "makanan",
    "image_url": "https://...",
    "thumbnail_url": "https://...",
    "cooking_time_minutes": 240,
    "difficulty": "hard",
    "is_halal": true
  }],
  "meta": { "page":1, "total":18, "remaining_requests":9995 }
}`,
  },
  {
    method:'GET', path:'/api/v1/recipes/:slug', title:'Detail Resep', category:'Resep',
    desc:'Detail lengkap satu resep termasuk bahan dan langkah masak.',
    params:[{name:'slug', type:'string', req:true, desc:'Slug unik resep (cth: rendang-sapi)'}],
    example:`curl "https://api-kograph.vercel.app/api/v1/recipes/rendang-sapi" \\
  -H "Authorization: Bearer kograph_your_key"`,
    response:`{
  "success": true,
  "data": {
    "slug": "rendang-sapi",
    "name": "Rendang Sapi",
    "image_url": "https://...",
    "ingredients": [
      {"name":"Daging sapi","amount":"1 kg","unit":""},
      {"name":"Santan kelapa","amount":"1 liter","unit":""}
    ],
    "steps": [
      {"step":1,"description":"Haluskan semua bumbu..."},
      {"step":2,"description":"Masukkan daging..."}
    ]
  }
}`,
  },
  {
    method:'GET', path:'/api/v1/recipes/search', title:'Cari Resep', category:'Resep',
    desc:'Cari resep berdasarkan nama, deskripsi, atau daerah asal.',
    params:[
      {name:'q',     type:'string',  req:true,  desc:'Kata kunci (minimal 2 karakter)'},
      {name:'page',  type:'integer', req:false, desc:'Halaman'},
      {name:'limit', type:'integer', req:false, desc:'Per halaman (maks:50)'},
    ],
    example:`curl "https://api-kograph.vercel.app/api/v1/recipes/search?q=ayam" \\
  -H "Authorization: Bearer kograph_your_key"`,
    response:`{ "success":true, "query":"ayam", "data":[...], "meta":{"total":12} }`,
  },
  {
    method:'GET', path:'/api/v1/recipes/regions', title:'Daftar Wilayah', category:'Meta',
    desc:'Semua wilayah dan provinsi yang tersedia beserta jumlah resep.',
    params:[],
    example:`curl "https://api-kograph.vercel.app/api/v1/recipes/regions" \\
  -H "Authorization: Bearer kograph_your_key"`,
    response:`{
  "success": true,
  "data": [
    { "region":"Jawa", "provinces":["DKI Jakarta","Jawa Barat",...], "total_recipes":8 }
  ]
}`,
  },
  {
    method:'GET', path:'/api/v1/recipes/categories', title:'Daftar Kategori', category:'Meta',
    desc:'Semua kategori resep beserta jumlah resep per kategori.',
    params:[],
    example:`curl "https://api-kograph.vercel.app/api/v1/recipes/categories" \\
  -H "Authorization: Bearer kograph_your_key"`,
    response:`{
  "success": true,
  "data": [
    {"category":"makanan","label":"Makanan","total_recipes":9},
    {"category":"minuman","label":"Minuman","total_recipes":4}
  ]
}`,
  },
]

const CATS = ['Semua','Resep','Meta']

export default function DocsPage() {
  const [activeCat,      setActiveCat]      = useState('Semua')
  const [activeEndpoint, setActiveEndpoint] = useState<number|null>(null)

  const filtered = activeCat==='Semua' ? ENDPOINTS : ENDPOINTS.filter(e=>e.category===activeCat)

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav style={{ borderBottom:'1px solid var(--border)', background:'rgba(15,10,5,.9)', backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between', height:58 }}>
          <Link href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'.625rem' }}>
            <div style={{ width:30, height:30, background:'linear-gradient(135deg,var(--color-batik),var(--color-wayang))', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🍛</div>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-primary)', fontSize:'1rem' }}>Kograph <span className="gradient-text">APIs</span></span>
          </Link>
          <div style={{ display:'flex', gap:'.875rem', alignItems:'center' }}>
            <Link href="/dashboard" style={{ color:'var(--text-secondary)', textDecoration:'none', fontSize:'.875rem' }}>Dashboard</Link>
            <Link href="/auth/register" className="btn-batik" style={{ padding:'.45rem 1rem', fontSize:'.82rem', textDecoration:'none' }}>Mulai Gratis</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'2.5rem 1.25rem' }}>
        <div style={{ marginBottom:'2.5rem' }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.75rem,4vw,2.5rem)', fontWeight:700, color:'var(--text-primary)', marginBottom:'.75rem' }}>📖 Dokumentasi API</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'1rem', lineHeight:1.6, maxWidth:580 }}>
            Referensi lengkap Kograph APIs. Semua endpoint memerlukan API key di header <code style={{ fontFamily:'var(--font-mono)', color:'var(--color-batik)', fontSize:'.875rem' }}>Authorization</code>.
          </p>
        </div>

        {/* Auth */}
        <div className="nusantara-card" style={{ padding:'1.5rem', marginBottom:'1.5rem' }}>
          <h2 style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:'1rem', fontSize:'1rem' }}>🔐 Autentikasi</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:'.875rem', marginBottom:'.875rem' }}>Sertakan API key di header setiap request:</p>
          <div className="code-block" style={{ marginBottom:'.875rem', fontSize:'.82rem' }}>{`Authorization: Bearer kograph_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</div>
          <p style={{ color:'var(--text-secondary)', fontSize:'.82rem' }}>
            Atau via query param: <code style={{ fontFamily:'var(--font-mono)', color:'var(--color-batik)', fontSize:'.78rem' }}>?api_key=kograph_your_key</code>
          </p>
        </div>

        {/* Rate limit */}
        <div className="nusantara-card" style={{ padding:'1.5rem', marginBottom:'2rem' }}>
          <h2 style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:'1rem', fontSize:'1rem' }}>⚡ Rate Limiting</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'.875rem' }}>
            {[
              {label:'Limit per bulan',  value:'10.000 request'},
              {label:'Reset',            value:'Awal bulan (otomatis)'},
              {label:'Header limit',     value:'X-RateLimit-Limit'},
              {label:'Header sisa',      value:'X-RateLimit-Remaining'},
            ].map(item => (
              <div key={item.label} style={{ padding:'.75rem 1rem', background:'rgba(255,255,255,.03)', borderRadius:8, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:'.72rem', color:'var(--text-muted)', marginBottom:'.25rem' }}>{item.label}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'.82rem', color:'var(--color-emas)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
          {CATS.map(cat => (
            <button key={cat} onClick={()=>setActiveCat(cat)} style={{ padding:'.45rem 1.1rem', borderRadius:20, border:'1px solid', cursor:'pointer', fontSize:'.85rem', fontWeight:500, transition:'all .2s', background: activeCat===cat?'rgba(216,135,28,.15)':'transparent', borderColor: activeCat===cat?'rgba(216,135,28,.5)':'var(--border)', color: activeCat===cat?'var(--color-batik)':'var(--text-secondary)' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Endpoints */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {filtered.map((ep, i) => (
            <div key={i} className="nusantara-card" style={{ overflow:'hidden' }}>
              <button
                onClick={() => setActiveEndpoint(activeEndpoint===i ? null : i)}
                style={{ width:'100%', padding:'1.1rem 1.5rem', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'.875rem', textAlign:'left', flexWrap:'wrap' }}
              >
                <span style={{ padding:'3px 10px', borderRadius:6, background:'rgba(33,196,26,.15)', border:'1px solid rgba(33,196,26,.3)', color:'#4ade80', fontFamily:'var(--font-mono)', fontSize:'.75rem', fontWeight:700, flexShrink:0 }}>{ep.method}</span>
                <code style={{ fontFamily:'var(--font-mono)', fontSize:'.875rem', color:'var(--color-emas)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ep.path}</code>
                <span style={{ color:'var(--text-secondary)', fontSize:'.85rem', fontWeight:500, flexShrink:0 }}>{ep.title}</span>
                <span className="badge badge-emas" style={{ fontSize:'.62rem', flexShrink:0 }}>{ep.category}</span>
                <span style={{ color:'var(--text-muted)', fontSize:'.9rem', flexShrink:0 }}>{activeEndpoint===i?'▲':'▼'}</span>
              </button>

              {activeEndpoint===i && (
                <div style={{ padding:'0 1.5rem 1.5rem', borderTop:'1px solid var(--border)' }}>
                  <p style={{ color:'var(--text-secondary)', fontSize:'.875rem', lineHeight:1.6, margin:'1rem 0' }}>{ep.desc}</p>

                  {ep.params.length > 0 && (
                    <div style={{ marginBottom:'1.5rem' }}>
                      <h4 style={{ fontSize:'.82rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'.75rem', textTransform:'uppercase', letterSpacing:'.08em' }}>Parameters</h4>
                      <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                        {ep.params.map(p => (
                          <div key={p.name} style={{ display:'grid', gridTemplateColumns:'140px 70px 1fr', gap:'.625rem', padding:'.625rem .875rem', background:'rgba(255,255,255,.03)', borderRadius:8, border:'1px solid var(--border)', alignItems:'center' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                              <code style={{ fontFamily:'var(--font-mono)', fontSize:'.8rem', color:'var(--color-emas)' }}>{p.name}</code>
                              {p.req && <span style={{ fontSize:'.6rem', color:'#f87171', background:'rgba(239,68,68,.15)', padding:'1px 5px', borderRadius:4 }}>wajib</span>}
                            </div>
                            <code style={{ fontFamily:'var(--font-mono)', fontSize:'.75rem', color:'var(--text-muted)' }}>{p.type}</code>
                            <span style={{ fontSize:'.8rem', color:'var(--text-secondary)' }}>{p.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom:'1rem' }}>
                    <h4 style={{ fontSize:'.82rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'.75rem', textTransform:'uppercase', letterSpacing:'.08em' }}>Contoh Request</h4>
                    <div className="code-block" style={{ fontSize:'.8rem' }}>{ep.example}</div>
                  </div>

                  <div>
                    <h4 style={{ fontSize:'.82rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'.75rem', textTransform:'uppercase', letterSpacing:'.08em' }}>Contoh Response</h4>
                    <div className="code-block" style={{ fontSize:'.78rem', maxHeight:280, overflowY:'auto' }}>{ep.response}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:'3.5rem', padding:'2.5rem', borderTop:'1px solid var(--border)' }}>
          <p style={{ color:'var(--text-secondary)', marginBottom:'1.5rem', fontSize:'.9rem' }}>Siap mengintegrasikan kuliner Nusantara ke aplikasi Anda?</p>
          <Link href="/auth/register" className="btn-batik" style={{ textDecoration:'none', display:'inline-block', padding:'.875rem 2rem' }}>🚀 Daftar & Dapatkan API Key Gratis</Link>
        </div>
      </div>
    </div>
  )
}
