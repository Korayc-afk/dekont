# Sorun Giderme Rehberi

## 🔍 500 Hatası Alıyorsanız

### 1. Supabase Storage Bucket Kontrolü (EN ÖNEMLİ!)

**Supabase Dashboard'da:**
1. **Storage** → Bucket listesine bakın
2. `receipts` adında bir bucket var mı kontrol edin
3. **YOKSA:**
   - "New bucket" → Name: `receipts`
   - ✅ Public bucket işaretleyin
   - File size limit: `5242880` (5MB)
   - Create bucket

### 2. Vercel Runtime Logs Kontrolü

**Vercel Dashboard'da:**
1. Projeniz → **Deployments**
2. Son deployment → **Functions** → `/api/index.js`
3. **Logs** sekmesine tıklayın
4. Form göndermeyi deneyin ve logları kontrol edin

**Loglarda şunları arayın:**
- ✅ `Supabase initialized successfully` - Başarılı
- ❌ `Supabase not configured` - Environment variables eksik
- ❌ `Storage bucket "receipts" not found` - Bucket oluşturulmamış
- ❌ `Database error` - RLS policies sorunu

### 3. Environment Variables Kontrolü

**Vercel Dashboard → Settings → Environment Variables:**

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (tam key)
```

**Kontrol:**
- ✅ Production için eklendi mi?
- ✅ Değerler doğru mu? (URL ve key tam mı?)
- Değişiklik yaptıysanız → **Redeploy** yapın

### 4. Database Schema Kontrolü

**Supabase Dashboard → SQL Editor:**
1. `supabase/schema.sql` dosyasındaki SQL'i çalıştırdınız mı?
2. `supabase/fix-policies.sql` dosyasındaki SQL'i çalıştırdınız mı?

**Kontrol:**
- Table Editor → `tickets` tablosu var mı?
- RLS policies var mı? (4 policies olmalı)

### 5. Health Check Testi

Browser console'da veya Postman'de test edin:

```bash
GET https://dekont-ruby.vercel.app/api/health
```

**Beklenen cevap:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "supabase": true
}
```

**Eğer `supabase: false` ise:**
- Environment variables eksik veya yanlış

### 6. Form Gönderme Testi

1. Ana sayfadan bir dekont yükleyin
2. Vercel Logs'u açık tutun (real-time)
3. Formu gönderin
4. Logları kontrol edin:

**Başarılı loglar:**
```
📥 POST /tickets request received
📄 File received: {...}
📤 Uploading file to Supabase Storage...
✅ File uploaded successfully: https://...
💾 Saving ticket to database...
✅ Ticket created successfully: 1
```

**Hata logları:**
```
❌ Storage bucket "receipts" not found
❌ Database error: ...
❌ Supabase not initialized
```

## 🐛 Yaygın Hatalar ve Çözümleri

### Hata: "Storage bucket not found"
**Çözüm:** Supabase Dashboard → Storage → `receipts` bucket'ını oluşturun

### Hata: "Supabase not configured"
**Çözüm:** Vercel → Environment Variables kontrol edin ve Redeploy yapın

### Hata: "Database error: new row violates row-level security policy"
**Çözüm:** `supabase/fix-policies.sql` dosyasını Supabase SQL Editor'da çalıştırın

### Hata: "column does not exist"
**Çözüm:** `supabase/schema.sql` dosyasını Supabase SQL Editor'da çalıştırın

## 📞 Destek

Sorun devam ederse:
1. Vercel Runtime Logs'u paylaşın
2. Supabase Dashboard screenshot'ları paylaşın (Storage, Table Editor)
3. Health check sonucunu paylaşın

