# Supabase Kurulum Rehberi

Bu rehber, Supabase'i projeye entegre etmek için adım adım talimatlar içerir.

## 🚀 1. Supabase Projesi Oluşturma

1. **Supabase'e gidin:**
   - https://supabase.com
   - "Start your project" butonuna tıklayın
   - GitHub ile giriş yapın (veya e-posta ile)

2. **Yeni proje oluşturun:**
   - "New Project" butonuna tıklayın
   - **Organization:** Seçin veya oluşturun
   - **Name:** `dekont-ticket` (veya istediğiniz isim)
   - **Database Password:** Koray48!.
   - **Region:** En yakın bölgeyi seçin (Avrupa: `eu-central-1`)
   - **Pricing Plan:** Free tier seçin (yeterli)

3. **Proje oluşturulduktan sonra:** (2-3 dakika sürebilir)

## 📊 2. Database Schema Oluşturma

1. **Supabase Dashboard'da:**
   - Sol menüden **"SQL Editor"** seçin
   - **"New query"** butonuna tıklayın

2. **SQL'i çalıştırın:**
   - `supabase/schema.sql` dosyasındaki SQL'i kopyalayın
   - SQL Editor'a yapıştırın
   - **"Run"** butonuna tıklayın

3. **Kontrol edin:**
   - Sol menüden **"Table Editor"** seçin
   - `tickets` tablosunun oluşturulduğunu görmelisiniz

## 🗄️ 3. Storage Bucket Oluşturma

1. **Supabase Dashboard'da:**
   - Sol menüden **"Storage"** seçin
   - **"New bucket"** butonuna tıklayın

2. **Bucket ayarları:**
   - **Name:** `receipts`
   - **Public bucket:** ✅ İşaretleyin (resimlerin erişilebilir olması için)
   - **File size limit:** 5242880 (5MB)
   - **Allowed MIME types:** `image/jpeg,image/jpg,image/png,image/webp,application/pdf`
   - **"Create bucket"** butonuna tıklayın

3. **Storage Policies (Güvenlik):**
   - `receipts` bucket'ını seçin
   - **"Policies"** sekmesine gidin
   - **"New Policy"** → **"For full customization"**
   - **Policy name:** `Allow public read`
   - **Allowed operation:** SELECT
   - **Policy definition:** 
     ```sql
     true
     ```
   - **"Review"** → **"Save policy"**

   - **"New Policy"** → Upload için
   - **Policy name:** `Allow authenticated upload`
   - **Allowed operation:** INSERT
   - **Policy definition:**
     ```sql
     true
     ```
   - **"Review"** → **"Save policy"**

## 🔑 4. API Keys ve Environment Variables

1. **Supabase Dashboard'da:**
   - Sol menüden **"Settings"** → **"API"** seçin

2. **Keys'i kopyalayın:**
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** (anon key)
   - **service_role key:** (⚠️ Gizli tutun, sadece backend'de kullanın!)

3. **Vercel Environment Variables ekleyin:**

   Vercel Dashboard'da projenizi seçin:
   - **Settings** → **Environment Variables**
   - Şu değişkenleri ekleyin:

   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Production** için ekleyin (Preview ve Development opsiyonel).

4. **Local development için:**
   
   Root dizinde `.env.local` dosyası oluşturun:
   ```env
   VITE_API_URL=/api
   VITE_ADMIN_PASSWORD=Padisah2024!Secure
   
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## ✅ 5. Test

1. **API Health Check:**
   ```
   https://your-project.vercel.app/api/health
   ```
   Cevap: `{"status":"OK","supabase":true}` olmalı

2. **Form gönderme testi:**
   - Ana sayfadan dekont yükleyin
   - Başarılı olmalı

3. **Supabase Dashboard'da kontrol:**
   - **Table Editor** → `tickets` tablosunda kayıt görünmeli
   - **Storage** → `receipts` bucket'ında dosya görünmeli

## 🔒 Güvenlik Notları

1. **Service Role Key:**
   - ⚠️ **ASLA** frontend'de kullanmayın!
   - ⚠️ **ASLA** GitHub'a commit etmeyin!
   - Sadece backend/serverless functions'da kullanın

2. **Row Level Security (RLS):**
   - `tickets` tablosunda RLS aktif
   - Herkes okuyabilir (anon key ile)
   - Sadece service role ile yazabilir

3. **Storage Policies:**
   - Public read: Herkes okuyabilir
   - Service role ile upload: Backend'den yükleme

## 📊 Supabase Free Tier Limits

- **Database:** 500MB
- **Storage:** 1GB
- **API Requests:** 50,000/month
- **Bandwidth:** 5GB/month

## 🔄 Migration (SQLite'den Supabase'e)

Mevcut SQLite verilerini Supabase'e taşımak için:

1. **SQLite verilerini export edin:**
   ```bash
   sqlite3 database.db ".mode csv" ".output tickets.csv" "SELECT * FROM tickets;"
   ```

2. **Supabase'e import edin:**
   - Supabase Dashboard → **Table Editor** → **tickets**
   - **Import data** → CSV dosyasını seçin

## 🐛 Sorun Giderme

### Supabase bağlantı hatası:
- Environment variables'ların doğru olduğundan emin olun
- Vercel'de environment variables'ların Production için eklendiğini kontrol edin

### Storage upload hatası:
- Bucket'ın public olduğundan emin olun
- Storage policies'in doğru olduğunu kontrol edin

### Database hatası:
- SQL schema'nın çalıştırıldığını kontrol edin
- Table Editor'da `tickets` tablosunun var olduğunu kontrol edin

## 📚 Daha Fazla Bilgi

- Supabase Docs: https://supabase.com/docs
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Database: https://supabase.com/docs/guides/database

