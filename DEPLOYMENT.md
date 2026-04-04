# 🚀 IDM-FME Supabase Setup Guide

## Langkah 1: Jalankan SQL Schema di Supabase

1. Buka **Supabase Dashboard**: https://supabase.com/dashboard/project/tnbdndbtbyabluqoeotv
2. Klik menu **SQL Editor** di sidebar kiri
3. Klik **New Query**
4. Copy-paste seluruh isi file `supabase/full-setup.sql`
5. Klik **Run** (atau tekan Ctrl+Enter)
6. Tunggu hingga selesai (beberapa detik)

✅ Setelah selesai, Anda akan punya:
- 15 tabel database (User, Tournament, Match, Club, dll)
- 3 storage buckets (avatars, payment-proofs, club-logos)
- Realtime broadcast function
- Default admin account (admin@idm-fme.com / PIN: 123456)

---

## Langkah 2: Enable Realtime

1. Di Supabase Dashboard, klik **Database** → **Replication**
2. Di bagian **Realtime**, aktifkan untuk tabel:
   - `Tournament`
   - `Match`
   - `Donation`
   - `Sawer`
   - `Registration`
3. Klik **Save**

---

## Langkah 3: Verify Setup

1. Klik **Table Editor** di sidebar
2. Cek tabel `User` — harus ada 1 row (default admin)
3. Klik **Storage** — harus ada 3 buckets: avatars, payment-proofs, club-logos

---

## Langkah 4: Deploy ke Vercel

1. Buka https://vercel.com dan login dengan GitHub
2. Klik **Add New Project** → Import `IDM-FME` repository
3. Di **Environment Variables**, tambahkan:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `(Copy dari Supabase → Settings → Database → Connection Pooling URL)` |
| `NEXT_PUBLIC_SUPABASE_URL` | `(Copy dari Supabase → Settings → API → Project URL)` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `(Copy dari Supabase → Settings → API → anon/public key)` |
| `SUPABASE_SERVICE_ROLE_KEY` | `(Copy dari Supabase → Settings → API → service_role key)` |
| `JWT_SECRET` | `(Buat random string min 32 chars)` |
| `NEXTAUTH_SECRET` | `(Buat random string min 32 chars)` |

> Catatan: Untuk `DATABASE_URL`, gunakan **Connection Pooling** URL dari Supabase Dashboard → Settings → Database → Connection string → URI (tab "Transaction pooler")

4. Klik **Deploy**

---

## Langkah 5: Deploy Bot ke Railway

1. Buka https://railway.app
2. Klik **New Project** → Deploy from GitHub repo
3. Pilih folder `railway/bot-service/`
4. Tambahkan Environment Variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `(Copy dari Supabase → Settings → API → Project URL)` |
| `SUPABASE_SERVICE_ROLE_KEY` | `(Copy dari Supabase → Settings → API → service_role key)` |
| `WHATSAPP_BOT_SECRET` | `(Buat secret unik)` |
| `API_BASE_URL` | `(URL Vercel Anda setelah deploy)` |

5. Klik **Deploy**

---

## Keamanan: Ganti Password Admin

Setelah login pertama kali, segera ganti PIN admin default (123456) melalui Admin Panel → Change PIN.
