# DESAIN.md — Sistem Desain Laomera

Dokumen ini adalah **sumber kebenaran** (source of truth) untuk desain Laomera.
Semua kartu, sidebar, dan penataan halaman **WAJIB** mengikuti aturan di sini.
Kalau mau menambah kartu baru, halaman baru, atau komponen apa pun —
ikuti resep di bawah. **Jangan bikin gaya baru sendiri.**

> Dibuat 2026-11-12 atas permintaan roboy, setelah kartu halaman
> Konfigurasi admin kedapatan "nyaru" (warnanya menyatu dengan base web)
> sehingga tidak kelihatan sebagai kartu.

---

## 1. Warna (Token)

Token hidup di `app/globals.css` (`:root`). Jangan pakai nilai hex mentah
di komponen — selalu pakai `var(--nama-token)`.

### 1.1 Warna dasar

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--bg-app` | `#acc8ec` (powder blue) | Warna dasar / latar seluruh workspace (area konten). Ini "base web". |
| `--brand-navy` / `--base-midnight-navy` | `#071236` (navy tergelap) | Teks utama, ikon aktif, latar seksi navy (Vision), sidebar pill gelap. |
| `--sunflower-yellow` / `--brand-amber` / `--brand-yellow` | `#FFC20D` (kuning) | Aksen: ikon menu aktif, tombol utama, badge, lingkaran tab aktif HP. |
| `--text-main` | `#071236` | Judul & teks utama (sama dengan navy). |
| `--text-body` | `#172033` | Teks isi/body. |
| `--text-muted` | `#000000` (hitam) | Teks sekunder. **Dulu `#35425d` (abu) — diubah ke hitam 2026-11-12 atas permintaan roboy karena abu tidak terbaca di atas kaca.** Jangan kembalikan ke abu. |
| `--text-light` | `#071236` | Teks di atas latar terang. |

### 1.2 Warna landing page

Landing page **dilindungi** — jangan samakan dengan kartu workspace.

| Elemen | Warna |
|---|---|
| Latar landing (base) | `var(--bg-app)` `#acc8ec` (sama dengan workspace). |
| Seksi Vision (`#visi`, berfoto) | `var(--base-midnight-navy)` `#071236`, **full-bleed mentok kiri-kanan** (lihat §5). |
| Hero | Radial gradient powder blue (lihat `app/globals.css` `.landing-hero-fullscreen`). |
| Kartu landing (`.vision-card`, `.feature-fluid-card`, `.testimonial-card`, `.faq-card-item`, dll) | Kaca **0.4 / blur(11px)** — resep lama yang sengaja dipertahankan. **Jangan samakan ke resep kartu workspace (§2).** |
| Judul hero "The Future of..." | Navy, dengan `.hero-ambient-glow` di belakangnya (lihat §5). |

---

### 1.3 Aturan warna teks (WAJIB)

**Teks hanya boleh hitam atau navy.** (Roboy, 2026-11-12.)

- **Hitam** `#000000` (`--text-muted`) atau **navy** `#071236`
  (`--text-main` / `--brand-navy`) — hanya dua warna ini untuk teks.
- **DILARANG untuk teks:** kuning (`#FFC20D` / `--sunflower-yellow`),
  abu-abu (`#64748b`, `#A0B4CC`, `#35425d`, `rgba(130,152,181,…)`,
  dan abu apa pun), dan putih (`#ffffff`) **di atas permukaan terang**
  (kartu kaca, base powder blue). Kuning/abu/putih di atas kartu terang
  tidak terbaca — itulah yang dulu terjadi pada deskripsi dan badge
  kartu modul Konfigurasi (deskripsi `#A0B4CC`, badge kuning, judul
  putih) sehingga hampir tidak kelihatan.
- **Teks harus cukup tebal:** deskripsi / teks isi minimal
  `font-weight: 600`; judul / badge `700`. Jangan pakai teks tipis
  (400) untuk deskripsi di atas kartu.
- **Pengecualian — teks putih HANYA di atas permukaan gelap:** teks
  putih boleh dipakai kalau latarnya gelap (mis. seksi navy Vision di
  landing, tombol navy, badge di atas navy) karena di sana hitam/navy
  justru tidak terbaca. Aturan ini berlaku untuk teks di atas
  permukaan **terang**; di atas permukaan gelap, putih adalah satu-satunya
  pilihan yang terbaca.
- **Kuning hanya untuk ikon / aksen, bukan teks.** Ikon menu aktif
  boleh kuning (lingkaran kuning + ikon navy), tombol utama boleh
  kuning dengan teks navy — tapi jangan tulis teks berwarna kuning.

## 2. Kartu (Card) — Glassmorphism

### 2.1 Resep kartu (WAJIB untuk semua kartu customer + admin)

Setiap kartu — dashboard, scan, riwayat, marketplace, profil, admin
(dashboard, users, products, audit scan, trends, AI Copilot, settings) —
**wajib** memakai resep ini. Satu bahasa, tidak ada pengecualian.

```css
background: rgba(255, 255, 255, 0.6);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border-radius: 20px;
border: 1px solid rgba(255, 255, 255, 0.85);
box-shadow:
  0 8px 32px rgba(7, 18, 54, 0.14),
  inset 0 1px 0 rgba(255, 255, 255, 0.6),
  inset 0 -1px 0 rgba(255, 255, 255, 0.15),
  inset 0 0 16px 8px rgba(255, 255, 255, 0.8);
```

Kelas kartu yang memakai resep ini (di `app/globals.css`):
`.glass-panel`, `.glass-card`, `.dash-workspace-panel`,
`.dash-hero-score-stat`, `.dash-kpi-pillar`, `.dash-product-item`,
`.kpi-strip-item`, `.admin-glass-card`, `.admin-stat-card`,
`.admin-table-card`, `.admin-form-card`, `.admin-toolbar-card`,
`.admin-kpi-tile`, `.profile-section-card`, `.detail-card`,
`.detail-recommendation-card`, `.product-dispensary-card`,
`.auth-form-panel`, `.modal-surface-card`,
**plus khusus halaman Konfigurasi admin:**
`.standalone-config-card` (kartu form), `.config-selector-tab`
(3 kartu modul di atas), `.config-selector-card`, dan `.audit-stat-card`
(kartu statistik Audit Scan). Semuanya **wajib** memakai resep ini juga.

> **DILARANG:** memakai tint biru-abu `rgba(130, 152, 181, …)` sebagai
> latar kartu. Tint itu setelah digabung hampir sama persis dengan base
> powder blue `#acc8ec` (jarak warna cuma ~16) sehingga kartu "nyaru" /
> menyatu dengan base — itulah yang dulu terjadi di halaman Konfigurasi
> (`.standalone-config-card` dan `.config-selector-card` memakai tint
> itu, diperbaiki 2026-11-12). Latar kartu harus selalu **kaca putih**
> (§2.1), bukan tint biru-abu.

### 2.2 Aturan anti-nyaru (kartu harus beda dari base)

**Masalah yang pernah terjadi (2026-11-12):** kartu memakai kaca putih
`0.5` di atas base powder blue `#acc8ec`. Setelah digabung (compositing),
warna kartu jadi ±`(214, 228, 246)` — jaraknya cuma ~51 dari base
`(172, 200, 236)`. Akibatnya kartu **tidak kelihatan sebagai kartu**,
menyatu dengan base ("nyaru"), terutama di halaman Konfigurasi admin
yang kartunya besar-besar. Border putih `0.6` dan bayangan navy `0.08`
terlalu halus untuk menegaskan tepi kartu.

**Aturan (wajib):**

1. **Latar kartu minimal putih `0.6`.** Jangan pernah pakai `0.5` atau
   lebih bening untuk kartu di atas base powder blue. `0.6` memberi jarak
   warna yang cukup dari base sambil tetap terasa kaca (tembus pandang).
2. **Border minimal putih `0.85`.** Border adalah garis tepi kartu —
   harus cukup tegas untuk membedakan kartu dari base. Jangan pakai
   border di bawah `0.75`.
3. **Bayangan luar minimal navy `0.14`.** Bayangan mengangkat kartu dari
   base. Jangan pakai bayangan hitam — selalu navy `rgba(7, 18, 54, …)`.
   Jangan pakai bayangan di bawah `0.12` untuk kartu utama.
4. **Radius selalu `20px`** untuk kartu. Jangan pakai radius lain
   (kecuali elemen kecil: chip, tombol, input).
5. **Blur selalu `blur(20px) saturate(180%)`.** Jangan pakai blur lain
   untuk kartu workspace (blur `11px` hanya untuk kartu landing, §1.2).

**Cara mengecek:** ukur computed style kartu vs base. Warna gabungan
kartu harus berjarak cukup dari `#acc8ec` dan border + bayangan harus
terlihat jelas di screenshot. Kalau kartu masih "nyaru" di screenshot,
naikkan opasitas putih latar (bukan dengan menambah warna baru).

### 2.3 Yang BUKAN kartu (jangan samakan ke resep §2.1)

- **Latar putih solid `#ffffff`:** `.mobile-drawer-sheet`, `.feedback-modal-sheet`,
  gelembung chat, `.chip-btn`, `.switch-thumb` — ini bukan kartu, biarkan.
- **Banner notif teks-putih** (mis. "Mode Uji Coba Cepat" di scan):
  sengaja lebih bening (`0.28`) supaya teks putih tetap terbaca. Jangan
  samakan ke `0.6`.
- **Elemen kecil / bersarang:** chip, baris list, kotak di dalam kartu,
  kotak alasan AI Copilot, input form. Input di settings sengaja
  neumorphic (inset) supaya kelihatan seperti kolom isi — jangan ubah
  jadi kaca kartu.
- **Varian semantik:** `.detail-notice-box.warning` (amber) dan `.danger`
  (merah) — sengaja beda warna karena artinya beda. Jangan samakan.
- **Hover:** kartu boleh naik ke `0.55`→ (sesuaikan) + bayangan lebih kuat
  saat hover; `.admin-stat-card.active` boleh `0.65` + glow kuning.
  Hover `.kpi-strip-item` memakai bayangan hitam `0.15` (beda tipis,
  hanya saat hover — dibiarkan).

### 2.4 Menambah kartu baru

1. Pakai salah satu kelas di §2.1 (atau buat kelas baru yang menyalin
   persis resep §2.1 — jangan tulis nilai sendiri).
2. Jangan pakai **inline style** untuk kartu. Semua gaya kartu harus
   lewat kelas CSS supaya konsisten dan gampang diubah serentak.
   (Pelajaran 2026-11-12: 3 panel yang "beda sendiri" ternyata
   semuanya inline style.)
3. Isi kartu: judul navy tebal, teks isi `--text-body`, teks sekunder
   `--text-muted` (hitam). Jangan pakai teks abu / putih tipis di atas
   kartu kaca — tidak terbaca.

---

## 3. Sidebar — Efek Berongga (Geroak)

Sidebar workspace (`.dash-side-slide`) memakai kaca iOS:
`rgba(255, 255, 255, 0.5)` + `blur(20px) saturate(180%)`.
Konten di kanan memakai base solid `var(--bg-app)`.

### 3.1 Bahu "r"

- Sudut kanan-atas sidebar: `border-top-right-radius: 14px`.
  Sudut kanan-bawah: `0px`. Jangan ubah ke 28px (terlalu lebar,
  potongannya kelihatan seperti celah yang memisahkan panel).

### 3.2 Menu aktif — pil "geroak" (efek berongga)

Menu yang aktif **tidak** diberi kotak / latar putih. Sebagai gantinya
ada slider `.magic-geroak-slider` (div di `components/WorkspaceSidebar.js`,
di dalam `.side-nav-track`) yang tampil sebagai **"lubang" warna base**:

- **Latar pil: `var(--bg-app)` `#acc8ec`** — warna base persis (sama
  dengan konten kanan). Jadi menu aktif tampak seperti rongga warna base
  yang "melubangi" sidebar kaca.
- **Bentuk pil:** `left: 10px; right: -14px` (mode expanded),
  `left: 6px; right: 0` (mode mini rail); `height: 52px`;
  `border-top-left-radius: 26px; border-bottom-left-radius: 26px`;
  radius kanan `0`.
- **Lekukan rongga (notch):** `::before` / `::after` berupa radial
  gradient `var(--bg-app)` — lengkungan cekung di tepi kanan sidebar.
  **Efek rongga ini WAJIB dipertahankan.** Jangan hapus, jangan ganti
  jadi kotak putih.
- **Gerakan:** `transform: translateY(calc(var(--glide-index, 0) * 54px))`,
  `top: 1px`. Langkah **54px** di kedua mode (expanded: tinggi link
  48px + margin 3px+3px; mini rail: tinggi 46px + margin 4px+4px).
  Jangan pakai 52px (dulu meleset 2px per menu sehingga pil tampak
  miring). Terukur: tengah pil == tengah link aktif, selisih 0px.
- **Teks menu aktif:** `var(--text-main)` `#071236` (navy), `font-weight: 700`.
  **Jangan kuning** — kuning hanya untuk ikon.
- **Ikon menu aktif:** lingkaran kuning `#FFC20D`, ikon navy, `scale(1.05)`.
- **Link aktif sendiri:** `background: transparent; backdrop-filter: none;
  border: 1.5px solid transparent; box-shadow: none;` (tidak ada kotak
  pada item yang dipilih).
- **Hover:** biarkan apa adanya (jangan ubah).

### 3.3 Nav bawah HP (≤767px)

`components/MobileBottomNav.js` — bar pill navy `#071236` (fixed,
`bottom: 14px; left: 14px; right: 14px; height: 64px; border-radius: 32px`).
Tab aktif = lingkaran kuning `#FFC20D` terangkat + lekukan cekung (scoop).
5 tab (customer: Dashboard, Scan, Riwayat, Marketplace, Profil;
admin: Dashboard Admin, Pengguna, Produk, Audit Scan, Konfigurasi).
Konten diberi `padding-bottom: 96px` supaya tidak tertutup bar.

---

## 4. Penataan (Layout)

### 4.1 Struktur workspace

```
AppShell
└─ .dash-workspace-layout
   ├─ WorkspaceSidebar (.dash-side-slide)
   ├─ .dash-main-canvas-area (latar var(--bg-app))
   │  └─ main.app-main-viewport
   │     └─ .content-canvas (max-width 1400px, margin auto)
   │        └─ halaman (dashboard, scan, admin, …)
   └─ MobileBottomNav (hanya ≤767px)
```

- **`.app-main-viewport`:** `padding: 20px clamp(24px, 3vw, 44px) 0`
  (atas 20px, samping ±38px di layar 1280px, bawah 0).
- **`.content-canvas`:** `width: 100%; max-width: 1400px; margin: 0 auto;`
  padding horizontal **0** di dalam viewport (supaya tidak dobel).
- **`.admin-stage-container`:** `max-width: 1440px; margin: auto;`
  padding horizontal **0** di dalam viewport.
- **Jarak kartu dari tepi:** ±38px dari sidebar dan dari tepi kanan
  (di layar 1280px). Jangan ubah padding viewport tanpa mengukur ulang.
- **Pill status mengambang (tanggal + lonceng):** `.dash-floating-status-pill`
  (fixed, `top: 14px; right: 14px`, kaca iOS, 161×52px) — pengganti topbar
  workspace yang sudah dihapus. Jangan kembalikan topbar workspace.

### 4.2 Penataan landing (full-bleed)

- **`.landing-fullscreen-flow`:** `width: 100%; overflow-x: hidden;
  background: var(--bg-app)`.
- **Seksi Vision (`.landing-vision-section`, navy berfoto):**
  `width: auto; margin-left: calc(-1 * clamp(24px, 3vw, 44px));
  margin-right: calc(-1 * clamp(24px, 3vw, 44px));` — margin negatif
  sebesar padding viewport supaya navy **mentok ke tepi kiri-kanan**
  (full-bleed). Isi (`.vision-container`, max-width) tetap di tengah.
  Jangan kembalikan `width: 100%` (itu yang dulu membuat navy tampak
  seperti kotak dengan powder blue di kanan-kiri).
- **Hero:** `.hero-ambient-glow` di belakang judul "The Future of…"
  harus `top: 0` (bukan `-80px`) supaya sinar tidak terpotong di atas.
- **Topbar landing:** `.fullscreen-topbar.topbar-landing` — transparan
  (tanpa latar/bayangan/border) + `position: absolute` (melayang di atas
  hero lalu ikut ter-scroll). Logo, nav, tombol Scan/Masuk tetap ada.
  Halaman login/register tetap memakai bar biasa.

### 4.3 Aturan umum penataan

- Satu halaman = satu bahasa visual (kaca + navy + kuning). Jangan
  campur bahasa permukaan lain (mis. neumorphic abu) untuk kartu.
- Jarak antar kartu: pakai `gap` grid/flex yang konsisten (16px).
- Teks harus terbaca: judul navy, isi `--text-body`, sekunder hitam.
  Jangan pakai teks abu / putih tipis di atas kaca terang.
- Setiap perubahan visual **wajib** diukur (computed style + screenshot
  desktop & HP 390px) sebelum di-push. Jangan klaim "sudah rapi" tanpa
  bukti ukur.

---

## 5. Cara memakai dokumen ini

- **Menambah kartu baru:** ikut §2.1 + §2.4 (pakai kelas yang ada,
  jangan inline style).
- **Menambah halaman baru:** ikut §4 (struktur viewport + content-canvas).
- **Mengubah warna:** ubah token di `:root` (§1), jangan ubah nilai
  di tiap komponen satu per satu.
- **Mengubah resep kartu:** ubah §2.1 **dan** semua kelas di daftar
  §2.1 serentak (pakai script/pencarian, jangan satu-satu manual).
  Lalu ukur ulang semua halaman (desktop + HP) sebelum push.
- **Ragu-ragu:** tanya roboy dulu; jangan tebak sendiri.

---

## 6. Riwayat perubahan desain (singkat)

- 2026-11-05: Rebrand Laomera; admin UC-13..UC-22; Riwayat & Diagnosis digabung.
- 2026-11-11: Audit UI (ui-ux-pro-max) — 3 P0 (meter dashboard "—",
  sidebar HP tidak bisa dibuka, kontras Pengaturan admin).
- 2026-11-12: Kaca iOS (sidebar + 33 kartu), nav bawah HP, bahu "r" 14px,
  pil menu aktif warna base + teks navy, topbar workspace dihapus
  (diganti pill mengambang), ikon mata password, font abu → hitam,
  loading powder blue, Scan landing + chatbot hapus saat logout,
  3 panel inline disamakan ke resep dashboard.
- 2026-11-12: Landing full-bleed (navy mentok), topbar landing transparan,
  sinar hero `top: 0`.
- 2026-11-12: **Resep kartu dipertegas (dokumen ini)** — latar putih
  `0.5` → `0.6`, border putih `0.6` → `0.85`, bayangan navy `0.08` →
  `0.14` — karena kartu `0.5` "nyaru" dengan base powder blue di
  halaman Konfigurasi admin.
