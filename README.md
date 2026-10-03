# Geprex Next.js 2.0 — Frontend Portal Berita

Frontend **Next.js 16 + React 19 (App Router)** untuk tema WordPress **Geprex**. WordPress tetap menjadi dasbor
(menulis berita, kategori, menu, Customizer), sedangkan pengunjung membuka situs Next.js yang sangat cepat.

- Render di server + cache otomatis (ISR), ramah Google: meta, Open Graph, Twitter Card, JSON-LD NewsArticle,
  `sitemap.xml`, `news-sitemap.xml` (Google News), `robots.txt`.
- Modern: skeleton loading (efek kilau) di setiap halaman, bilah progres saat pindah halaman, streaming render, gambar muncul halus.
- Tampilan identik dengan tema: slider headline (thumbnail di desktop, mode tengah di HP), carousel Topik Khusus, 3 gaya beranda, Trending 24 Jam, carousel topik, kanal kategori (grid 2×2 di HP),
  mode gelap, menu kanal mobile, navigasi bawah, muat lebih banyak, komentar, penghitung dibaca, iklan.
- Semua warna, font, tata letak, dan kategori diambil dari **Customizer WordPress** — tidak ada yang perlu diubah di kode.
- Membutuhkan **lisensi tema Geprex aktif** di WordPress; tanpa lisensi, situs Next.js menampilkan "Situs sedang disiapkan".

## Persyaratan
- WordPress dengan tema Geprex ≥ 2.1.0 aktif dan berlisensi.
- Permalink WordPress apa pun didukung (`/%postname%/`, `/%year%/%monthnum%/%day%/%postname%/`, `/%category%/%postname%/`, dll.). Slug artikel harus unik.
- **Node.js 20.9 atau lebih baru** (hosting: Vercel, Netlify, VPS, atau cPanel dengan Node.js 20/22).
- Tema Geprex **2.3.0** atau lebih baru di WordPress (untuk slider headline & Topik Khusus).

## Struktur domain yang disarankan
| Fungsi | Contoh |
|---|---|
| WordPress (dasbor & API) | `https://cms.situsanda.com` |
| Next.js (dibuka pengunjung) | `https://situsanda.com` |

## Pemasangan

### 1. Siapkan WordPress
1. Pastikan tema Geprex 2.1.0 aktif dan lisensinya **Aktif**.
2. Buka **Tampilan > Sesuaikan > Geprex: Pengaturan Tema > Frontend Next.js (Headless)**:
   - *Alamat situs Next.js*: `https://situsanda.com`
   - *Kunci rahasia revalidasi*: teks acak panjang (simpan, dipakai di langkah 2)
   - Opsional: centang *Arahkan pengunjung tema WordPress ke situs Next.js* setelah Next.js online.

### 2a. Deploy ke Vercel (paling mudah)
1. Unggah folder ini ke repositori GitHub.
2. Di vercel.com: **Add New Project** → pilih repositori.
3. Isi *Environment Variables* (lihat `.env.example`):
   - `WP_URL` = `https://cms.situsanda.com`
   - `SITE_URL` = `https://situsanda.com`
   - `REVALIDATE` = `60`
   - `REVALIDATE_SECRET` = kunci rahasia dari langkah 1
4. **Deploy**, lalu hubungkan domain `situsanda.com` di Vercel.

### 2b. Deploy ke hosting cPanel (menu "Setup Node.js App")
1. Unggah `geprex-next.zip` ke File Manager (mis. ke folder `/home/USER/geprex-next`), lalu **Extract**.
2. Buat file `.env.local` di folder itu (salin dari `.env.example`) dan isi `WP_URL`, `SITE_URL`, `REVALIDATE`, `REVALIDATE_SECRET`.
3. cPanel → **Setup Node.js App → Create Application**:
   - Node.js version: **20** atau **22** (minimal 20.9)
   - Application mode: **Production**
   - Application root: `geprex-next`
   - Application URL: domain Anda
   - Application startup file: `server.js`
4. Klik **Create**, lalu **Run NPM Install**.
5. Salin perintah *virtual environment* yang ditampilkan cPanel, buka **Terminal** cPanel, tempel, lalu jalankan:
   `npm run build`
6. Kembali ke Setup Node.js App → **Restart**. Situs siap dibuka.

Setiap mengubah `.env.local`, jalankan lagi `npm run build` lalu **Restart**.
Bila hosting tidak menyediakan Terminal, jalankan `npm install && npm run build` di komputer Anda,
lalu unggah seluruh folder termasuk `.next` dan `node_modules`.

### 2c. Deploy ke VPS
```bash
cp .env.example .env.local   # lalu isi nilainya
npm install
npm run build
npm start                    # port 3000, atau PORT=8080 npm start
```
Jalankan di belakang Nginx/Apache sebagai reverse proxy, dan pakai PM2 agar tetap hidup:
`pm2 start npm --name geprex-next -- start`.

## Mode anti blokir (Vercel + hosting dengan firewall/reCAPTCHA)
Bila hosting WordPress memblokir server Vercel (403, "Bot Verification", timeout), balik arah datanya:
WordPress **mengirim** data ke Vercel, Vercel tidak perlu meminta.

1. Vercel → project → **Storage** → **Upstash for Redis** (gratis) → **Connect** ke project ini.
   Variabel `KV_REST_API_URL` & `KV_REST_API_TOKEN` terisi otomatis.
2. Vercel → **Environment Variables** → `REVALIDATE_SECRET` = kunci acak panjang. **Redeploy**.
3. WordPress → pasang plugin `wordpress-plugin/geprex-next-sync` (zip folder itu) → **Pengaturan → Next Sync**:
   isi alamat situs Vercel + kunci yang sama → **Uji koneksi** → **Kirim data utama** → **Kirim semua artikel**.
4. Cek `https://<situs>/api/cek-wp/` → `anti_blokir.aktif: true`, `beranda_tersimpan: true`.

Setelah itu plugin mengirim otomatis saat berita terbit/diubah/dihapus, komentar disetujui, Customizer
disimpan, dan setiap jam. Aksi pengunjung (komentar, hitungan dibaca, muat lebih banyak, pencarian)
dikirim langsung dari browser pengunjung ke WordPress.

## Cara kerja pembaruan
- Halaman di-cache selama `REVALIDATE` detik.
- Saat berita/halaman/menu/Customizer disimpan, WordPress memanggil `/api/revalidate` sehingga
  perubahan langsung tampil.
- CSS tema disalin di `app/theme.css`. Bila CSS tema WordPress diubah (`npm run build` di folder tema),
  salin ulang `geprex/assets/css/main.css` ke `app/theme.css`.

## Catatan
- Widget sidebar WordPress tidak ditampilkan di Next.js; sidebar berisi iklan sidebar, Trending, dan daftar kanal.
- CSS Tambahan dari Customizer ikut diterapkan.
- Kode iklan & analytics dari Customizer dijalankan di sisi browser.

## Rute
| URL | Isi |
|---|---|
| `/` | Beranda |
| `/judul-berita/`, `/2026/09/30/judul-berita/`, dst. | Artikel atau halaman (mengikuti permalink WordPress) |
| `/kategori/slug/`, `/tag/slug/`, `/penulis/slug/` | Arsip |
| `/cari/?q=...` | Pencarian |
| `/indeks/` | Indeks berita (filter tanggal & kanal) |
| `/sitemap.xml`, `/news-sitemap.xml`, `/robots.txt` | SEO |

URL lama tema (`/category/...`, `/author/...`) otomatis dialihkan (301).
