# 🍛 Kograph APIs

Platform API resep kuliner Nusantara Indonesia, dibangun dengan **Next.js 14** + **Supabase**.

---

## 🚀 Setup (3 Langkah)

### 1. Install dependencies
```bash
npm install
```

### 2. Konfigurasi Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Jalankan **`supabase-schema.sql`** di **SQL Editor** Supabase — akan membuat semua tabel + seed 13 resep
3. Di Supabase → **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 3. Environment variables
```bash
cp .env.local.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

```bash
npm run dev
# Buka http://localhost:3000
```

---

## 👑 Buat Akun Admin

Setelah daftar dan verifikasi email, jalankan di SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'email-anda@contoh.com';
```

---

## 📡 API Endpoints

Semua endpoint memerlukan header:
```
Authorization: Bearer kograph_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxx
```

| Method | Path | Keterangan |
|--------|------|------------|
| `GET`  | `/api/v1/recipes` | Daftar resep (filter: category, region, difficulty, is_halal, is_vegan) |
| `GET`  | `/api/v1/recipes/:slug` | Detail resep + bahan + langkah |
| `GET`  | `/api/v1/recipes/search?q=` | Cari resep |
| `GET`  | `/api/v1/recipes/regions` | Daftar wilayah |
| `GET`  | `/api/v1/recipes/categories` | Daftar kategori |

---

## 🔐 Kenapa 401 Hilang?

Fix utama ada di **3 hal**:

1. **`getUser()` bukan `getSession()`** — `getUser()` validasi JWT ke Supabase server, `getSession()` hanya baca cookie lokal tanpa verifikasi.

2. **`router.refresh()` setelah login** — memaksa Next.js sync cookie server-side sebelum redirect.

3. **`createBrowserClient` dari `@supabase/ssr`** — bukan `createClient` dari `@supabase/supabase-js`, agar cookie disync dengan benar antara browser dan server.

---

## 🐛 Debug

Buka `https://api-kograph.vercel.app/api/debug-auth` untuk lihat status session, cookie, dan env vars.

---

## 🪝 Webhook Signature

```javascript
const crypto = require('crypto')
app.post('/webhook', (req, res) => {
  const sig = req.headers['x-kograph-signature']
  const expected = crypto.createHash('sha256')
    .update(JSON.stringify(req.body) + WEBHOOK_SECRET)
    .digest('hex')
  if (sig !== expected) return res.status(401).send('Invalid signature')
  // handle event
  res.sendStatus(200)
})
```

---

Made with ❤️ untuk kuliner Nusantara 🇮🇩
