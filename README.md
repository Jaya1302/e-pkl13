# 🎓 E-PKL — Sistem Informasi Praktik Kerja Lapangan (PKL)
### SMK Negeri 13 Bandung

Aplikasi web terpadu untuk manajemen siklus Praktik Kerja Lapangan (PKL) / Praktik Kerja Industri (Prakerin) di lingkungan **SMK Negeri 13 Bandung**. Mengintegrasikan 5 peran utama: Administrator / Hubinmas, Kepala Sekolah, Guru Pembimbing, Pembimbing Industri (DUDI), dan Siswa.

---

## 🚀 Fitur Unggulan

1. **Multi-Role RBAC (5 Level Akses)**:
   - **Super Admin / Hubinmas**: Manajemen master data (Jurusan, Guru, Siswa, DUDI), plotting penempatan, template surat resmi, dan pengaturan sistem.
   - **Kepala Sekolah / Manajemen**: Monitoring statistik penempatan, supervisi berkala, dan validasi kelulusan.
   - **Guru Pembimbing**: Input catatan monitoring berkala (5 aspek), verifikasi jurnal siswa, dan pengisian nilai guru.
   - **Pembimbing Industri (DUDI)**: Presensi harian siswa di tempat PKL, validasi jurnal harian, dan penilaian industri.
   - **Siswa**: Presensi GPS + swafoto, pengisian jurnal kegiatan harian, upload laporan akhir, dan sertifikat digital.
2. **Presensi Mandiri Berbasis GPS & Geofencing**:
   - Validasi radius jarak koordinat DUDI secara realtime.
   - Deteksi tepat waktu / terlambat otomatis.
3. **Pusat Generator Surat Resmi Berstandar Disdik Jabar**:
   - Kop surat resmi Cabang Dinas Pendidikan Wilayah VII & SMKN 13 Bandung.
   - Surat Permohonan PKL, Surat Pengantar, Surat Tugas Guru, Surat Tugas Monitoring, dan Surat Selesai PKL.
4. **Sertifikat Digital PKL & Verifikasi QR Code Publik**:
   - Penerbitan sertifikat digital otomatis dengan QR code unik untuk verifikasi publik.
5. **Import/Export Data Massal**:
   - Dukungan import master siswa dan guru melalui file Excel (`.xlsx`) dan CSV.

---

## 📋 Persyaratan Sistem

- **Node.js**: Versi `18.x` atau lebih baru
- **NPM**: Versi `9.x` atau lebih baru
- **Database**: Akun [Supabase](https://supabase.com) (PostgreSQL Cloud)

---

## 🛠️ Panduan Instalasi & Setup

### 1. Ekstrak / Clone Project
Buka terminal pada direktori project:
```bash
cd "6. E-PKL SMKN13BDG"
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Setup Database Supabase
1. Buat project baru di dashboard [Supabase](https://supabase.com).
2. Buka menu **SQL Editor** pada project Supabase Anda.
3. Buka file `supabase/seed_complete_live.sql` yang ada di project ini, salin seluruh isinya, lalu jalankan (**Run**) di SQL Editor.
4. Script tersebut akan otomatis menginisialisasi:
   - Enum type & tabel relasional
   - Storage & RLS security policies
   - Data master default SMKN 13 Bandung (Jurusan RPL, APL, TKJ, FI, DUDI, Akun Demo)

### 4. Konfigurasi Environment Variables (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan isi dengan kredensial dari dashboard Supabase (**Project Settings -> API**):
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Jalankan Aplikasi (Mode Development)
```bash
npm run dev
```
Aplikasi akan berjalan di browser pada alamat default `http://localhost:5173`.

### 6. Build untuk Produksi (Deployment)
```bash
npm run build
```
Folder hasil build `dist/` siap di-upload ke layanan hosting seperti **Vercel, Firebase Hosting, Netlify, cPanel, atau VPS**.

---

## 🔐 Akun Default untuk Login / Demo

Semua akun demo awal menggunakan kata sandi default: **`smkn13bandung`** *(atau login langsung melalui opsi simulasi switch-role di mode demo)*.

| Peran (Role) | Email Login | Nama Akun |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@smkn13bdg.sch.id` | Super Administrator (IT SMKN 13 Bandung) |
| **Admin Hubin / PKL** | `hubin@smkn13bdg.sch.id` | Koordinator Hubinmas & PKL |
| **Guru Pembimbing** | `guru.fauzi@smkn13bdg.sch.id` | Ahmad Fauzi, S.Kom |
| **Pembimbing Industri** | `mentor.telkom@smkn13bdg.sch.id` | Hendri Gunawan (PT Telkom Bandung) |
| **Siswa PKL** | `siswa.rizky@smkn13bdg.sch.id` | Muhammad Rizky Pratama |

---

## ⚙️ Pengaturan Identitas Sekolah

Pengaturan profil sekolah (Alamat, No Telp, Nama Kepala Sekolah, Format Nomor Surat & Sertifikat) dapat diubah kapan saja melalui menu **Pengaturan Sistem** (Akses Super Admin / Admin Hubin).

---

## 📄 Hak Cipta & Lisensi
Dikembangkan untuk **SMK Negeri 13 Bandung**.  
Hak Cipta dilindungi undang-undang.
