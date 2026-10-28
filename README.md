# SkinCheck Frontend (Next.js)

Frontend SkinCheck hasil pemisahan dari monolit FastAPI (template Jinja).
Backend adalah repo Python/FastAPI terpisah yang mengekspos JSON di `/api/v2`
(health, auth/login, auth/register, auth/logout, me, dashboard, history,
history/{id}, scan/upload, products, admin/summary) dengan autentikasi
cookie sesi (`credentials: 'include'`).

Frontend ini **sengaja dibuat bisa build dan render tanpa backend**:
jika `NEXT_PUBLIC_API_URL` kosong, halaman menampilkan pesan
"backend belum dikonfigurasi" — bukan crash. URL backend TIDAK ada di repo
ini; user mengisi `.env` sendiri.

## Menjalankan lokal

```bash
npm install
cp .env.example .env.local
# isi NEXT_PUBLIC_API_URL di .env.local dengan URL backend Python kamu
npm run dev
# buka http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

## Deploy di Vercel

1. Import repo frontend ini sebagai project Vercel baru.
2. Framework Preset: Next.js (otomatis terdeteksi).
3. Di **Settings → Environment Variables**, isi:
   - `NEXT_PUBLIC_API_URL` = URL backend Python kamu (tanpa trailing slash)
   - `BACKEND_URL` = opsional, hanya untuk pemanggilan server-side di masa depan
4. Deploy. **Jangan** meng-commit `.env.local` — file itu sudah di-`.gitignore`.
   `.env.example` di repo ini sengaja hanya berisi placeholder kosong, tanpa
   URL asli dan tanpa secret apa pun.

## Struktur

- `app/` — App Router: `/`, `/login`, `/register`, `/verify-otp`,
  `/dashboard`, `/scan`, `/history`, `/history/[id]`, `/assistant`,
  `/admin`, `/profile`
- `lib/api.js` — fetch wrapper ke backend (`NEXT_PUBLIC_API_URL`),
  semua helper endpoint `/api/v2`, plus error `BACKEND_NOT_CONFIGURED`
- `components/Notice.js` — pesan loading/error/backend-belum-dikonfigurasi

## Status halaman

- Terhubung penuh ke kontrak `/api/v2` yang direncanakan: home (health),
  login, register, dashboard, scan (upload), history, history detail,
  profil, admin summary.
- Shell / TODO (bukan endpoint karangan): `/verify-otp` (alur OTP tetap
  lewat email/backend; tidak ada endpoint OTP di kontrak `/api/v2`) dan
  `/assistant` (chat UI saja; endpoint asisten belum ada di kontrak
  `/api/v2`, dan asisten backend juga butuh `GEMINI_API_KEY`).
  Keduanya punya komentar TODO di kode yang menjelaskan apa yang harus
  ditambahkan setelah backend mengekspos endpoint tersebut.
- Halaman produk tidak dibuat sebagai rute tersendiri (tidak diminta);
  helper `getProducts()` tersedia di `lib/api.js` untuk dipakai nanti.
